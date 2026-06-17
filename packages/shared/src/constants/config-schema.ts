// ═══════════════════════════════════════════════════════════════
//  config-schema.ts — SpinPad config schema and validation
//
//  Used by:
//    - packages/studio  (.spinpad import/export validation)
//    - packages/website (format documentation)
//
//  Matches kb_config_t in config_store.h (firmware).
// ═══════════════════════════════════════════════════════════════

import { backfillLayerColors } from './layer-colors.js';

// ── Structural constants ────────────────────────────────────────

// Single source of truth: these constants are also emitted in C
// (config_limits.gen.h) by scripts/codegen.mjs → do not duplicate on the firmware side.
export const CONFIG_NUM_KEYS = 10; // SW1–SW10
export const CONFIG_MAX_PROFILES = 4;
export const CONFIG_MAX_LAYERS = 6; // per profile (real firmware cap)
export const CONFIG_NAME_MAX_LEN = 32; // bytes, '\0' included → 31 usable chars
export const CONFIG_FORMAT_VERSION = 4; // v4: per-layer encoder sensitivity override

// Lower bounds for the CRUD (one profile/layer minimum)
export const MIN_PROFILES = 1;
export const MIN_LAYERS = 1;

// Profile icon: 24×24 monochrome 1bpp → 72 bytes, transported as base64
export const PROFILE_ICON_W = 24;
export const PROFILE_ICON_H = 24;
export const PROFILE_ICON_BYTES = (PROFILE_ICON_W * PROFILE_ICON_H) / 8; // 72

// ── OLED widget — 4×4 mosaic grid (v1, span-based) ──────────────
//
//  Span-based model: each widget occupies a box (x, y, w, h) on a
//  logical 4×4 grid. The outer ring (col/row 0 and 3) is a fixed band
//  of WIDGET_MIN_BAND_PX; the 2 central tracks share the rest
//  (1fr). The orientation (0–3) is a pure transform at firmware render —
//  the logical layout never changes. Each (type, size) pair maps to
//  a distinct drawing variant on the firmware side.
//
//  ⚠ Must stay synchronized with kb_widget_t / WIDGET_* in config_store.h.

export const WIDGET_GRID_COLS = 4;
export const WIDGET_GRID_ROWS = 4;
export const WIDGET_MIN_BAND_PX = 10; // fixed outer band (col/row 0 and 3)
export const DISPLAY_WIDTH_PX = 72; // orientation 0 (paysage)
export const DISPLAY_HEIGHT_PX = 40;
export const DISPLAY_MAX_WIDGETS = 8;

export const WIDGET_TYPE = {
  NONE: 0,
  BLE_STATUS: 1,
  LAYER: 2,
  PROFILE: 3,
  BATTERY: 4,
  CUSTOM_TEXT: 5,
  CLOCK: 6,
  ICON: 7,
} as const;
export type WidgetType = (typeof WIDGET_TYPE)[keyof typeof WIDGET_TYPE];

// Minimum width of a widget: all widgets are at least WIDGET_MIN_W
// units wide (no 1-column variant).
export const WIDGET_MIN_W = 2;

// The per-widget UI metadata (label, icon, allowed sizes, singleton,
// preview, options) lives in the Studio registry:
//   components/app/studio/dashboard/screen/widgets/
// config-schema only keeps the data contract (types, defaults, validation).

// ── Span-based data model (discriminated union) ─────────────────

interface WidgetBase {
  x: number; // 0..WIDGET_GRID_COLS-1
  y: number; // 0..WIDGET_GRID_ROWS-1
  w: number; // span en cellules
  h: number;
}

