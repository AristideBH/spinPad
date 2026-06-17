// AUTO-GENERATED — do not edit manually
// Source: packages/shared/src/constants/config-schema.ts
// Run:   pnpm codegen
//
// Structural config limits, single source of truth on the TS side.
#pragma once

#define CONFIG_MAX_PROFILES   4
#define CONFIG_MAX_LAYERS     6
#define CONFIG_NAME_MAX_LEN   32
#define CONFIG_NUM_KEYS       10  // Must match KB_NUM_KEYS in kb_config.h
#define CONFIG_FORMAT_VERSION 4

// Global macros (shared by all profiles)
#define MACRO_COUNT           16
#define MACRO_MAX_STEPS       32
#define MACRO_NAME_MAX_LEN    17

// Profile icon: 24×24 monochrome 1bpp bitmap
#define PROFILE_ICON_W        24
#define PROFILE_ICON_H        24
#define PROFILE_ICON_BYTES    72

