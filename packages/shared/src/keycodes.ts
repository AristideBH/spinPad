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

const {
  ACTION_TYPE_KC, ACTION_TYPE_MOD, ACTION_TYPE_LAYER_MO,
  ACTION_TYPE_LAYER_TG, ACTION_TYPE_LAYER_TO,
  ACTION_TYPE_MEDIA, ACTION_TYPE_SPECIAL,
} = ACTION_TYPES;

const {
  MEDIA_VOL_UP, MEDIA_VOL_DN, MEDIA_MUTE, MEDIA_PLAY,
  MEDIA_NEXT, MEDIA_PREV, MEDIA_SCRL_UP, MEDIA_SCRL_DN,
  MEDIA_ZOOM_IN, MEDIA_ZOOM_OUT, MEDIA_SCRL_LEFT, MEDIA_SCRL_RIGHT,
} = MEDIA_CODES;

const {
  SPECIAL_BLE_SWITCH, SPECIAL_ORIENT_CW, SPECIAL_ORIENT_CCW,
  SPECIAL_LED_BRIGHT_UP, SPECIAL_LED_BRIGHT_DN, SPECIAL_STUDIO_MODE,
} = SPECIAL_CODES;

// ── Types ───────────────────────────────────────────────────────

export type KeycodeCategory =
  | 'letter'
  | 'special'
  | 'modifier'
  | 'layer'
  | 'media'
  | 'firmware';

