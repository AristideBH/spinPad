// ═══════════════════════════════════════════════════════════════
//  keycodes.ts — Table des keycodes disponibles (source de vérité)
//
//  Chaque keycode = { label, value, category }
//  value = uint16 encodé : (type << 12) | valeur
//
//  Utilisé par Studio pour l'éditeur visuel.
//  Les valeurs correspondent aux définitions firmware HID.
// ═══════════════════════════════════════════════════════════════

import { ACTION_TYPES, MEDIA_CODES, SPECIAL_CODES, action } from './action-types.js';
import { MACRO_COUNT, MACRO_STEP_TYPE, isMacroUsed, type MacroDef, type MacroStep } from './config-schema.js';

const {
  ACTION_TYPE_KC,
  ACTION_TYPE_MOD,
  ACTION_TYPE_LAYER_MO,
  ACTION_TYPE_LAYER_TG,
  ACTION_TYPE_LAYER_TO,
  ACTION_TYPE_MEDIA,
  ACTION_TYPE_SPECIAL,
  ACTION_TYPE_MACRO,
} = ACTION_TYPES;

const {
  MEDIA_VOL_UP,
  MEDIA_VOL_DN,
  MEDIA_MUTE,
  MEDIA_PLAY,
  MEDIA_NEXT,
  MEDIA_PREV,
  MEDIA_STOP,
  MEDIA_SCRL_UP,
  MEDIA_SCRL_DN,
  MEDIA_ZOOM_IN,
  MEDIA_ZOOM_OUT,
  MEDIA_SCRL_LEFT,
  MEDIA_SCRL_RIGHT,
  MEDIA_BRIGHT_UP,
  MEDIA_BRIGHT_DN,
  MEDIA_APP_CALC,
  MEDIA_APP_MAIL,
  MEDIA_APP_BROWSER,
  MEDIA_APP_SEARCH,
  MEDIA_APP_FILES,
  MEDIA_APP_CALENDAR,
  MEDIA_APP_PLAYER,
  MEDIA_APP_LOCK,
  MEDIA_APP_SCRSHOT,
} = MEDIA_CODES;

const {
  SPECIAL_BLE_SWITCH,
  SPECIAL_ORIENT_CW,
  SPECIAL_ORIENT_CCW,
  SPECIAL_LED_BRIGHT_UP,
  SPECIAL_LED_BRIGHT_DN,
  SPECIAL_STUDIO_MODE,
  SPECIAL_ENC_SENS_UP,
  SPECIAL_ENC_SENS_DN,
  SPECIAL_SLEEP,
} = SPECIAL_CODES;

// ── Types ───────────────────────────────────────────────────────

export type KeycodeCategory =
  | 'letter'
  | 'number'
  | 'function'
  | 'symbol'
  | 'nav'
  | 'keypad'
  | 'special'
  | 'modifier'
  | 'layer'
  | 'media'
  | 'app'
  | 'firmware'
  | 'macro';

export interface Keycode {
  label: string;
  value: number;
  category: KeycodeCategory;
}

// ── Table principale ────────────────────────────────────────────

