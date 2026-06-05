// ═══════════════════════════════════════════════════════════════
//  config-schema.ts — Schéma et validation de la config SpinPad
//
//  Utilisé par :
//    - packages/studio  (validation import/export .spinpad)
//    - packages/website (documentation du format)
//
//  Correspond à kb_config_t dans config_store.h (firmware).
// ═══════════════════════════════════════════════════════════════

import { backfillLayerColors } from './layer-colors.js';

// ── Constantes structurelles ────────────────────────────────────

// Source de vérité unique : ces constantes sont aussi émises en C
// (config_limits.gen.h) par scripts/codegen.mjs → ne pas dupliquer côté firmware.
export const CONFIG_NUM_KEYS = 10; // SW1–SW10
export const CONFIG_MAX_PROFILES = 4;
export const CONFIG_MAX_LAYERS = 6; // par profil (cap réel firmware)
export const CONFIG_NAME_MAX_LEN = 32; // octets, '\0' inclus → 31 chars utiles
export const CONFIG_FORMAT_VERSION = 3; // v3 : widgets OLED span-based (grille 4×4)

// Bornes basses pour la CRUD (un profil/layer minimum)
export const MIN_PROFILES = 1;
export const MIN_LAYERS = 1;

// Icône de profil : 24×24 monochrome 1bpp → 72 octets, transportée en base64
export const PROFILE_ICON_W = 24;
export const PROFILE_ICON_H = 24;
export const PROFILE_ICON_BYTES = (PROFILE_ICON_W * PROFILE_ICON_H) / 8; // 72

// ── Widget OLED — grille mosaïque 4×4 (v1, span-based) ──────────
//
//  Modèle span-based : chaque widget occupe une boîte (x, y, w, h) sur une
//  grille logique 4×4. L'anneau extérieur (col/row 0 et 3) fait une bande
//  fixe de WIDGET_MIN_BAND_PX ; les 2 pistes centrales se partagent le reste
//  (1fr). L'orientation (0–3) est un pur transform au rendu firmware — le
//  layout logique ne change jamais. Chaque paire (type, size) correspond à
//  une variante de dessin distincte côté firmware.
//
//  ⚠ Doit rester synchronisé avec kb_widget_t / WIDGET_* dans config_store.h.

export const WIDGET_GRID_COLS = 4;
export const WIDGET_GRID_ROWS = 4;
export const WIDGET_MIN_BAND_PX = 10; // bande extérieure fixe (col/row 0 et 3)
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

// Largeur minimale d'un widget : tous les widgets font au moins WIDGET_MIN_W
// unités de large (pas de variante 1 colonne).
export const WIDGET_MIN_W = 2;

// Les métadonnées UI par widget (label, icône, tailles autorisées, singleton,
// aperçu, options) vivent dans le registre Studio :
//   components/app/studio/dashboard/screen/widgets/
// config-schema ne garde que le contrat de données (types, défauts, validation).

// ── Modèle de données span-based (union discriminée) ────────────

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
  clock_show_date?: boolean; // 2×2 uniquement
}
export interface CustomTextWidget extends WidgetBase {
  type: typeof WIDGET_TYPE.CUSTOM_TEXT;
  custom_text?: string; // max 12 chars
}
export interface IconWidget extends WidgetBase {
  type: typeof WIDGET_TYPE.ICON;
  icon?: string; // bitmap 24×24 1bpp en base64 (même format que l'icône de profil)
}

export type WidgetConfig =
  | BleWidget
  | BatteryWidget
  | LayerWidget
  | ProfileWidget
  | ClockWidget
  | CustomTextWidget
  | IconWidget;

