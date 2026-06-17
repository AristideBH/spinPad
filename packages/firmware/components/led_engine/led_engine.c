// ═══════════════════════════════════════════════════════════════
//  led_engine.c — WS2812 LED engine for the SpinPad keys
//
//  WS2812 chain : LED_KEY_GPIO (GPIO3), 10 key LEDs + N extension
//
//  Architecture :
//    g_key_cfg[]       — per-key config (color + effect)
//    g_brightness      — global brightness (0–255)
//    g_ext_rgb[]       — extension pixels (Hyperion / Mirror / etc.)
//    g_ext_count       — nb of active extension LEDs
//    led_engine_tick() — computes the effects, refreshes if dirty
//
//  Effects :
//    SOLID   → fixed color scaled by g_brightness
//    BREATHE → sinusoidal modulation ~2s, amplitude 10%–100%
//    OFF     → black
// ═══════════════════════════════════════════════════════════════

#include "led_engine.h"
#include "kb_config.h"
#include "config_store.h"

#include "led_strip.h"
#include "esp_log.h"
#include "esp_timer.h"
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"

#include <math.h>
#include <string.h>

static const char *TAG = "LED_ENGINE";

// Duration of the REACTIVE flash in ticks (fade from 255→0 in ~500ms @ 5ms/tick)
#define REACTIVE_FADE_STEP   3    // subtracted on each render tick (20ms), ~1700ms total

// ── Constants ────────────────────────────────────────────────
#define LED_EXT_MAX          50                          // Max nb of extension LEDs
#define LED_TOTAL_MAX        (LED_KEY_COUNT + LED_EXT_MAX)
#define BREATHE_PERIOD_MS    2000                        // Breathe period in ms
#define TICK_INTERVAL_MS     5                           // Tick frequency (= scan)
#define REFRESH_EVERY_TICKS  4                           // Refresh the chain every 4 ticks (20ms)

// ── Internal state ──────────────────────────────────────────────
static led_strip_handle_t  g_strip         = NULL;
static led_key_config_t    g_key_cfg[LED_KEY_COUNT];
static uint8_t             g_brightness    = 255;         // Global key brightness
static uint8_t             g_ext_rgb[LED_EXT_MAX * 3];    // External frame (Hyperion / bridge)
static uint8_t             g_ext_count     = 0;           // Nb of LEDs in g_ext_rgb
static uint32_t            g_tick_count    = 0;
static bool                g_dirty         = true;        // Force a first refresh
static bool                g_last_activity = false;       // For REACTIVE mode (set from ISR/keymap)
static uint8_t             g_reactive_fade = 0;           // Current intensity of the REACTIVE flash (0–255)

// Mutex for concurrent access (tick from kb_scan_task, set from web_config task)
static SemaphoreHandle_t   g_mutex         = NULL;

// ─────────────────────────────────────────────────────────────
//  Math helpers
// ─────────────────────────────────────────────────────────────

// Multiplies a color component by the brightness (0–255) and returns it on 0–255.
static inline uint8_t scale8(uint8_t val, uint8_t brightness)
{
    return (uint8_t)(((uint16_t)val * brightness) / 255);
}

// Computes the breathe factor (0–255) for a given instant.
// Uses a sinusoid between 26 (10%) and 255 (100%).
static uint8_t breathe_factor(void)
{
    // Time in ms modulo the period
    uint32_t t_ms = (g_tick_count * TICK_INTERVAL_MS) % BREATHE_PERIOD_MS;
    // Angle 0–2π
    float angle = (2.0f * (float)M_PI * t_ms) / BREATHE_PERIOD_MS;
    // sin ∈ [-1, 1] → [0.1, 1.0]
    float factor = 0.55f + 0.45f * sinf(angle);
    return (uint8_t)(factor * 255.0f);
}

// ─────────────────────────────────────────────────────────────
//  Extension render : extra LEDs according to the configured mode
// ─────────────────────────────────────────────────────────────

