// ═══════════════════════════════════════════════════════════════
//  config-ops.ts — Mutations CRUD profils & layers (logique pure)
//
//  Module sans runtime Svelte : opère sur un FullConfig cloné et
//  renvoie le nouvel objet + la nouvelle sélection (profil/layer actifs).
//  Testable au vitest, réutilisé par config.svelte.js.
//
//  Invariants maintenus :
//    - 1 ≤ profiles.length ≤ CONFIG_MAX_PROFILES
//    - 1 ≤ layers.length   ≤ CONFIG_MAX_LAYERS (par profil)
//    - cfg.active_profile reste un index valide après delete/move
//    - les noms restent ≤ CONFIG_NAME_MAX_LEN-1 et uniques par scope
// ═══════════════════════════════════════════════════════════════

import {
  CONFIG_MAX_PROFILES,
  CONFIG_MAX_LAYERS,
  CONFIG_NAME_MAX_LEN,
  MIN_PROFILES,
  MIN_LAYERS,
  defaultProfile,
  defaultLayer,
  type FullConfig,
  type ProfileConfig,
} from './config-schema.js';

export interface Selection {
  profile: number;
  layer:   number;
}

export interface OpResult {
  config:    FullConfig;
  selection: Selection;
}

// ── Types publics pour les patches ──────────────────────────────
export type ProfileTemplate = ProfileConfig;

export interface ProfilePatch {
  name?:   string;
  icon?:   string;
  moveTo?: number;
}

export interface LayerPatch {
  name?:   string;
  moveTo?: number;
}

// ── Utilitaires ─────────────────────────────────────────────────

