// ═══════════════════════════════════════════════════════════════
//  mock/keyboard-config.ts — Configuration mock complète
//
//  4 profils riches pour tester le frontend en devMode (VITE_DEV_MODE).
//  Chaque layer est entièrement keymappé (pas de KC_NONE) et chaque
//  layer porte un binding encodeur distinct pour exercer l'UI.
// ═══════════════════════════════════════════════════════════════

import { action, ACTION_TYPES, MEDIA_CODES } from '$shared/constants/action-types.js';
import type { FullConfig } from '$shared/constants/config-schema.js';

// ── Action type constants ─────────────────────────────────────
const {
  ACTION_TYPE_KC: TYPE_KC,
  ACTION_TYPE_MOD: TYPE_MOD,
  ACTION_TYPE_LAYER_MO: TYPE_MO,
  ACTION_TYPE_LAYER_TG: TYPE_TG,
  ACTION_TYPE_LAYER_TO: TYPE_TO,
  ACTION_TYPE_MEDIA: TYPE_MEDIA,
  ACTION_TYPE_MACRO: TYPE_MACRO,
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
  MEDIA_BRIGHT_UP,
  MEDIA_BRIGHT_DN,
  MEDIA_APP_BROWSER,
  MEDIA_APP_FILES,
  MEDIA_APP_CALC,
  MEDIA_APP_SCRSHOT,
} = MEDIA_CODES;

// ── Helpers ───────────────────────────────────────────────────
const KC = (v: number) => action(TYPE_KC, v);
const MOD = (v: number) => action(TYPE_MOD, v);
const MO = (v: number) => action(TYPE_MO, v);
const TG = (v: number) => action(TYPE_TG, v);
const TO = (v: number) => action(TYPE_TO, v);
const MEDIA = (v: number) => action(TYPE_MEDIA, v);
const MACRO = (v: number) => action(TYPE_MACRO, v);

// Modifiers
const LCTRL = MOD(0x01);
const LSHIFT = MOD(0x02);
const LALT = MOD(0x04);
const LGUI = MOD(0x08);

// Letters / keys
const A = KC(0x04);
const C = KC(0x06);
const D = KC(0x07);
const E = KC(0x08);
const F = KC(0x09);
const N = KC(0x11);
const R = KC(0x15);
const S = KC(0x16);
const T = KC(0x17);
const V = KC(0x19);
const W = KC(0x1a);
const X = KC(0x1b);
const Y = KC(0x1c);
const Z = KC(0x1d);

const ESC = KC(0x29);
const ENTER = KC(0x28);
const TAB = KC(0x2b);
const BKSP = KC(0x2a);
const SPACE = KC(0x2c);
const DEL = KC(0x4c);

// Navigation
const RIGHT = KC(0x4f);
const LEFT = KC(0x50);
const DOWN = KC(0x51);
const UP = KC(0x52);
const HOME = KC(0x4a);
const END = KC(0x4d);
const PGUP = KC(0x4b);
const PGDN = KC(0x4e);

// F-keys
const F1 = KC(0x3a);
const F2 = KC(0x3b);
const F3 = KC(0x3c);
const F4 = KC(0x3d);
const F5 = KC(0x3e);
const F6 = KC(0x3f);

// Media
const VOL_UP = MEDIA(MEDIA_VOL_UP);
const VOL_DN = MEDIA(MEDIA_VOL_DN);
const MUTE = MEDIA(MEDIA_MUTE);
const PLAY = MEDIA(MEDIA_PLAY);
const NEXT = MEDIA(MEDIA_NEXT);
const PREV = MEDIA(MEDIA_PREV);
const STOP = MEDIA(MEDIA_STOP);
const SCRL_UP = MEDIA(MEDIA_SCRL_UP);
const SCRL_DN = MEDIA(MEDIA_SCRL_DN);
const ZOOM_IN = MEDIA(MEDIA_ZOOM_IN);
const ZOOM_OUT = MEDIA(MEDIA_ZOOM_OUT);
const BRT_UP = MEDIA(MEDIA_BRIGHT_UP);
const BRT_DN = MEDIA(MEDIA_BRIGHT_DN);
const BROWSER = MEDIA(MEDIA_APP_BROWSER);
const FILES = MEDIA(MEDIA_APP_FILES);
const CALC = MEDIA(MEDIA_APP_CALC);
const SCRSHOT = MEDIA(MEDIA_APP_SCRSHOT);