export interface BleWidget extends WidgetBase {
  type: typeof WIDGET_TYPE.BLE_STATUS;
}
export interface BatteryWidget extends WidgetBase {
  type: typeof WIDGET_TYPE.BATTERY;
}
export interface LayerWidget extends WidgetBase {
  type: typeof WIDGET_TYPE.LAYER;
}
export interface ProfileWidget extends WidgetBase {
  type: typeof WIDGET_TYPE.PROFILE;
}
export interface ClockWidget extends WidgetBase {
  type: typeof WIDGET_TYPE.CLOCK;
  clock_24h?: boolean;
  clock_show_date?: boolean; // 2×2 only
}
export interface CustomTextWidget extends WidgetBase {
  type: typeof WIDGET_TYPE.CUSTOM_TEXT;
  custom_text?: string; // max 12 chars
}
export interface IconWidget extends WidgetBase {
  type: typeof WIDGET_TYPE.ICON;
  icon?: string; // 24×24 1bpp bitmap in base64 (same format as the profile icon)
}

export type WidgetConfig =
  | BleWidget
  | BatteryWidget
  | LayerWidget
  | ProfileWidget
  | ClockWidget
  | CustomTextWidget
  | IconWidget;

/** Default v1 layout (orientation 0, 4×4 grid). */
export function defaultWidgets(): WidgetConfig[] {
  return [
    { type: WIDGET_TYPE.BATTERY, x: 0, y: 0, w: 2, h: 1 }, // battery, top-left
    { type: WIDGET_TYPE.CLOCK, x: 2, y: 0, w: 2, h: 1 }, // clock, top-right (2×1)
    { type: WIDGET_TYPE.PROFILE, x: 0, y: 1, w: 4, h: 3 }, // profile, 4×3, starting from the 2nd row
  ];
}

// ── Macros ──────────────────────────────────────────────────────

export const MACRO_STEP_TYPE = {
  KEY_DOWN: 0,
  KEY_UP: 1,
  DELAY_MS: 2,
} as const;
export type MacroStepType = (typeof MACRO_STEP_TYPE)[keyof typeof MACRO_STEP_TYPE];

export interface MacroStep {
  type: MacroStepType;
  keycode?: number; // HID keycode (KEY_DOWN / KEY_UP)
  delay?: number; // ms, max 1000 (DELAY_MS)
}

export const MACRO_MAX_STEPS = 32;
export const MACRO_COUNT = 16; // fixed global slots (index 0..15 in ACTION_TYPE_MACRO)
export const MACRO_NAME_MAX_LEN = 17; // bytes, '\0' included → 16 usable chars

/**
 * A global macro (shared by all profiles). An empty slot has
 * `steps.length === 0`; its `name` may stay empty (fallback "Macro N").
 */
export interface MacroDef {
  name: string;
  steps: MacroStep[]; // up to MACRO_MAX_STEPS
}

export function defaultMacro(): MacroDef {
  return { name: '', steps: [] };
}

export function defaultMacros(): MacroDef[] {
  return Array.from({ length: MACRO_COUNT }, defaultMacro);
}

/** True if the slot contains at least one step (i.e. "used"). */
export function isMacroUsed(m: MacroDef | undefined): boolean {
  return !!m && m.steps.length >= 1;
}

// ── LED ─────────────────────────────────────────────────────────

/**
 * Available LED effects — exact mirror of the led-matrix.svelte modes.
 * Each level of the hierarchy exposes only a subset:
 *   Global   : all modes
 *   Profile  : off | static | breathe | pulse  (no position-dependent ones)
 *   Per-key  : off | static | breathe | alert
 */
export type LedMode = 'off' | 'static' | 'pulse' | 'breathe' | 'flow' | 'sweep' | 'alert' | 'rainbow';
export type LedModeProfile = Extract<LedMode, 'off' | 'static' | 'breathe' | 'pulse'>;
export type LedModeKey = Extract<LedMode, 'off' | 'static' | 'breathe' | 'alert'>;

/** Gradient presets for the flow/sweep effects. Index 0 = initial default. */
export const GRADIENT_PRESETS = [
  { label: 'Teal–Blue',  colors: ['#34d399', '#22d3ee', '#3b82f6', '#34d399'] },
  { label: 'Sunset',     colors: ['#f97316', '#ef4444', '#ec4899', '#f97316'] },
  { label: 'Aurora',     colors: ['#8b5cf6', '#06b6d4', '#10b981', '#8b5cf6'] },
  { label: 'Fire',       colors: ['#fbbf24', '#f97316', '#ef4444', '#fbbf24'] },
] as const;