/** Layout v1 par défaut (orientation 0, grille 4×4). */
export function defaultWidgets(): WidgetConfig[] {
  return [
    { type: WIDGET_TYPE.BATTERY, x: 0, y: 0, w: 2, h: 1 }, // batterie, haut-gauche
    { type: WIDGET_TYPE.CLOCK, x: 2, y: 0, w: 2, h: 1 }, // heure, haut-droite (2×1)
    { type: WIDGET_TYPE.PROFILE, x: 0, y: 1, w: 4, h: 3 }, // profil, 4×3, à partir de la 2ᵉ rangée
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
export const MACRO_COUNT = 16; // slots globaux fixes (index 0..15 dans ACTION_TYPE_MACRO)
export const MACRO_NAME_MAX_LEN = 17; // octets, '\0' inclus → 16 chars utiles

/**
 * Une macro globale (partagée par tous les profils). Un slot vide a
 * `steps.length === 0` ; son `name` peut rester vide (fallback "Macro N").
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

/** True si le slot contient au moins une étape (donc "utilisé"). */
export function isMacroUsed(m: MacroDef | undefined): boolean {
  return !!m && m.steps.length >= 1;
}

// ── Types ───────────────────────────────────────────────────────

export interface LayerConfig {
  keys: number[]; // length = CONFIG_NUM_KEYS
  encoder_cw: number;
  encoder_ccw: number;
  name?: string;
  encoder?: { cw: number; ccw: number; press?: number };
  // Slot couleur (0..CONFIG_MAX_LAYERS-1) — app-only, ignoré par le firmware.
  // Suit le layer lors d'un réordonnancement pour stabiliser sa couleur. Voir
  // layer-colors.ts. Réassigné par position à l'entrée si absent (round-trip device).
  color?: number;
}

export interface ProfileConfig {
  name: string;
  layers: LayerConfig[]; // 1..CONFIG_MAX_LAYERS
  layer_count?: number;
  icon?: string; // base64 d'un bitmap 24×24 1bpp (PROFILE_ICON_BYTES octets)
  combos?: unknown[];
  combo_count?: number;
}

export interface FullConfig {
  active_profile: number;
  profiles: ProfileConfig[]; // 1..CONFIG_MAX_PROFILES
  macros: MacroDef[]; // MACRO_COUNT slots globaux fixes
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
  led_extension: {
    enabled: boolean;
    count: number; // 0–50
    mode: number; // LED_EXT_MODE_*
    r: number; // 0–255
    g: number;
    b: number;
    brightness: number;
    max_power_mw?: number; // 0 = illimité, défaut 500
  };
}

export type ValidationResult<T> = { ok: true; config: T } | { ok: false; error: string };

// ── Valeurs par défaut ──────────────────────────────────────────

export function defaultKeyAction(): number {
  return 0x0000; // KC_NONE
}

export function defaultLayer(name = 'Base'): LayerConfig {
  return {
    name,
    keys: Array(CONFIG_NUM_KEYS).fill(0) as number[],
    encoder_cw: 0,
    encoder_ccw: 0,
    // Objet `encoder` = format canonique (lu par firmware + UI). Sans lui, l'UI
    // ne peut pas assigner d'action à l'encodeur sur un layer fraîchement créé.
    encoder: { cw: 0, ccw: 0, press: 0 },
  };
}

export function defaultProfile(): ProfileConfig {
  return {
    name: 'Profile',
    icon: '', // pas d'icône par défaut (les presets en fournissent une)
    layers: [defaultLayer('Base')], // un seul layer au départ — ajout à la demande
  };
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

function mergeProfile(raw: unknown, def: ProfileConfig = defaultProfile()): ProfileConfig {
  if (typeof raw !== 'object' || raw === null) return def;
  const r = raw as Record<string, unknown>;
  const layers =
    Array.isArray(r.layers) && r.layers.length > 0
      ? (r.layers as unknown[]).slice(0, CONFIG_MAX_LAYERS).map((l, i) => mergeLayer(l, def.layers[i]))
      : def.layers;
  return {
    name: typeof r.name === 'string' ? r.name : def.name,
    icon: typeof r.icon === 'string' ? r.icon : (def.icon ?? ''),
    layers,
  };
}

// Types placeables (NONE exclu) pour la validation du format de fil.
const KNOWN_WIDGET_TYPES = new Set<number>(
  Object.values(WIDGET_TYPE).filter((t) => t !== WIDGET_TYPE.NONE),
);

/**
 * Normalise un tableau de widgets span-based : ne garde que les types connus,
 * clampe (x,y,w,h) aux bornes de la grille 4×4 (w ≥ WIDGET_MIN_W), recopie les
 * champs d'options connus, et limite à DISPLAY_MAX_WIDGETS. La légalité fine
 * des tailles par type est affaire de l'UI (registre) ; ici on ne garantit que
 * des coordonnées dans les bornes. Fallback défauts si rien d'exploitable.
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

    // Bornes génériques : w ∈ [WIDGET_MIN_W, COLS], h ∈ [1, ROWS], puis x/y dans la grille.
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

/** Normalise les macros globales en MACRO_COUNT slots fixes. */
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
  return {
    name: typeof r.name === 'string' ? r.name : def.name,
    keys: Array.isArray(r.keys)
      ? (r.keys as unknown[]).slice(0, CONFIG_NUM_KEYS).map((k) => (typeof k === 'number' ? k : 0))
      : def.keys,
    encoder_cw: typeof r.encoder_cw === 'number' ? r.encoder_cw : def.encoder_cw,
    encoder_ccw: typeof r.encoder_ccw === 'number' ? r.encoder_ccw : def.encoder_ccw,
    ...(typeof r.color === 'number' ? { color: r.color } : {}),
  };
}
