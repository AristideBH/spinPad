// ═══════════════════════════════════════════════════════════════
//  led_engine.h — WS2812 LED engine for the SpinPad keys
//
//  Manages the WS2812 chain of the 10 keys (LED_KEY_GPIO).
//  Supports per-key effects, global brightness, chain extension.
//
//  Usage :
//    led_engine_init()             — to call in app_main after battery_init
//    led_engine_tick()             — to call in keyboard_scan_task (~5ms)
//    led_engine_apply_config()     — reload from config_store after a change
//    led_engine_set_brightness_global(50) — in Studio Mode (dim ~20%)
//
//  Chain extension :
//    The extra LEDs (led_extension in the config) are added
//    after the 10 key LEDs in the same physical chain.
// ═══════════════════════════════════════════════════════════════

#pragma once

#include <stdint.h>
#include <stdbool.h>
#include "esp_err.h"

// ─────────────────────────────────────────────────────────────
//  Effects available per key
// ─────────────────────────────────────────────────────────────

typedef enum {
    LED_EFFECT_OFF     = 0,   // Off
    LED_EFFECT_SOLID   = 1,   // Fixed color
    LED_EFFECT_BREATHE = 2,   // Soft pulsing (sinusoidal ~2s)
} led_effect_t;

// ─────────────────────────────────────────────────────────────
//  Config of an individual key
// ─────────────────────────────────────────────────────────────

typedef struct {
    uint8_t      r, g, b;    // Color (0–255)
    led_effect_t effect;     // Effect
} led_key_config_t;

// ─────────────────────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────────────────────

/**
 * Initializes the LED engine and starts the WS2812 chain via RMT.
 * Call after battery_init() in app_main (both use RMT).
 */
esp_err_t led_engine_init(void);

/**
 * LED engine tick (~5ms). Updates the animated effects (breathe)
 * and refreshes the chain if needed.
 * Call from keyboard_scan_task.
 */
void led_engine_tick(void);

/**
 * Reloads the colors/effects from config_store.
 * Call after loadConfig on the firmware side or after a web_config update.
 */
void led_engine_apply_config(void);

/**
 * Sets the LED config of an individual key.
 * @param key_idx Key index (0–9)
 * @param cfg     Color + effect
 */
void led_engine_set_key(uint8_t key_idx, const led_key_config_t *cfg);

/**
 * Applies the same config to all keys.
 */
void led_engine_set_all(const led_key_config_t *cfg);

/**
 * Global brightness (0–255). All colors are scaled by this factor.
 * 255 = full brightness, 50 = ~20% (Studio dim mode).
 */
void led_engine_set_brightness_global(uint8_t brightness);

/**
 * Injects external RGB pixels for the chain extension
 * (Hyperion NG bridge, Mirror mode, etc.).
 * @param rgb   Array of R,G,B triplets
 * @param count Number of extension LEDs to update
 */
void led_engine_set_extension_frame(const uint8_t *rgb, uint8_t count);

/**
 * Returns the current global brightness.
 */
uint8_t led_engine_get_brightness(void);

/**
 * Signals keyboard activity to the LED engine (for REACTIVE mode).
 * Call from keymap_process_events() on each key press.
 */
void led_engine_notify_activity(void);