/** Global LED config for the 10 keys (in FullConfig). */
export interface LedKeyGlobal {
  brightness: number; // 0–255
  effect: LedMode;
  r: number; // 0–255
  g: number;
  b: number;
  gradient_preset?: number; // index in GRADIENT_PRESETS, active if effect=flow|sweep
}

/** Profile identity LED color/effect — inherits from global if absent. */
export interface LedProfile {
  r: number;
  g: number;
  b: number;
  effect?: LedModeProfile;
}

/** Per-key LED override in a layer — null = inherits from layer/profile/global. */
export interface KeyLedOverride {
  r: number;
  g: number;
  b: number;
  effect?: LedModeKey;
}

// ── Types ───────────────────────────────────────────────────────

export interface LayerConfig {
  keys: number[]; // length = CONFIG_NUM_KEYS
  encoder_cw: number;
  encoder_ccw: number;
  name?: string;
  encoder?: { cw: number; ccw: number; press?: number };
  // Color slot (0..CONFIG_MAX_LAYERS-1) — app-only, ignored by the firmware.
  // Follows the layer on a reorder to stabilize its color. See
  // layer-colors.ts. Reassigned by position on entry if absent (device round-trip).
  color?: number;
  // Per-key LED overrides (index = key index, null = inherits). App-only unless
  // the firmware is updated to read these fields.
  key_leds?: (KeyLedOverride | null)[];
  // Encoder sensitivity override for this layer. null/absent = inherits from global.
  encoder_sensitivity?: number | null;
}

export interface ProfileConfig {
  name: string;
  layers: LayerConfig[]; // 1..CONFIG_MAX_LAYERS
  layer_count?: number;
  icon?: string; // base64 of a 24×24 1bpp bitmap (PROFILE_ICON_BYTES bytes)
  combos?: unknown[];
  combo_count?: number;
  led?: LedProfile; // profile identity color (absent = inherits from global)
}

export interface FullConfig {
  active_profile: number;
  profiles: ProfileConfig[]; // 1..CONFIG_MAX_PROFILES
  macros: MacroDef[]; // MACRO_COUNT fixed global slots
  version?: number;
  profile_count?: number;
  display: {
    brightness: number; // 0–255
    timeout_s: number;
    widgets?: WidgetConfig[];
    clock_base_unix_ts?: number;
  };
  ble: {
    device_name: string;
    active_slot?: number;
    slot_names?: string[];
  };
  power?: {
    sleep_timeout_s: number;
    battery_critical_pct?: number;
    battery_present?: 'auto' | 'yes' | 'no';
    debounce_press_scans?: number; // 1–20, default 3
    debounce_release_scans?: number; // 1–20, default 5
  };
  orientation: number; // 0–3 (ORIENTATION_0 … ORIENTATION_270)
  encoder: {
    sensitivity: number; // 1–4
  };
  led_key: LedKeyGlobal; // global LED config of the 10 keys
  led_extension: {
    enabled: boolean;
    count: number; // 0–50
    mode: number; // LED_EXT_MODE_*
    r: number; // 0–255
    g: number;
    b: number;
    brightness: number;
    max_power_mw?: number; // 0 = unlimited, default 500
  };
}

export type ValidationResult<T> = { ok: true; config: T } | { ok: false; error: string };

// ── Default values ──────────────────────────────────────────────

export function defaultKeyAction(): number {
  return 0x0000; // KC_NONE
}

export function defaultLedKey(): LedKeyGlobal {
  return { brightness: 180, effect: 'static', r: 255, g: 255, b: 255 };
}