export const KEYCODES: Record<string, Keycode[]> = {
  // ── Lettres ──────────────────────────────────────────────────
  letters: [
    { label: 'A', value: action(ACTION_TYPE_KC, 0x04), category: 'letter' },
    { label: 'B', value: action(ACTION_TYPE_KC, 0x05), category: 'letter' },
    { label: 'C', value: action(ACTION_TYPE_KC, 0x06), category: 'letter' },
    { label: 'D', value: action(ACTION_TYPE_KC, 0x07), category: 'letter' },
    { label: 'E', value: action(ACTION_TYPE_KC, 0x08), category: 'letter' },
    { label: 'F', value: action(ACTION_TYPE_KC, 0x09), category: 'letter' },
    { label: 'G', value: action(ACTION_TYPE_KC, 0x0a), category: 'letter' },
    { label: 'H', value: action(ACTION_TYPE_KC, 0x0b), category: 'letter' },
    { label: 'I', value: action(ACTION_TYPE_KC, 0x0c), category: 'letter' },
    { label: 'J', value: action(ACTION_TYPE_KC, 0x0d), category: 'letter' },
    { label: 'K', value: action(ACTION_TYPE_KC, 0x0e), category: 'letter' },
    { label: 'L', value: action(ACTION_TYPE_KC, 0x0f), category: 'letter' },
    { label: 'M', value: action(ACTION_TYPE_KC, 0x10), category: 'letter' },
    { label: 'N', value: action(ACTION_TYPE_KC, 0x11), category: 'letter' },
    { label: 'O', value: action(ACTION_TYPE_KC, 0x12), category: 'letter' },
    { label: 'P', value: action(ACTION_TYPE_KC, 0x13), category: 'letter' },
    { label: 'Q', value: action(ACTION_TYPE_KC, 0x14), category: 'letter' },
    { label: 'R', value: action(ACTION_TYPE_KC, 0x15), category: 'letter' },
    { label: 'S', value: action(ACTION_TYPE_KC, 0x16), category: 'letter' },
    { label: 'T', value: action(ACTION_TYPE_KC, 0x17), category: 'letter' },
    { label: 'U', value: action(ACTION_TYPE_KC, 0x18), category: 'letter' },
    { label: 'V', value: action(ACTION_TYPE_KC, 0x19), category: 'letter' },
    { label: 'W', value: action(ACTION_TYPE_KC, 0x1a), category: 'letter' },
    { label: 'X', value: action(ACTION_TYPE_KC, 0x1b), category: 'letter' },
    { label: 'Y', value: action(ACTION_TYPE_KC, 0x1c), category: 'letter' },
    { label: 'Z', value: action(ACTION_TYPE_KC, 0x1d), category: 'letter' },
  ],

  // ── Nombres ──────────────────────────────────────────────────
  number: [
    { label: '1', value: action(ACTION_TYPE_KC, 0x1e), category: 'number' },
    { label: '2', value: action(ACTION_TYPE_KC, 0x1f), category: 'number' },
    { label: '3', value: action(ACTION_TYPE_KC, 0x20), category: 'number' },
    { label: '4', value: action(ACTION_TYPE_KC, 0x21), category: 'number' },
    { label: '5', value: action(ACTION_TYPE_KC, 0x22), category: 'number' },
    { label: '6', value: action(ACTION_TYPE_KC, 0x23), category: 'number' },
    { label: '7', value: action(ACTION_TYPE_KC, 0x24), category: 'number' },
    { label: '8', value: action(ACTION_TYPE_KC, 0x25), category: 'number' },
    { label: '9', value: action(ACTION_TYPE_KC, 0x26), category: 'number' },
    { label: '0', value: action(ACTION_TYPE_KC, 0x27), category: 'number' },
  ],

  // ── Touches spéciales / édition ──────────────────────────────
  special: [
    { label: 'None', value: 0, category: 'special' },
    { label: 'Esc', value: action(ACTION_TYPE_KC, 0x29), category: 'special' },
    { label: 'Enter', value: action(ACTION_TYPE_KC, 0x28), category: 'special' },
    { label: 'Space', value: action(ACTION_TYPE_KC, 0x2c), category: 'special' },
    { label: 'Bksp', value: action(ACTION_TYPE_KC, 0x2a), category: 'special' },
    { label: 'Tab', value: action(ACTION_TYPE_KC, 0x2b), category: 'special' },
    { label: 'Caps', value: action(ACTION_TYPE_KC, 0x39), category: 'special' },
    { label: 'PrtSc', value: action(ACTION_TYPE_KC, 0x46), category: 'special' },
    { label: 'ScrLk', value: action(ACTION_TYPE_KC, 0x47), category: 'special' },
    { label: 'Pause', value: action(ACTION_TYPE_KC, 0x48), category: 'special' },
    { label: 'Menu', value: action(ACTION_TYPE_KC, 0x65), category: 'special' },
  ],

  // ── Touches de fonction ──────────────────────────────────────
  function: Array.from({ length: 24 }, (_, i) => ({
    label: `F${i + 1}`,
    // F1–F12 = 0x3a–0x45 ; F13–F24 = 0x68–0x73
    value: action(ACTION_TYPE_KC, i < 12 ? 0x3a + i : 0x68 + (i - 12)),
    category: 'function' as KeycodeCategory,
  })),

  // ── Navigation ───────────────────────────────────────────────
  navigation: [
    { label: '←', value: action(ACTION_TYPE_KC, 0x50), category: 'nav' },
    { label: '↓', value: action(ACTION_TYPE_KC, 0x51), category: 'nav' },
    { label: '↑', value: action(ACTION_TYPE_KC, 0x52), category: 'nav' },
    { label: '→', value: action(ACTION_TYPE_KC, 0x4f), category: 'nav' },
    { label: 'Home', value: action(ACTION_TYPE_KC, 0x4a), category: 'nav' },
    { label: 'End', value: action(ACTION_TYPE_KC, 0x4d), category: 'nav' },
    { label: 'PgUp', value: action(ACTION_TYPE_KC, 0x4b), category: 'nav' },
    { label: 'PgDn', value: action(ACTION_TYPE_KC, 0x4e), category: 'nav' },
    { label: 'Ins', value: action(ACTION_TYPE_KC, 0x49), category: 'nav' },
    { label: 'Del', value: action(ACTION_TYPE_KC, 0x4c), category: 'nav' },
  ],

  // ── Symboles / ponctuation (positions US) ────────────────────
  symbols: [
    { label: '-', value: action(ACTION_TYPE_KC, 0x2d), category: 'symbol' },
    { label: '=', value: action(ACTION_TYPE_KC, 0x2e), category: 'symbol' },
    { label: '[', value: action(ACTION_TYPE_KC, 0x2f), category: 'symbol' },
    { label: ']', value: action(ACTION_TYPE_KC, 0x30), category: 'symbol' },
    { label: '\\', value: action(ACTION_TYPE_KC, 0x31), category: 'symbol' },
    { label: ';', value: action(ACTION_TYPE_KC, 0x33), category: 'symbol' },
    { label: "'", value: action(ACTION_TYPE_KC, 0x34), category: 'symbol' },
    { label: '`', value: action(ACTION_TYPE_KC, 0x35), category: 'symbol' },
    { label: ',', value: action(ACTION_TYPE_KC, 0x36), category: 'symbol' },
    { label: '.', value: action(ACTION_TYPE_KC, 0x37), category: 'symbol' },
    { label: '/', value: action(ACTION_TYPE_KC, 0x38), category: 'symbol' },
  ],

  // ── Pavé numérique ───────────────────────────────────────────
  keypad: [
    { label: 'Num', value: action(ACTION_TYPE_KC, 0x53), category: 'keypad' },
    { label: 'KP/', value: action(ACTION_TYPE_KC, 0x54), category: 'keypad' },
    { label: 'KP*', value: action(ACTION_TYPE_KC, 0x55), category: 'keypad' },
    { label: 'KP-', value: action(ACTION_TYPE_KC, 0x56), category: 'keypad' },
    { label: 'KP+', value: action(ACTION_TYPE_KC, 0x57), category: 'keypad' },
    { label: 'KP↵', value: action(ACTION_TYPE_KC, 0x58), category: 'keypad' },
    { label: 'KP1', value: action(ACTION_TYPE_KC, 0x59), category: 'keypad' },
    { label: 'KP2', value: action(ACTION_TYPE_KC, 0x5a), category: 'keypad' },
    { label: 'KP3', value: action(ACTION_TYPE_KC, 0x5b), category: 'keypad' },
    { label: 'KP4', value: action(ACTION_TYPE_KC, 0x5c), category: 'keypad' },
    { label: 'KP5', value: action(ACTION_TYPE_KC, 0x5d), category: 'keypad' },
    { label: 'KP6', value: action(ACTION_TYPE_KC, 0x5e), category: 'keypad' },
    { label: 'KP7', value: action(ACTION_TYPE_KC, 0x5f), category: 'keypad' },
    { label: 'KP8', value: action(ACTION_TYPE_KC, 0x60), category: 'keypad' },
    { label: 'KP9', value: action(ACTION_TYPE_KC, 0x61), category: 'keypad' },
    { label: 'KP0', value: action(ACTION_TYPE_KC, 0x62), category: 'keypad' },
    { label: 'KP.', value: action(ACTION_TYPE_KC, 0x63), category: 'keypad' },
  ],

  // ── Modificateurs ────────────────────────────────────────────
  modifiers: [
    { label: 'L-Ctrl', value: action(ACTION_TYPE_MOD, 0x01), category: 'modifier' },
    { label: 'L-Shift', value: action(ACTION_TYPE_MOD, 0x02), category: 'modifier' },
    { label: 'L-Alt', value: action(ACTION_TYPE_MOD, 0x04), category: 'modifier' },
    { label: 'L-GUI', value: action(ACTION_TYPE_MOD, 0x08), category: 'modifier' },
    { label: 'R-Ctrl', value: action(ACTION_TYPE_MOD, 0x10), category: 'modifier' },
    { label: 'R-Shift', value: action(ACTION_TYPE_MOD, 0x20), category: 'modifier' },
    { label: 'R-Alt', value: action(ACTION_TYPE_MOD, 0x40), category: 'modifier' },
    { label: 'R-GUI', value: action(ACTION_TYPE_MOD, 0x80), category: 'modifier' },
  ],

  // ── Layers ───────────────────────────────────────────────────
  layers: [
    { label: 'MO(0)', value: action(ACTION_TYPE_LAYER_MO, 0), category: 'layer' },
    { label: 'MO(1)', value: action(ACTION_TYPE_LAYER_MO, 1), category: 'layer' },
    { label: 'MO(2)', value: action(ACTION_TYPE_LAYER_MO, 2), category: 'layer' },
    { label: 'MO(3)', value: action(ACTION_TYPE_LAYER_MO, 3), category: 'layer' },
    { label: 'TG(1)', value: action(ACTION_TYPE_LAYER_TG, 1), category: 'layer' },
    { label: 'TG(2)', value: action(ACTION_TYPE_LAYER_TG, 2), category: 'layer' },
    { label: 'TG(3)', value: action(ACTION_TYPE_LAYER_TG, 3), category: 'layer' },
    { label: 'TO(0)', value: action(ACTION_TYPE_LAYER_TO, 0), category: 'layer' },
    { label: 'TO(1)', value: action(ACTION_TYPE_LAYER_TO, 1), category: 'layer' },
    { label: 'TO(2)', value: action(ACTION_TYPE_LAYER_TO, 2), category: 'layer' },
  ],

  // ── Médias ───────────────────────────────────────────────────
  media: [
    { label: 'Vol+', value: action(ACTION_TYPE_MEDIA, MEDIA_VOL_UP), category: 'media' },
    { label: 'Vol-', value: action(ACTION_TYPE_MEDIA, MEDIA_VOL_DN), category: 'media' },
    { label: 'Mute', value: action(ACTION_TYPE_MEDIA, MEDIA_MUTE), category: 'media' },
    { label: 'Play', value: action(ACTION_TYPE_MEDIA, MEDIA_PLAY), category: 'media' },
    { label: 'Next', value: action(ACTION_TYPE_MEDIA, MEDIA_NEXT), category: 'media' },
    { label: 'Prev', value: action(ACTION_TYPE_MEDIA, MEDIA_PREV), category: 'media' },
    { label: 'Scrl↑', value: action(ACTION_TYPE_MEDIA, MEDIA_SCRL_UP), category: 'media' },
    { label: 'Scrl↓', value: action(ACTION_TYPE_MEDIA, MEDIA_SCRL_DN), category: 'media' },
    { label: 'Scrl←', value: action(ACTION_TYPE_MEDIA, MEDIA_SCRL_LEFT), category: 'media' },
    { label: 'Scrl→', value: action(ACTION_TYPE_MEDIA, MEDIA_SCRL_RIGHT), category: 'media' },
    { label: 'Stop', value: action(ACTION_TYPE_MEDIA, MEDIA_STOP), category: 'media' },
    { label: 'Zoom+', value: action(ACTION_TYPE_MEDIA, MEDIA_ZOOM_IN), category: 'media' },
    { label: 'Zoom-', value: action(ACTION_TYPE_MEDIA, MEDIA_ZOOM_OUT), category: 'media' },
    { label: 'Lum+', value: action(ACTION_TYPE_MEDIA, MEDIA_BRIGHT_UP), category: 'media' },
    { label: 'Lum-', value: action(ACTION_TYPE_MEDIA, MEDIA_BRIGHT_DN), category: 'media' },
  ],

  // ── Lancement d'applications (Consumer Control) ──────────────
  apps: [
    { label: 'Calc', value: action(ACTION_TYPE_MEDIA, MEDIA_APP_CALC), category: 'app' },
    { label: 'Mail', value: action(ACTION_TYPE_MEDIA, MEDIA_APP_MAIL), category: 'app' },
    { label: 'Navigateur', value: action(ACTION_TYPE_MEDIA, MEDIA_APP_BROWSER), category: 'app' },
    { label: 'Recherche', value: action(ACTION_TYPE_MEDIA, MEDIA_APP_SEARCH), category: 'app' },
    { label: 'Fichiers', value: action(ACTION_TYPE_MEDIA, MEDIA_APP_FILES), category: 'app' },
    { label: 'Agenda', value: action(ACTION_TYPE_MEDIA, MEDIA_APP_CALENDAR), category: 'app' },
    { label: 'Lecteur', value: action(ACTION_TYPE_MEDIA, MEDIA_APP_PLAYER), category: 'app' },
    { label: 'Verrouiller', value: action(ACTION_TYPE_MEDIA, MEDIA_APP_LOCK), category: 'app' },
    { label: 'Capture', value: action(ACTION_TYPE_MEDIA, MEDIA_APP_SCRSHOT), category: 'app' },
  ],

  // ── Spéciaux firmware ────────────────────────────────────────
  firmware: [
    { label: 'BLE Switch', value: action(ACTION_TYPE_SPECIAL, SPECIAL_BLE_SWITCH), category: 'firmware' },
    { label: 'Studio Mode', value: action(ACTION_TYPE_SPECIAL, SPECIAL_STUDIO_MODE), category: 'firmware' },
    { label: 'Orient ↻', value: action(ACTION_TYPE_SPECIAL, SPECIAL_ORIENT_CW), category: 'firmware' },
    { label: 'Orient ↺', value: action(ACTION_TYPE_SPECIAL, SPECIAL_ORIENT_CCW), category: 'firmware' },
    { label: 'LED +', value: action(ACTION_TYPE_SPECIAL, SPECIAL_LED_BRIGHT_UP), category: 'firmware' },
    { label: 'LED -', value: action(ACTION_TYPE_SPECIAL, SPECIAL_LED_BRIGHT_DN), category: 'firmware' },
    { label: 'Sens +', value: action(ACTION_TYPE_SPECIAL, SPECIAL_ENC_SENS_UP), category: 'firmware' },
    { label: 'Sens -', value: action(ACTION_TYPE_SPECIAL, SPECIAL_ENC_SENS_DN), category: 'firmware' },
    { label: 'Veille', value: action(ACTION_TYPE_SPECIAL, SPECIAL_SLEEP), category: 'firmware' },
  ],

};

