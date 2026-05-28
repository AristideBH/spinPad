// ═══════════════════════════════════════════════════════════════
//  profile-icon-library.ts — Bibliothèque d'icônes de profil 24×24
//
//  Les icônes sont stockées directement en base64 (72 o → 96 chars),
//  prêtes à être affectées à profile.icon sans calcul.
//
//  Pour mettre à jour une icône :
//    1. Dessinez-la dans l'IconEditor
//    2. Copiez le base64 affiché dans le panneau « Dev »
//    3. Remplacez la valeur data: ci-dessous
// ═══════════════════════════════════════════════════════════════

import { base64ToGrid, type BoolGrid } from './profile-icon.js';

export interface IconLibraryEntry {
  id:    string;
  label: string;
  data:  string;   // base64 — source de vérité
  /** Décodé à la demande (lazy via getter) */
  readonly grid: BoolGrid;
}

function entry(id: string, label: string, data: string): IconLibraryEntry {
  let _grid: BoolGrid | undefined;
  return {
    id, label, data,
    get grid() {
      if (!_grid) _grid = base64ToGrid(data);
      return _grid;
    },
  };
}

// ── Données ─────────────────────────────────────────────────────
// Source de vérité : base64. Éditable via le panneau Dev de l'IconEditor.

export const PROFILE_ICON_LIBRARY: IconLibraryEntry[] = [
  entry('home',       'Maison',     'AAAAAAAAAAAAAAgAAAQAAPofAAkQgAgQgAgQQAgQIMgfEMgfCMgfEMgfIAgQQAgQgAgQAAkQAPofAAQAAAgAAAAAAAAAAAAA'),
  entry('controller', 'Manette',    'AAAAAAAAAAAAAP8DAAECAAECgBEGgBEGgP0GgBEGgBEGgAEGgAEGgCEGgHEGgKkGgN0HgKkGAHECACECAP8DAAAAAAAAAAAA'),
  entry('pc',         'Ordinateur', 'AAAAAAAAAAAA8P8AEIAAEIAAEIAAEIAIEIAIEIAIEIAPEIAPEIAPEIAPEIAIEIAIEIAIEIAAEIAAEIAA8P8AAAAAAAAAAAAA'),
  entry('palette',    'Palette',    'AAAAAAAAAP4AgIMDwAAGYCAMMHAYkCAQ2AEwiAAgCAAgCAAgCAAgSAAg+AAwUAAQMMQfYM4PwMQHgMMHAP4HAMAHAAAAAAAA'),
  entry('settings',   'Réglages',   'AAAAAAAAABAAABAAABAAIHwIQIMFgAEDwAAGQDgEIHwIIP4IPO44IP4IIHwIQDgEwAAGgAEDQIMFIHwIABAAABAAAAAAAAAA'),
  entry('music',      'Musique',    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAIAPAMAfAMAfAMAfAIAP8P8HEAAAEAAAEAAA8AEAAAAAAAAAAAAA'),
  entry('terminal',   'Terminal',   'AAAAAAAAAAAA4P8PIAEIIAEIIIkIIFEIIFEIICEIIAEIIAEJIAEJIAEJIAEJIAEJIAEJIAEIIAEIIAEI4P8PAAAAAAAAAAAA'),
];

export function iconLibraryEntry(id: string): IconLibraryEntry | undefined {
  return PROFILE_ICON_LIBRARY.find((e) => e.id === id);
}

/** base64 d'un preset de la bibliothèque (chaîne vide si introuvable). */
export function libraryIcon(id: string): string {
  return iconLibraryEntry(id)?.data ?? '';
}
