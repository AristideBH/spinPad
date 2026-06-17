// ===============================================================
//  keymap.c - Key engine: layers, combos, modifiers
//
//  RECOMMENDED READING if you are new to C:
//  Think of this file as a JavaScript "service".
//  Static functions (static) = private module functions.
//  Non-static functions = public functions (in keymap.h).
// ===============================================================

#include "keymap.h"
#include "kb_config.h"
#include "config_store.h"
#include "usb_hid.h"
#include "ble_hid.h"
#include "web_config.h"
#include "display.h"
#include "led_engine.h"
#include "action_types.gen.h"
#include <stdio.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "esp_timer.h"      // Timestamps in microseconds
#include "esp_log.h"
#include <string.h>         // memset, memcpy
#include <stdlib.h>         // malloc, free

static const char *TAG = "KEYMAP";

// -------------------------------------------------------------
//  INTERNAL MODULE STATE
//  "static" variables = private, visible only in this file
// -------------------------------------------------------------

// The full keymap: [profile][layer][key] = action
// Loaded from config_store at startup
static uint16_t g_keymap[CONFIG_MAX_PROFILES][KEYMAP_MAX_LAYERS][KB_NUM_KEYS];

// Number of active layers in each profile
static uint8_t g_layer_count[CONFIG_MAX_PROFILES];

// Currently active profile
static uint8_t g_active_profile = 0;

// Stack of active layers (like a z-index stack)
// The highest-index layer has priority.
// Example: [0, 2] -> layer 2 is active, layer 0 below
static uint8_t  g_layer_stack[KEYMAP_MAX_LAYERS];
static uint8_t  g_layer_stack_size = 0;

// -- Physical key state --
// Indices 0..KB_NUM_KEYS-1  : matrix keys (SW1-SW10)
// Indices KB_NUM_KEYS..KB_TOTAL_KEYS-1 : special buttons (SW11, SW16, SW17)
static uint8_t  g_key_state[KB_TOTAL_KEYS];          // Current state (1=pressed, 0=released)
static uint8_t  g_key_prev[KB_TOTAL_KEYS];           // State at the previous scan
static uint8_t  g_debounce_count[KB_TOTAL_KEYS];     // Debounce counter
static uint8_t  g_debounce_timeout[KB_TOTAL_KEYS];  // Total oscillation scans (force-accept)

#define KB_DEBOUNCE_TIMEOUT_SCANS 20  // Force-accept after 20 scans (~100ms) of oscillation

// Timestamp (us) of the moment each key was pressed
static int64_t  g_key_press_time[KB_TOTAL_KEYS];

// Currently active modifier (HID byte: bits 0-7)
static uint8_t  g_modifier_state = 0;

// "activity detected" flag (reset after keymap_has_activity())
static bool     g_has_activity = false;

// -- Combos --
static kb_combo_t g_combos[KEYMAP_MAX_COMBOS];
static uint8_t    g_combo_count = 0;

// Internal state of the combo detector
typedef enum {
    COMBO_STATE_IDLE,       // No combo in progress
    COMBO_STATE_DETECTING,  // Keys partially pressed, waiting
    COMBO_STATE_FIRED,      // Combo triggered
} combo_state_t;

static combo_state_t g_combo_state = COMBO_STATE_IDLE;
static int64_t       g_combo_start_time = 0;   // When the first combo press happened

// -- Long press (for SW16+SW17 pairing) --
static int64_t g_sw16_press_time = 0;
static int64_t g_sw17_press_time = 0;
static bool    g_pairing_triggered = false;

// -- Monitor mode (training) --
static bool    g_monitor_enabled  = false;
static int64_t g_monitor_start_ms = 0;
#define MONITOR_AUTO_OFF_MS (5 * 60 * 1000)  // 5 minutes

// -- Training mode (suppress action execution) --
// Enabled by {"cmd":"training_mode","enable":true}: the studio still
// receives the events via the monitor, but no HID action is sent.
static bool    g_training_mode = false;