static void render_extension(uint8_t breathe)
{
    const kb_config_t *cfg = config_store_get();
    if (!cfg) return;

    const kb_led_extension_t *ext = &cfg->led_extension;
    if (!ext->enabled || ext->count == 0) return;

    uint8_t count = (ext->count < LED_EXT_MAX) ? ext->count : LED_EXT_MAX;
    uint8_t eb    = ext->brightness;   // extension's own brightness

    switch (ext->mode) {

        case LED_EXT_MODE_OFF:
            for (uint8_t i = 0; i < count; i++) {
                led_strip_set_pixel(g_strip, LED_KEY_COUNT + i, 0, 0, 0);
            }
            break;

        case LED_EXT_MODE_MIRROR:
            // Loops the key colors onto the extension (with effects)
            for (uint8_t i = 0; i < count; i++) {
                const led_key_config_t *k = &g_key_cfg[i % LED_KEY_COUNT];
                uint8_t r, g, b;
                switch (k->effect) {
                    case LED_EFFECT_BREATHE:
                        r = scale8(k->r, breathe);
                        g = scale8(k->g, breathe);
                        b = scale8(k->b, breathe);
                        break;
                    case LED_EFFECT_SOLID:
                        r = k->r; g = k->g; b = k->b;
                        break;
                    default:
                        r = 0; g = 0; b = 0;
                        break;
                }
                led_strip_set_pixel(g_strip, LED_KEY_COUNT + i,
                    scale8(r, eb), scale8(g, eb), scale8(b, eb));
            }
            break;

        case LED_EXT_MODE_AMBIENT:
            // Single color in breathe mode
            {
                uint8_t r = scale8(scale8(ext->r, breathe), eb);
                uint8_t g = scale8(scale8(ext->g, breathe), eb);
                uint8_t b = scale8(scale8(ext->b, breathe), eb);
                for (uint8_t i = 0; i < count; i++) {
                    led_strip_set_pixel(g_strip, LED_KEY_COUNT + i, r, g, b);
                }
            }
            break;

        case LED_EXT_MODE_STATIC:
            {
                uint8_t r = scale8(ext->r, eb);
                uint8_t g = scale8(ext->g, eb);
                uint8_t b = scale8(ext->b, eb);
                for (uint8_t i = 0; i < count; i++) {
                    led_strip_set_pixel(g_strip, LED_KEY_COUNT + i, r, g, b);
                }
            }
            break;

        case LED_EXT_MODE_REACTIVE:
            // Flash on keyboard activity, then progressive fade
            {
                // Advance the fade (called on each render, ~20ms)
                if (g_last_activity) {
                    g_reactive_fade  = 255;
                    g_last_activity  = false;
                } else if (g_reactive_fade >= REACTIVE_FADE_STEP) {
                    g_reactive_fade -= REACTIVE_FADE_STEP;
                } else {
                    g_reactive_fade  = 0;
                }

                uint8_t r = scale8(scale8(ext->r, g_reactive_fade), eb);
                uint8_t g = scale8(scale8(ext->g, g_reactive_fade), eb);
                uint8_t b = scale8(scale8(ext->b, g_reactive_fade), eb);
                for (uint8_t i = 0; i < count; i++) {
                    led_strip_set_pixel(g_strip, LED_KEY_COUNT + i, r, g, b);
                }
            }
            break;

        case LED_EXT_MODE_HYPERION:
        default:
            // Frame injected from outside (Hyperion bridge / API)
            for (uint8_t i = 0; i < count; i++) {
                if (i >= g_ext_count) {
                    led_strip_set_pixel(g_strip, LED_KEY_COUNT + i, 0, 0, 0);
                }
                else {
                    uint8_t r = scale8(g_ext_rgb[i * 3 + 0], eb);
                    uint8_t g = scale8(g_ext_rgb[i * 3 + 1], eb);
                    uint8_t b = scale8(g_ext_rgb[i * 3 + 2], eb);
                    led_strip_set_pixel(g_strip, LED_KEY_COUNT + i, r, g, b);
                }
            }
            break;
    }
}