export function defaultLayer(name = 'Base'): LayerConfig {
  return {
    name,
    keys: Array(CONFIG_NUM_KEYS).fill(0) as number[],
    encoder_cw: 0,
    encoder_ccw: 0,
    // `encoder` object = canonical format (read by firmware + UI). Without it, the UI
    // cannot assign an action to the encoder on a freshly created layer.
    encoder: { cw: 0, ccw: 0, press: 0 },
  };
}

export function defaultProfile(): ProfileConfig {
  const profile: ProfileConfig = {
    name: 'Profile',
    icon: '', // no default icon (presets provide one)
    layers: [defaultLayer('Base')], // a single layer to start — add on demand
  };
  backfillLayerColors([profile]); // guarantees color: 0 on the base layer
  return profile;
}

export function defaultConfig(): FullConfig {
  return {
    active_profile: 0,
    profiles: Array.from({ length: CONFIG_MAX_PROFILES }, (_, i) => ({
      ...defaultProfile(),
      name: `Profile ${i + 1}`,
    })),
    macros: defaultMacros(),
    display: {
      brightness: 200,
      timeout_s: 60,
      widgets: defaultWidgets(),
    },
    ble: {
      device_name: 'SpinPad',
    },
    orientation: 0, // ORIENTATION_0
    encoder: {
      sensitivity: 1, // 1–4
    },
    led_key: defaultLedKey(),
    led_extension: {
      enabled: false,
      count: 0,
      mode: 0, // LED_EXT_MODE_OFF
      r: 255,
      g: 80,
      b: 0,
      brightness: 200,
    },
  };
}

// ── Validation ──────────────────────────────────────────────────

/**
 * Validates and completes an imported config (applies the default values
 * for missing fields, without a fatal error on optional fields).
 */
export function validateConfig(raw: unknown): ValidationResult<FullConfig> {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'The config must be a JSON object.' };
  }

  const r = raw as Record<string, unknown>;
  const defaults = defaultConfig();

  const config: FullConfig = {
    active_profile:
      typeof r.active_profile === 'number'
        ? Math.min(Math.max(r.active_profile, 0), CONFIG_MAX_PROFILES - 1)
        : defaults.active_profile,

    profiles:
      Array.isArray(r.profiles) && r.profiles.length > 0
        ? (r.profiles as unknown[]).slice(0, CONFIG_MAX_PROFILES).map((p, i) => mergeProfile(p, defaults.profiles[i]))
        : defaults.profiles,

    macros: mergeMacros(r.macros),

    display: {
      brightness: (r.display as any)?.brightness ?? defaults.display.brightness,
      timeout_s: (r.display as any)?.timeout_s ?? defaults.display.timeout_s,
      widgets: Array.isArray((r.display as any)?.widgets)
        ? mergeWidgets((r.display as any).widgets)
        : defaults.display.widgets,
    },

    ble: {
      device_name: (r.ble as any)?.device_name ?? defaults.ble.device_name,
    },

    orientation:
      typeof r.orientation === 'number' ? Math.min(Math.max(Math.round(r.orientation), 0), 3) : defaults.orientation,

    encoder: {
      sensitivity:
        typeof (r.encoder as any)?.sensitivity === 'number'
          ? Math.min(Math.max(Math.round((r.encoder as any).sensitivity), 1), 4)
          : defaults.encoder.sensitivity,
    },

    led_key: mergeLedKey(r.led_key, defaults.led_key),
    led_extension: {
      enabled: (r.led_extension as any)?.enabled ?? defaults.led_extension.enabled,
      count: (r.led_extension as any)?.count ?? defaults.led_extension.count,
      mode: (r.led_extension as any)?.mode ?? defaults.led_extension.mode,
      r: (r.led_extension as any)?.r ?? defaults.led_extension.r,
      g: (r.led_extension as any)?.g ?? defaults.led_extension.g,
      b: (r.led_extension as any)?.b ?? defaults.led_extension.b,
      brightness: (r.led_extension as any)?.brightness ?? defaults.led_extension.brightness,
      max_power_mw: (r.led_extension as any)?.max_power_mw ?? 500,
    },
  };

  backfillLayerColors(config.profiles);
  return { ok: true, config };
}

