// ═══════════════════════════════════════════════════════════════
//  config-schema.ts — Schéma et validation de la config SpinPad
//
//  Utilisé par :
//    - packages/studio  (validation import/export .spinpad)
//    - packages/website (documentation du format)
//
//  Correspond à kb_config_t dans config_store.h (firmware).
// ═══════════════════════════════════════════════════════════════

// ── Constantes structurelles ────────────────────────────────────

export const CONFIG_NUM_KEYS      = 10;   // SW1–SW10
export const CONFIG_NUM_PROFILES  = 4;
export const CONFIG_NUM_LAYERS    = 4;    // par profil
export const CONFIG_FORMAT_VERSION = 1;

// ── Types ───────────────────────────────────────────────────────

export interface LayerConfig {
  keys:        number[];   // length = CONFIG_NUM_KEYS
  encoder_cw:  number;
  encoder_ccw: number;
  name?:       string;
  encoder?:    { cw: number; ccw: number; press?: number };
}

export interface ProfileConfig {
  name:          string;
  layers:        LayerConfig[];  // length = CONFIG_NUM_LAYERS
  layer_count?:  number;
  combos?:       unknown[];
  combo_count?:  number;
}

export interface FullConfig {
  active_profile: number;
  profiles:       ProfileConfig[];   // length = CONFIG_NUM_PROFILES
  version?:       number;
  profile_count?: number;
  display: {
    brightness:       number;  // 0–255
    timeout_s:        number;
    show_battery?:    boolean;
    show_layer?:      boolean;
    show_profile?:    boolean;
    show_ble_status?: boolean;
  };
  ble: {
    device_name:  string;
    active_slot?: number;
    slot_names?:  string[];
  };
  power?: {
    sleep_timeout_s:      number;
    battery_critical_pct?: number;
    battery_present?:     'auto' | 'yes' | 'no';
  };
  orientation:    number;   // 0–3 (ORIENTATION_0 … ORIENTATION_270)
  encoder: {
    sensitivity: number;   // 1–4
  };
  led_extension: {
    enabled:    boolean;
    count:      number;    // 0–50
    mode:       number;    // LED_EXT_MODE_*
    r:          number;    // 0–255
    g:          number;
    b:          number;
    brightness: number;
  };
}

export type ValidationResult<T> =
  | { ok: true;  config: T }
  | { ok: false; error: string };

// ── Valeurs par défaut ──────────────────────────────────────────

export function defaultKeyAction(): number {
  return 0x0000; // KC_NONE
}

export function defaultLayer(): LayerConfig {
  return {
    keys:        Array(CONFIG_NUM_KEYS).fill(0) as number[],
    encoder_cw:  0,
    encoder_ccw: 0,
  };
}

export function defaultProfile(): ProfileConfig {
  return {
    name:   'Profile',
    layers: Array.from({ length: CONFIG_NUM_LAYERS }, defaultLayer),
  };
}

export function defaultConfig(): FullConfig {
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
 */
export function validateConfig(raw: unknown): ValidationResult<FullConfig> {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'La config doit être un objet JSON.' };
  }

  const r = raw as Record<string, unknown>;
  const defaults = defaultConfig();

  const config: FullConfig = {
    active_profile: typeof r.active_profile === 'number'
      ? Math.min(Math.max(r.active_profile, 0), CONFIG_NUM_PROFILES - 1)
      : defaults.active_profile,

    profiles: Array.isArray(r.profiles)
      ? (r.profiles as unknown[]).slice(0, CONFIG_NUM_PROFILES).map((p, i) =>
          mergeProfile(p, defaults.profiles[i]))
      : defaults.profiles,

    display: {
      brightness: (r.display as any)?.brightness ?? defaults.display.brightness,
      timeout_s:  (r.display as any)?.timeout_s  ?? defaults.display.timeout_s,
    },

    ble: {
      device_name: (r.ble as any)?.device_name ?? defaults.ble.device_name,
    },

    orientation: typeof r.orientation === 'number'
      ? Math.min(Math.max(Math.round(r.orientation), 0), 3)
      : defaults.orientation,

    encoder: {
      sensitivity: typeof (r.encoder as any)?.sensitivity === 'number'
        ? Math.min(Math.max(Math.round((r.encoder as any).sensitivity), 1), 4)
        : defaults.encoder.sensitivity,
    },

    led_extension: {
      enabled:    (r.led_extension as any)?.enabled    ?? defaults.led_extension.enabled,
      count:      (r.led_extension as any)?.count      ?? defaults.led_extension.count,
      mode:       (r.led_extension as any)?.mode       ?? defaults.led_extension.mode,
      r:          (r.led_extension as any)?.r          ?? defaults.led_extension.r,
      g:          (r.led_extension as any)?.g          ?? defaults.led_extension.g,
      b:          (r.led_extension as any)?.b          ?? defaults.led_extension.b,
      brightness: (r.led_extension as any)?.brightness ?? defaults.led_extension.brightness,
    },
  };

  return { ok: true, config };
}

function mergeProfile(raw: unknown, def: ProfileConfig): ProfileConfig {
  if (typeof raw !== 'object' || raw === null) return def;
  const r = raw as Record<string, unknown>;
  return {
    name:   typeof r.name === 'string' ? r.name : def.name,
    layers: Array.isArray(r.layers)
      ? (r.layers as unknown[]).slice(0, CONFIG_NUM_LAYERS).map((l, i) =>
          mergeLayer(l, def.layers[i]))
      : def.layers,
  };
}

function mergeLayer(raw: unknown, def: LayerConfig): LayerConfig {
  if (typeof raw !== 'object' || raw === null) return def;
  const r = raw as Record<string, unknown>;
  return {
    keys: Array.isArray(r.keys)
      ? (r.keys as unknown[]).slice(0, CONFIG_NUM_KEYS).map(k =>
          typeof k === 'number' ? k : 0)
      : def.keys,
    encoder_cw:  typeof r.encoder_cw  === 'number' ? r.encoder_cw  : def.encoder_cw,
    encoder_ccw: typeof r.encoder_ccw === 'number' ? r.encoder_ccw : def.encoder_ccw,
  };
}
