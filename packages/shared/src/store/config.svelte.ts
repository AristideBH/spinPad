// ═══════════════════════════════════════════════════════════════
//  store/config.svelte.ts — State global de la configuration SpinPad
//
//  Transport sélectionné au build via store/transport.ts :
//    VITE_TRANSPORT=http  → transport/http.ts   (Studio Mode embarqué)
//    (défaut)             → store/serial.svelte.ts (WebSerial USB)
//    VITE_DEV_MODE=true   → transport/mock.ts (développement sans device)
//
//  Features :
//    - Auto-save debounced (800ms) → transport.setConfig()
//    - Undo / Redo via Runed StateHistory (Ctrl+Z / Ctrl+Y)
//    - Import / Export au format .spinpad (JSON avec header)
//
//  Note : les raccourcis clavier Ctrl+Z/Y sont gérés dans Studio.svelte
//  via <svelte:window onkeydown=...> pour isoler l'effet de bord UI.
// ═══════════════════════════════════════════════════════════════

import { browser } from '$app/environment';
import { StateHistory } from 'runed';
import { toast } from 'svelte-sonner';
import { activeTransport, transportMode as _transportMode } from './transport.js';
import { AutoSave } from './auto-save.js';
import { parseSpinpadFile, createSpinpadFile } from '$shared/constants/config-migrations.js';
import * as ops from '$shared/constants/config-ops.js';
import type { FullConfig } from '$shared/constants/config-schema.js';
import type { Selection } from '$shared/constants/config-ops.js';

// ─────────────────────────────────────────────────────────────
//  AUTO-SAVE (debounce 800ms)
// ─────────────────────────────────────────────────────────────

async function _flushSave(): Promise<void> {
  if (!configState.data) return;
  configState.isSaving = true;
  try {
    await activeTransport().setConfig(configState.data);
    configState.isDirty = false;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    configState.loadError = msg;
    console.error('[config] Erreur auto-save :', err);
    toast.error('Erreur de sauvegarde', { description: msg });
  } finally {
    configState.isSaving = false;
  }
}

const _autoSave = new AutoSave(_flushSave);

// ─────────────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────────────

class ConfigState {
  data               = $state<FullConfig | null>(null);
  activeProfileIndex = $state(0);
  activeLayerIndex   = $state(0);
  isDirty            = $state(false);
  isLoading          = $state(false);
  isSaving           = $state(false);
  loadError          = $state<string | null>(null);

  get activeProfile() {
    return this.data?.profiles?.[this.activeProfileIndex] ?? null;
  }

  get activeLayer() {
    return this.activeProfile?.layers?.[this.activeLayerIndex] ?? null;
  }

  get transportMode(): 'mock' | 'http' | 'serial' {
    return _transportMode();
  }
}

export const configState = new ConfigState();

// ─────────────────────────────────────────────────────────────
//  HISTORIQUE UNDO/REDO (Runed StateHistory)
// ─────────────────────────────────────────────────────────────

let _history: StateHistory<FullConfig | null> | null = null;

if (browser) {
  $effect.root(() => {
    _history = new StateHistory(
      () => configState.data,
      (v) => {
        configState.data    = v ? $state.snapshot(v) as FullConfig : null;
        configState.isDirty = true;
        _autoSave.schedule();
      },
      { capacity: 50 },
    );
  });
}

export function undo(): void       { if (_history?.canUndo) _history.undo(); }
export function redo(): void       { if (_history?.canRedo) _history.redo(); }
export function canUndo(): boolean { return _history?.canUndo ?? false; }
export function canRedo(): boolean { return _history?.canRedo ?? false; }

// ─────────────────────────────────────────────────────────────
//  CHARGEMENT
// ─────────────────────────────────────────────────────────────

export async function loadConfig(): Promise<void> {
  configState.isLoading = true;
  configState.loadError = null;
  try {
    const cfg = await activeTransport().getConfig();
    configState.data               = cfg;
    configState.activeProfileIndex = cfg.active_profile ?? 0;
    configState.isDirty            = false;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    configState.loadError = msg;
    console.error('[config] Erreur chargement :', err);
    toast.error('Impossible de charger la config', { description: msg });
  } finally {
    configState.isLoading = false;
  }
}

// ─────────────────────────────────────────────────────────────
//  SAUVEGARDE MANUELLE
// ─────────────────────────────────────────────────────────────

export async function saveConfig(): Promise<void> {
  await _autoSave.flush();
}

export async function factoryReset(): Promise<void> {
  configState.isLoading = true;
  try {
    await activeTransport().factoryReset();
    await loadConfig();
    toast.success('Reset usine effectué');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    configState.loadError = msg;
    console.error('[config] Erreur factory reset :', err);
    toast.error('Erreur lors du reset usine', { description: msg });
  } finally {
    configState.isLoading = false;
  }
}

// ─────────────────────────────────────────────────────────────
//  IMPORT / EXPORT .spinpad
// ─────────────────────────────────────────────────────────────

