// ═══════════════════════════════════════════════════════════════
//  config-schema.js — Schéma et validation de la config SpinPad
//
//  Utilisé par :
//    - packages/studio  (validation import/export .spinpad)
//    - packages/website (documentation du format)
//
//  Correspond à kb_config_t dans config_store.h (firmware).
// ═══════════════════════════════════════════════════════════════

// ── Constantes structurelles ────────────────────────────────────

export const CONFIG_NUM_KEYS     = 10;   // SW1–SW10
export const CONFIG_NUM_PROFILES = 4;
export const CONFIG_NUM_LAYERS   = 4;    // par profil
export const CONFIG_FORMAT_VERSION = 1;

// ── Valeurs par défaut ──────────────────────────────────────────

export function defaultKeyAction() {
  return 0x0000; // KC_NONE
}

export function defaultLayer() {
  return {
    keys:        Array(CONFIG_NUM_KEYS).fill(0),
    encoder_cw:  0,
    encoder_ccw: 0,
  };
}

export function defaultProfile() {
  return {
    name:   'Profile',
    layers: Array.from({ length: CONFIG_NUM_LAYERS }, defaultLayer),
  };
}

export function defaultConfig() {
  return {
    active_profile: 0,
    profiles: Array.from({ length: CONFIG_NUM_PROFILES }, (_, i) => ({
      ...defaultProfile(),
      name: `Profile ${i + 1}`,
    })),
    display: {
      brightness: 200,
      timeout_s:  60,
    },
    ble: {
      device_name: 'SpinPad',
    },
    orientation: 0,   // ORIENTATION_0
    encoder: {
      sensitivity: 1, // 1–4
    },
    led_extension: {
      enabled:    false,
      count:      0,
      mode:       0,  // LED_EXT_MODE_OFF
      r:          255,
      g:          80,
      b:          0,
      brightness: 200,
    },
  };
}

// ── Validation ──────────────────────────────────────────────────

/**
 * Valide et complète une config importée (applique les valeurs par défaut
 * pour les champs manquants, sans erreur fatale sur les champs optionnels).
 *
 * @param {unknown} raw  Objet brut parsé depuis JSON
 * @returns {{ ok: true, config: object } | { ok: false, error: string }}
 */
export function validateConfig(raw) {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'La config doit être un objet JSON.' };
  }

  const defaults = defaultConfig();

  // Fusion profonde superficielle : les champs présents écrasent les défauts
  const config = {
    active_profile: typeof raw.active_profile === 'number'
      ? Math.min(Math.max(raw.active_profile, 0), CONFIG_NUM_PROFILES - 1)
      : defaults.active_profile,

    profiles: Array.isArray(raw.profiles)
      ? raw.profiles.slice(0, CONFIG_NUM_PROFILES).map((p, i) => mergeProfile(p, defaults.profiles[i]))
      : defaults.profiles,

    display: {
      brightness: raw.display?.brightness ?? defaults.display.brightness,
      timeout_s:  raw.display?.timeout_s  ?? defaults.display.timeout_s,
    },

    ble: {
      device_name: raw.ble?.device_name ?? defaults.ble.device_name,
    },

    orientation: typeof raw.orientation === 'number'
      ? Math.min(Math.max(Math.round(raw.orientation), 0), 3)
      : defaults.orientation,

    encoder: {
      sensitivity: typeof raw.encoder?.sensitivity === 'number'
        ? Math.min(Math.max(Math.round(raw.encoder.sensitivity), 1), 4)
        : defaults.encoder.sensitivity,
    },

    led_extension: {
      enabled:    raw.led_extension?.enabled    ?? defaults.led_extension.enabled,
      count:      raw.led_extension?.count      ?? defaults.led_extension.count,
      mode:       raw.led_extension?.mode       ?? defaults.led_extension.mode,
      r:          raw.led_extension?.r          ?? defaults.led_extension.r,
      g:          raw.led_extension?.g          ?? defaults.led_extension.g,
      b:          raw.led_extension?.b          ?? defaults.led_extension.b,
      brightness: raw.led_extension?.brightness ?? defaults.led_extension.brightness,
    },
  };

  return { ok: true, config };
}

/**
 * Fusionne un profil importé avec les valeurs par défaut.
 * @param {unknown} raw
 * @param {object}  def  profil par défaut
 * @returns {object}
 */
function mergeProfile(raw, def) {
  if (typeof raw !== 'object' || raw === null) return def;
  return {
    name:   typeof raw.name === 'string' ? raw.name : def.name,
    layers: Array.isArray(raw.layers)
      ? raw.layers.slice(0, CONFIG_NUM_LAYERS).map((l, i) => mergeLayer(l, def.layers[i]))
      : def.layers,
  };
}

/**
 * Fusionne un layer importé avec les valeurs par défaut.
 * @param {unknown} raw
 * @param {object}  def  layer par défaut
 * @returns {object}
 */
function mergeLayer(raw, def) {
  if (typeof raw !== 'object' || raw === null) return def;
  return {
    keys: Array.isArray(raw.keys)
      ? raw.keys.slice(0, CONFIG_NUM_KEYS).map(k => (typeof k === 'number' ? k : 0))
      : def.keys,
    encoder_cw:  typeof raw.encoder_cw  === 'number' ? raw.encoder_cw  : def.encoder_cw,
    encoder_ccw: typeof raw.encoder_ccw === 'number' ? raw.encoder_ccw : def.encoder_ccw,
  };
}