// -------------------------------------------------------------
//  PRIVATE FUNCTIONS - GPIO MATRIX
// -------------------------------------------------------------

// Configure the GPIOs of the matrix and the special buttons
static void matrix_gpio_init(void)
{
    // Rows (ROW) = outputs, HIGH by default
    for (int r = 0; r < KB_MATRIX_ROWS; r++) {
        gpio_config_t cfg = {
            .pin_bit_mask = (1ULL << KB_ROW_PINS[r]),
            .mode         = GPIO_MODE_OUTPUT,
            .pull_up_en   = GPIO_PULLUP_DISABLE,
            .pull_down_en = GPIO_PULLDOWN_DISABLE,
            .intr_type    = GPIO_INTR_DISABLE,
        };
        gpio_config(&cfg);
        gpio_set_level(KB_ROW_PINS[r], 1);
    }

    // Columns (COL) = inputs with pull-up - LOW = key pressed
    for (int c = 0; c < KB_MATRIX_COLS; c++) {
        gpio_config_t cfg = {
            .pin_bit_mask = (1ULL << KB_COL_PINS[c]),
            .mode         = GPIO_MODE_INPUT,
            .pull_up_en   = GPIO_PULLUP_ENABLE,
            .pull_down_en = GPIO_PULLDOWN_DISABLE,
            .intr_type    = GPIO_INTR_DISABLE,
        };
        gpio_config(&cfg);
    }

    // Special buttons outside the matrix (SW11, SW16, SW17)
    const gpio_num_t special_pins[] = {SW11_GPIO, SW16_GPIO, SW17_GPIO};
    for (int i = 0; i < 3; i++) {
        gpio_config_t cfg = {
            .pin_bit_mask = (1ULL << special_pins[i]),
            .mode         = GPIO_MODE_INPUT,
            .pull_up_en   = GPIO_PULLUP_ENABLE,
            .pull_down_en = GPIO_PULLDOWN_DISABLE,
            .intr_type    = GPIO_INTR_DISABLE,
        };
        gpio_config(&cfg);
    }

    ESP_LOGI(TAG, "GPIO matrix initialized (%dx%d + 3 special buttons)",
             KB_MATRIX_ROWS, KB_MATRIX_COLS);
}

// -------------------------------------------------------------
//  PRIVATE FUNCTIONS - LAYERS
// -------------------------------------------------------------

// Push a layer onto the stack (make it active)
// Equivalent to "z-index: auto" in CSS
static void layer_push(uint8_t layer)
{
    if (g_layer_stack_size >= KEYMAP_MAX_LAYERS) {
        ESP_LOGW(TAG, "Layer stack full");
        return;
    }
    // Avoid duplicates
    for (int i = 0; i < g_layer_stack_size; i++) {
        if (g_layer_stack[i] == layer) return;
    }
    g_layer_stack[g_layer_stack_size++] = layer;
    ESP_LOGD(TAG, "Layer %d activated (stack size: %d)", layer, g_layer_stack_size);
}

// Remove a layer from the stack
static void layer_pop(uint8_t layer)
{
    for (int i = 0; i < g_layer_stack_size; i++) {
        if (g_layer_stack[i] == layer) {
            // Shift all the following elements to the left
            // (like Array.splice in JS)
            memmove(&g_layer_stack[i], &g_layer_stack[i+1],
                    (g_layer_stack_size - i - 1) * sizeof(uint8_t));
            g_layer_stack_size--;
            ESP_LOGD(TAG, "Layer %d deactivated", layer);
            return;
        }
    }
}