// ─────────────────────────────────────────────────────────────
//  Render : computes the final color of each pixel
// ─────────────────────────────────────────────────────────────

// WS2812 power model : each unit (0–255) of an RGB channel ≈ 0.392 mW @ 5V/20mA.
// Integer approximation : total_mW = sum_rgb * 392 / 1000 ≈ sum_rgb * 2 / 5
static uint8_t power_scale_factor(uint32_t sum_rgb, uint16_t max_power_mw)
{
    if (max_power_mw == 0) return 255;  // Unlimited
    uint32_t total_mw = (sum_rgb * 392) / (255 * 1000 / 100);  // Integer approximation
    if (total_mw <= (uint32_t)max_power_mw) return 255;
    return (uint8_t)(((uint32_t)max_power_mw * 255) / total_mw);
}

static void render_frame(void)
{
    uint8_t breathe = breathe_factor();

    const kb_config_t *cfg = config_store_get();
    uint16_t max_power_mw = cfg ? cfg->led_extension.max_power_mw : 500;

    // First pass : compute the post-brightness colors
    uint8_t pixels[LED_KEY_COUNT][3];
    uint32_t sum_rgb = 0;

    for (uint8_t i = 0; i < LED_KEY_COUNT; i++) {
        const led_key_config_t *k = &g_key_cfg[i];
        uint8_t r = 0, g = 0, b = 0;

        switch (k->effect) {
            case LED_EFFECT_SOLID:
                r = k->r; g = k->g; b = k->b;
                break;
            case LED_EFFECT_BREATHE:
                r = scale8(k->r, breathe);
                g = scale8(k->g, breathe);
                b = scale8(k->b, breathe);
                break;
            case LED_EFFECT_OFF:
            default:
                break;
        }

        r = scale8(r, g_brightness);
        g = scale8(g, g_brightness);
        b = scale8(b, g_brightness);
        pixels[i][0] = r;
        pixels[i][1] = g;
        pixels[i][2] = b;
        sum_rgb += r + g + b;
    }

    // Second pass : apply power budget if needed
    uint8_t pscale = power_scale_factor(sum_rgb, max_power_mw);
    for (uint8_t i = 0; i < LED_KEY_COUNT; i++) {
        led_strip_set_pixel(g_strip, i,
            scale8(pixels[i][0], pscale),
            scale8(pixels[i][1], pscale),
            scale8(pixels[i][2], pscale));
    }

    // Chain extension — delegated to render_extension()
    render_extension(breathe);

    led_strip_refresh(g_strip);
}

// ─────────────────────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────────────────────

esp_err_t led_engine_init(void)
{
    g_mutex = xSemaphoreCreateMutex();
    if (!g_mutex) return ESP_ERR_NO_MEM;

    // Default config : all keys dim white (SOLID effect)
    led_key_config_t default_cfg = { .r = 30, .g = 30, .b = 30, .effect = LED_EFFECT_SOLID };
    for (int i = 0; i < LED_KEY_COUNT; i++) {
        g_key_cfg[i] = default_cfg;
    }
    memset(g_ext_rgb, 0, sizeof(g_ext_rgb));

    // Create the LED strip via RMT
    // The chain handles LED_KEY_COUNT + LED_EXT_MAX pixels max.
    // In practice, only LED_KEY_COUNT + g_ext_count are sent.
    led_strip_config_t strip_cfg = {
        .strip_gpio_num   = LED_KEY_GPIO,
        .max_leds         = LED_TOTAL_MAX,
        .led_model        = LED_MODEL_WS2812,
        .color_component_format = LED_STRIP_COLOR_COMPONENT_FMT_GRB,
        .flags.invert_out = false,
    };
    led_strip_rmt_config_t rmt_cfg = {
        .clk_src        = RMT_CLK_SRC_DEFAULT,
        .resolution_hz  = 10 * 1000 * 1000,  // 10MHz
        .flags.with_dma = false,
    };

    esp_err_t ret = led_strip_new_rmt_device(&strip_cfg, &rmt_cfg, &g_strip);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "LED strip init error : %s", esp_err_to_name(ret));
        return ret;
    }

    // Load the config from config_store if available
    led_engine_apply_config();

    ESP_LOGI(TAG, "LED engine ready (%d keys + %d ext max)", LED_KEY_COUNT, LED_EXT_MAX);
    return ESP_OK;
}

