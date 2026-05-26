// AUTO-GENERATED — do not edit manually
// Source: packages/shared/src/constants/action-types.ts
// Run:   pnpm codegen
//
// This file is committed to the repo so the firmware can compile
// without requiring Node.js to be installed on the build machine.
#pragma once

// Action type nibbles (bits 15–12 of a uint16_t action)
#define ACTION_TYPE_KC        0x00
#define ACTION_TYPE_MOD       0x01
#define ACTION_TYPE_LAYER_MO  0x02
#define ACTION_TYPE_LAYER_TG  0x03
#define ACTION_TYPE_LAYER_TO  0x04
#define ACTION_TYPE_MEDIA     0x05
#define ACTION_TYPE_SPECIAL   0x0F

// Media subcodes  (bits 11–0 when ACTION_TYPE_MEDIA)
#define MEDIA_VOL_UP      0x01
#define MEDIA_VOL_DN      0x02
#define MEDIA_MUTE        0x03
#define MEDIA_PLAY        0x04
#define MEDIA_NEXT        0x05
#define MEDIA_PREV        0x06
#define MEDIA_SCRL_UP     0x10
#define MEDIA_SCRL_DN     0x11
#define MEDIA_ZOOM_IN     0x20
#define MEDIA_ZOOM_OUT    0x21
#define MEDIA_SCRL_LEFT   0x12
#define MEDIA_SCRL_RIGHT  0x13

// Special subcodes (bits 11–0 when ACTION_TYPE_SPECIAL)
#define SPECIAL_BLE_SWITCH     0x01
#define SPECIAL_ORIENT_CW      0x02
#define SPECIAL_ORIENT_CCW     0x03
#define SPECIAL_LED_BRIGHT_UP  0x04
#define SPECIAL_LED_BRIGHT_DN  0x05
#define SPECIAL_STUDIO_MODE    0x06

// Helper macro: encode (type, value) → uint16_t action
#define ACTION(type, val)  (((uint16_t)(type) << 12) | ((uint16_t)(val) & 0x0FFF))