const LED_MODES_ALL: LedMode[] = ['off', 'static', 'pulse', 'breathe', 'flow', 'sweep', 'alert', 'rainbow'];
const LED_MODES_PROFILE: LedModeProfile[] = ['off', 'static', 'breathe', 'pulse'];
const LED_MODES_KEY: LedModeKey[] = ['off', 'static', 'breathe', 'alert'];

function clampU8(v: unknown, def: number): number {
  return typeof v === 'number' ? Math.min(255, Math.max(0, Math.round(v))) : def;
}

function mergeLedKey(raw: unknown, def: LedKeyGlobal): LedKeyGlobal {
  if (typeof raw !== 'object' || raw === null) return def;
  const r = raw as Record<string, unknown>;
  const effect = typeof r.effect === 'string' && LED_MODES_ALL.includes(r.effect as LedMode)
    ? (r.effect as LedMode)
    : def.effect;
  const gp = typeof r.gradient_preset === 'number' && r.gradient_preset >= 0 && r.gradient_preset < GRADIENT_PRESETS.length
    ? r.gradient_preset
    : def.gradient_preset;
  return {
    brightness: clampU8(r.brightness, def.brightness),
    effect,
    r: clampU8(r.r, def.r),
    g: clampU8(r.g, def.g),
    b: clampU8(r.b, def.b),
    ...(gp !== undefined ? { gradient_preset: gp } : {}),
  };
}

function mergeLedProfile(raw: unknown): LedProfile | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  const effect = typeof r.effect === 'string' && LED_MODES_PROFILE.includes(r.effect as LedModeProfile)
    ? (r.effect as LedModeProfile)
    : undefined;
  return {
    r: clampU8(r.r, 255),
    g: clampU8(r.g, 255),
    b: clampU8(r.b, 255),
    ...(effect ? { effect } : {}),
  };
}

function mergeKeyLeds(raw: unknown): (KeyLedOverride | null)[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: (KeyLedOverride | null)[] = [];
  for (let i = 0; i < CONFIG_NUM_KEYS; i++) {
    const item = raw[i];
    if (item === null || item === undefined) {
      out.push(null);
      continue;
    }
    if (typeof item !== 'object') { out.push(null); continue; }
    const r = item as Record<string, unknown>;
    const effect = typeof r.effect === 'string' && LED_MODES_KEY.includes(r.effect as LedModeKey)
      ? (r.effect as LedModeKey)
      : undefined;
    out.push({
      r: clampU8(r.r, 255),
      g: clampU8(r.g, 255),
      b: clampU8(r.b, 255),
      ...(effect ? { effect } : {}),
    });
  }
  return out.some((x) => x !== null) ? out : undefined;
}

function mergeProfile(raw: unknown, def: ProfileConfig = defaultProfile()): ProfileConfig {
  if (typeof raw !== 'object' || raw === null) return def;
  const r = raw as Record<string, unknown>;
  const layers =
    Array.isArray(r.layers) && r.layers.length > 0
      ? (r.layers as unknown[]).slice(0, CONFIG_MAX_LAYERS).map((l, i) => mergeLayer(l, def.layers[i]))
      : def.layers;
  const led = mergeLedProfile(r.led);
  return {
    name: typeof r.name === 'string' ? r.name : def.name,
    icon: typeof r.icon === 'string' ? r.icon : (def.icon ?? ''),
    layers,
    ...(led ? { led } : {}),
  };
}

// Placeable types (NONE excluded) for wire-format validation.
const KNOWN_WIDGET_TYPES = new Set<number>(
  Object.values(WIDGET_TYPE).filter((t) => t !== WIDGET_TYPE.NONE),
);

/**
 * Normalizes an array of span-based widgets: keeps only known types,
 * clamps (x,y,w,h) to the 4×4 grid bounds (w ≥ WIDGET_MIN_W), copies the
 * known option fields, and limits to DISPLAY_MAX_WIDGETS. The fine legality
 * of sizes per type is the UI's concern (registry); here we only guarantee
 * coordinates within bounds. Falls back to defaults if nothing usable.
 */
