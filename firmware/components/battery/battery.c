// ═══════════════════════════════════════════════════════════════
//  battery.c — Lecture ADC batterie + LED RGB WS2812 (LED11)
//
//  ADC : lit la tension sur BATTERY_ADC_CHANNEL,
//        convertit en % via une courbe de décharge LiPo.
//
//  LED WS2812 (LED11) via RMT (Remote Control Transceiver) :
//    > 60% → vert
//    25-60% → jaune
//    < 25% → rouge
//    < 10% → rouge clignotant
// ═══════════════════════════════════════════════════════════════

#include "battery.h"
#include "kb_config.h"
#include "config_store.h"

#include "esp_adc/adc_oneshot.h"
#include "esp_adc/adc_cali.h"
#include "esp_adc/adc_cali_scheme.h"
#include "led_strip.h"   // Composant ESP-IDF pour WS2812 via RMT
#include "esp_log.h"
#include "esp_timer.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

static const char *TAG = "BATTERY";

// ─────────────────────────────────────────────────────────────
//  ÉTAT INTERNE
// ─────────────────────────────────────────────────────────────
static adc_oneshot_unit_handle_t g_adc_handle = NULL;
static adc_cali_handle_t         g_adc_cali   = NULL;
static led_strip_handle_t        g_led_strip  = NULL;

static uint16_t g_voltage_mv  = 0;
static uint8_t  g_percent     = 100;
static bool     g_blink_state = false;

// ─────────────────────────────────────────────────────────────
//  COURBE DE DÉCHARGE LIPO (tension → pourcentage)
//  Table de correspondance (interpolation linéaire entre les points)
//  Valeurs typiques pour une cellule LiPo 3.7V
// ─────────────────────────────────────────────────────────────
typedef struct { uint16_t mv; uint8_t pct; } batt_point_t;

static const batt_point_t BATT_CURVE[] = {
    {4200, 100},
    {4100,  90},
    {4000,  80},
    {3900,  70},
    {3800,  60},
    {3700,  50},
    {3650,  40},
    {3600,  30},
    {3550,  20},
    {3500,  10},
    {3400,   5},
    {3300,   0},
};
#define BATT_CURVE_SIZE (sizeof(BATT_CURVE) / sizeof(BATT_CURVE[0]))

// Interpoler le pourcentage depuis la tension (mv)
static uint8_t voltage_to_percent(uint16_t mv)
{
    if (mv >= BATT_CURVE[0].mv) return 100;
    if (mv <= BATT_CURVE[BATT_CURVE_SIZE - 1].mv) return 0;

    for (int i = 0; i < BATT_CURVE_SIZE - 1; i++) {
        if (mv <= BATT_CURVE[i].mv && mv >= BATT_CURVE[i+1].mv) {
            // Interpolation linéaire entre deux points
            // Formule : pct = pct_low + (mv - mv_low) * (pct_high - pct_low) / (mv_high - mv_low)
            uint16_t mv_high  = BATT_CURVE[i].mv;
            uint16_t mv_low   = BATT_CURVE[i+1].mv;
            uint8_t  pct_high = BATT_CURVE[i].pct;
            uint8_t  pct_low  = BATT_CURVE[i+1].pct;
            return pct_low + (uint8_t)((mv - mv_low) * (pct_high - pct_low) / (mv_high - mv_low));
        }
    }
    return 50;  // Fallback
}

// ─────────────────────────────────────────────────────────────
//  LED RGB
// ─────────────────────────────────────────────────────────────

static void led_set_color(uint8_t r, uint8_t g, uint8_t b)
{
    if (!g_led_strip) return;
    led_strip_set_pixel(g_led_strip, 0, r, g, b);
    led_strip_refresh(g_led_strip);
}

static void led_off(void)
{
    if (!g_led_strip) return;
    led_strip_clear(g_led_strip);
    led_strip_refresh(g_led_strip);
}

static void update_led(void)
{
    const kb_config_t *cfg = config_store_get();
    uint8_t critical_pct   = cfg->power.battery_critical_pct;

    if (g_percent > LED_BATT_GREEN_PCT) {
        // Vert
        led_set_color(0, 50, 0);
    } else if (g_percent > LED_BATT_YELLOW_PCT) {
        // Jaune
        led_set_color(50, 50, 0);
    } else if (g_percent > critical_pct) {
        // Rouge
        led_set_color(50, 0, 0);
    } else {
        // Rouge clignotant (critique)
        g_blink_state = !g_blink_state;
        if (g_blink_state) led_set_color(80, 0, 0);
        else               led_off();
    }
}

