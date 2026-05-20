// ═══════════════════════════════════════════════════════════════
//  keycodes/index.js — Table des keycodes disponibles
//
//  Chaque keycode = { label, value, category }
//  value = uint16 encodé : (type << 12) | valeur
//
//  L'app SvelteKit affiche ces labels dans un sélecteur visuel.
//  Le firmware utilise les valeurs uint16 pour déclencher les actions.
// ═══════════════════════════════════════════════════════════════

// Types d'action (doit correspondre à keymap.h)
const TYPE_KC = 0x0;
const TYPE_MOD = 0x1;
const TYPE_MO = 0x2;  // Momentary layer
const TYPE_TG = 0x3;  // Toggle layer
const TYPE_TO = 0x4;  // To layer
const TYPE_MEDIA = 0x5;
const TYPE_SPECIAL = 0xF;

const action = (type, val) => (type << 12) | (val & 0x0FFF);

export const KEYCODES = {
    // ── Lettres ──────────────────────────────────────────────
    letters: [
        { label: 'A', value: action(TYPE_KC, 0x04), category: 'letter' },
        { label: 'B', value: action(TYPE_KC, 0x05), category: 'letter' },
        { label: 'C', value: action(TYPE_KC, 0x06), category: 'letter' },
        { label: 'D', value: action(TYPE_KC, 0x07), category: 'letter' },
        { label: 'E', value: action(TYPE_KC, 0x08), category: 'letter' },
        { label: 'F', value: action(TYPE_KC, 0x09), category: 'letter' },
        { label: 'G', value: action(TYPE_KC, 0x0A), category: 'letter' },
        { label: 'H', value: action(TYPE_KC, 0x0B), category: 'letter' },
        { label: 'I', value: action(TYPE_KC, 0x0C), category: 'letter' },
        { label: 'J', value: action(TYPE_KC, 0x0D), category: 'letter' },
        { label: 'K', value: action(TYPE_KC, 0x0E), category: 'letter' },
        { label: 'L', value: action(TYPE_KC, 0x0F), category: 'letter' },
        { label: 'M', value: action(TYPE_KC, 0x10), category: 'letter' },
        { label: 'N', value: action(TYPE_KC, 0x11), category: 'letter' },
        { label: 'O', value: action(TYPE_KC, 0x12), category: 'letter' },
        { label: 'P', value: action(TYPE_KC, 0x13), category: 'letter' },
        { label: 'Q', value: action(TYPE_KC, 0x14), category: 'letter' },
        { label: 'R', value: action(TYPE_KC, 0x15), category: 'letter' },
        { label: 'S', value: action(TYPE_KC, 0x16), category: 'letter' },
        { label: 'T', value: action(TYPE_KC, 0x17), category: 'letter' },
        { label: 'U', value: action(TYPE_KC, 0x18), category: 'letter' },
        { label: 'V', value: action(TYPE_KC, 0x19), category: 'letter' },
        { label: 'W', value: action(TYPE_KC, 0x1A), category: 'letter' },
        { label: 'X', value: action(TYPE_KC, 0x1B), category: 'letter' },
        { label: 'Y', value: action(TYPE_KC, 0x1C), category: 'letter' },
        { label: 'Z', value: action(TYPE_KC, 0x1D), category: 'letter' },
    ],

    // ── Touches spéciales ────────────────────────────────────
    special: [
        { label: 'None', value: 0, category: 'special' },
        { label: 'Esc', value: action(TYPE_KC, 0x29), category: 'special' },
        { label: 'Enter', value: action(TYPE_KC, 0x28), category: 'special' },
        { label: 'Space', value: action(TYPE_KC, 0x2C), category: 'special' },
        { label: 'Bksp', value: action(TYPE_KC, 0x2A), category: 'special' },
        { label: 'Tab', value: action(TYPE_KC, 0x2B), category: 'special' },
        { label: 'Del', value: action(TYPE_KC, 0x4C), category: 'special' },
        { label: 'F1', value: action(TYPE_KC, 0x3A), category: 'special' },
        { label: 'F2', value: action(TYPE_KC, 0x3B), category: 'special' },
        { label: 'F3', value: action(TYPE_KC, 0x3C), category: 'special' },
        { label: 'F4', value: action(TYPE_KC, 0x3D), category: 'special' },
        { label: 'F5', value: action(TYPE_KC, 0x3E), category: 'special' },
    ],

    // ── Modificateurs ────────────────────────────────────────
    modifiers: [
        { label: 'L-Ctrl', value: action(TYPE_MOD, 0x01), category: 'modifier' },
        { label: 'L-Shift', value: action(TYPE_MOD, 0x02), category: 'modifier' },
        { label: 'L-Alt', value: action(TYPE_MOD, 0x04), category: 'modifier' },
        { label: 'L-GUI', value: action(TYPE_MOD, 0x08), category: 'modifier' },
        { label: 'R-Ctrl', value: action(TYPE_MOD, 0x10), category: 'modifier' },
        { label: 'R-Shift', value: action(TYPE_MOD, 0x20), category: 'modifier' },
        { label: 'R-Alt', value: action(TYPE_MOD, 0x40), category: 'modifier' },
    ],

    // ── Layers ───────────────────────────────────────────────
    layers: [
        { label: 'MO(0)', value: action(TYPE_MO, 0), category: 'layer' },
        { label: 'MO(1)', value: action(TYPE_MO, 1), category: 'layer' },
        { label: 'MO(2)', value: action(TYPE_MO, 2), category: 'layer' },
        { label: 'TG(1)', value: action(TYPE_TG, 1), category: 'layer' },
        { label: 'TG(2)', value: action(TYPE_TG, 2), category: 'layer' },
        { label: 'TO(0)', value: action(TYPE_TO, 0), category: 'layer' },
        { label: 'TO(1)', value: action(TYPE_TO, 1), category: 'layer' },
    ],

    // ── Médias ───────────────────────────────────────────────
    media: [
        { label: 'Vol+', value: action(TYPE_MEDIA, 0x01), category: 'media' },
        { label: 'Vol-', value: action(TYPE_MEDIA, 0x02), category: 'media' },
        { label: 'Mute', value: action(TYPE_MEDIA, 0x03), category: 'media' },
        { label: 'Play', value: action(TYPE_MEDIA, 0x04), category: 'media' },
        { label: 'Next', value: action(TYPE_MEDIA, 0x05), category: 'media' },
        { label: 'Prev', value: action(TYPE_MEDIA, 0x06), category: 'media' },
        { label: 'Scrl↑', value: action(TYPE_MEDIA, 0x10), category: 'media' },
        { label: 'Scrl↓', value: action(TYPE_MEDIA, 0x11), category: 'media' },
        { label: 'Zoom+', value: action(TYPE_MEDIA, 0x20), category: 'media' },
        { label: 'Zoom-', value: action(TYPE_MEDIA, 0x21), category: 'media' },
    ],

    // ── Spéciaux firmware ────────────────────────────────────
    firmware: [
        { label: 'BLE Switch', value: action(TYPE_SPECIAL, 0x01), category: 'firmware' },
    ],
};

// Table à plat pour la recherche par valeur
export const KEYCODES_FLAT = Object.values(KEYCODES).flat();

/**
 * Obtenir le label d'un keycode
 * @param {number} value
 * @returns {string}
 */
export function getKeycodeLabel(value) {
    if (value === 0) return '—';
    const kc = KEYCODES_FLAT.find(k => k.value === value);
    return kc ? kc.label : `0x${value.toString(16).toUpperCase()}`;
}

/**
 * Calculer la valeur d'une action
 * (utile pour les combo actions définies par l'utilisateur)
 */
export { action };