function mergeWidgets(raw: unknown): WidgetConfig[] {
  if (!Array.isArray(raw)) return defaultWidgets();
  const out: WidgetConfig[] = [];
  for (const item of raw) {
    if (out.length >= DISPLAY_MAX_WIDGETS) break;
    if (typeof item !== 'object' || item === null) continue;
    const r = item as Record<string, unknown>;
    const type = r.type as WidgetType;
    if (typeof type !== 'number' || !KNOWN_WIDGET_TYPES.has(type)) continue;

    // Generic bounds: w ∈ [WIDGET_MIN_W, COLS], h ∈ [1, ROWS], then x/y within the grid.
    const clamp = (v: unknown, lo: number, hi: number) =>
      typeof v === 'number' ? Math.min(Math.max(Math.round(v), lo), hi) : lo;
    const w = clamp(r.w, WIDGET_MIN_W, WIDGET_GRID_COLS);
    const h = clamp(r.h, 1, WIDGET_GRID_ROWS);
    const x = clamp(r.x, 0, WIDGET_GRID_COLS - w);
    const y = clamp(r.y, 0, WIDGET_GRID_ROWS - h);

    const base = { x, y, w, h };
    switch (type) {
      case WIDGET_TYPE.CUSTOM_TEXT:
        out.push({ type, ...base, custom_text: typeof r.custom_text === 'string' ? r.custom_text.slice(0, 12) : '' });
        break;
      case WIDGET_TYPE.ICON:
        out.push({ type, ...base, icon: typeof r.icon === 'string' ? r.icon : '' });
        break;
      case WIDGET_TYPE.CLOCK:
        out.push({ type, ...base, clock_24h: !!r.clock_24h, clock_show_date: !!r.clock_show_date });
        break;
      default:
        out.push({ type, ...base } as WidgetConfig);
    }
  }
  return out.length > 0 ? out : defaultWidgets();
}

/** Normalizes the global macros into MACRO_COUNT fixed slots. */
function mergeMacros(raw: unknown): MacroDef[] {
  const out = defaultMacros();
  if (!Array.isArray(raw)) return out;
  for (let i = 0; i < MACRO_COUNT && i < raw.length; i++) {
    const m = raw[i] as Record<string, unknown> | null;
    if (typeof m !== 'object' || m === null) continue;
    const steps = Array.isArray(m.steps) ? (m.steps as MacroStep[]).slice(0, MACRO_MAX_STEPS) : [];
    out[i] = {
      name: typeof m.name === 'string' ? m.name.slice(0, MACRO_NAME_MAX_LEN - 1) : '',
      steps,
    };
  }
  return out;
}

function mergeLayer(raw: unknown, def: LayerConfig = defaultLayer()): LayerConfig {
  if (typeof raw !== 'object' || raw === null) return def;
  const r = raw as Record<string, unknown>;
  const key_leds = mergeKeyLeds(r.key_leds);
  const rawSens = r.encoder_sensitivity;
  const encoder_sensitivity =
    typeof rawSens === 'number' ? Math.min(Math.max(Math.round(rawSens), 1), 4) : null;
  return {
    name: typeof r.name === 'string' ? r.name : def.name,
    keys: Array.isArray(r.keys)
      ? (r.keys as unknown[]).slice(0, CONFIG_NUM_KEYS).map((k) => (typeof k === 'number' ? k : 0))
      : def.keys,
    encoder_cw: typeof r.encoder_cw === 'number' ? r.encoder_cw : def.encoder_cw,
    encoder_ccw: typeof r.encoder_ccw === 'number' ? r.encoder_ccw : def.encoder_ccw,
    ...(typeof r.color === 'number' ? { color: r.color } : {}),
    ...(key_leds ? { key_leds } : {}),
    ...(encoder_sensitivity !== null ? { encoder_sensitivity } : {}),
  };
}
