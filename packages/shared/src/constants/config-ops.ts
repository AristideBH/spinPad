// ═══════════════════════════════════════════════════════════════
//  config-ops.ts — Profile & layer CRUD mutations (pure logic)
//
//  Module without Svelte runtime: operates on a cloned FullConfig and
//  returns the new object + the new selection (active profile/layer).
//  Testable with vitest, reused by config.svelte.js.
//
//  Maintained invariants:
//    - 1 ≤ profiles.length ≤ CONFIG_MAX_PROFILES
//    - 1 ≤ layers.length   ≤ CONFIG_MAX_LAYERS (per profile)
//    - cfg.active_profile stays a valid index after delete/move
//    - names stay ≤ CONFIG_NAME_MAX_LEN-1 and unique per scope
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
  type LayerConfig,
} from './config-schema.js';
import { allocColorSlot } from './layer-colors.js';
import { action, getActionType, getActionValue, ACTION_TYPES } from './action-types.js';

// Action types whose value is a layer index (to remap when
// reordering a profile's layers).
const LAYER_REF_TYPES: ReadonlySet<number> = new Set([
  ACTION_TYPES.ACTION_TYPE_LAYER_MO,
  ACTION_TYPES.ACTION_TYPE_LAYER_TG,
  ACTION_TYPES.ACTION_TYPE_LAYER_TO,
]);

export interface Selection {
  profile: number;
  layer: number;
}

export interface OpResult {
  config: FullConfig;
  selection: Selection;
}

// ── Public types for the patches ────────────────────────────────
export type ProfileTemplate = ProfileConfig;

export interface ProfilePatch {
  name?: string;
  icon?: string;
  moveTo?: number;
}

export interface LayerPatch {
  name?: string;
  moveTo?: number;
}

// ── Utilities ───────────────────────────────────────────────────