export function exportConfig(): void {
  if (!configState.data) return;
  const wrapper = createSpinpadFile(configState.data);
  const blob    = new Blob([JSON.stringify(wrapper, null, 2)], { type: 'application/json' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href         = url;
  a.download     = `spinpad-config-${new Date().toISOString().slice(0, 10)}.spinpad`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success('Config exportée');
}

export async function importConfig(file: File): Promise<void> {
  const text = await file.text();
  let parsed: FullConfig;
  try {
    const raw = JSON.parse(text) as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsed = (raw['_type'] ? parseSpinpadFile(raw) : raw) as any as FullConfig;
  } catch (err) {
    throw new Error(`Fichier invalide : ${err instanceof Error ? err.message : String(err)}`);
  }
  configState.data               = parsed;
  configState.activeProfileIndex = parsed.active_profile ?? 0;
  configState.isDirty            = true;
  _autoSave.schedule();
  toast.success('Config importée', { description: file.name });
}

// ─────────────────────────────────────────────────────────────
//  MUTATIONS KEYMAP + ENCODER
// ─────────────────────────────────────────────────────────────

export function updateConfig(path: string, value: unknown): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfg   = $state.snapshot(configState.data) as any;
  const parts = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let obj: any = cfg;
  for (let i = 0; i < parts.length - 1; i++) {
    if (obj[parts[i]] == null) obj[parts[i]] = {};
    obj = obj[parts[i]];
  }
  obj[parts[parts.length - 1]] = value;
  configState.data    = cfg as FullConfig;
  configState.isDirty = true;
  _autoSave.schedule();
}

export function setKeyAction(profileIdx: number, layerIdx: number, keyIndex: number, actionValue: number): void {
  const cfg = $state.snapshot(configState.data) as FullConfig;
  cfg.profiles[profileIdx].layers[layerIdx].keys[keyIndex] = actionValue;
  configState.data    = cfg;
  configState.isDirty = true;
  _autoSave.schedule();
}

export function setEncoderAction(profileIdx: number, layerIdx: number, direction: 'cw' | 'ccw' | 'press', actionValue: number): void {
  const cfg = $state.snapshot(configState.data) as FullConfig;
  const enc = cfg.profiles[profileIdx].layers[layerIdx].encoder;
  if (enc) enc[direction] = actionValue;
  configState.data    = cfg;
  configState.isDirty = true;
  _autoSave.schedule();
}

export function addCombo(profileIdx: number, combo: unknown): void {
  const cfg = $state.snapshot(configState.data) as FullConfig;
  cfg.profiles[profileIdx].combos?.push(combo);
  configState.data    = cfg;
  configState.isDirty = true;
  _autoSave.schedule();
}

export function removeCombo(profileIdx: number, comboIdx: number): void {
  const cfg = $state.snapshot(configState.data) as FullConfig;
  cfg.profiles[profileIdx].combos?.splice(comboIdx, 1);
  configState.data    = cfg;
  configState.isDirty = true;
  _autoSave.schedule();
}

// ─────────────────────────────────────────────────────────────
//  MUTATIONS PROFILS & LAYERS (CRUD)
// ─────────────────────────────────────────────────────────────

function _applyOp(result: ops.OpResult): void {
  configState.data               = result.config;
  configState.activeProfileIndex = result.selection.profile;
  configState.activeLayerIndex   = result.selection.layer;
  configState.isDirty            = true;
  _autoSave.schedule();
}

function _currentSelection(): Selection {
  return { profile: configState.activeProfileIndex, layer: configState.activeLayerIndex };
}

export function addProfile(template?: ops.ProfileTemplate): void {
  const tpl = template ? $state.snapshot(template) as ops.ProfileTemplate : undefined;
  _applyOp(ops.addProfile($state.snapshot(configState.data) as FullConfig, _currentSelection(), tpl));
}

export function deleteProfile(idx: number): void {
  _applyOp(ops.deleteProfile($state.snapshot(configState.data) as FullConfig, _currentSelection(), idx));
}

export function editProfile(idx: number, patch: ops.ProfilePatch): void {
  _applyOp(ops.editProfile($state.snapshot(configState.data) as FullConfig, _currentSelection(), idx, patch));
}

export function addLayer(profileIdx: number): void {
  _applyOp(ops.addLayer($state.snapshot(configState.data) as FullConfig, _currentSelection(), profileIdx));
}

export function deleteLayer(profileIdx: number, layerIdx: number): void {
  _applyOp(ops.deleteLayer($state.snapshot(configState.data) as FullConfig, _currentSelection(), profileIdx, layerIdx));
}

export function editLayer(profileIdx: number, layerIdx: number, patch: ops.LayerPatch): void {
  _applyOp(ops.editLayer($state.snapshot(configState.data) as FullConfig, _currentSelection(), profileIdx, layerIdx, patch));
}

export function setProfileIcon(profileIdx: number, iconBase64: string): void {
  editProfile(profileIdx, { icon: iconBase64 });
}
