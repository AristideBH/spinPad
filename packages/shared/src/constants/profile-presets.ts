// ═══════════════════════════════════════════════════════════════
//  profile-presets.ts — Ready-to-use profile templates
//
//  A new profile is created from a preset OR from scratch (blank).
//  Architecture designed to be extensible: today a single built-in
//  source (builtin), tomorrow a remote store / community repo.
// ═══════════════════════════════════════════════════════════════

import {
  CONFIG_NUM_KEYS,
  defaultLayer,
  type ProfileConfig,
} from './config-schema.js';
import { ACTION_TYPES, MEDIA_CODES, action } from './action-types.js';
import { libraryIcon } from './profile-icon-library.js';

const { ACTION_TYPE_MEDIA } = ACTION_TYPES;
const { MEDIA_VOL_UP, MEDIA_VOL_DN, MEDIA_MUTE, MEDIA_SCRL_UP, MEDIA_SCRL_DN } = MEDIA_CODES;

export interface ProfilePreset {
  id:           string;
  label:        string;
  description?: string;
  author?:      string;
  source:       'builtin' | 'remote';
  icon?:        string;          // base64 (preview / icon applied to the profile)
  profile:      ProfileConfig;   // complete template
}

/** Preset source — allows aggregating builtin + future remote sources. */
export interface ProfilePresetSource {
  id:    string;
  label: string;
  list(): Promise<ProfilePreset[]>;
}

// ── Construction helpers ────────────────────────────────────────

function emptyKeys(): number[] {
  return new Array(CONFIG_NUM_KEYS).fill(0);
}

function layer(name: string, encoder?: { cw: number; ccw: number; press?: number }): ReturnType<typeof defaultLayer> {
  const l = defaultLayer(name);
  l.keys = emptyKeys();
  if (encoder) {
    l.encoder_cw = encoder.cw;
    l.encoder_ccw = encoder.ccw;
    l.encoder = encoder;
  }
  return l;
}

// ── Built-in presets ────────────────────────────────────────────

const VOL_ENC = { cw: action(ACTION_TYPE_MEDIA, MEDIA_VOL_UP), ccw: action(ACTION_TYPE_MEDIA, MEDIA_VOL_DN), press: action(ACTION_TYPE_MEDIA, MEDIA_MUTE) };
const SCRL_ENC = { cw: action(ACTION_TYPE_MEDIA, MEDIA_SCRL_UP), ccw: action(ACTION_TYPE_MEDIA, MEDIA_SCRL_DN) };

export const BUILTIN_PROFILE_PRESETS: ProfilePreset[] = [
  {
    id: 'blank',
    label: 'Blank',
    description: 'Start from scratch: a single layer, no keys assigned.',
    source: 'builtin',
    icon: libraryIcon('home'),
    profile: {
      name: 'Profile',
      icon: libraryIcon('home'),
      layers: [layer('Base')],
    },
  },
  {
    id: 'base',
    label: 'Base + Fn',
    description: 'Two layers (Base / Fn), encoder volume then scroll.',
    source: 'builtin',
    icon: libraryIcon('home'),
    profile: {
      name: 'Base',
      icon: libraryIcon('home'),
      layers: [layer('Base', VOL_ENC), layer('Fn', SCRL_ENC)],
    },
  },
  {
    id: 'media',
    label: 'Media',
    description: 'Single layer focused on media control, volume encoder.',
    source: 'builtin',
    icon: libraryIcon('music'),
    profile: {
      name: 'Media',
      icon: libraryIcon('music'),
      layers: [layer('Media', VOL_ENC)],
    },
  },
  {
    id: 'gaming',
    label: 'Gaming',
    description: 'Gaming layer, volume encoder.',
    source: 'builtin',
    icon: libraryIcon('controller'),
    profile: {
      name: 'Gaming',
      icon: libraryIcon('controller'),
      layers: [layer('Game', VOL_ENC)],
    },
  },
];

// ── Sources ─────────────────────────────────────────────────────

export const builtinPresetSource: ProfilePresetSource = {
  id: 'builtin',
  label: 'Built-in',
  list: () => Promise.resolve(BUILTIN_PROFILE_PRESETS),
};

/**
 * STUB — remote source (future store / community repo).
 * Not wired up: the interface is in place to hook a fetch in later.
 */
export function remotePresetSource(url: string): ProfilePresetSource {
  return {
    id: `remote:${url}`,
    label: 'Community',
    list: async () => {
      // TODO: fetch and validate remote presets (validateConfig on each profile).
      return [];
    },
  };
}

// Registry of active sources (builtin only for now).
const sources: ProfilePresetSource[] = [builtinPresetSource];

export function registerPresetSource(source: ProfilePresetSource): void {
  if (!sources.some((s) => s.id === source.id)) sources.push(source);
}

/** Aggregates the presets from all registered sources. */
export async function listProfilePresets(): Promise<ProfilePreset[]> {
  const all = await Promise.all(sources.map((s) => s.list().catch(() => [])));
  return all.flat();
}

export function getPresetById(id: string): ProfilePreset | undefined {
  return BUILTIN_PROFILE_PRESETS.find((p) => p.id === id);
}
