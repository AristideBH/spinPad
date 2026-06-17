// ═══════════════════════════════════════════════════════════════
//  action-types.ts — Source of truth for action types
//
//  These constants are used by:
//    - packages/studio  (keycode selector)
//    - packages/firmware (via codegen → action_types.gen.h)
//
//  ⚠️  After modification, run: pnpm codegen
// ═══════════════════════════════════════════════════════════════

// ── Action type nibbles (bits 15–12 of a uint16_t action) ──────

export const ACTION_TYPES = {
  ACTION_TYPE_KC:        0x0,   // Standard HID keycode
  ACTION_TYPE_MOD:       0x1,   // Modifier (Ctrl, Shift, Alt, GUI)
  ACTION_TYPE_LAYER_MO:  0x2,   // Momentary layer (active while held)
  ACTION_TYPE_LAYER_TG:  0x3,   // Toggle layer (toggles on each press)
  ACTION_TYPE_LAYER_TO:  0x4,   // To layer (reset stack + go to layer n)
  ACTION_TYPE_MEDIA:     0x5,   // Consumer Control HID (volume, playback...)
  ACTION_TYPE_MACRO:     0x6,   // Macro sequence (bits 11–0 = index 0–15)
  ACTION_TYPE_SPECIAL:   0xF,   // Special firmware actions
} as const satisfies Record<string, number>;

export type ActionType = keyof typeof ACTION_TYPES;

// ── Media subcodes (bits 11–0 quand type = ACTION_TYPE_MEDIA) ──

export const MEDIA_CODES = {
  MEDIA_VOL_UP:      0x01,
  MEDIA_VOL_DN:      0x02,
  MEDIA_MUTE:        0x03,
  MEDIA_PLAY:        0x04,
  MEDIA_NEXT:        0x05,
  MEDIA_PREV:        0x06,
  MEDIA_STOP:        0x07,
  MEDIA_SCRL_UP:     0x10,
  MEDIA_SCRL_DN:     0x11,
  MEDIA_SCRL_LEFT:   0x12,
  MEDIA_SCRL_RIGHT:  0x13,
  MEDIA_ZOOM_IN:     0x20,
  MEDIA_ZOOM_OUT:    0x21,
  MEDIA_BRIGHT_UP:   0x22,   // host screen brightness
  MEDIA_BRIGHT_DN:   0x23,
  // ── Application launch (Consumer AL_* / AC_*) ────────────────
  //  The firmware maps these subcodes to the real Consumer usage.
  MEDIA_APP_CALC:    0x30,   // AL_Calculator
  MEDIA_APP_MAIL:    0x31,   // AL_Email_Reader
  MEDIA_APP_BROWSER: 0x32,   // AL_Internet_Browser
  MEDIA_APP_SEARCH:  0x33,   // AC_Search
  MEDIA_APP_FILES:   0x34,   // AL_File_Browser
  MEDIA_APP_CALENDAR:0x35,   // AL_Calendar
  MEDIA_APP_PLAYER:  0x36,   // AL_Media_Player
  MEDIA_APP_LOCK:    0x37,   // AL_Screen_Lock
  MEDIA_APP_SCRSHOT: 0x38,   // Screenshot (OS shortcut, mapped by firmware)
} as const satisfies Record<string, number>;

export type MediaCode = keyof typeof MEDIA_CODES;

// ── Special subcodes (bits 11–0 quand type = ACTION_TYPE_SPECIAL)

export const SPECIAL_CODES = {
  SPECIAL_BLE_SWITCH:    0x01,   // Switch between BLE slots
  SPECIAL_ORIENT_CW:     0x02,   // Rotate the SpinPad +90°
  SPECIAL_ORIENT_CCW:    0x03,   // Rotate the SpinPad -90°
  SPECIAL_LED_BRIGHT_UP: 0x04,   // Increase the LED brightness
  SPECIAL_LED_BRIGHT_DN: 0x05,   // Decrease the LED brightness
  SPECIAL_STUDIO_MODE:   0x06,   // Enable/disable Studio Mode
  SPECIAL_ENC_SENS_UP:   0x07,   // Encoder sensitivity +
  SPECIAL_ENC_SENS_DN:   0x08,   // Encoder sensitivity -
  SPECIAL_SLEEP:         0x09,   // Put the device to sleep
  SPECIAL_PROFILE_NEXT:  0x0A,   // Next active profile (cyclic)
  SPECIAL_PROFILE_PREV:  0x0B,   // Previous active profile (cyclic)
} as const satisfies Record<string, number>;

export type SpecialCode = keyof typeof SPECIAL_CODES;

// ── Helpers ────────────────────────────────────────────────────

/** Encode an action into a uint16 */
export function action(type: number, value: number): number {
  return ((type & 0xF) << 12) | (value & 0x0FFF);
}

/** Decode the type of an action */
export function getActionType(actionValue: number): number {
  return (actionValue >> 12) & 0xF;
}

/** Decode the value of an action */
export function getActionValue(actionValue: number): number {
  return actionValue & 0x0FFF;
}