// ─────────────────────────────────────────────────────────────
//  FONCTIONS PUBLIQUES
// ─────────────────────────────────────────────────────────────

esp_err_t battery_init(void)
{
    // ── ADC ──────────────────────────────────────────────────
    adc_oneshot_unit_init_cfg_t adc_cfg = {
        .unit_id  = BATTERY_ADC_UNIT,
        .ulp_mode = ADC_ULP_MODE_DISABLE,
    };
    ESP_ERROR_CHECK(adc_oneshot_new_unit(&adc_cfg, &g_adc_handle));

    adc_oneshot_chan_cfg_t chan_cfg = {
        .bitwidth = ADC_BITWIDTH_12,
        .atten    = ADC_ATTEN_DB_12,  // 12dB = plage 0-3.3V (DB_11 deprecated)
    };
    ESP_ERROR_CHECK(adc_oneshot_config_channel(g_adc_handle, BATTERY_ADC_CHANNEL, &chan_cfg));

    // Calibration ADC — ESP32S3 uses curve fitting (line fitting is ESP32 only)
    adc_cali_curve_fitting_config_t cali_cfg = {
        .unit_id  = BATTERY_ADC_UNIT,
        .chan     = BATTERY_ADC_CHANNEL,
        .atten    = ADC_ATTEN_DB_12,
        .bitwidth = ADC_BITWIDTH_12,
    };
    adc_cali_create_scheme_curve_fitting(&cali_cfg, &g_adc_cali);

    // ── LED WS2812 via RMT ───────────────────────────────────
    led_strip_config_t strip_cfg = {
        .strip_gpio_num   = LED_RGB_GPIO,
        .max_leds         = LED_RGB_COUNT,
        .led_model        = LED_MODEL_WS2812,
        .flags.invert_out = false,
    };
    led_strip_rmt_config_t rmt_cfg = {
        .clk_src        = RMT_CLK_SRC_DEFAULT,
        .resolution_hz  = 10 * 1000 * 1000,  // 10MHz
        .flags.with_dma = false,
    };
    ESP_ERROR_CHECK(led_strip_new_rmt_device(&strip_cfg, &rmt_cfg, &g_led_strip));
    led_off();

    // Première lecture
    battery_update();

    ESP_LOGI(TAG, "Batterie init : %dmV → %d%%", g_voltage_mv, g_percent);
    return ESP_OK;
}

void battery_update(void)
{
    // Lire l'ADC
    int raw = 0;
    adc_oneshot_read(g_adc_handle, BATTERY_ADC_CHANNEL, &raw);

    // Convertir en millivolts via calibration
    int mv_adc = 0;
    if (g_adc_cali) {
        adc_cali_raw_to_voltage(g_adc_cali, raw, &mv_adc);
    } else {
        // Conversion manuelle si pas de calibration (moins précis)
        mv_adc = (raw * 3300) / 4095;
    }

    // Appliquer le ratio du diviseur de tension du PCB
    // Exemple : si R1=R2=100k → ratio 0.5 → tension réelle = mv_adc / 0.5
    g_voltage_mv = (uint16_t)((float)mv_adc / BATTERY_VOLTAGE_DIVIDER_RATIO);

    // Clamp entre min et max
    if (g_voltage_mv > BATTERY_VOLTAGE_MAX_MV) g_voltage_mv = BATTERY_VOLTAGE_MAX_MV;
    if (g_voltage_mv < BATTERY_VOLTAGE_MIN_MV) g_voltage_mv = BATTERY_VOLTAGE_MIN_MV;

    // Calculer le pourcentage
    g_percent = voltage_to_percent(g_voltage_mv);

    // Mettre à jour la LED
    update_led();

    ESP_LOGD(TAG, "ADC raw=%d, mv=%d, pct=%d%%", raw, g_voltage_mv, g_percent);
}

uint8_t battery_get_percent(void) { return g_percent; }
uint16_t battery_get_voltage_mv(void) { return g_voltage_mv; }