/** Table à plat pour la recherche par valeur ou label (hors macros, qui sont dynamiques) */
export const KEYCODES_FLAT: Keycode[] = Object.values(KEYCODES).flat();

// ── Macros (dynamiques, dépendent de la config) ────────────────

/** Nom d'affichage d'un slot macro (son `name`, sinon "Macro N"). */
export function macroLabel(idx: number, macros?: MacroDef[]): string {
  const name = macros?.[idx]?.name?.trim();
  return name && name.length > 0 ? name : `Macro ${idx}`;
}

/**
 * Keycodes des macros à proposer dans le picker : uniquement les slots
 * utilisés (≥ 1 étape), libellés par leur nom.
 */
export function macroKeycodes(macros?: MacroDef[]): Keycode[] {
  const out: Keycode[] = [];
  for (let i = 0; i < MACRO_COUNT; i++) {
    if (!isMacroUsed(macros?.[i])) continue;
    out.push({ label: macroLabel(i, macros), value: action(ACTION_TYPE_MACRO, i), category: 'macro' });
  }
  return out;
}

/** Groupes de keycodes pour le picker, macros résolues depuis la config. */
export function keycodeGroups(macros?: MacroDef[]): Record<string, Keycode[]> {
  const used = macroKeycodes(macros);
  return used.length > 0 ? { ...KEYCODES, macros: used } : { ...KEYCODES };
}