void led_engine_tick(void)
{
    if (!g_strip) return;
    g_tick_count++;

    // BREATHE effects require a frequent refresh.
    // For SOLID, we only refresh if dirty.
    bool need_breathe = false;
    for (int i = 0; i < LED_KEY_COUNT; i++) {
        if (g_key_cfg[i].effect == LED_EFFECT_BREATHE) {
            need_breathe = true;
            break;
        }
    }

    // REACTIVE mode requires a refresh as long as the fade is not finished
    bool need_reactive = (g_reactive_fade > 0) || g_last_activity;

    bool should_render = g_dirty
        || (need_breathe  && (g_tick_count % REFRESH_EVERY_TICKS == 0))
        || (need_reactive && (g_tick_count % REFRESH_EVERY_TICKS == 0));
    if (!should_render) return;

    if (xSemaphoreTake(g_mutex, 0) == pdTRUE) {
        render_frame();
        g_dirty = false;
        xSemaphoreGive(g_mutex);
    }
}

void led_engine_apply_config(void)
{
    // For now : applies a default color from config_store.
    // The per-layer LED config will be added in the config_store schema Sprint 4b.
    // We just read the brightness from the display config if available.
    const kb_config_t *cfg = config_store_get();
    if (!cfg) return;

    if (xSemaphoreTake(g_mutex, pdMS_TO_TICKS(50)) == pdTRUE) {
        // Apply brightness from display config
        g_brightness = cfg->display.brightness;

        // Default per-layer color : soft white
        led_key_config_t default_cfg = {
            .r = 60, .g = 60, .b = 80,
            .effect = LED_EFFECT_SOLID,
        };
        for (int i = 0; i < LED_KEY_COUNT; i++) {
            g_key_cfg[i] = default_cfg;
        }

        g_dirty = true;
        xSemaphoreGive(g_mutex);
    }
}

void led_engine_set_key(uint8_t key_idx, const led_key_config_t *cfg)
{
    if (key_idx >= LED_KEY_COUNT || !cfg) return;
    if (xSemaphoreTake(g_mutex, pdMS_TO_TICKS(10)) == pdTRUE) {
        g_key_cfg[key_idx] = *cfg;
        g_dirty = true;
        xSemaphoreGive(g_mutex);
    }
}

void led_engine_set_all(const led_key_config_t *cfg)
{
    if (!cfg) return;
    if (xSemaphoreTake(g_mutex, pdMS_TO_TICKS(10)) == pdTRUE) {
        for (int i = 0; i < LED_KEY_COUNT; i++) {
            g_key_cfg[i] = *cfg;
        }
        g_dirty = true;
        xSemaphoreGive(g_mutex);
    }
}

void led_engine_set_brightness_global(uint8_t brightness)
{
    if (xSemaphoreTake(g_mutex, pdMS_TO_TICKS(10)) == pdTRUE) {
        g_brightness = brightness;
        g_dirty = true;
        xSemaphoreGive(g_mutex);
    }
}

void led_engine_set_extension_frame(const uint8_t *rgb, uint8_t count)
{
    if (!rgb || count == 0) return;
    uint8_t n = count > LED_EXT_MAX ? LED_EXT_MAX : count;
    if (xSemaphoreTake(g_mutex, pdMS_TO_TICKS(10)) == pdTRUE) {
        memcpy(g_ext_rgb, rgb, n * 3);
        g_ext_count = n;
        g_dirty = true;
        xSemaphoreGive(g_mutex);
    }
}

uint8_t led_engine_get_brightness(void)
{
    return g_brightness;
}

void led_engine_notify_activity(void)
{
    // No need for the mutex : g_last_activity is an atomic write (bool)
    // The render reads g_last_activity under mutex → consistency ensured.
    g_last_activity = true;
}
