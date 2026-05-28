// ═══════════════════════════════════════════════════════════════
//  mock/keyboard-config.ts — Configuration mock complète
// ═══════════════════════════════════════════════════════════════

import { action, ACTION_TYPES, MEDIA_CODES } from '$shared/constants/action-types.js';
import type { FullConfig } from '$shared/constants/config-schema.js';

// ── Action type constants ─────────────────────────────────────
const {
  ACTION_TYPE_KC: TYPE_KC, ACTION_TYPE_MOD: TYPE_MOD,
  ACTION_TYPE_LAYER_MO: TYPE_MO, ACTION_TYPE_LAYER_TG: TYPE_TG,
  ACTION_TYPE_LAYER_TO: TYPE_TO, ACTION_TYPE_MEDIA: TYPE_MEDIA,
} = ACTION_TYPES;
const {
  MEDIA_VOL_UP, MEDIA_VOL_DN, MEDIA_MUTE, MEDIA_PLAY,
  MEDIA_NEXT, MEDIA_PREV, MEDIA_SCRL_UP, MEDIA_SCRL_DN,
  MEDIA_ZOOM_IN, MEDIA_ZOOM_OUT,
} = MEDIA_CODES;

// ── Helpers ───────────────────────────────────────────────────
const KC  = (v: number) => action(TYPE_KC,    v);
const MOD = (v: number) => action(TYPE_MOD,   v);
const MO  = (v: number) => action(TYPE_MO,    v);
const TG  = (v: number) => action(TYPE_TG,    v);
const TO  = (v: number) => action(TYPE_TO,    v);

// Modifiers
const LCTRL  = MOD(0x01);
const LSHIFT = MOD(0x02);
const LALT   = MOD(0x04);

// Keys
const ESC   = KC(0x29);
const ENTER = KC(0x28);
const TAB   = KC(0x2B);
const BKSP  = KC(0x2A);
const SPACE = KC(0x2C);
const DEL   = KC(0x4C);

// F-keys
const F1 = KC(0x3A); const F2 = KC(0x3B); const F3 = KC(0x3C);
const F4 = KC(0x3D); const F5 = KC(0x3E); const F6 = KC(0x3F);

// Media
const VOL_UP  = action(TYPE_MEDIA, MEDIA_VOL_UP);
const VOL_DN  = action(TYPE_MEDIA, MEDIA_VOL_DN);
const MUTE    = action(TYPE_MEDIA, MEDIA_MUTE);
const PLAY    = action(TYPE_MEDIA, MEDIA_PLAY);
const NEXT    = action(TYPE_MEDIA, MEDIA_NEXT);
const PREV    = action(TYPE_MEDIA, MEDIA_PREV);
const SCRL_UP = action(TYPE_MEDIA, MEDIA_SCRL_UP);
const SCRL_DN = action(TYPE_MEDIA, MEDIA_SCRL_DN);
const ZOOM_IN = action(TYPE_MEDIA, MEDIA_ZOOM_IN);
const ZOOM_OUT= action(TYPE_MEDIA, MEDIA_ZOOM_OUT);

// ── Key index order ───────────────────────────────────────────
// keys[0..9] = [SW1, SW8, SW2, SW7, SW9, SW3, SW6, SW10, SW4, SW5]
//
// Physical layout:
//   [ SW8 ] [ SW1 ---- 2u ---- ]
//   [ SW9 ] [ SW7 ]   [ SW2 ]
//   [ SW10 -2u- ] [ SW6 ] [ SW3 ]
//   [       ]     [ SW5 ] [ SW4 ]

export const MOCK_CONFIG: FullConfig = {
  version:        1,
  active_profile: 0,
  profile_count:  2,

  profiles: [

    // ══════════════════════════════════════════════════════════
    //  PROFILE 1 — "Shortcuts"
    //  Demonstrates: MO (hold SW1 for Fn) + TG (toggle SW10 for Media)
    // ══════════════════════════════════════════════════════════
    {
      name:        'Shortcuts',
      layer_count: 3,
      layers: [
        {
          name: 'Base',
          keys: [
            MO(1),  ESC,    BKSP,  TAB,   ENTER,
            LCTRL,  LSHIFT, TG(2), LALT,  SPACE,
          ],
          encoder: { cw: VOL_UP, ccw: VOL_DN, press: MUTE },
          encoder_cw:  VOL_UP,
          encoder_ccw: VOL_DN,
        },
        {
          name: 'Fn',
          keys: [
            0,     DEL,   F2,   F3,   F4,
            F5,    F6,    0,    0,    0,
          ],
          encoder: { cw: ZOOM_IN, ccw: ZOOM_OUT, press: 0 },
          encoder_cw:  ZOOM_IN,
          encoder_ccw: ZOOM_OUT,
        },
        {
          name: 'Media',
          keys: [
            TO(0), PLAY,    NEXT, PREV, MUTE,
            SCRL_UP, SCRL_DN, TO(0), VOL_DN, VOL_UP,
          ],
          encoder: { cw: SCRL_UP, ccw: SCRL_DN, press: PLAY },
          encoder_cw:  SCRL_UP,
          encoder_ccw: SCRL_DN,
        },
      ],
      combo_count: 0,
      combos:      [],
    },

    // ══════════════════════════════════════════════════════════
    //  PROFILE 2 — "Gaming"
    // ══════════════════════════════════════════════════════════
    {
      name:        'Gaming',
      layer_count: 2,
      layers: [
        {
          name: 'WASD',
          keys: [
            TG(1),  KC(0x1D), KC(0x08), KC(0x09), KC(0x16),
            TAB,    SPACE,    LSHIFT,   LCTRL,    LALT,
          ],
          encoder: { cw: VOL_UP, ccw: VOL_DN, press: MUTE },
          encoder_cw:  VOL_UP,
          encoder_ccw: VOL_DN,
        },
        {
          name: 'Menu',
          keys: [
            TG(1), ESC, F1,    F2,    F3,
            F4,    F5,  F6,    ENTER, 0,
          ],
          encoder: { cw: SCRL_UP, ccw: SCRL_DN, press: ENTER },
          encoder_cw:  SCRL_UP,
          encoder_ccw: SCRL_DN,
        },
      ],
      combo_count: 0,
      combos:      [],
    },
  ],

  ble: {
    device_name: 'SpinPad',
  },

  display: {
    brightness: 180,
    timeout_s:  30,
  },

  power: {
    sleep_timeout_s:      300,
    battery_critical_pct: 10,
    battery_present:      'auto',
  },

  orientation: 0,

  encoder: {
    sensitivity: 1,
  },

  led_extension: {
    enabled:    false,
    count:      10,
    mode:       0,
    r:          255,
    g:          100,
    b:          0,
    brightness: 200,
  },
} as unknown as FullConfig;