// Return the action for a given key according to the active layers
// Searches from the highest layer down (descending priority)
static uint16_t layer_resolve_action(uint8_t key_index)
{
    // Search from the highest layer (top of stack) down
    for (int i = g_layer_stack_size - 1; i >= 0; i--) {
        uint8_t layer = g_layer_stack[i];
        uint16_t action = g_keymap[g_active_profile][layer][key_index];
        // KC_NONE = "transparent" -> fall through to the layer below
        if (action != KC_NONE) {
            return action;
        }
    }
    return KC_NONE;  // No action found in any layer
}

// -------------------------------------------------------------
//  PRIVATE FUNCTIONS - COMBOS
// -------------------------------------------------------------

// Check whether a set of keys matches a defined combo
// Returns the combo index, or -1 if no match
static int combo_find_match(void)
{
    for (int c = 0; c < g_combo_count; c++) {
        if (!g_combos[c].active) continue;

        bool all_pressed = true;
        for (int k = 0; k < g_combos[c].key_count; k++) {
            uint8_t sw = g_combos[c].keys[k];
            if (!g_key_state[sw]) {
                all_pressed = false;
                break;
            }
        }
        if (all_pressed) return c;
    }
    return -1;
}

// -------------------------------------------------------------
//  PRIVATE FUNCTIONS - HID SEND
// -------------------------------------------------------------

// Dispatch the action to the right handler (USB or BLE)
static void send_action(uint16_t action, bool pressed)
{
    // Training mode: we stream the events to the studio (via _monitor_emit
    // upstream) but we do not execute the HID action. Lets you re-configure
    // the device by pressing the keys without triggering their current action.
    if (g_training_mode) return;

    uint8_t  type  = (action >> 12) & 0xF;   // high 4 bits = type
    uint16_t value = action & 0x0FFF;          // low 12 bits = value

    switch (type) {

    case ACTION_TYPE_KC: {
        // Standard keycode: HID usage (bits 7-0) + modifier nibble (bits 11-8).
        // The nibble lets you send a "shifted" symbol (e.g. Shift+1 = '!')
        // from a single key, without a macro or a held physical modifier.
        // It is combined (OR) with g_modifier_state (held SpinPad modifiers).
        uint8_t kc   = (uint8_t)(value & 0xFF);
        uint8_t kmod = (uint8_t)((value >> 8) & 0x0F);
        if (pressed) {
            uint8_t mods = g_modifier_state | kmod;
            usb_hid_key_press(kc, mods);
            ble_hid_key_press(kc, mods);
        } else {
            usb_hid_key_release(kc);
            ble_hid_key_release(kc);
        }
        break;
    }

    case ACTION_TYPE_MOD:
        // Modifier: update the modifier byte
        if (pressed) {
            g_modifier_state |= (uint8_t)value;   // Set the bit
        } else {
            g_modifier_state &= ~(uint8_t)value;  // Clear the bit
        }
        break;

    case ACTION_TYPE_LAYER_MO:
        // Momentary: layer active while the key is pressed
        if (pressed) layer_push((uint8_t)value);
        else         layer_pop((uint8_t)value);
        break;

    case ACTION_TYPE_LAYER_TG:
        // Toggle: each press enables/disables
        if (pressed) {
            bool found = false;
            for (int i = 0; i < g_layer_stack_size; i++) {
                if (g_layer_stack[i] == (uint8_t)value) {
                    layer_pop((uint8_t)value);
                    found = true;
                    break;
                }
            }
            if (!found) layer_push((uint8_t)value);
        }
        break;

    case ACTION_TYPE_LAYER_TO:
        // To: go directly to this layer (reset the stack)
        if (pressed) {
            g_layer_stack_size = 0;
            layer_push(0);               // Layer 0 always at the base
            layer_push((uint8_t)value);  // Target layer
        }
        break;

    case ACTION_TYPE_MEDIA:
        // Media key: HID Consumer Control
        if (pressed) {
            usb_hid_consumer_press((uint16_t)value);
            ble_hid_consumer_press((uint16_t)value);
        } else {
            usb_hid_consumer_release();
            ble_hid_consumer_release();
        }
        break;

    case ACTION_TYPE_MACRO:
        // Launch the macro in the background on press only
        if (pressed && value < MACRO_COUNT) {
            keymap_play_macro((uint8_t)value);
        }
        break;

    case ACTION_TYPE_SPECIAL:
        // Special firmware actions
        if (pressed) {
            if (value == SPECIAL_BLE_SWITCH) {
                ESP_LOGI(TAG, "BLE device switch requested");
                ble_hid_switch_device();
            } else if (value == SPECIAL_ORIENT_CW || value == SPECIAL_ORIENT_CCW) {
                // Rotation of the global orientation
                kb_config_t *cfg = (kb_config_t *)config_store_get();
                int delta = (value == SPECIAL_ORIENT_CW) ? 1 : 3; // +1 or -1 mod 4
                cfg->orientation = (kb_orientation_t)((cfg->orientation + delta) % 4);
                display_apply_orientation(cfg->orientation);
                config_store_save();
                ESP_LOGI(TAG, "Orientation -> %d deg", cfg->orientation * 90);
            } else if (value == SPECIAL_PROFILE_NEXT || value == SPECIAL_PROFILE_PREV) {
                // Cyclic switch of the active profile on-device. keymap_set_active_profile
                // persists + reloads + emits the "profile" event for the studio.
                uint8_t count = config_store_get()->profile_count;
                if (count > 0) {
                    int delta = (value == SPECIAL_PROFILE_NEXT) ? 1 : (count - 1);
                    uint8_t target = (uint8_t)((g_active_profile + delta) % count);
                    keymap_set_active_profile(target);
                    ESP_LOGI(TAG, "Active profile -> %u (%s)", target,
                             value == SPECIAL_PROFILE_NEXT ? "next" : "prev");
                }
            }
            // BLE_PAIR is handled separately (long press SW16+SW17)
        }
        break;

    default:
        break;
    }
}