export interface Keycode {
  label:    string;
  value:    number;
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
    { label: 'G', value: action(ACTION_TYPE_KC, 0x0A), category: 'letter' },
    { label: 'H', value: action(ACTION_TYPE_KC, 0x0B), category: 'letter' },
    { label: 'I', value: action(ACTION_TYPE_KC, 0x0C), category: 'letter' },
    { label: 'J', value: action(ACTION_TYPE_KC, 0x0D), category: 'letter' },
    { label: 'K', value: action(ACTION_TYPE_KC, 0x0E), category: 'letter' },
    { label: 'L', value: action(ACTION_TYPE_KC, 0x0F), category: 'letter' },
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
    { label: 'W', value: action(ACTION_TYPE_KC, 0x1A), category: 'letter' },
    { label: 'X', value: action(ACTION_TYPE_KC, 0x1B), category: 'letter' },
    { label: 'Y', value: action(ACTION_TYPE_KC, 0x1C), category: 'letter' },
    { label: 'Z', value: action(ACTION_TYPE_KC, 0x1D), category: 'letter' },
  ],

  // ── Touches spéciales ────────────────────────────────────────
  special: [
    { label: 'None',  value: 0,                             category: 'special' },
    { label: 'Esc',   value: action(ACTION_TYPE_KC, 0x29),  category: 'special' },
    { label: 'Enter', value: action(ACTION_TYPE_KC, 0x28),  category: 'special' },
    { label: 'Space', value: action(ACTION_TYPE_KC, 0x2C),  category: 'special' },
    { label: 'Bksp',  value: action(ACTION_TYPE_KC, 0x2A),  category: 'special' },
    { label: 'Tab',   value: action(ACTION_TYPE_KC, 0x2B),  category: 'special' },
    { label: 'Del',   value: action(ACTION_TYPE_KC, 0x4C),  category: 'special' },
    { label: 'F1',    value: action(ACTION_TYPE_KC, 0x3A),  category: 'special' },
    { label: 'F2',    value: action(ACTION_TYPE_KC, 0x3B),  category: 'special' },
    { label: 'F3',    value: action(ACTION_TYPE_KC, 0x3C),  category: 'special' },
    { label: 'F4',    value: action(ACTION_TYPE_KC, 0x3D),  category: 'special' },
    { label: 'F5',    value: action(ACTION_TYPE_KC, 0x3E),  category: 'special' },
    { label: 'F6',    value: action(ACTION_TYPE_KC, 0x3F),  category: 'special' },
    { label: 'F7',    value: action(ACTION_TYPE_KC, 0x40),  category: 'special' },
    { label: 'F8',    value: action(ACTION_TYPE_KC, 0x41),  category: 'special' },
    { label: 'F9',    value: action(ACTION_TYPE_KC, 0x42),  category: 'special' },
    { label: 'F10',   value: action(ACTION_TYPE_KC, 0x43),  category: 'special' },
    { label: 'F11',   value: action(ACTION_TYPE_KC, 0x44),  category: 'special' },
    { label: 'F12',   value: action(ACTION_TYPE_KC, 0x45),  category: 'special' },
  ],

  // ── Modificateurs ────────────────────────────────────────────
  modifiers: [
    { label: 'L-Ctrl',  value: action(ACTION_TYPE_MOD, 0x01), category: 'modifier' },
    { label: 'L-Shift', value: action(ACTION_TYPE_MOD, 0x02), category: 'modifier' },
    { label: 'L-Alt',   value: action(ACTION_TYPE_MOD, 0x04), category: 'modifier' },
    { label: 'L-GUI',   value: action(ACTION_TYPE_MOD, 0x08), category: 'modifier' },
    { label: 'R-Ctrl',  value: action(ACTION_TYPE_MOD, 0x10), category: 'modifier' },
    { label: 'R-Shift', value: action(ACTION_TYPE_MOD, 0x20), category: 'modifier' },
    { label: 'R-Alt',   value: action(ACTION_TYPE_MOD, 0x40), category: 'modifier' },
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
    { label: 'Vol+',  value: action(ACTION_TYPE_MEDIA, MEDIA_VOL_UP),    category: 'media' },
    { label: 'Vol-',  value: action(ACTION_TYPE_MEDIA, MEDIA_VOL_DN),    category: 'media' },
    { label: 'Mute',  value: action(ACTION_TYPE_MEDIA, MEDIA_MUTE),      category: 'media' },
    { label: 'Play',  value: action(ACTION_TYPE_MEDIA, MEDIA_PLAY),      category: 'media' },
    { label: 'Next',  value: action(ACTION_TYPE_MEDIA, MEDIA_NEXT),      category: 'media' },
    { label: 'Prev',  value: action(ACTION_TYPE_MEDIA, MEDIA_PREV),      category: 'media' },
    { label: 'Scrl↑', value: action(ACTION_TYPE_MEDIA, MEDIA_SCRL_UP),   category: 'media' },
    { label: 'Scrl↓', value: action(ACTION_TYPE_MEDIA, MEDIA_SCRL_DN),   category: 'media' },
    { label: 'Scrl←', value: action(ACTION_TYPE_MEDIA, MEDIA_SCRL_LEFT), category: 'media' },
    { label: 'Scrl→', value: action(ACTION_TYPE_MEDIA, MEDIA_SCRL_RIGHT),category: 'media' },
    { label: 'Zoom+', value: action(ACTION_TYPE_MEDIA, MEDIA_ZOOM_IN),   category: 'media' },
    { label: 'Zoom-', value: action(ACTION_TYPE_MEDIA, MEDIA_ZOOM_OUT),  category: 'media' },
  ],

  // ── Spéciaux firmware ────────────────────────────────────────
  firmware: [
    { label: 'BLE Switch',  value: action(ACTION_TYPE_SPECIAL, SPECIAL_BLE_SWITCH),    category: 'firmware' },
    { label: 'Studio Mode', value: action(ACTION_TYPE_SPECIAL, SPECIAL_STUDIO_MODE),   category: 'firmware' },
    { label: 'Orient ↻',    value: action(ACTION_TYPE_SPECIAL, SPECIAL_ORIENT_CW),     category: 'firmware' },
    { label: 'Orient ↺',    value: action(ACTION_TYPE_SPECIAL, SPECIAL_ORIENT_CCW),    category: 'firmware' },
    { label: 'LED +',       value: action(ACTION_TYPE_SPECIAL, SPECIAL_LED_BRIGHT_UP), category: 'firmware' },
    { label: 'LED -',       value: action(ACTION_TYPE_SPECIAL, SPECIAL_LED_BRIGHT_DN), category: 'firmware' },
  ],
};

/** Table à plat pour la recherche par valeur ou label */
export const KEYCODES_FLAT: Keycode[] = Object.values(KEYCODES).flat();

/** Obtenir le label d'un keycode par valeur */
export function getKeycodeLabel(value: number): string {
  if (value === 0) return '—';
  const kc = KEYCODES_FLAT.find(k => k.value === value);
  return kc ? kc.label : `0x${value.toString(16).toUpperCase()}`;
}
