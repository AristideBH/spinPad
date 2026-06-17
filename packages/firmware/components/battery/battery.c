// ═══════════════════════════════════════════════════════════════
//  battery.c — Battery ADC reading + RGB LED WS2812 (LED11)
//
//  ADC: reads the voltage on BATTERY_ADC_CHANNEL,
//        converts to % via a LiPo discharge curve.
//
//  Optional battery:
//    power.battery_present = "auto"  → auto-detect via ADC
//                          = "yes"   → force present
//                          = "no"    → disable entirely
//
//  WS2812 LED (LED11) via RMT, lit only if battery present:
//    > 60% → green
//    25-60% → yellow
//    < 25% → red
//    < 10% → blinking red
// ═══════════════════════════════════════════════════════════════

#include "battery.h"
#include "kb_config.h"
#include "config_store.h"

#include "esp_adc/adc_oneshot.h"
#include "esp_adc/adc_cali.h"
#include "esp_adc/adc_cali_scheme.h"
#include "led_strip.h"
#include "esp_log.h"
#include "esp_timer.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include <string.h>

static const char *TAG = "BATTERY";

// "Plausible" voltage range for auto-detection. Outside it
// (typically ~0 mV if the divider is not wired, or USB only)
// → battery marked absent.
#define BATTERY_DETECT_MIN_MV  2800
#define BATTERY_DETECT_MAX_MV  4500

// ─────────────────────────────────────────────────────────────
//  INTERNAL STATE
// ─────────────────────────────────────────────────────────────
static adc_oneshot_unit_handle_t g_adc_handle = NULL;
static adc_cali_handle_t         g_adc_cali   = NULL;
static led_strip_handle_t        g_led_strip  = NULL;

static uint16_t g_voltage_mv  = 0;
static uint8_t  g_percent     = 100;
static bool     g_blink_state = false;
static bool     g_present     = false;
static char     g_source[16]  = "forced_no";

// ─────────────────────────────────────────────────────────────
//  LIPO DISCHARGE CURVE
// ─────────────────────────────────────────────────────────────
typedef struct { uint16_t mv; uint8_t pct; } batt_point_t;

static const batt_point_t BATT_CURVE[] = {
    {4200, 100}, {4100,  90}, {4000,  80}, {3900,  70},
    {3800,  60}, {3700,  50}, {3650,  40}, {3600,  30},
    {3550,  20}, {3500,  10}, {3400,   5}, {3300,   0},
};
#define BATT_CURVE_SIZE (sizeof(BATT_CURVE) / sizeof(BATT_CURVE[0]))

static uint8_t voltage_to_percent(uint16_t mv)
{
    if (mv >= BATT_CURVE[0].mv) return 100;
    if (mv <= BATT_CURVE[BATT_CURVE_SIZE - 1].mv) return 0;

    for (int i = 0; i < BATT_CURVE_SIZE - 1; i++) {
        if (mv <= BATT_CURVE[i].mv && mv >= BATT_CURVE[i+1].mv) {
            uint16_t mv_high  = BATT_CURVE[i].mv;
            uint16_t mv_low   = BATT_CURVE[i+1].mv;
            uint8_t  pct_high = BATT_CURVE[i].pct;
            uint8_t  pct_low  = BATT_CURVE[i+1].pct;
            return pct_low + (uint8_t)((mv - mv_low) * (pct_high - pct_low) / (mv_high - mv_low));
        }
    }
    return 50;
}

// ─────────────────────────────────────────────────────────────
//  RGB LED
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
    if (!g_present) { led_off(); return; }
    const kb_config_t *cfg = config_store_get();
    uint8_t critical_pct   = cfg->power.battery_critical_pct;

    if (g_percent > LED_BATT_GREEN_PCT) {
        led_set_color(0, 50, 0);
    } else if (g_percent > LED_BATT_YELLOW_PCT) {
        led_set_color(50, 50, 0);
    } else if (g_percent > critical_pct) {
        led_set_color(50, 0, 0);
    } else {
        g_blink_state = !g_blink_state;
        if (g_blink_state) led_set_color(80, 0, 0);
        else               led_off();
    }
}

// ─────────────────────────────────────────────────────────────
//  ADC — raw reading (used by init for detection
//  and by battery_update() for continuous monitoring)
// ─────────────────────────────────────────────────────────────

