// ═══════════════════════════════════════════════════════════════
//  profile-icon-library.ts — 24×24 profile icon library
//
//  The icons are stored directly as base64 (72 bytes → 96 chars),
//  ready to be assigned to profile.icon without computation.
//
//  To update an icon:
//    1. Draw it in the IconEditor
//    2. Copy the base64 shown in the "Dev" panel
//    3. Replace the data: value below
// ═══════════════════════════════════════════════════════════════

import { base64ToGrid, type BoolGrid } from './profile-icon.js';

export interface IconLibraryEntry {
  id: string;
  label: string;
  data: string; // base64 — source of truth
  /** Decoded on demand (lazy via getter) */
  readonly grid: BoolGrid;
}

function entry(id: string, label: string, data: string): IconLibraryEntry {
  let _grid: BoolGrid | undefined;
  return {
    id,
    label,
    data,
    get grid() {
      if (!_grid) _grid = base64ToGrid(data);
      return _grid;
    },
  };
}

// ── Data ────────────────────────────────────────────────────────
// Source of truth: base64. Editable via the Dev panel of the IconEditor.

export const PROFILE_ICON_LIBRARY: IconLibraryEntry[] = [
  entry(
    'home',
    'Home',
    'AAAAAAAAAAAAAPgfAAQQAAIQAAEQgAAQQAAQIAAQEAAQCAAQCAAQEAAfIIAAQIAAgAAfAAEQAAIQAAQQAPgfAAAAAAAAAAAA',
  ),
  entry(
    'controller',
    'Controller',
    'AAAAAAAAAAAAgP8HwAAMQAAIQAAMwGYGgGYCgAACgAACgAACgAACgAgCgAgCgDYCwAgGQAgMQAAIwAAMgP8HAAAAAAAAAAAA',
  ),
  entry(
    'pc',
    'Computer',
    'AAAAAAAAAAAA8P8AEIAAEIAAEIAAEIAIEIAIEIAIEIAPEIAPEIAPEIAPEIAIEIAIEIAIEIAAEIAAEIAA8P8AAAAAAAAAAAAA',
  ),
  entry(
    'palette',
    'Palette',
    'AAAAAAAAAP4AgIMDwAAGYCAMMHAYECEQmAMwCAEgCAAgCAAgiAAgyAEgmAAwEAgYMBwOYAgBwAABgAMBAP4AAAAAAAAAAAAA',
  ),
  entry(
    'settings',
    'Settings',
    'AAAAAAAAADwAACQAYGIGsIENEAAIIAAEIDwEMGYYDMMgDIEgDIEgDMMgMGYYIDwEIAAEEAAIsIENYGIGACQAADwAAAAAAAAA',
  ),
  entry(
    'music',
    'Music',
    'AAAAAAAAAAAAAAAAAAAOAAAfAAAfAAAfAAAP4P8HYAAAYAAAcAAAMAAAMMADOOAHGOAHGOAHHOAD/P8BAAAAAAAAAAAAAAAA',
  ),
  entry(
    'terminal',
    'Terminal',
    'AAAAAAAAAAAA4P8PIAEIIAEIIIkIINkIIHEIICEIIAEIIAEJIAEJIAEJIAEJIAEJIAEJIAEIIAEIIAEI4P8PAAAAAAAAAAAA',
  ),
  entry(
    'lightbulb',
    'Light bulb',
    'AAAAAAAAAAAAAAAAAAAAgA8A4HAAIIAAEAABGAAeCAAyCAAyCAAyyAAymAEeEAEBIIAA4HAAgA8AAAAAAAAAAAAAAAAAAAAA',
  ),
];

export function iconLibraryEntry(id: string): IconLibraryEntry | undefined {
  return PROFILE_ICON_LIBRARY.find((e) => e.id === id);
}

/** base64 of a library preset (empty string if not found). */
export function libraryIcon(id: string): string {
  return iconLibraryEntry(id)?.data ?? '';
}