// ── Key index order ───────────────────────────────────────────
// keys[0..9] = [SW1, SW8, SW2, SW7, SW9, SW3, SW6, SW10, SW4, SW5]
//
// Physical layout:
//   [ SW8 ] [ SW1 ---- 2u ---- ]
//   [ SW9 ] [ SW7 ]   [ SW2 ]
//   [ SW10 -2u- ] [ SW6 ] [ SW3 ]
//   [       ]     [ SW5 ] [ SW4 ]

export const MOCK_CONFIG: FullConfig = {
  version: 2,
  active_profile: 0,
  profile_count: 4,

  profiles: [
    // ══════════════════════════════════════════════════════════
    //  PROFILE 1 — "Productivity"
    //  Base + Fn (hold SW1, MO) + Nav (toggle, TG)
    // ══════════════════════════════════════════════════════════
    {
      name: 'Productivity',
      layer_count: 3,
      layers: [
        {
          name: 'Base',
          keys: [MO(1), C, V, X, Z, LCTRL, LSHIFT, TG(2), LGUI, SPACE],
          encoder: { cw: VOL_UP, ccw: VOL_DN, press: MUTE },
          encoder_cw: VOL_UP,
          encoder_ccw: VOL_DN,
        },
        {
          name: 'Fn',
          keys: [0, F1, F2, F3, F4, F5, F6, SCRSHOT, FILES, BROWSER],
          encoder: { cw: BRT_UP, ccw: BRT_DN, press: 0 },
          encoder_cw: BRT_UP,
          encoder_ccw: BRT_DN,
        },
        {
          name: 'Nav',
          keys: [TO(0), UP, PGUP, HOME, END, LEFT, DOWN, RIGHT, PGDN, ENTER],
          encoder: { cw: SCRL_DN, ccw: SCRL_UP, press: ENTER },
          encoder_cw: SCRL_DN,
          encoder_ccw: SCRL_UP,
        },
      ],
      // SW4 + SW5 → macro "Salut"
      combo_count: 1,
      combos: [{ keys: [8, 9], action: MACRO(0), window_ms: 50 }],
    },

    // ══════════════════════════════════════════════════════════
    //  PROFILE 2 — "Creative"
    //  Base (design-app shortcuts) + Tools (hold SW1, MO)
    // ══════════════════════════════════════════════════════════
    {
      name: 'Creative',
      layer_count: 2,
      layers: [
        {
          name: 'Base',
          keys: [MO(1), Z, Y, C, V, LCTRL, LSHIFT, LALT, S, SPACE],
          encoder: { cw: ZOOM_IN, ccw: ZOOM_OUT, press: 0 },
          encoder_cw: ZOOM_IN,
          encoder_ccw: ZOOM_OUT,
        },
        {
          name: 'Tools',
          keys: [0, W, E, R, T, F, D, N, A, DEL],
          encoder: { cw: SCRL_UP, ccw: SCRL_DN, press: 0 },
          encoder_cw: SCRL_UP,
          encoder_ccw: SCRL_DN,
        },
      ],
      // SW4 + SW5 → screenshot
      combo_count: 1,
      combos: [{ keys: [8, 9], action: SCRSHOT, window_ms: 50 }],
    },

    // ══════════════════════════════════════════════════════════
    //  PROFILE 3 — "Media"
    //  Base (transport) + Stream (toggle, TG)
    // ══════════════════════════════════════════════════════════
    {
      name: 'Media',
      layer_count: 2,
      layers: [
        {
          name: 'Base',
          keys: [PLAY, PREV, NEXT, STOP, MUTE, VOL_DN, VOL_UP, TG(1), SCRL_DN, SCRL_UP],
          encoder: { cw: VOL_UP, ccw: VOL_DN, press: PLAY },
          encoder_cw: VOL_UP,
          encoder_ccw: VOL_DN,
        },
        {
          name: 'Stream',
          keys: [TO(0), MUTE, MACRO(0), MACRO(1), BROWSER, CALC, BRT_DN, BRT_UP, SCRSHOT, PLAY],
          encoder: { cw: SCRL_UP, ccw: SCRL_DN, press: MUTE },
          encoder_cw: SCRL_UP,
          encoder_ccw: SCRL_DN,
        },
      ],
      // SW4 + SW5 → mute
      combo_count: 1,
      combos: [{ keys: [8, 9], action: MUTE, window_ms: 50 }],
    },

    // ══════════════════════════════════════════════════════════
    //  PROFILE 4 — "Gaming"
    //  WASD + Menu (toggle, TG)
    // ══════════════════════════════════════════════════════════
    {
      name: 'Gaming',
      layer_count: 2,
      layers: [
        {
          name: 'WASD',
          keys: [TG(1), KC(0x1a), KC(0x04), KC(0x16), KC(0x07), TAB, SPACE, LSHIFT, LCTRL, LALT],
          encoder: { cw: VOL_UP, ccw: VOL_DN, press: MUTE },
          encoder_cw: VOL_UP,
          encoder_ccw: VOL_DN,
        },
        {
          name: 'Menu',
          keys: [TG(1), ESC, F1, F2, F3, F4, F5, F6, ENTER, 0],
          encoder: { cw: SCRL_UP, ccw: SCRL_DN, press: ENTER },
          encoder_cw: SCRL_UP,
          encoder_ccw: SCRL_DN,
        },
      ],
      // SW4 + SW5 → Enter
      combo_count: 1,
      combos: [{ keys: [8, 9], action: ENTER, window_ms: 50 }],
    },
  ],

  // ── Macros globales (partagées par tous les profils) ──────────
  // 16 slots fixes ; les premiers sont remplis pour la démo.
  macros: [
    {
      name: 'Salut',
      steps: [
        { type: 0, keycode: 0x0b },
        { type: 1, keycode: 0x0b }, // H
        { type: 0, keycode: 0x04 },
        { type: 1, keycode: 0x04 }, // A
        { type: 0, keycode: 0x0f },
        { type: 1, keycode: 0x0f }, // L
        { type: 0, keycode: 0x18 },
        { type: 1, keycode: 0x18 }, // U
        { type: 0, keycode: 0x17 },
        { type: 1, keycode: 0x17 }, // T
      ],
    },
    {
      name: 'Entrée x2',
      steps: [
        { type: 0, keycode: 0x28 },
        { type: 1, keycode: 0x28 },
        { type: 2, delay: 100 },
        { type: 0, keycode: 0x28 },
        { type: 1, keycode: 0x28 },
      ],
    },
    ...Array.from({ length: 14 }, () => ({ name: '', steps: [] as unknown[] })),
  ],

  macro_count: 2,

  ble: {
    device_name: 'SpinPad',
    slot_names: ['PC', 'HomeAssistant'],
    active_slot: 0,
  },

  display: {
    brightness: 180,
    timeout_s: 30,
    widgets: [
      { type: 4, x: 0, y: 0, w: 2, h: 1 }, // Batterie (haut-gauche)
      { type: 6, x: 2, y: 0, w: 2, h: 1 }, // Horloge (haut-droite, 2×1)
      { type: 3, x: 0, y: 1, w: 4, h: 3 }, // Profil (4×3, à partir de la 2ᵉ rangée)
    ],
  },

  power: {
    sleep_timeout_s: 300,
    battery_critical_pct: 10,
    battery_present: 'auto',
    debounce_press_scans: 3,
    debounce_release_scans: 5,
  },

  orientation: 0,

  encoder: {
    sensitivity: 1,
  },

  led_extension: {
    enabled: true,
    count: 12,
    mode: 3, // STATIC
    r: 60,
    g: 60,
    b: 80,
    brightness: 128,
    max_power_mw: 500,
  },
} as unknown as FullConfig;
