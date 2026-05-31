// AUTO-GENERATED — do not edit manually
// Source: packages/shared/src/constants/config-schema.ts
// Run:   pnpm codegen
//
// Limites structurelles de la config, source de vérité unique côté TS.
#pragma once

#define CONFIG_MAX_PROFILES   4
#define CONFIG_MAX_LAYERS     8
#define CONFIG_NAME_MAX_LEN   32
#define CONFIG_NUM_KEYS       10  // Doit correspondre à KB_NUM_KEYS dans kb_config.h
#define CONFIG_FORMAT_VERSION 2

// Macros globales (partagées par tous les profils)
#define MACRO_COUNT           16
#define MACRO_MAX_STEPS       32
#define MACRO_NAME_MAX_LEN    17

// Icône de profil : bitmap 24×24 monochrome 1bpp
#define PROFILE_ICON_W        24
#define PROFILE_ICON_H        24
#define PROFILE_ICON_BYTES    72