/** Table à plat incluant les macros utilisées (pour la recherche). */
export function keycodesFlat(macros?: MacroDef[]): Keycode[] {
  return [...KEYCODES_FLAT, ...macroKeycodes(macros)];
}

// ═══════════════════════════════════════════════════════════════
//  LIVE-RECORD — KeyboardEvent (clavier hôte) → keycode firmware
//
//  Mappe `KeyboardEvent.code` vers un usage HID, puis retrouve le
//  Keycode correspondant dans la table. Utilisé par le picker en
//  mode "enregistrement direct".
// ═══════════════════════════════════════════════════════════════

/** `KeyboardEvent.code` → usage HID (sous-code 12 bits, type KC). */
const CODE_TO_HID: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  // Lettres A–Z → 0x04–0x1d
  for (let i = 0; i < 26; i++) m[`Key${String.fromCharCode(65 + i)}`] = 0x04 + i;
  // Chiffres 1–9,0 → 0x1e–0x27
  for (let i = 1; i <= 9; i++) m[`Digit${i}`] = 0x1e + (i - 1);
  m['Digit0'] = 0x27;
  // F1–F12 → 0x3a–0x45 ; F13–F24 → 0x68–0x73
  for (let i = 1; i <= 12; i++) m[`F${i}`] = 0x3a + (i - 1);
  for (let i = 13; i <= 24; i++) m[`F${i}`] = 0x68 + (i - 13);
  // Pavé numérique 1–9,0
  for (let i = 1; i <= 9; i++) m[`Numpad${i}`] = 0x59 + (i - 1);
  m['Numpad0'] = 0x62;
  Object.assign(m, {
    // Édition / spéciales
    Escape: 0x29,
    Enter: 0x28,
    Space: 0x2c,
    Backspace: 0x2a,
    Tab: 0x2b,
    CapsLock: 0x39,
    PrintScreen: 0x46,
    ScrollLock: 0x47,
    Pause: 0x48,
    ContextMenu: 0x65,
    // Navigation
    Insert: 0x49,
    Home: 0x4a,
    PageUp: 0x4b,
    Delete: 0x4c,
    End: 0x4d,
    PageDown: 0x4e,
    ArrowRight: 0x4f,
    ArrowLeft: 0x50,
    ArrowDown: 0x51,
    ArrowUp: 0x52,
    // Symboles / ponctuation
    Minus: 0x2d,
    Equal: 0x2e,
    BracketLeft: 0x2f,
    BracketRight: 0x30,
    Backslash: 0x31,
    Semicolon: 0x33,
    Quote: 0x34,
    Backquote: 0x35,
    Comma: 0x36,
    Period: 0x37,
    Slash: 0x38,
    // Pavé numérique (opérateurs)
    NumLock: 0x53,
    NumpadDivide: 0x54,
    NumpadMultiply: 0x55,
    NumpadSubtract: 0x56,
    NumpadAdd: 0x57,
    NumpadEnter: 0x58,
    NumpadDecimal: 0x63,
  });
  return m;
})();