// -------------------------------------------------------------
//  PRIVATE FUNCTIONS - STUDIO MODE LONG PRESS
//
//  SW8 + SW9 held 3 seconds = toggle Studio Mode WiFi
// -------------------------------------------------------------

#define STUDIO_MODE_LONGPRESS_MS  3000

static int64_t g_sw8sw9_press_start  = 0;
static bool    g_studio_mode_triggered = false;

static void check_studio_mode_longpress(void)
{
    bool sw8 = g_key_state[SW8];   // index 1
    bool sw9 = g_key_state[SW9];   // index 4
    int64_t now = esp_timer_get_time() / 1000;  // us -> ms

    if (sw8 && sw9) {
        if (g_sw8sw9_press_start == 0) {
            g_sw8sw9_press_start = now;
        }
        if (!g_studio_mode_triggered &&
            (now - g_sw8sw9_press_start) >= STUDIO_MODE_LONGPRESS_MS) {
            if (web_config_is_running()) {
                ESP_LOGI(TAG, "Long press SW8+SW9 -> stop Studio Mode");
                web_config_stop();
            } else {
                ESP_LOGI(TAG, "Long press SW8+SW9 -> start Studio Mode");
                web_config_start();
            }
            g_studio_mode_triggered = true;
        }
    } else {
        // Reset when one of the keys is released
        g_sw8sw9_press_start    = 0;
        g_studio_mode_triggered = false;
    }
}

// -------------------------------------------------------------
//  PRIVATE FUNCTIONS - PAIRING LONG PRESS DETECTION
//
//  SW16 + SW17 held BLE_PAIRING_LONG_PRESS_MS = BLE pairing
// -------------------------------------------------------------
static void check_pairing_longpress(void)
{
    bool sw16 = g_key_state[SW16];
    bool sw17 = g_key_state[SW17];
    int64_t now = esp_timer_get_time() / 1000;  // us -> ms

    if (sw16 && sw17 && !g_pairing_triggered) {
        // Both are pressed: check for how long
        int64_t press_start = (g_sw16_press_time < g_sw17_press_time)
                              ? g_sw17_press_time   // The more recent of the two
                              : g_sw16_press_time;
        if ((now - press_start) >= BLE_PAIRING_LONG_PRESS_MS) {
            ESP_LOGI(TAG, "Long press SW16+SW17 -> BLE pairing mode");
            ble_hid_enter_pairing_mode();
            g_pairing_triggered = true;
        }
    }

    // Reset when one of the two keys is released
    if (!sw16 || !sw17) {
        g_pairing_triggered = false;
    }
}