static esp_err_t adc_setup(void)
{
    adc_oneshot_unit_init_cfg_t adc_cfg = {
        .unit_id  = BATTERY_ADC_UNIT,
        .ulp_mode = ADC_ULP_MODE_DISABLE,
    };
    if (adc_oneshot_new_unit(&adc_cfg, &g_adc_handle) != ESP_OK) return ESP_FAIL;

    adc_oneshot_chan_cfg_t chan_cfg = {
        .bitwidth = ADC_BITWIDTH_12,
        .atten    = ADC_ATTEN_DB_12,
    };
    if (adc_oneshot_config_channel(g_adc_handle, BATTERY_ADC_CHANNEL, &chan_cfg) != ESP_OK) return ESP_FAIL;

    adc_cali_curve_fitting_config_t cali_cfg = {
        .unit_id  = BATTERY_ADC_UNIT,
        .chan     = BATTERY_ADC_CHANNEL,
        .atten    = ADC_ATTEN_DB_12,
        .bitwidth = ADC_BITWIDTH_12,
    };
    adc_cali_create_scheme_curve_fitting(&cali_cfg, &g_adc_cali);
    return ESP_OK;
}

static uint16_t adc_read_voltage_mv(void)
{
    int raw = 0;
    if (adc_oneshot_read(g_adc_handle, BATTERY_ADC_CHANNEL, &raw) != ESP_OK) return 0;

    int mv_adc = 0;
    if (g_adc_cali) {
        adc_cali_raw_to_voltage(g_adc_cali, raw, &mv_adc);
    } else {
        mv_adc = (raw * 3300) / 4095;
    }
    return (uint16_t)((float)mv_adc / BATTERY_VOLTAGE_DIVIDER_RATIO);
}

// ─────────────────────────────────────────────────────────────
//  PUBLIC FUNCTIONS
// ─────────────────────────────────────────────────────────────

esp_err_t battery_init(void)
{
    // Resolve the config (auto / yes / no)
    const kb_config_t *cfg = config_store_get();
    const char *mode = cfg->power.battery_present;
    if (!mode || !mode[0]) mode = "auto";

    if (strcmp(mode, "no") == 0) {
        g_present = false;
        strncpy(g_source, "forced_no", sizeof(g_source) - 1);
        ESP_LOGI(TAG, "Battery disabled by config (forced_no)");
        return ESP_OK;
    }

    // For "yes" and "auto": we try to initialize the ADC
    if (adc_setup() != ESP_OK) {
        ESP_LOGW(TAG, "ADC init failed — battery marked absent");
        g_present = false;
        strncpy(g_source, "auto", sizeof(g_source) - 1);
        return ESP_OK;
    }

    // RGB LED (always init, even if battery absent — may be used elsewhere)
    led_strip_config_t strip_cfg = {
        .strip_gpio_num   = LED_RGB_GPIO,
        .max_leds         = LED_RGB_COUNT,
        .led_model        = LED_MODEL_WS2812,
        .flags.invert_out = false,
    };
    led_strip_rmt_config_t rmt_cfg = {
        .clk_src        = RMT_CLK_SRC_DEFAULT,
        .resolution_hz  = 10 * 1000 * 1000,
        .flags.with_dma = false,
    };
    led_strip_new_rmt_device(&strip_cfg, &rmt_cfg, &g_led_strip);
    led_off();

    if (strcmp(mode, "yes") == 0) {
        g_present = true;
        strncpy(g_source, "forced_yes", sizeof(g_source) - 1);
    } else {
        // auto-detection: average of 3 readings
        uint32_t acc = 0;
        for (int i = 0; i < 3; i++) {
            acc += adc_read_voltage_mv();
            vTaskDelay(pdMS_TO_TICKS(10));
        }
        uint16_t mv = (uint16_t)(acc / 3);
        g_present = (mv >= BATTERY_DETECT_MIN_MV && mv <= BATTERY_DETECT_MAX_MV);
        strncpy(g_source, "auto", sizeof(g_source) - 1);
        ESP_LOGI(TAG, "Auto-detection: %dmV → %s", mv,
                 g_present ? "present" : "absent");
    }

    if (g_present) {
        battery_update();
        ESP_LOGI(TAG, "Battery init: %dmV → %d%% (%s)",
                 g_voltage_mv, g_percent, g_source);
    } else {
        ESP_LOGI(TAG, "Battery absent (%s)", g_source);
    }
    return ESP_OK;
}

void battery_update(void)
{
    if (!g_present) return;

    g_voltage_mv = adc_read_voltage_mv();
    if (g_voltage_mv > BATTERY_VOLTAGE_MAX_MV) g_voltage_mv = BATTERY_VOLTAGE_MAX_MV;
    if (g_voltage_mv < BATTERY_VOLTAGE_MIN_MV) g_voltage_mv = BATTERY_VOLTAGE_MIN_MV;
    g_percent = voltage_to_percent(g_voltage_mv);
    update_led();
    ESP_LOGD(TAG, "mv=%d pct=%d", g_voltage_mv, g_percent);
}

uint8_t  battery_get_percent(void)    { return g_present ? g_percent : 0; }
uint16_t battery_get_voltage_mv(void) { return g_present ? g_voltage_mv : 0; }
bool     battery_is_present(void)     { return g_present; }
const char *battery_source_str(void)  { return g_source; }