/** `KeyboardEvent.code` d'un modificateur → bit MOD (sous-code, type MOD). */
const MOD_CODE_TO_BIT: Record<string, number> = {
  ControlLeft: 0x01,
  ShiftLeft: 0x02,
  AltLeft: 0x04,
  MetaLeft: 0x08,
  ControlRight: 0x10,
  ShiftRight: 0x20,
  AltRight: 0x40,
  MetaRight: 0x08, // pas de R-GUI dans la table → fallback L-GUI
};

/** True si `code` est une touche modificatrice (Ctrl/Shift/Alt/Meta). */
export function isModifierCode(code: string): boolean {
  return code in MOD_CODE_TO_BIT;
}

/** Retrouver un Keycode par sa valeur d'action encodée. */
function findByValue(value: number): Keycode | null {
  return KEYCODES_FLAT.find((k) => k.value === value) ?? null;
}

/**
 * Mappe un KeyboardEvent vers le Keycode (non-modificateur) à assigner.
 * - touche modificatrice seule → le Keycode MOD correspondant
 * - touche supportée → le Keycode KC correspondant
 * - sinon → null (touche non supportée)
 */
export function keyEventToKeycode(e: KeyboardEvent): Keycode | null {
  if (isModifierCode(e.code)) {
    return findByValue(action(ACTION_TYPE_MOD, MOD_CODE_TO_BIT[e.code]));
  }
  const hid = CODE_TO_HID[e.code];
  if (hid === undefined) return null;
  return findByValue(action(ACTION_TYPE_KC, hid));
}