// -------------------------------------------------------------
//  PUBLIC FUNCTIONS
// -------------------------------------------------------------

esp_err_t keymap_init(void)
{
    // Initialize the matrix GPIOs
    matrix_gpio_init();

    // Reset the internal states (matrix + special buttons)
    memset(g_key_state,      0, sizeof(g_key_state));
    memset(g_key_prev,       0, sizeof(g_key_prev));
    memset(g_debounce_count, 0, sizeof(g_debounce_count));
    g_modifier_state = 0;
    g_has_activity   = false;

    // Layer 0 always active (base layer)
    g_layer_stack[0]  = 0;
    g_layer_stack_size = 1;

    // Load the keymap and the combos from the config
    keymap_reload_from_config();

    ESP_LOGI(TAG, "Keymap initialized - %d profiles, %d combos",
             CONFIG_MAX_PROFILES, g_combo_count);
    return ESP_OK;
}

// Validate a key state after asymmetric debounce with timeout.
// Returns true if the state changed and must be applied.
static bool _debounce_update(int key_idx, int raw, int64_t now,
                             uint8_t press_scans, uint8_t release_scans)
{
    if (raw == g_key_state[key_idx]) {
        // Stable signal -> reset the counters
        g_debounce_count[key_idx]   = 0;
        g_debounce_timeout[key_idx] = 0;
        return false;
    }

    g_debounce_count[key_idx]++;
    g_debounce_timeout[key_idx]++;

    uint8_t threshold = raw ? press_scans : release_scans;

    bool timeout_force = (g_debounce_timeout[key_idx] >= KB_DEBOUNCE_TIMEOUT_SCANS);
    bool threshold_met = (g_debounce_count[key_idx]   >= threshold);

    if (threshold_met || timeout_force) {
        if (timeout_force && !threshold_met) {
            ESP_LOGD("KEYMAP", "Debounce timeout forced key=%d raw=%d", key_idx, raw);
        }
        g_debounce_count[key_idx]   = 0;
        g_debounce_timeout[key_idx] = 0;
        g_key_prev[key_idx]         = g_key_state[key_idx];
        g_key_state[key_idx]        = raw;
        return true;
    }
    return false;
}

static void _monitor_emit(int key_idx, int state, int64_t now)
{
    if (!g_monitor_enabled) return;
    char buf[96];
    uint16_t act = (key_idx < KB_NUM_KEYS) ? g_keymap[g_active_profile][g_layer_stack[g_layer_stack_size - 1]][key_idx] : 0;
    snprintf(buf, sizeof(buf),
             "{\"event\":\"key\",\"idx\":%d,\"state\":\"%s\",\"layer\":%d,\"action\":%u,\"ts_ms\":%lld}\n",
             key_idx, state ? "down" : "up",
             (int)g_layer_stack[g_layer_stack_size - 1], (unsigned)act, (long long)now);
    usb_hid_cdc_send(buf);
}

// Emit an active-profile change event to the studio (monitor stream).
// Lets the studio reflect the profile switch live, whether it comes
// from the studio itself or from an on-device action (slice 5).
static void _monitor_emit_profile(uint8_t idx)
{
    if (!g_monitor_enabled) return;
    int64_t now = esp_timer_get_time() / 1000;  // us -> ms
    char buf[64];
    snprintf(buf, sizeof(buf),
             "{\"event\":\"profile\",\"active\":%u,\"ts_ms\":%lld}\n",
             (unsigned)idx, (long long)now);
    usb_hid_cdc_send(buf);
}

