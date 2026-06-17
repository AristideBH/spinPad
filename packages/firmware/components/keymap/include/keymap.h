#pragma once
// ===============================================================
//  keymap.h - Public interface of the key engine
//
//  This header exposes only what the other components need to
//  know. The implementation is in keymap.c.
// ===============================================================

#include <stdint.h>
#include <stdbool.h>
#include "esp_err.h"

// -------------------------------------------------------------
//  ACTION ENCODING (16 bits)
//
//  Each key is associated with an "action" - a uint16_t
//  that encodes both the action TYPE and its VALUE.
//
//  Structure of the 16 bits:
//    [15..12] = type (4 bits)  -> which kind of action
//    [11..0]  = value (12 bits) -> what exactly
//
//  Examples:
//    0x0004  -> KC (normal keycode), value 4 = KC_A
//    0x1000  -> LAYER_MO, value 0 = activate layer 0 while pressed
//    0x2001  -> LAYER_TG, value 1 = toggle layer 1
//    0xF000  -> ACTION_SPECIAL, value 0 = BLE switch
// -------------------------------------------------------------

// Action types (high 4 bits)
#define ACTION_TYPE_KC          0x0   // Standard HID keycode
#define ACTION_TYPE_MOD         0x1   // Modifier (Ctrl, Shift, Alt, GUI)
#define ACTION_TYPE_LAYER_MO    0x2   // Momentary layer (active while pressed)
#define ACTION_TYPE_LAYER_TG    0x3   // Toggle layer (press = on/off)
#define ACTION_TYPE_LAYER_TO    0x4   // To layer (go to this layer permanently)
#define ACTION_TYPE_MEDIA       0x5   // Media key (volume, play, etc.)
#define ACTION_TYPE_MACRO       0x6   // Macro sequence (bits 11-0 = index 0-15)
#define ACTION_TYPE_SPECIAL     0xF   // Special firmware actions

// Macro to build an action - combines type and value
// Example: ACTION(ACTION_TYPE_KC, 0x04) = key 'A'
#define ACTION(type, val)   ((uint16_t)(((type) << 12) | ((val) & 0x0FFF)))

// -- Standard HID keycodes (USB HID Usage ID values) --
// Source: USB HID Usage Tables 1.12, Keyboard/Keypad section
#define KC_NONE     ACTION(ACTION_TYPE_KC, 0x00)   // No action
#define KC_A        ACTION(ACTION_TYPE_KC, 0x04)
#define KC_B        ACTION(ACTION_TYPE_KC, 0x05)
#define KC_C        ACTION(ACTION_TYPE_KC, 0x06)
#define KC_D        ACTION(ACTION_TYPE_KC, 0x07)
#define KC_E        ACTION(ACTION_TYPE_KC, 0x08)
#define KC_F        ACTION(ACTION_TYPE_KC, 0x09)
#define KC_G        ACTION(ACTION_TYPE_KC, 0x0A)
#define KC_H        ACTION(ACTION_TYPE_KC, 0x0B)
#define KC_I        ACTION(ACTION_TYPE_KC, 0x0C)
#define KC_J        ACTION(ACTION_TYPE_KC, 0x0D)
#define KC_K        ACTION(ACTION_TYPE_KC, 0x0E)
#define KC_L        ACTION(ACTION_TYPE_KC, 0x0F)
#define KC_M        ACTION(ACTION_TYPE_KC, 0x10)
#define KC_N        ACTION(ACTION_TYPE_KC, 0x11)
#define KC_O        ACTION(ACTION_TYPE_KC, 0x12)
#define KC_P        ACTION(ACTION_TYPE_KC, 0x13)
#define KC_Q        ACTION(ACTION_TYPE_KC, 0x14)
#define KC_R        ACTION(ACTION_TYPE_KC, 0x15)
#define KC_S        ACTION(ACTION_TYPE_KC, 0x16)
#define KC_T        ACTION(ACTION_TYPE_KC, 0x17)
#define KC_U        ACTION(ACTION_TYPE_KC, 0x18)
#define KC_V        ACTION(ACTION_TYPE_KC, 0x19)
#define KC_W        ACTION(ACTION_TYPE_KC, 0x1A)
#define KC_X        ACTION(ACTION_TYPE_KC, 0x1B)
#define KC_Y        ACTION(ACTION_TYPE_KC, 0x1C)
#define KC_Z        ACTION(ACTION_TYPE_KC, 0x1D)
#define KC_1        ACTION(ACTION_TYPE_KC, 0x1E)
#define KC_2        ACTION(ACTION_TYPE_KC, 0x1F)
#define KC_3        ACTION(ACTION_TYPE_KC, 0x20)
#define KC_4        ACTION(ACTION_TYPE_KC, 0x21)
#define KC_5        ACTION(ACTION_TYPE_KC, 0x22)
#define KC_ESC      ACTION(ACTION_TYPE_KC, 0x29)
#define KC_ENTER    ACTION(ACTION_TYPE_KC, 0x28)
#define KC_SPACE    ACTION(ACTION_TYPE_KC, 0x2C)
#define KC_BSPC     ACTION(ACTION_TYPE_KC, 0x2A)
#define KC_TAB      ACTION(ACTION_TYPE_KC, 0x2B)
#define KC_DEL      ACTION(ACTION_TYPE_KC, 0x4C)
#define KC_F1       ACTION(ACTION_TYPE_KC, 0x3A)
#define KC_F2       ACTION(ACTION_TYPE_KC, 0x3B)
#define KC_F3       ACTION(ACTION_TYPE_KC, 0x3C)
#define KC_F4       ACTION(ACTION_TYPE_KC, 0x3D)
#define KC_F5       ACTION(ACTION_TYPE_KC, 0x3E)