function clone<T>(v: T): T {
  return structuredClone(v);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

function trimName(name: string): string {
  return name.slice(0, CONFIG_NAME_MAX_LEN - 1);
}

/** Rend un nom unique dans `existing` en suffixant " (n)" si nécessaire. */
function uniqueName(base: string, existing: string[]): string {
  const trimmed = trimName(base) || 'Profile';
  if (!existing.includes(trimmed)) return trimmed;
  for (let i = 2; i < 100; i++) {
    const candidate = trimName(`${trimmed} ${i}`);
    if (!existing.includes(candidate)) return candidate;
  }
  return trimmed;
}

/** Nouvel index d'un élément suivi après suppression de `removed`. */
function indexAfterRemove(tracked: number, removed: number): number {
  if (tracked === removed) return -1;        // l'élément suivi a été supprimé
  return tracked > removed ? tracked - 1 : tracked;
}

/** Nouvel index d'un élément suivi après déplacement from→to. */
function indexAfterMove(tracked: number, from: number, to: number): number {
  if (tracked === from) return to;
  if (from < tracked && to >= tracked) return tracked - 1;
  if (from > tracked && to <= tracked) return tracked + 1;
  return tracked;
}

function moveInArray<T>(arr: T[], from: number, to: number): void {
  const [item] = arr.splice(from, 1);
  arr.splice(to, 0, item);
}

// ── Profils ─────────────────────────────────────────────────────

/**
 * Ajoute un profil à partir d'un gabarit (preset) ou d'un profil vierge.
 * Sélectionne le nouveau profil. No-op si déjà au max.
 */
export function addProfile(
  config: FullConfig,
  selection: Selection,
  template?: ProfileConfig,
): OpResult {
  const cfg = clone(config);
  if (cfg.profiles.length >= CONFIG_MAX_PROFILES) {
    return { config: cfg, selection };
  }
  const tpl = template ? clone(template) : defaultProfile();
  const names = cfg.profiles.map((p) => p.name);
  tpl.name = uniqueName(tpl.name || `Profile ${cfg.profiles.length + 1}`, names);
  cfg.profiles.push(tpl);

  const newIdx = cfg.profiles.length - 1;
  return { config: cfg, selection: { profile: newIdx, layer: 0 } };
}

/** Supprime un profil (garde au moins MIN_PROFILES). */
export function deleteProfile(
  config: FullConfig,
  selection: Selection,
  idx: number,
): OpResult {
  const cfg = clone(config);
  if (cfg.profiles.length <= MIN_PROFILES || idx < 0 || idx >= cfg.profiles.length) {
    return { config: cfg, selection };
  }
  cfg.profiles.splice(idx, 1);

  cfg.active_profile = remapTracked(cfg.active_profile, idx, cfg.profiles.length);
  const profile = remapTracked(selection.profile, idx, cfg.profiles.length);
  const layer = clamp(selection.layer, 0, cfg.profiles[profile].layers.length - 1);
  return { config: cfg, selection: { profile, layer } };
}

/**
 * Édite un profil de façon fédérée : renommage, icône et/ou déplacement.
 * patch = { name?, icon?, moveTo? }
 */
export function editProfile(
  config: FullConfig,
  selection: Selection,
  idx: number,
  patch: ProfilePatch,
): OpResult {
  const cfg = clone(config);
  if (idx < 0 || idx >= cfg.profiles.length) return { config: cfg, selection };

  if (patch.name !== undefined) {
    const others = cfg.profiles.filter((_, i) => i !== idx).map((p) => p.name);
    cfg.profiles[idx].name = uniqueName(patch.name, others);
  }
  if (patch.icon !== undefined) {
    cfg.profiles[idx].icon = patch.icon;
  }

  let sel = selection;
  if (patch.moveTo !== undefined && patch.moveTo !== idx) {
    const to = clamp(patch.moveTo, 0, cfg.profiles.length - 1);
    moveInArray(cfg.profiles, idx, to);
    cfg.active_profile = indexAfterMove(cfg.active_profile, idx, to);
    sel = { ...selection, profile: indexAfterMove(selection.profile, idx, to) };
  }
  return { config: cfg, selection: sel };
}

// ── Layers ──────────────────────────────────────────────────────

/** Ajoute un layer au profil pIdx (garde ≤ CONFIG_MAX_LAYERS) et le sélectionne. */
export function addLayer(
  config: FullConfig,
  selection: Selection,
  pIdx: number,
): OpResult {
  const cfg = clone(config);
  const profile = cfg.profiles[pIdx];
  if (!profile || profile.layers.length >= CONFIG_MAX_LAYERS) {
    return { config: cfg, selection };
  }
  const names = profile.layers.map((l) => l.name ?? '');
  const layer = defaultLayer(uniqueName(`Layer ${profile.layers.length + 1}`, names));
  profile.layers.push(layer);

  const newLayer = profile.layers.length - 1;
  return { config: cfg, selection: { profile: pIdx, layer: newLayer } };
}

/** Supprime un layer (garde au moins MIN_LAYERS). */
export function deleteLayer(
  config: FullConfig,
  selection: Selection,
  pIdx: number,
  lIdx: number,
): OpResult {
  const cfg = clone(config);
  const profile = cfg.profiles[pIdx];
  if (!profile || profile.layers.length <= MIN_LAYERS || lIdx < 0 || lIdx >= profile.layers.length) {
    return { config: cfg, selection };
  }
  profile.layers.splice(lIdx, 1);

  let sel = selection;
  if (selection.profile === pIdx) {
    const layer = remapTracked(selection.layer, lIdx, profile.layers.length);
    sel = { ...selection, layer };
  }
  return { config: cfg, selection: sel };
}

/**
 * Édite un layer de façon fédérée : renommage et/ou déplacement.
 * patch = { name?, moveTo? }
 */
export function editLayer(
  config: FullConfig,
  selection: Selection,
  pIdx: number,
  lIdx: number,
  patch: LayerPatch,
): OpResult {
  const cfg = clone(config);
  const profile = cfg.profiles[pIdx];
  if (!profile || lIdx < 0 || lIdx >= profile.layers.length) return { config: cfg, selection };

  if (patch.name !== undefined) {
    const others = profile.layers.filter((_, i) => i !== lIdx).map((l) => l.name ?? '');
    profile.layers[lIdx].name = uniqueName(patch.name, others);
  }

  let sel = selection;
  if (patch.moveTo !== undefined && patch.moveTo !== lIdx) {
    const to = clamp(patch.moveTo, 0, profile.layers.length - 1);
    moveInArray(profile.layers, lIdx, to);
    if (selection.profile === pIdx) {
      sel = { ...selection, layer: indexAfterMove(selection.layer, lIdx, to) };
    }
  }
  return { config: cfg, selection: sel };
}

// ── Helpers granulaires exposés (composables) ───────────────────

export function renameProfile(config: FullConfig, selection: Selection, idx: number, name: string): OpResult {
  return editProfile(config, selection, idx, { name });
}
export function moveProfile(config: FullConfig, selection: Selection, from: number, to: number): OpResult {
  return editProfile(config, selection, from, { moveTo: to });
}
export function setProfileIcon(config: FullConfig, selection: Selection, idx: number, icon: string): OpResult {
  return editProfile(config, selection, idx, { icon });
}
export function renameLayer(config: FullConfig, selection: Selection, pIdx: number, lIdx: number, name: string): OpResult {
  return editLayer(config, selection, pIdx, lIdx, { name });
}
export function moveLayer(config: FullConfig, selection: Selection, pIdx: number, from: number, to: number): OpResult {
  return editLayer(config, selection, pIdx, from, { moveTo: to });
}

// ── interne ─────────────────────────────────────────────────────

/** Remappe un index suivi après suppression, en restant dans [0, newLen-1]. */
function remapTracked(tracked: number, removed: number, newLen: number): number {
  const next = indexAfterRemove(tracked, removed);
  if (next < 0) return clamp(removed, 0, newLen - 1); // l'élément suivi a disparu
  return clamp(next, 0, newLen - 1);
}