/** Keycodes des modificateurs maintenus pendant l'événement (côté gauche). */
export function eventModifierKeycodes(e: KeyboardEvent): Keycode[] {
  const out: Keycode[] = [];
  if (e.ctrlKey) out.push(findByValue(action(ACTION_TYPE_MOD, 0x01))!);
  if (e.shiftKey) out.push(findByValue(action(ACTION_TYPE_MOD, 0x02))!);
  if (e.altKey) out.push(findByValue(action(ACTION_TYPE_MOD, 0x04))!);
  if (e.metaKey) out.push(findByValue(action(ACTION_TYPE_MOD, 0x08))!);
  return out.filter(Boolean);
}

/**
 * Construit les étapes d'une macro pour un combo (modificateurs + touche).
 * Convention identique à MacroManager : `step.keycode = value & 0x0fff`.
 *   [MOD_DOWN…, KEY_DOWN, KEY_UP, …MOD_UP]
 */
export function buildComboMacroSteps(mods: Keycode[], key: Keycode): MacroStep[] {
  const sub = (k: Keycode) => k.value & 0x0fff;
  return [
    ...mods.map((m) => ({ type: MACRO_STEP_TYPE.KEY_DOWN, keycode: sub(m) })),
    { type: MACRO_STEP_TYPE.KEY_DOWN, keycode: sub(key) },
    { type: MACRO_STEP_TYPE.KEY_UP, keycode: sub(key) },
    ...[...mods].reverse().map((m) => ({ type: MACRO_STEP_TYPE.KEY_UP, keycode: sub(m) })),
  ];
}

/** Obtenir le label d'un keycode par valeur (macros résolues par nom si fournies). */
export function getKeycodeLabel(value: number, macros?: MacroDef[]): string {
  if (value === 0) return '—';
  const type = (value >> 12) & 0xf;
  if (type === ACTION_TYPE_MACRO) return macroLabel(value & 0x0fff, macros);
  const kc = KEYCODES_FLAT.find((k) => k.value === value);
  if (kc) return kc.label;
  return `0x${value.toString(16).toUpperCase()}`;
}