// -- Modifiers --
// Match the bits of the "modifier" byte of the HID report
#define MOD_LCTRL   ACTION(ACTION_TYPE_MOD, 0x01)
#define MOD_LSHIFT  ACTION(ACTION_TYPE_MOD, 0x02)
#define MOD_LALT    ACTION(ACTION_TYPE_MOD, 0x04)
#define MOD_LGUI    ACTION(ACTION_TYPE_MOD, 0x08)   // Windows/Cmd key
#define MOD_RCTRL   ACTION(ACTION_TYPE_MOD, 0x10)
#define MOD_RSHIFT  ACTION(ACTION_TYPE_MOD, 0x20)
#define MOD_RALT    ACTION(ACTION_TYPE_MOD, 0x40)
#define MOD_RGUI    ACTION(ACTION_TYPE_MOD, 0x80)

// -- Media keys (HID Consumer Control) --
#define KC_VOLU     ACTION(ACTION_TYPE_MEDIA, 0x01)   // Volume +
#define KC_VOLD     ACTION(ACTION_TYPE_MEDIA, 0x02)   // Volume -
#define KC_MUTE     ACTION(ACTION_TYPE_MEDIA, 0x03)   // Mute
#define KC_PLAY     ACTION(ACTION_TYPE_MEDIA, 0x04)   // Play/Pause
#define KC_NEXT     ACTION(ACTION_TYPE_MEDIA, 0x05)   // Next track
#define KC_PREV     ACTION(ACTION_TYPE_MEDIA, 0x06)   // Previous track
#define KC_SCRL_U   ACTION(ACTION_TYPE_MEDIA, 0x10)   // Scroll up
#define KC_SCRL_D   ACTION(ACTION_TYPE_MEDIA, 0x11)   // Scroll down
#define KC_ZOOM_IN  ACTION(ACTION_TYPE_MEDIA, 0x20)   // Zoom +
#define KC_ZOOM_OUT ACTION(ACTION_TYPE_MEDIA, 0x21)   // Zoom -

// -- Layer actions --
#define MO(n)   ACTION(ACTION_TYPE_LAYER_MO, n)   // Momentary layer n
#define TG(n)   ACTION(ACTION_TYPE_LAYER_TG, n)   // Toggle layer n
#define TO(n)   ACTION(ACTION_TYPE_LAYER_TO, n)   // Go to layer n

// -- Special firmware actions --
#define BLE_SWITCH  ACTION(ACTION_TYPE_SPECIAL, 0x01)  // SW11: switch BLE device
#define BLE_PAIR    ACTION(ACTION_TYPE_SPECIAL, 0x02)  // SW16+SW17: pairing mode

// -------------------------------------------------------------
//  DATA STRUCTURES
// -------------------------------------------------------------

#define KEYMAP_MAX_LAYERS    8    // Maximum number of simultaneous layers
#define KEYMAP_MAX_COMBOS   16    // Maximum number of defined combos

// -------------------------------------------------------------
//  PUBLIC FUNCTIONS
// -------------------------------------------------------------

// Initialize the GPIO matrix and load the keymap from the config
esp_err_t keymap_init(void);

// Scan the physical matrix (to call every KB_SCAN_INTERVAL_MS)
void keymap_scan_matrix(void);

// Process the events: combos, tap-hold, send the HID reports
void keymap_process_events(void);

// Returns true if a key was pressed since the last call
bool keymap_has_activity(void);

// Reload the keymap from the config (after an update via the SvelteKit app)
void keymap_reload_from_config(void);

// Get the currently active layer (for display on the screen)
uint8_t keymap_get_active_layer(void);

// Switch the active profile (data + runtime layer): persists to NVS,
// reloads the keymap/combos, resets the layer stack to the base, and emits a
// "profile" event on the monitor stream if the index actually changed.
// idx is clamped to profile_count.
void keymap_set_active_profile(uint8_t idx);

// Enable/disable keyboard event streaming (training mode)
// When enabled, each state change is emitted via usb_hid_cdc_send().
void keymap_set_monitor(bool enable);
bool keymap_get_monitor(void);

// Enable/disable training mode: no HID action executed while
// it is ON. The monitor stays independent (events always streamed).
void keymap_set_training_mode(bool enable);
bool keymap_get_training_mode(void);

// Launch the active profile's macro macro_idx in an ephemeral FreeRTOS task.
void keymap_play_macro(uint8_t macro_idx);
