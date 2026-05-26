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
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const OUT = resolve(
  __dirname,
  '../../firmware/components/keymap/include/action_types.gen.h'
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