// Matrix scan: updates g_key_state[0..KB_NUM_KEYS-1]
void keymap_scan_matrix(void)
{
    int64_t now = esp_timer_get_time() / 1000;  // us -> ms
    const kb_config_t *cfg = config_store_get();
    uint8_t press_scans   = cfg->power.debounce_press_scans   ? cfg->power.debounce_press_scans   : 3;
    uint8_t release_scans = cfg->power.debounce_release_scans ? cfg->power.debounce_release_scans : 5;

    // Auto-disable monitor after 5 minutes (and training with it, otherwise the
    // keys would stay inert once the studio is closed).
    if (g_monitor_enabled && (now - g_monitor_start_ms) > MONITOR_AUTO_OFF_MS) {
        g_monitor_enabled = false;
        if (g_training_mode) {
            g_training_mode = false;
            ESP_LOGI(TAG, "Training mode disabled (monitor timeout)");
        }
        ESP_LOGI(TAG, "Monitor mode disabled (timeout)");
    }

    for (int r = 0; r < KB_MATRIX_ROWS; r++) {
        gpio_set_level(KB_ROW_PINS[r], 0);
        esp_rom_delay_us(5);

        for (int c = 0; c < KB_MATRIX_COLS; c++) {
            if (!KB_MATRIX_VALID[r][c]) continue;  // Empty cell

            int key_idx = KB_MATRIX_TO_KEY[r][c];
            int raw = gpio_get_level(KB_COL_PINS[c]) == 0 ? 1 : 0;

            if (_debounce_update(key_idx, raw, now, press_scans, release_scans)) {
                if (raw) {
                    g_key_press_time[key_idx] = now;
                    g_has_activity = true;
                }
                _monitor_emit(key_idx, raw, now);
            }
        }

        gpio_set_level(KB_ROW_PINS[r], 1);
    }

    // Scan the special buttons outside the matrix (SW11, SW16, SW17)
    const gpio_num_t special_pins[] = {SW11_GPIO, SW16_GPIO, SW17_GPIO};
    const int        special_idx[]  = {SW11,      SW16,      SW17     };
    for (int i = 0; i < 3; i++) {
        int ki  = special_idx[i];
        int raw = gpio_get_level(special_pins[i]) == SW_BTN_ACTIVE_LEVEL ? 1 : 0;

        if (_debounce_update(ki, raw, now, press_scans, release_scans)) {
            if (raw) {
                g_key_press_time[ki] = now;
                if (ki == SW16) g_sw16_press_time = now;
                if (ki == SW17) g_sw17_press_time = now;
                g_has_activity = true;
            }
        }
    }
}

void keymap_set_monitor(bool enable)
{
    g_monitor_enabled = enable;
    if (enable) {
        g_monitor_start_ms = esp_timer_get_time() / 1000;
        ESP_LOGI(TAG, "Monitor mode enabled");
    } else {
        ESP_LOGI(TAG, "Monitor mode disabled");
    }
}

bool keymap_get_monitor(void) { return g_monitor_enabled; }

void keymap_set_training_mode(bool enable)
{
    g_training_mode = enable;
    ESP_LOGI(TAG, "Training mode %s", enable ? "ON" : "OFF");
}

bool keymap_get_training_mode(void) { return g_training_mode; }

// -------------------------------------------------------------
//  MACRO PLAYBACK
//  Each press on a macro key launches an ephemeral task
//  that plays the steps in order, then terminates.
// -------------------------------------------------------------
typedef struct { uint8_t macro_idx; } MacroTaskArg;