function clone<T>(v: T): T {
  return structuredClone(v);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

function trimName(name: string): string {
  return name.slice(0, CONFIG_NAME_MAX_LEN - 1);
}

/** Makes a name unique within `existing` by suffixing " (n)" if needed. */
function uniqueName(base: string, existing: string[]): string {
  const trimmed = trimName(base) || 'Profile';
  if (!existing.includes(trimmed)) return trimmed;
  for (let i = 2; i < 100; i++) {
    const candidate = trimName(`${trimmed} ${i}`);
    if (!existing.includes(candidate)) return candidate;
  }
  return trimmed;
}

/** New index of a tracked element after removal of `removed`. */
function indexAfterRemove(tracked: number, removed: number): number {
  if (tracked === removed) return -1; // the tracked element was removed
  return tracked > removed ? tracked - 1 : tracked;
}

/** New index of a tracked element after move from→to. */
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

/** Remaps an action if it references a layer moved from→to. */
function remapLayerRef(act: number, from: number, to: number): number {
  if (!LAYER_REF_TYPES.has(getActionType(act))) return act;
  const target = getActionValue(act);
  const next = indexAfterMove(target, from, to);
  return next === target ? act : action(getActionType(act), next);
}

/**
 * Rewrites all the profile's MO/TG/TO actions to follow a layer move
 * from→to (keys + encoder, flat and nested). Mutates the profile.
 */
function remapProfileLayerRefs(profile: ProfileConfig, from: number, to: number): void {
  for (const layer of profile.layers) {
    layer.keys = layer.keys.map((k) => remapLayerRef(k, from, to));
    layer.encoder_cw = remapLayerRef(layer.encoder_cw, from, to);
    layer.encoder_ccw = remapLayerRef(layer.encoder_ccw, from, to);
    if (layer.encoder) {
      layer.encoder.cw = remapLayerRef(layer.encoder.cw, from, to);
      layer.encoder.ccw = remapLayerRef(layer.encoder.ccw, from, to);
      if (layer.encoder.press !== undefined) {
        layer.encoder.press = remapLayerRef(layer.encoder.press, from, to);
      }
    }
  }
}

// ── Profiles ────────────────────────────────────────────────────

/**
 * Adds a profile from a template (preset) or from a blank profile.
 * Selects the new profile. No-op if already at max.
 */
export function addProfile(config: FullConfig, selection: Selection, template?: ProfileConfig): OpResult {
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

/** Deletes a profile (keeps at least MIN_PROFILES). */
export function deleteProfile(config: FullConfig, selection: Selection, idx: number): OpResult {
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
 * Re-inserts a previously deleted profile at `idx` and selects it.
 * Used to restore a specific profile from a delete-toast, independent of
 * the global undo stack. No-op if already at max.
 */
export function insertProfile(config: FullConfig, selection: Selection, idx: number, profile: ProfileConfig): OpResult {
  const cfg = clone(config);
  if (cfg.profiles.length >= CONFIG_MAX_PROFILES) {
    return { config: cfg, selection };
  }
  const at = clamp(idx, 0, cfg.profiles.length);
  cfg.profiles.splice(at, 0, clone(profile));
  return { config: cfg, selection: { profile: at, layer: 0 } };
}

/** Overwrites profile `idx` wholesale. Used to restore a reset/cleared profile from its toast. */
export function replaceProfile(config: FullConfig, selection: Selection, idx: number, profile: ProfileConfig): OpResult {
  const cfg = clone(config);
  if (!cfg.profiles[idx]) return { config: cfg, selection };
  cfg.profiles[idx] = clone(profile);
  return { config: cfg, selection };
}

/**
 * Edits a profile in a unified way: rename, icon and/or move.
 * patch = { name?, icon?, moveTo? }
 */
export function editProfile(config: FullConfig, selection: Selection, idx: number, patch: ProfilePatch): OpResult {
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

/**
 * Resets a profile: sets all keys of all its layers back to 0.
 * Keeps the structure (layer count, names), the encoders, the icon and the
 * profile name — same semantics as a layer "reset", applied to all.
 */
export function clearProfile(config: FullConfig, selection: Selection, idx: number): OpResult {
  const cfg = clone(config);
  const profile = cfg.profiles[idx];
  if (!profile) return { config: cfg, selection };

  for (const layer of profile.layers) {
    layer.keys = layer.keys.map(() => 0);
  }
  return { config: cfg, selection };
}

// ── Layers ──────────────────────────────────────────────────────

/** Adds a layer to profile pIdx (keeps ≤ CONFIG_MAX_LAYERS) and selects it. */
export function addLayer(config: FullConfig, selection: Selection, pIdx: number): OpResult {
  const cfg = clone(config);
  const profile = cfg.profiles[pIdx];
  if (!profile || profile.layers.length >= CONFIG_MAX_LAYERS) {
    return { config: cfg, selection };
  }
  const names = profile.layers.map((l) => l.name ?? '');
  const layer = defaultLayer(uniqueName(`Layer ${profile.layers.length + 1}`, names));
  layer.color = allocColorSlot(profile.layers);
  profile.layers.push(layer);

  const newLayer = profile.layers.length - 1;
  return { config: cfg, selection: { profile: pIdx, layer: newLayer } };
}

/** Duplicates layer lIdx of profile pIdx (clone + unique name), inserts it just
 *  after and selects it. No-op if already at max. */
export function duplicateLayer(config: FullConfig, selection: Selection, pIdx: number, lIdx: number): OpResult {
  const cfg = clone(config);
  const profile = cfg.profiles[pIdx];
  if (!profile || profile.layers.length >= CONFIG_MAX_LAYERS || lIdx < 0 || lIdx >= profile.layers.length) {
    return { config: cfg, selection };
  }
  const src = clone(profile.layers[lIdx]);
  const names = profile.layers.map((l) => l.name ?? '');
  src.name = uniqueName(src.name ?? `Layer ${profile.layers.length + 1}`, names);
  src.color = allocColorSlot(profile.layers); // new slot: layer distinct from the source
  profile.layers.splice(lIdx + 1, 0, src);

  return { config: cfg, selection: { profile: pIdx, layer: lIdx + 1 } };
}

/** Deletes a layer (keeps at least MIN_LAYERS). */
export function deleteLayer(config: FullConfig, selection: Selection, pIdx: number, lIdx: number): OpResult {
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
 * Re-inserts a previously deleted layer at `idx` in profile `pIdx` and
 * selects it. Used to restore a specific layer from a delete-toast,
 * independent of the global undo stack. No-op if already at max.
 */
export function insertLayer(
  config: FullConfig,
  selection: Selection,
  pIdx: number,
  idx: number,
  layer: LayerConfig,
): OpResult {
  const cfg = clone(config);
  const profile = cfg.profiles[pIdx];
  if (!profile || profile.layers.length >= CONFIG_MAX_LAYERS) {
    return { config: cfg, selection };
  }
  const at = clamp(idx, 0, profile.layers.length);
  profile.layers.splice(at, 0, clone(layer));

  let sel = selection;
  if (selection.profile === pIdx) sel = { ...selection, layer: at };
  return { config: cfg, selection: sel };
}

/** Overwrites layer `idx` of profile `pIdx` wholesale. Used to restore a reset layer from its toast. */
export function replaceLayer(
  config: FullConfig,
  selection: Selection,
  pIdx: number,
  idx: number,
  layer: LayerConfig,
): OpResult {
  const cfg = clone(config);
  const profile = cfg.profiles[pIdx];
  if (!profile?.layers[idx]) return { config: cfg, selection };
  profile.layers[idx] = clone(layer);
  return { config: cfg, selection };
}

/**
 * Edits a layer in a unified way: rename and/or move.
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
    // Follow the layer references (MO/TG/TO) after the move.
    remapProfileLayerRefs(profile, lIdx, to);
    if (selection.profile === pIdx) {
      sel = { ...selection, layer: indexAfterMove(selection.layer, lIdx, to) };
    }
  }
  return { config: cfg, selection: sel };
}

// ── Exposed granular helpers (composables) ──────────────────────

function renameProfile(config: FullConfig, selection: Selection, idx: number, name: string): OpResult {
  return editProfile(config, selection, idx, { name });
}
function moveProfile(config: FullConfig, selection: Selection, from: number, to: number): OpResult {
  return editProfile(config, selection, from, { moveTo: to });
}
function setProfileIcon(config: FullConfig, selection: Selection, idx: number, icon: string): OpResult {
  return editProfile(config, selection, idx, { icon });
}
function renameLayer(config: FullConfig, selection: Selection, pIdx: number, lIdx: number, name: string): OpResult {
  return editLayer(config, selection, pIdx, lIdx, { name });
}
function moveLayer(config: FullConfig, selection: Selection, pIdx: number, from: number, to: number): OpResult {
  return editLayer(config, selection, pIdx, from, { moveTo: to });
}

// ── internal ────────────────────────────────────────────────────

/** Remaps a tracked index after removal, staying within [0, newLen-1]. */
function remapTracked(tracked: number, removed: number, newLen: number): number {
  const next = indexAfterRemove(tracked, removed);
  if (next < 0) return clamp(removed, 0, newLen - 1); // the tracked element disappeared
  return clamp(next, 0, newLen - 1);
}
