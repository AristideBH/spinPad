import { action } from '$lib/keycodes/index.js';

const TYPE_KC = 0x0;
const TYPE_MOD = 0x1;
const TYPE_MO = 0x2;
const TYPE_MEDIA = 0x5;

const KC = (v) => action(TYPE_KC, v);
const MOD = (v) => action(TYPE_MOD, v);
const MO = (v) => action(TYPE_MO, v);
const VOL_UP = action(TYPE_MEDIA, 0x01);
const VOL_DOWN = action(TYPE_MEDIA, 0x02);
const MUTE = action(TYPE_MEDIA, 0x03);

export const MOCK_CONFIG = {
    version: 1,
    active_profile: 0,
    profile_count: 1,

    profiles: [
        {
            name: 'Main',
            layers: [
                {
                    name: 'Base',
                    // 10 keys: SW1 SW8 SW2 SW7 SW9 SW3 SW6 SW10 SW4 SW5
                    keys: [
                        KC(0x04), KC(0x05), KC(0x06), KC(0x07), KC(0x08), // SW1 SW8 SW2 SW7 SW9
                        KC(0x09), KC(0x0A), KC(0x0B), KC(0x0C), KC(0x0D), // SW3 SW6 SW10 SW4 SW5
                    ],
                    encoder: { cw: VOL_UP, ccw: VOL_DOWN, press: MUTE },
                },
                {
                    name: 'Fn',
                    keys: [
                        KC(0x3A), KC(0x3B), KC(0x3C), KC(0x3D), KC(0x3E), // F1-F5
                        KC(0x3F), KC(0x40), KC(0x41), KC(0x42), KC(0x43), // F6-F10
                    ],
                    encoder: { cw: 0, ccw: 0, press: 0 },
                },
            ],
            combos: [],
        },
        {
            name: 'Media',
            layers: [
                {
                    name: 'Base',
                    keys: [
                        MO(1), VOL_UP, KC(0x29), KC(0x2C), KC(0x28), // SW1 SW8 SW2 SW7 SW9
                        MUTE,  VOL_DOWN, 0,       0,        0,        // SW3 SW6 SW10 SW4 SW5
                    ],
                    encoder: { cw: VOL_UP, ccw: VOL_DOWN, press: MUTE },
                },
            ],
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