static void macro_task(void *pvArg)
{
    MacroTaskArg *arg = (MacroTaskArg *)pvArg;
    const kb_config_t *cfg = config_store_get();

    if (arg->macro_idx >= MACRO_COUNT) goto done;
    const kb_macro_t *macro = &cfg->macros[arg->macro_idx];

    for (int si = 0; si < macro->step_count; si++) {
        const kb_macro_step_t *step = &macro->steps[si];
        switch (step->type) {
        case MACRO_STEP_KEY_DOWN:
            usb_hid_key_press(step->keycode_or_delay, 0);
            ble_hid_key_press(step->keycode_or_delay, 0);
            break;
        case MACRO_STEP_KEY_UP:
            usb_hid_key_release(step->keycode_or_delay);
            ble_hid_key_release(step->keycode_or_delay);
            break;
        case MACRO_STEP_DELAY_MS:
            if (step->keycode_or_delay > 0) {
                vTaskDelay(pdMS_TO_TICKS(step->keycode_or_delay));
            }
            break;
        default:
            break;
        }
    }

done:
    free(pvArg);
    vTaskDelete(NULL);
}

void keymap_play_macro(uint8_t macro_idx)
{
    const kb_config_t *cfg = config_store_get();

    if (macro_idx >= MACRO_COUNT || cfg->macros[macro_idx].step_count == 0) {
        ESP_LOGW(TAG, "Macro %d nonexistent or empty", macro_idx);
        return;
    }

    MacroTaskArg *arg = malloc(sizeof(MacroTaskArg));
    if (!arg) {
        ESP_LOGE(TAG, "OOM - macro ignored");
        return;
    }
    arg->macro_idx = macro_idx;

    // Ephemeral task, priority 4 (slightly above the scan)
    // Stack 1024 words = 4KB, enough for simple HID calls
    BaseType_t rc = xTaskCreate(macro_task, "macro", 1024, arg, 4, NULL);
    if (rc != pdPASS) {
        free(arg);
        ESP_LOGE(TAG, "xTaskCreate macro failed");
    }
}

// Event processing: combos, layers, HID send
void keymap_process_events(void)
{
    // -- 0. Notify the LED engine if a key was just pressed --
    if (g_has_activity) {
        led_engine_notify_activity();
        // NB: we do NOT reset g_has_activity to false here - keymap_has_activity()
        // does it separately for the other consumers (display, etc.)
    }

    // -- 1. Check the special long presses --
    check_studio_mode_longpress();   // SW8+SW9 -> Studio Mode WiFi
    check_pairing_longpress();       // SW16+SW17 -> BLE Pairing

    // -- 2. Combo detection --
    int64_t now = esp_timer_get_time() / 1000;

    if (g_combo_state == COMBO_STATE_IDLE) {
        // Look for whether a pressed key can be the start of a combo
        for (int k = 0; k < KB_NUM_KEYS; k++) {
            if (g_key_state[k] && !g_key_prev[k]) {
                // New key pressed - can it initiate a combo?
                for (int c = 0; c < g_combo_count; c++) {
                    for (int ki = 0; ki < g_combos[c].key_count; ki++) {
                        if (g_combos[c].keys[ki] == k) {
                            g_combo_state      = COMBO_STATE_DETECTING;
                            g_combo_start_time = now;
                            goto combo_detection_started;
                        }
                    }
                }
            }
        }
        combo_detection_started:;
    }

    if (g_combo_state == COMBO_STATE_DETECTING) {
        int match = combo_find_match();
        if (match >= 0) {
            // Complete combo! Trigger the action
            ESP_LOGD(TAG, "Combo triggered: %d", match);
            send_action(g_combos[match].action, true);
            send_action(g_combos[match].action, false);
            g_combo_state = COMBO_STATE_FIRED;
        } else if ((now - g_combo_start_time) > 50) {
            // Combo window timeout -> process the keys normally
            g_combo_state = COMBO_STATE_IDLE;
        }
    }

    if (g_combo_state == COMBO_STATE_FIRED) {
        // Wait until all the combo keys are released
        bool any_pressed = false;
        for (int k = 0; k < KB_NUM_KEYS; k++) {
            if (g_key_state[k]) { any_pressed = true; break; }
        }
        if (!any_pressed) g_combo_state = COMBO_STATE_IDLE;
        return;  // Ignore individual keys during a combo
    }

    // -- 3. Key-by-key processing (matrix keys only) --
    for (int k = 0; k < KB_NUM_KEYS; k++) {
        bool curr = g_key_state[k];
        bool prev = g_key_prev[k];

        if (curr == prev) continue;

        uint16_t action = layer_resolve_action(k);

        if (curr && !prev) {
            ESP_LOGD(TAG, "SW%d pressed -> action 0x%04X", k+1, action);
            send_action(action, true);
        } else if (!curr && prev) {
            ESP_LOGD(TAG, "SW%d released -> action 0x%04X", k+1, action);
            send_action(action, false);
        }

        g_key_prev[k] = curr;
    }

    // -- 4. Special buttons outside the matrix --
    // SW11: BLE device switch (rising edge)
    if (g_key_state[SW11] && !g_key_prev[SW11]) {
        ESP_LOGI(TAG, "SW11 -> BLE device switch");
        ble_hid_switch_device();
    }
    g_key_prev[SW11] = g_key_state[SW11];
    g_key_prev[SW16] = g_key_state[SW16];
    g_key_prev[SW17] = g_key_state[SW17];
}

