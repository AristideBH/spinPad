#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
//  codegen.mjs — Génère action_types.gen.h depuis action-types.js
//
//  Utilisation :
//    pnpm codegen              (depuis la racine du monorepo)
//    pnpm --filter @spinpad/shared codegen
//    node packages/shared/scripts/codegen.mjs
//
//  Sortie : packages/firmware/components/keymap/include/action_types.gen.h
// ═══════════════════════════════════════════════════════════════

import { ACTION_TYPES, MEDIA_CODES, SPECIAL_CODES } from '../src/constants/action-types.ts';
import {
  CONFIG_NUM_KEYS,
  CONFIG_MAX_PROFILES,
  CONFIG_MAX_LAYERS,
  CONFIG_NAME_MAX_LEN,
  CONFIG_FORMAT_VERSION,
  PROFILE_ICON_W,
  PROFILE_ICON_H,
  PROFILE_ICON_BYTES,
  MACRO_COUNT,
  MACRO_MAX_STEPS,
  MACRO_NAME_MAX_LEN,
  WIDGET_TYPE,
} from '../src/constants/config-schema.ts';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const OUT = resolve(
  __dirname,
  '../../firmware/components/keymap/include/action_types.gen.h'
);

const OUT_LIMITS = resolve(
  __dirname,
  '../../firmware/components/config_store/include/config_limits.gen.h'
);

const OUT_WIDGETS = resolve(
  __dirname,
  '../../firmware/components/config_store/include/widget_types.gen.h'
);

function toHex(n) {
  return '0x' + n.toString(16).toUpperCase().padStart(2, '0');
}

function defineBlock(comment, entries, prefix = '') {
  const maxLen = Math.max(...Object.keys(entries).map(k => k.length));
  return [
    `// ${comment}`,
    ...Object.entries(entries).map(
      ([k, v]) => `#define ${k.padEnd(maxLen + 1)} ${toHex(v)}`
    ),
  ].join('\n');
}

const lines = [
  '// AUTO-GENERATED — do not edit manually',
  '// Source: packages/shared/src/constants/action-types.ts',
  '// Run:   pnpm codegen',
  '//',
  '// This file is committed to the repo so the firmware can compile',
  '// without requiring Node.js to be installed on the build machine.',
  '#pragma once',
  '',
  defineBlock('Action type nibbles (bits 15–12 of a uint16_t action)', ACTION_TYPES),
  '',
  defineBlock('Media subcodes  (bits 11–0 when ACTION_TYPE_MEDIA)',  MEDIA_CODES),
  '',
  defineBlock('Special subcodes (bits 11–0 when ACTION_TYPE_SPECIAL)', SPECIAL_CODES),
  '',
  '// Helper macro: encode (type, value) → uint16_t action',
  '#define ACTION(type, val)  (((uint16_t)(type) << 12) | ((uint16_t)(val) & 0x0FFF))',
  '',
];

writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');
console.log(`✅  Generated: ${OUT}`);

// ── config_limits.gen.h ─────────────────────────────────────────
// Constantes structurelles partagées entre le schéma TS (source de vérité)
// et les structs firmware (config_store.h).
const limitsLines = [
  '// AUTO-GENERATED — do not edit manually',
  '// Source: packages/shared/src/constants/config-schema.ts',
  '// Run:   pnpm codegen',
  '//',
  '// Limites structurelles de la config, source de vérité unique côté TS.',
  '#pragma once',
  '',
  `#define CONFIG_MAX_PROFILES   ${CONFIG_MAX_PROFILES}`,
  `#define CONFIG_MAX_LAYERS     ${CONFIG_MAX_LAYERS}`,
  `#define CONFIG_NAME_MAX_LEN   ${CONFIG_NAME_MAX_LEN}`,
  `#define CONFIG_NUM_KEYS       ${CONFIG_NUM_KEYS}  // Doit correspondre à KB_NUM_KEYS dans kb_config.h`,
  `#define CONFIG_FORMAT_VERSION ${CONFIG_FORMAT_VERSION}`,
  '',
  '// Macros globales (partagées par tous les profils)',
  `#define MACRO_COUNT           ${MACRO_COUNT}`,
  `#define MACRO_MAX_STEPS       ${MACRO_MAX_STEPS}`,
  `#define MACRO_NAME_MAX_LEN    ${MACRO_NAME_MAX_LEN}`,
  '',
  '// Icône de profil : bitmap 24×24 monochrome 1bpp',
  `#define PROFILE_ICON_W        ${PROFILE_ICON_W}`,
  `#define PROFILE_ICON_H        ${PROFILE_ICON_H}`,
  `#define PROFILE_ICON_BYTES    ${PROFILE_ICON_BYTES}`,
  '',
];

writeFileSync(OUT_LIMITS, limitsLines.join('\n') + '\n', 'utf8');
console.log(`✅  Generated: ${OUT_LIMITS}`);

// ── widget_types.gen.h ──────────────────────────────────────────
// Enum des types de widgets OLED, miroir de WIDGET_TYPE (config-schema.ts).
// Nom C = WIDGET_<CLE>. Inclus par config_store.h.
const widgetMaxLen = Math.max(...Object.keys(WIDGET_TYPE).map((k) => k.length));
const widgetLines = [
  '// AUTO-GENERATED — do not edit manually',
  '// Source: packages/shared/src/constants/config-schema.ts (WIDGET_TYPE)',
  '// Run:   pnpm codegen',
  '#pragma once',
  '',
  'typedef enum {',
  ...Object.entries(WIDGET_TYPE).map(
    ([k, v]) => `    WIDGET_${k.padEnd(widgetMaxLen)} = ${v},`
  ),
  '} kb_widget_type_t;',
  '',
];

writeFileSync(OUT_WIDGETS, widgetLines.join('\n') + '\n', 'utf8');
console.log(`✅  Generated: ${OUT_WIDGETS}`);
