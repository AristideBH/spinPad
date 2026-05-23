const ACTION_TYPES = {
  ACTION_TYPE_KC: 0,
  // Keycode HID standard
  ACTION_TYPE_MOD: 1,
  // Modifier (Ctrl, Shift, Alt, GUI)
  ACTION_TYPE_LAYER_MO: 2,
  // Momentary layer (actif tant que tenu)
  ACTION_TYPE_LAYER_TG: 3,
  // Toggle layer (bascule à chaque appui)
  ACTION_TYPE_LAYER_TO: 4,
  // To layer (reset stack + aller au layer n)
  ACTION_TYPE_MEDIA: 5,
  // Consumer Control HID (volume, lecture...)
  ACTION_TYPE_SPECIAL: 15
  // Actions firmware spéciales
};
const MEDIA_CODES = {
  MEDIA_VOL_UP: 1,
  MEDIA_VOL_DN: 2,
  MEDIA_MUTE: 3,
  MEDIA_PLAY: 4,
  MEDIA_NEXT: 5,
  MEDIA_PREV: 6,
  MEDIA_SCRL_UP: 16,
  MEDIA_SCRL_DN: 17,
  MEDIA_ZOOM_IN: 32,
  MEDIA_ZOOM_OUT: 33,
  MEDIA_SCRL_LEFT: 18,
  MEDIA_SCRL_RIGHT: 19
};
const SPECIAL_CODES = {
  SPECIAL_BLE_SWITCH: 1,
  // Basculer entre slots BLE
  SPECIAL_ORIENT_CW: 2,
  // Rotation du SpinPad +90°
  SPECIAL_ORIENT_CCW: 3,
  // Rotation du SpinPad -90°
  SPECIAL_LED_BRIGHT_UP: 4,
  // Augmenter la luminosité des LEDs
  SPECIAL_LED_BRIGHT_DN: 5,
  // Diminuer la luminosité des LEDs
  SPECIAL_STUDIO_MODE: 6
  // Activer/désactiver le Studio Mode
};
function action(type, value) {
  return (type & 15) << 12 | value & 4095;
}
const {
  ACTION_TYPE_KC,
  ACTION_TYPE_MOD,
  ACTION_TYPE_LAYER_MO,
  ACTION_TYPE_LAYER_TG,
  ACTION_TYPE_LAYER_TO,
  ACTION_TYPE_MEDIA,
  ACTION_TYPE_SPECIAL
} = ACTION_TYPES;
const {
  MEDIA_VOL_UP,
  MEDIA_VOL_DN,
  MEDIA_MUTE,
  MEDIA_PLAY,
  MEDIA_NEXT,
  MEDIA_PREV,
  MEDIA_SCRL_UP,
  MEDIA_SCRL_DN,
  MEDIA_ZOOM_IN,
  MEDIA_ZOOM_OUT,
  MEDIA_SCRL_LEFT,
  MEDIA_SCRL_RIGHT
} = MEDIA_CODES;
const {
  SPECIAL_BLE_SWITCH,
  SPECIAL_ORIENT_CW,
  SPECIAL_ORIENT_CCW,
  SPECIAL_LED_BRIGHT_UP,
  SPECIAL_LED_BRIGHT_DN,
  SPECIAL_STUDIO_MODE
} = SPECIAL_CODES;
const KEYCODES = {
  // ── Lettres ──────────────────────────────────────────────────
  letters: [
    { label: "A", value: action(ACTION_TYPE_KC, 4), category: "letter" },
    { label: "B", value: action(ACTION_TYPE_KC, 5), category: "letter" },
    { label: "C", value: action(ACTION_TYPE_KC, 6), category: "letter" },
    { label: "D", value: action(ACTION_TYPE_KC, 7), category: "letter" },
    { label: "E", value: action(ACTION_TYPE_KC, 8), category: "letter" },
    { label: "F", value: action(ACTION_TYPE_KC, 9), category: "letter" },
    { label: "G", value: action(ACTION_TYPE_KC, 10), category: "letter" },
    { label: "H", value: action(ACTION_TYPE_KC, 11), category: "letter" },
    { label: "I", value: action(ACTION_TYPE_KC, 12), category: "letter" },
    { label: "J", value: action(ACTION_TYPE_KC, 13), category: "letter" },
    { label: "K", value: action(ACTION_TYPE_KC, 14), category: "letter" },
    { label: "L", value: action(ACTION_TYPE_KC, 15), category: "letter" },
    { label: "M", value: action(ACTION_TYPE_KC, 16), category: "letter" },
    { label: "N", value: action(ACTION_TYPE_KC, 17), category: "letter" },
    { label: "O", value: action(ACTION_TYPE_KC, 18), category: "letter" },
    { label: "P", value: action(ACTION_TYPE_KC, 19), category: "letter" },
    { label: "Q", value: action(ACTION_TYPE_KC, 20), category: "letter" },
    { label: "R", value: action(ACTION_TYPE_KC, 21), category: "letter" },
    { label: "S", value: action(ACTION_TYPE_KC, 22), category: "letter" },
    { label: "T", value: action(ACTION_TYPE_KC, 23), category: "letter" },
    { label: "U", value: action(ACTION_TYPE_KC, 24), category: "letter" },
    { label: "V", value: action(ACTION_TYPE_KC, 25), category: "letter" },
    { label: "W", value: action(ACTION_TYPE_KC, 26), category: "letter" },
    { label: "X", value: action(ACTION_TYPE_KC, 27), category: "letter" },
    { label: "Y", value: action(ACTION_TYPE_KC, 28), category: "letter" },
    { label: "Z", value: action(ACTION_TYPE_KC, 29), category: "letter" }
  ],
  // ── Touches spéciales ────────────────────────────────────────
  special: [
    { label: "None", value: 0, category: "special" },
    { label: "Esc", value: action(ACTION_TYPE_KC, 41), category: "special" },
    { label: "Enter", value: action(ACTION_TYPE_KC, 40), category: "special" },
    { label: "Space", value: action(ACTION_TYPE_KC, 44), category: "special" },
    { label: "Bksp", value: action(ACTION_TYPE_KC, 42), category: "special" },
    { label: "Tab", value: action(ACTION_TYPE_KC, 43), category: "special" },
    { label: "Del", value: action(ACTION_TYPE_KC, 76), category: "special" },
    { label: "F1", value: action(ACTION_TYPE_KC, 58), category: "special" },
    { label: "F2", value: action(ACTION_TYPE_KC, 59), category: "special" },
    { label: "F3", value: action(ACTION_TYPE_KC, 60), category: "special" },
    { label: "F4", value: action(ACTION_TYPE_KC, 61), category: "special" },
    { label: "F5", value: action(ACTION_TYPE_KC, 62), category: "special" },
    { label: "F6", value: action(ACTION_TYPE_KC, 63), category: "special" },
    { label: "F7", value: action(ACTION_TYPE_KC, 64), category: "special" },
    { label: "F8", value: action(ACTION_TYPE_KC, 65), category: "special" },
    { label: "F9", value: action(ACTION_TYPE_KC, 66), category: "special" },
    { label: "F10", value: action(ACTION_TYPE_KC, 67), category: "special" },
    { label: "F11", value: action(ACTION_TYPE_KC, 68), category: "special" },
    { label: "F12", value: action(ACTION_TYPE_KC, 69), category: "special" }
  ],
  // ── Modificateurs ────────────────────────────────────────────
  modifiers: [
    { label: "L-Ctrl", value: action(ACTION_TYPE_MOD, 1), category: "modifier" },
    { label: "L-Shift", value: action(ACTION_TYPE_MOD, 2), category: "modifier" },
    { label: "L-Alt", value: action(ACTION_TYPE_MOD, 4), category: "modifier" },
    { label: "L-GUI", value: action(ACTION_TYPE_MOD, 8), category: "modifier" },
    { label: "R-Ctrl", value: action(ACTION_TYPE_MOD, 16), category: "modifier" },
    { label: "R-Shift", value: action(ACTION_TYPE_MOD, 32), category: "modifier" },
    { label: "R-Alt", value: action(ACTION_TYPE_MOD, 64), category: "modifier" }
  ],
  // ── Layers ───────────────────────────────────────────────────
  layers: [
    { label: "MO(0)", value: action(ACTION_TYPE_LAYER_MO, 0), category: "layer" },
    { label: "MO(1)", value: action(ACTION_TYPE_LAYER_MO, 1), category: "layer" },
    { label: "MO(2)", value: action(ACTION_TYPE_LAYER_MO, 2), category: "layer" },
    { label: "MO(3)", value: action(ACTION_TYPE_LAYER_MO, 3), category: "layer" },
    { label: "TG(1)", value: action(ACTION_TYPE_LAYER_TG, 1), category: "layer" },
    { label: "TG(2)", value: action(ACTION_TYPE_LAYER_TG, 2), category: "layer" },
    { label: "TG(3)", value: action(ACTION_TYPE_LAYER_TG, 3), category: "layer" },
    { label: "TO(0)", value: action(ACTION_TYPE_LAYER_TO, 0), category: "layer" },
    { label: "TO(1)", value: action(ACTION_TYPE_LAYER_TO, 1), category: "layer" },
    { label: "TO(2)", value: action(ACTION_TYPE_LAYER_TO, 2), category: "layer" }
  ],
  // ── Médias ───────────────────────────────────────────────────
  media: [
    { label: "Vol+", value: action(ACTION_TYPE_MEDIA, MEDIA_VOL_UP), category: "media" },
    { label: "Vol-", value: action(ACTION_TYPE_MEDIA, MEDIA_VOL_DN), category: "media" },
    { label: "Mute", value: action(ACTION_TYPE_MEDIA, MEDIA_MUTE), category: "media" },
    { label: "Play", value: action(ACTION_TYPE_MEDIA, MEDIA_PLAY), category: "media" },
    { label: "Next", value: action(ACTION_TYPE_MEDIA, MEDIA_NEXT), category: "media" },
    { label: "Prev", value: action(ACTION_TYPE_MEDIA, MEDIA_PREV), category: "media" },
    { label: "Scrl↑", value: action(ACTION_TYPE_MEDIA, MEDIA_SCRL_UP), category: "media" },
    { label: "Scrl↓", value: action(ACTION_TYPE_MEDIA, MEDIA_SCRL_DN), category: "media" },
    { label: "Scrl←", value: action(ACTION_TYPE_MEDIA, MEDIA_SCRL_LEFT), category: "media" },
    { label: "Scrl→", value: action(ACTION_TYPE_MEDIA, MEDIA_SCRL_RIGHT), category: "media" },
    { label: "Zoom+", value: action(ACTION_TYPE_MEDIA, MEDIA_ZOOM_IN), category: "media" },
    { label: "Zoom-", value: action(ACTION_TYPE_MEDIA, MEDIA_ZOOM_OUT), category: "media" }
  ],
  // ── Spéciaux firmware ────────────────────────────────────────
  firmware: [
    { label: "BLE Switch", value: action(ACTION_TYPE_SPECIAL, SPECIAL_BLE_SWITCH), category: "firmware" },
    { label: "Studio Mode", value: action(ACTION_TYPE_SPECIAL, SPECIAL_STUDIO_MODE), category: "firmware" },
    { label: "Orient ↻", value: action(ACTION_TYPE_SPECIAL, SPECIAL_ORIENT_CW), category: "firmware" },
    { label: "Orient ↺", value: action(ACTION_TYPE_SPECIAL, SPECIAL_ORIENT_CCW), category: "firmware" },
    { label: "LED +", value: action(ACTION_TYPE_SPECIAL, SPECIAL_LED_BRIGHT_UP), category: "firmware" },
    { label: "LED -", value: action(ACTION_TYPE_SPECIAL, SPECIAL_LED_BRIGHT_DN), category: "firmware" }
  ]
};
const KEYCODES_FLAT = Object.values(KEYCODES).flat();
function getKeycodeLabel(value) {
  if (value === 0) return "—";
  const kc = KEYCODES_FLAT.find((k) => k.value === value);
  return kc ? kc.label : `0x${value.toString(16).toUpperCase()}`;
}
export {
  ACTION_TYPES as A,
  KEYCODES as K,
  MEDIA_CODES as M,
  KEYCODES_FLAT as a,
  action as b,
  getKeycodeLabel as g
};
