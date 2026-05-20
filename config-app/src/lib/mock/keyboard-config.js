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
                    keys: [
                        KC(0x04), KC(0x05), KC(0x06), KC(0x07), KC(0x08), // A B C D E
                        KC(0x09), KC(0x0A), KC(0x0B), KC(0x0C), KC(0x0D), // F G H I J
                        KC(0x0E), KC(0x0F), KC(0x10), KC(0x11), KC(0x12), // K L M N O
                        MOD(0x01), KC(0x29), KC(0x28), MO(1), KC(0x2C), // LCtrl Esc Enter MO1 Space
                    ],
                    encoder: { cw: VOL_UP, ccw: VOL_DOWN, press: MUTE },
                },
                {
                    name: 'Fn',
                    keys: [
                        KC(0x3A), KC(0x3B), KC(0x3C), KC(0x3D), KC(0x3E), // F1-F5
                        KC(0x3F), KC(0x40), KC(0x41), KC(0x42), KC(0x43), // F6-F10
                        KC(0x44), KC(0x45), 0, 0, 0,        // F11 F12
                        0, 0, 0, 0, 0,
                    ],
                    encoder: { cw: 0, ccw: 0, press: 0 },
                },
            ],
            combos: [],
        },
        {
            name: 'Gaming',
            layers: [
                {
                    name: 'Base',
                    keys: [
                        KC(0x1A), KC(0x17), KC(0x08), KC(0x15), 0,       // W A E R
                        KC(0x04), KC(0x16), KC(0x07), KC(0x09), 0,       // A S D F
                        KC(0x04), KC(0x05), KC(0x06), KC(0x07), 0,
                        MOD(0x04), KC(0x2C), KC(0x28), 0, 0,       // LAlt Space
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
