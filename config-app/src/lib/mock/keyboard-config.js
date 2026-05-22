import { action } from '$lib/keycodes/index.js';

// ── Action type constants ─────────────────────────────────────
const TYPE_KC     = 0x0;
const TYPE_MOD    = 0x1;
const TYPE_MO     = 0x2;  // Momentary: layer active while held
const TYPE_TG     = 0x3;  // Toggle: press once to activate, again to deactivate
const TYPE_TO     = 0x4;  // Jump: resets stack and goes to layer n
const TYPE_MEDIA  = 0x5;

// ── Helpers ───────────────────────────────────────────────────
const KC  = (v) => action(TYPE_KC,    v);
const MOD = (v) => action(TYPE_MOD,   v);
const MO  = (v) => action(TYPE_MO,    v);
const TG  = (v) => action(TYPE_TG,    v);
const TO  = (v) => action(TYPE_TO,    v);

// Modifiers
const LCTRL  = MOD(0x01);
const LSHIFT = MOD(0x02);
const LALT   = MOD(0x04);

// Keys
const ESC    = KC(0x29);
const ENTER  = KC(0x28);
const TAB    = KC(0x2B);
const BKSP   = KC(0x2A);
const SPACE  = KC(0x2C);
const DEL    = KC(0x4C);

// F-keys
const F1 = KC(0x3A); const F2 = KC(0x3B); const F3 = KC(0x3C);
const F4 = KC(0x3D); const F5 = KC(0x3E); const F6 = KC(0x3F);

// Media
const VOL_UP  = action(TYPE_MEDIA, 0x01);
const VOL_DN  = action(TYPE_MEDIA, 0x02);
const MUTE    = action(TYPE_MEDIA, 0x03);
const PLAY    = action(TYPE_MEDIA, 0x04);
const NEXT    = action(TYPE_MEDIA, 0x05);
const PREV    = action(TYPE_MEDIA, 0x06);
const SCRL_UP = action(TYPE_MEDIA, 0x10);
const SCRL_DN = action(TYPE_MEDIA, 0x11);
const ZOOM_IN = action(TYPE_MEDIA, 0x20);
const ZOOM_OUT= action(TYPE_MEDIA, 0x21);

// ── Key index order ───────────────────────────────────────────
// keys[0..9] = [SW1, SW8, SW2, SW7, SW9, SW3, SW6, SW10, SW4, SW5]
//
// Physical layout:
//   [ SW8 ] [ SW1 ---- 2u ---- ]
//   [ SW9 ] [ SW7 ]   [ SW2 ]
//   [ SW10 -2u- ] [ SW6 ] [ SW3 ]
//   [       ]     [ SW5 ] [ SW4 ]

export const MOCK_CONFIG = {
    version: 1,
    active_profile: 0,
    profile_count: 2,

    profiles: [

        // ══════════════════════════════════════════════════════
        //  PROFILE 1 — "Shortcuts"
        //  Demonstrates: MO (hold SW1 for Fn) + TG (toggle SW10 for Media)
        //
        //  Layer 0  Base    → everyday shortcuts + modifiers
        //  Layer 1  Fn      → F-keys, accessible while SW1 is held
        //  Layer 2  Media   → playback/volume, toggled by SW10
        // ══════════════════════════════════════════════════════
        {
            name: 'Shortcuts',
            layer_count: 3,
            layers: [
                {
                    name: 'Base',
                    //        SW1     SW8   SW2   SW7   SW9
                    //        SW3     SW6   SW10  SW4   SW5
                    keys: [
                        MO(1),  ESC,   BKSP, TAB,  ENTER,
                        LCTRL,  LSHIFT,TG(2),LALT, SPACE,
                    ],
                    encoder: { cw: VOL_UP, ccw: VOL_DN, press: MUTE },
                },
                {
                    // Accessed by holding SW1 (MO)
                    // SW1 itself is transparent (0) — it stays held
                    name: 'Fn',
                    keys: [
                        0,     DEL,   F2,   F3,   F4,
                        F5,    F6,    0,    0,    0,
                    ],
                    encoder: { cw: ZOOM_IN, ccw: ZOOM_OUT, press: 0 },
                },
                {
                    // Accessed by toggling SW10 (TG)
                    // TO(0) on SW1 and SW10 lets the user exit back to Base
                    name: 'Media',
                    keys: [
                        TO(0), PLAY,  NEXT, PREV, MUTE,
                        SCRL_UP, SCRL_DN, TO(0), VOL_DN, VOL_UP,
                    ],
                    encoder: { cw: SCRL_UP, ccw: SCRL_DN, press: PLAY },
                },
            ],
            combo_count: 0,
            combos: [],
        },

        // ══════════════════════════════════════════════════════
        //  PROFILE 2 — "Gaming"
        //  Demonstrates: TG to switch between two full layers
        //
        //  Layer 0  WASD    → in-game actions
        //  Layer 1  Menu    → overlay / settings keys, toggle on/off
        // ══════════════════════════════════════════════════════
        {
            name: 'Gaming',
            layer_count: 2,
            layers: [
                {
                    name: 'WASD',
                    //        SW1     SW8        SW2        SW7        SW9
                    //        SW3     SW6        SW10       SW4        SW5
                    keys: [
                        TG(1),  KC(0x1D),  KC(0x08),  KC(0x09),  KC(0x16), // TG  Z  E  F  S
                        TAB,    SPACE,     LSHIFT,    LCTRL,     LALT,      // Tab Spc Shift Ctrl Alt
                    ],
                    encoder: { cw: VOL_UP, ccw: VOL_DN, press: MUTE },
                },
                {
                    // TG(1) on SW1 toggles back to WASD layer
                    name: 'Menu',
                    keys: [
                        TG(1), ESC,  F1,   F2,   F3,
                        F4,    F5,   F6,   ENTER,0,
                    ],
                    encoder: { cw: SCRL_UP, ccw: SCRL_DN, press: ENTER },
                },
            ],
            combo_count: 0,
            combos: [],
        },
    ],

    ble: {
        device_name: 'SpinPad',
        active_slot: 0,
        slot_names: ['PC Principal', 'MacBook'],
    },

    display: {
        brightness: 180,
        timeout_s: 30,
        show_battery: true,
        show_layer: true,
        show_profile: true,
        show_ble_status: true,
    },

    power: {
        sleep_timeout_s: 300,
        battery_critical_pct: 10,
    },
};
