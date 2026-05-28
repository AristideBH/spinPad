// ═══════════════════════════════════════════════════════════════
//  profile-presets.ts — Gabarits de profils prêts à l'emploi
//
//  Un nouveau profil se crée à partir d'un preset OU de zéro (blank).
//  Architecture pensée extensible : aujourd'hui une seule source
//  intégrée (builtin), demain un store / repo communautaire distant.
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
  icon?:        string;          // base64 (aperçu / icône appliquée au profil)
  profile:      ProfileConfig;   // gabarit complet
}

/** Source de presets — permet d'agréger builtin + futures sources distantes. */
export interface ProfilePresetSource {
  id:    string;
  label: string;
  list(): Promise<ProfilePreset[]>;
}

// ── Helpers de construction ─────────────────────────────────────

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

// ── Presets intégrés ────────────────────────────────────────────

const VOL_ENC = { cw: action(ACTION_TYPE_MEDIA, MEDIA_VOL_UP), ccw: action(ACTION_TYPE_MEDIA, MEDIA_VOL_DN), press: action(ACTION_TYPE_MEDIA, MEDIA_MUTE) };
const SCRL_ENC = { cw: action(ACTION_TYPE_MEDIA, MEDIA_SCRL_UP), ccw: action(ACTION_TYPE_MEDIA, MEDIA_SCRL_DN) };

export const BUILTIN_PROFILE_PRESETS: ProfilePreset[] = [
  {
    id: 'blank',
    label: 'Vierge',
    description: 'Partir de zéro : un seul layer, aucune touche assignée.',
    source: 'builtin',
    icon: libraryIcon('home'),
    profile: {
      name: 'Profil',
      icon: libraryIcon('home'),
      layers: [layer('Base')],
    },
  },
  {
    id: 'base',
    label: 'Base + Fn',
    description: 'Deux layers (Base / Fn), encodeur volume puis défilement.',
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
    label: 'Média',
    description: 'Layer unique orienté contrôle média, encodeur volume.',
    source: 'builtin',
    icon: libraryIcon('music'),
    profile: {
      name: 'Média',
      icon: libraryIcon('music'),
      layers: [layer('Média', VOL_ENC)],
    },
  },
  {
    id: 'gaming',
    label: 'Gaming',
    description: 'Layer de jeu, encodeur volume.',
    source: 'builtin',
    icon: libraryIcon('controller'),
    profile: {
      name: 'Gaming',
      icon: libraryIcon('controller'),
      layers: [layer('Jeu', VOL_ENC)],
    },
  },
];

// ── Sources ─────────────────────────────────────────────────────

export const builtinPresetSource: ProfilePresetSource = {
  id: 'builtin',
  label: 'Intégrés',
  list: () => Promise.resolve(BUILTIN_PROFILE_PRESETS),
};

/**
 * STUB — source distante (futur store / repo communautaire).
 * Non câblée : l'interface est posée pour brancher un fetch plus tard.
 */
export function remotePresetSource(url: string): ProfilePresetSource {
  return {
    id: `remote:${url}`,
    label: 'Communauté',
    list: async () => {
      // TODO: récupérer et valider des presets distants (validateConfig sur chaque profile).
      return [];
    },
  };
}

// Registre des sources actives (builtin seule pour l'instant).
const sources: ProfilePresetSource[] = [builtinPresetSource];

export function registerPresetSource(source: ProfilePresetSource): void {
  if (!sources.some((s) => s.id === source.id)) sources.push(source);
}

/** Agrège les presets de toutes les sources enregistrées. */
export async function listProfilePresets(): Promise<ProfilePreset[]> {
  const all = await Promise.all(sources.map((s) => s.list().catch(() => [])));
  return all.flat();
}

export function getPresetById(id: string): ProfilePreset | undefined {
  return BUILTIN_PROFILE_PRESETS.find((p) => p.id === id);
}