bool keymap_has_activity(void)
{
    if (g_has_activity) {
        g_has_activity = false;  // Auto-reset after read
        return true;
    }
    return false;
}

uint8_t keymap_get_active_layer(void)
{
    // Return the highest layer in the stack
    if (g_layer_stack_size > 0) {
        return g_layer_stack[g_layer_stack_size - 1];
    }
    return 0;
}

void keymap_reload_from_config(void)
{
    // Load the keymap from config_store
    const kb_config_t *cfg = config_store_get();

    // Sync the active profile from the config. Previously g_active_profile
    // stayed frozen here: a change of active_profile in config (set_config,
    // factory_reset, profile switch) was not propagated to the keymap engine.
    g_active_profile = (cfg->active_profile < cfg->profile_count) ? cfg->active_profile : 0;

    // Copy the keymaps of each profile/layer
    for (int p = 0; p < cfg->profile_count && p < CONFIG_MAX_PROFILES; p++) {
        g_layer_count[p] = cfg->profiles[p].layer_count;
        for (int l = 0; l < cfg->profiles[p].layer_count && l < KEYMAP_MAX_LAYERS; l++) {
            for (int k = 0; k < KB_NUM_KEYS; k++) {
                g_keymap[p][l][k] = cfg->profiles[p].layers[l].keys[k];
            }
        }
    }

    // Load the combos of the active profile
    g_combo_count = 0;
    const kb_profile_t *prof = &cfg->profiles[g_active_profile];
    for (int c = 0; c < prof->combo_count && c < KEYMAP_MAX_COMBOS; c++) {
        g_combos[c] = prof->combos[c];
        g_combo_count++;
    }

    ESP_LOGI(TAG, "Keymap reloaded: profile %d, %d layers, %d combos",
             g_active_profile, g_layer_count[g_active_profile], g_combo_count);
}

void keymap_set_active_profile(uint8_t idx)
{
    uint8_t prev = g_active_profile;
    uint8_t applied = idx;

    // Data layer: clamp + NVS persistence.
    if (config_store_set_active_profile(idx, &applied) != ESP_OK) return;

    // Runtime layer: reload keymap/combos and sync g_active_profile
    // (via the fix in keymap_reload_from_config), then reset the layer
    // stack to the base.
    keymap_reload_from_config();
    g_layer_stack_size = 0;
    layer_push(0);

    // Notify the studio only on a real change (avoids noise and echo
    // loops with the reconciler on the studio side).
    if (applied != prev) _monitor_emit_profile(applied);
}
