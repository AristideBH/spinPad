// ═══════════════════════════════════════════════════════════════
//  action-types.ts — Source de vérité des types d'actions
//
//  Ces constantes sont utilisées par :
//    - packages/studio  (sélecteur de keycode)
//    - packages/firmware (via codegen → action_types.gen.h)
//
//  ⚠️  Après modification, lancer : pnpm codegen
// ═══════════════════════════════════════════════════════════════

// ── Action type nibbles (bits 15–12 d'un uint16_t action) ──────

export const ACTION_TYPES = {
  ACTION_TYPE_KC:        0x0,   // Keycode HID standard
  ACTION_TYPE_MOD:       0x1,   // Modifier (Ctrl, Shift, Alt, GUI)
  ACTION_TYPE_LAYER_MO:  0x2,   // Momentary layer (actif tant que tenu)
  ACTION_TYPE_LAYER_TG:  0x3,   // Toggle layer (bascule à chaque appui)
  ACTION_TYPE_LAYER_TO:  0x4,   // To layer (reset stack + aller au layer n)
  ACTION_TYPE_MEDIA:     0x5,   // Consumer Control HID (volume, lecture...)
  ACTION_TYPE_MACRO:     0x6,   // Macro sequence (bits 11–0 = index 0–15)
  ACTION_TYPE_SPECIAL:   0xF,   // Actions firmware spéciales
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
  MEDIA_SCRL_UP:     0x10,
  MEDIA_SCRL_DN:     0x11,
  MEDIA_ZOOM_IN:     0x20,
  MEDIA_ZOOM_OUT:    0x21,
  MEDIA_SCRL_LEFT:   0x12,
  MEDIA_SCRL_RIGHT:  0x13,
} as const satisfies Record<string, number>;

export type MediaCode = keyof typeof MEDIA_CODES;

// ── Special subcodes (bits 11–0 quand type = ACTION_TYPE_SPECIAL)

export const SPECIAL_CODES = {
  SPECIAL_BLE_SWITCH:    0x01,   // Basculer entre slots BLE
  SPECIAL_ORIENT_CW:     0x02,   // Rotation du SpinPad +90°
  SPECIAL_ORIENT_CCW:    0x03,   // Rotation du SpinPad -90°
  SPECIAL_LED_BRIGHT_UP: 0x04,   // Augmenter la luminosité des LEDs
  SPECIAL_LED_BRIGHT_DN: 0x05,   // Diminuer la luminosité des LEDs
  SPECIAL_STUDIO_MODE:   0x06,   // Activer/désactiver le Studio Mode
} as const satisfies Record<string, number>;

export type SpecialCode = keyof typeof SPECIAL_CODES;

// ── Helpers ────────────────────────────────────────────────────

/** Encoder une action en uint16 */
export function action(type: number, value: number): number {
  return ((type & 0xF) << 12) | (value & 0x0FFF);
}

/** Décoder le type d'une action */
export function getActionType(actionValue: number): number {
  return (actionValue >> 12) & 0xF;
}

/** Décoder la valeur d'une action */
export function getActionValue(actionValue: number): number {
  return actionValue & 0x0FFF;
}
