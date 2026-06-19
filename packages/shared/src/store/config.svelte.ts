// ═══════════════════════════════════════════════════════════════
//  store/config.svelte.ts — Global state of the SpinPad configuration
//
//  Transport selected at build via store/transport.ts:
//    VITE_TRANSPORT=http  → transport/http.ts   (embedded Studio Mode)
//    (default)            → store/serial.svelte.ts (WebSerial USB)
//    VITE_DEV_MODE=true   → transport/mock.ts (development without device)
//
//  Features:
//    - Auto-save debounced (800ms) → transport.setConfig()
//    - Undo / Redo via CommitHistory, committed on the auto-save debounce (Ctrl+Z / Ctrl+Y)
//    - Import / Export in .spinpad format (JSON with header)
//
//  Note: the Ctrl+Z/Y keyboard shortcuts are handled in Studio.svelte
//  via <svelte:window onkeydown=...> to isolate the UI side effect.
// ═══════════════════════════════════════════════════════════════

// @ts-ignore - shared workspace is not a Svelte folder; resolved at runtime by
// the Vite alias of the studio/website workspaces (resolution varies by check).
import { toast } from 'svelte-sonner';
import { activeTransport, transportMode as _transportMode } from './transport.js';
import { AutoSave } from './auto-save.js';
import { CommitHistory } from './history.js';
import {
  parseSpinpadFile,
  createSpinpadFile,
  parseProfilesFile,
  createProfilesFile,
  SPINPAD_FILE_TYPE,
  SPINPAD_PROFILES_FILE_TYPE,
} from '$shared/constants/config-migrations.js';
import * as ops from '$shared/constants/config-ops.js';
import { MOCK_CONFIG } from '$shared/mock/keyboard-config.js';
import {
  defaultConfig,
  defaultLedKey,
  defaultMacros,
  defaultProfile,
  isMacroUsed,
  MACRO_COUNT,
  MACRO_MAX_STEPS,
  MACRO_NAME_MAX_LEN,
  type FullConfig,
  type LayerConfig,
  type LedProfile,
  type KeyLedOverride,
  type MacroDef,
  type MacroStep,
} from '$shared/constants/config-schema.js';
import { serial } from './serial.svelte.js';
import { backfillLayerColors } from '$shared/constants/layer-colors.js';
import type { Selection } from '$shared/constants/config-ops.js';

// ─────────────────────────────────────────────────────────────
//  AUTO-SAVE (debounce 800ms)
// ─────────────────────────────────────────────────────────────

async function _flushSave(): Promise<void> {
  if (!configState.data) return;
  if (_skipNextCommit) _skipNextCommit = false;
  else {
    _history.commit($state.snapshot(configState.data) as FullConfig);
    _syncHistoryFlags();
  }
  configState.isSaving = true;
  try {
    await activeTransport().setConfig(configState.data);
    configState.isDirty = false;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    configState.loadError = msg;
    console.error('[config] Auto-save error:', err);
    toast.error('Save error', { description: msg });
  } finally {
    configState.isSaving = false;
  }
}

const _autoSave = new AutoSave(_flushSave);

// ─────────────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────────────

class ConfigState {
  data = $state<FullConfig | null>(null);
  activeProfileIndex = $state(0);
  activeLayerIndex = $state(0);
  isDirty = $state(false);
  isLoading = $state(false);
  isSaving = $state(false);
  loadError = $state<string | null>(null);

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
//  UNDO/REDO HISTORY (CommitHistory, committed on auto-save debounce)
// ─────────────────────────────────────────────────────────────

const _history = new CommitHistory<FullConfig>(50);
let _skipNextCommit = false;

// CommitHistory is a plain (rune-less) class, so its internal log/redoStack
// aren't tracked by Svelte. Mirror its canUndo/canRedo into $state here so
// the toolbar buttons actually re-render after every seed/commit/undo/redo.
let _canUndo = $state(false);
let _canRedo = $state(false);

function _syncHistoryFlags(): void {
  _canUndo = _history.canUndo;
  _canRedo = _history.canRedo;
}

function _restore(snapshot: FullConfig): void {
  configState.data = snapshot;
  configState.isDirty = true;
  _skipNextCommit = true;
  _autoSave.schedule();
  _syncHistoryFlags();
}

export function undo(): void {
  const prev = _history.undo();
  if (prev !== undefined) _restore(prev);
}
export function redo(): void {
  const next = _history.redo();
  if (next !== undefined) _restore(next);
}
export function canUndo(): boolean {
  return _canUndo;
}
export function canRedo(): boolean {
  return _canRedo;
}

// ─────────────────────────────────────────────────────────────
//  LOADING
// ─────────────────────────────────────────────────────────────

export async function loadConfig(): Promise<void> {
  configState.isLoading = true;
  configState.loadError = null;
  try {
    // No device plugged in (outside demo mode / HTTP) → preview the default
    // config instead of failing on "Not connected".
    if (_transportMode() === 'serial' && !serial.connected) {
      const cfg = structuredClone(MOCK_CONFIG) as unknown as FullConfig;
      backfillLayerColors(cfg.profiles);
      configState.data = cfg;
      configState.activeProfileIndex = cfg.active_profile ?? 0;
      configState.isDirty = false;
      _history.seed($state.snapshot(cfg) as FullConfig);
      _syncHistoryFlags();
      return;
    }
    const cfg = await activeTransport().getConfig();
    backfillLayerColors(cfg.profiles);
    configState.data = cfg;
    configState.activeProfileIndex = cfg.active_profile ?? 0;
    configState.isDirty = false;
    _history.seed($state.snapshot(cfg) as FullConfig);
    _syncHistoryFlags();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    configState.loadError = msg;
    console.error('[config] Loading error:', err);
    toast.error('Unable to load config', { description: msg });
  } finally {
    configState.isLoading = false;
  }
}

// ─────────────────────────────────────────────────────────────
//  MANUAL SAVE
// ─────────────────────────────────────────────────────────────

export async function saveConfig(): Promise<void> {
  await _autoSave.flush();
}

/** `true` if an auto-save is still pending (debounce window). */
export function hasPendingSave(): boolean {
  return _autoSave.pending;
}

export async function factoryReset(): Promise<void> {
  configState.isLoading = true;
  try {
    await activeTransport().factoryReset();
    await loadConfig();
    toast.success('Factory reset done');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    configState.loadError = msg;
    console.error('[config] Factory reset error:', err);
    toast.error('Error during factory reset', { description: msg });
  } finally {
    configState.isLoading = false;
  }
}

// ─────────────────────────────────────────────────────────────
//  IMPORT / EXPORT .spinpad
// ─────────────────────────────────────────────────────────────

function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportConfig(): void {
  if (!configState.data) return;
  const wrapper = createSpinpadFile(configState.data);
  downloadJson(`spinpad-config-${new Date().toISOString().slice(0, 10)}.spinpad`, wrapper);
  toast.success('Config exported');
}

export async function importConfig(file: File): Promise<void> {
  const text = await file.text();
  let parsed: FullConfig;
  try {
    const raw = JSON.parse(text) as Record<string, unknown>;
    if (raw['_type'] === SPINPAD_PROFILES_FILE_TYPE) {
      throw new Error('This file contains profiles — use "Import profiles".');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsed = (raw['_type'] ? parseSpinpadFile(raw) : raw) as any as FullConfig;
  } catch (err) {
    throw new Error(`Invalid file: ${err instanceof Error ? err.message : String(err)}`);
  }
  backfillLayerColors(parsed.profiles);
  configState.data = parsed;
  configState.activeProfileIndex = parsed.active_profile ?? 0;
  configState.isDirty = true;
  _autoSave.schedule();
  toast.success('Config imported', { description: file.name });
}

/**
 * Wipes the keymap-side state back to a clean slate: a single profile with
 * a single empty layer, no macros, no per-key LED overrides. Device-level
 * settings (display, BLE, power, orientation, LED extension) are untouched —
 * use `factoryReset()` for a full hardware reset instead.
 */
export function resetToMinimalConfig(): void {
  if (!configState.data) return;
  const cfg = $state.snapshot(configState.data) as FullConfig;
  cfg.profiles = [defaultProfile()];
  cfg.active_profile = 0;
  cfg.macros = defaultMacros();
  configState.data = cfg;
  configState.activeProfileIndex = 0;
  configState.activeLayerIndex = 0;
  configState.isDirty = true;
  _autoSave.schedule();
  toast.success('Config reset to a minimal starting point');
}

// ─────────────────────────────────────────────────────────────
//  IMPORT / EXPORT profiles (.spinpad-profiles)
// ─────────────────────────────────────────────────────────────

function _filenameSafe(s: string): string {
  return s.replace(/[^a-z0-9_-]+/gi, '_').slice(0, 40) || 'profiles';
}

export function exportProfiles(indices: number[]): void {
  if (!configState.data || indices.length === 0) return;
  const all = configState.data.profiles;
  const selected = indices
    .filter((i) => i >= 0 && i < all.length)
    .map((i) => structuredClone($state.snapshot(all[i])));
  if (selected.length === 0) return;
  const wrapper = createProfilesFile(selected);
  const stem =
    selected.length === 1
      ? _filenameSafe(selected[0].name ?? 'profile')
      : `profiles-${selected.length}`;
  downloadJson(`spinpad-${stem}-${new Date().toISOString().slice(0, 10)}.spinpad-profiles`, wrapper);
  toast.success(`${selected.length} profile(s) exported`);
}

export async function importProfiles(file: File): Promise<void> {
  const text = await file.text();
  let profiles;
  try {
    const raw = JSON.parse(text) as Record<string, unknown>;
    if (raw['_type'] === SPINPAD_FILE_TYPE) {
      throw new Error('This file contains a full config — use "Import config".');
    }
    profiles = parseProfilesFile(raw).profiles;
  } catch (err) {
    throw new Error(`Invalid file: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!configState.data) throw new Error('No config loaded.');
  const cfg = $state.snapshot(configState.data) as FullConfig;
  cfg.profiles = profiles;
  if (cfg.active_profile >= profiles.length) cfg.active_profile = 0;
  configState.data = cfg;
  configState.activeProfileIndex = cfg.active_profile;
  configState.activeLayerIndex = 0;
  configState.isDirty = true;
  _autoSave.schedule();
  toast.success(`${profiles.length} profile(s) imported`, { description: file.name });
}

// ─────────────────────────────────────────────────────────────
//  MUTATIONS KEYMAP + ENCODER
// ─────────────────────────────────────────────────────────────

export function updateConfig(path: string, value: unknown): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfg = $state.snapshot(configState.data) as any;
  const parts = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let obj: any = cfg;
  for (let i = 0; i < parts.length - 1; i++) {
    if (obj[parts[i]] == null) obj[parts[i]] = {};
    obj = obj[parts[i]];
  }
  obj[parts[parts.length - 1]] = value;
  configState.data = cfg as FullConfig;
  configState.isDirty = true;
  _autoSave.schedule();
}

export function setKeyAction(profileIdx: number, layerIdx: number, keyIndex: number, actionValue: number): void {
  const cfg = $state.snapshot(configState.data) as FullConfig;
  cfg.profiles[profileIdx].layers[layerIdx].keys[keyIndex] = actionValue;
  configState.data = cfg;
  configState.isDirty = true;
  _autoSave.schedule();
}

export function setEncoderAction(
  profileIdx: number,
  layerIdx: number,
  direction: 'cw' | 'ccw' | 'press',
  actionValue: number,
): void {
  const cfg = $state.snapshot(configState.data) as FullConfig;
  const layer = cfg.profiles[profileIdx].layers[layerIdx];
  // The (nested) `encoder` object is the canonical format read by the firmware
  // and the UI. Layers created via defaultLayer may not have it → we create it
  // on the fly, otherwise the assignment would be silently ignored.
  const enc = layer.encoder ?? (layer.encoder = { cw: 0, ccw: 0, press: 0 });
  enc[direction] = actionValue;
  configState.data = cfg;
  configState.isDirty = true;
  _autoSave.schedule();
}

// ─────────────────────────────────────────────────────────────
//  ACTIVE PROFILE (coupled device ↔ studio)
// ─────────────────────────────────────────────────────────────

// Last index pushed to the device — anti-echo guard for the reconciler
// (avoids resending the device a value it just reported to us).
let _lastSentActiveProfile = -1;

/**
 * Sets the active profile on the studio AND device side (edit ↔ active coupling).
 *
 * - IN-PLACE mutation of `data.active_profile`: no undo entry nor full-save
 *   (a profile switch is not an undoable edit), but the config stays consistent
 *   for the next `setConfig` (avoids clobbering the active profile persisted on
 *   the device).
 * - `push: true` (default) → pushes the lightweight switch to the device.
 *   `push: false` → used by the reconciler when the device is already the
 *   source of truth (we do not send the value back to it).
 */
export function setActiveProfileLocal(idx: number, opts: { push?: boolean } = {}): void {
  const data = configState.data;
  if (!data) return;
  const max = Math.max(0, data.profiles.length - 1);
  const clamped = Math.min(Math.max(idx, 0), max);

  data.active_profile = clamped; // in-place mutation → no history/full-save
  configState.activeProfileIndex = clamped;
  configState.activeLayerIndex = 0;

  if (opts.push ?? true) {
    _lastSentActiveProfile = clamped;
    void activeTransport()
      .setActiveProfile(clamped)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        // "Not connected" is normal in preview mode (serial without device).
        if (msg !== 'Not connected') console.error('[config] setActiveProfile failed:', msg);
      });
  }
}

/**
 * Reconciles the active profile reported by the device with the studio state.
 * Called from the device_status polling and the monitor "profile" event. The
 * device is the source of truth of the "live profile": if the index diverges,
 * we align the studio WITHOUT sending back to the device (no echo/loop).
 */
export function reconcileActiveProfile(deviceIdx: number): void {
  const data = configState.data;
  if (!data || typeof deviceIdx !== 'number' || deviceIdx < 0) return;
  if (deviceIdx === data.active_profile) return; // already synced → no-op
  if (deviceIdx === _lastSentActiveProfile) {
    // This is the echo of our own push: we are already aligned locally.
    _lastSentActiveProfile = -1;
    return;
  }
  setActiveProfileLocal(deviceIdx, { push: false });
}

// Combo mutations dormant — firmware still supports chord combos but the
// frontend editor has been deferred (see issue #16). Kept here as commented
// reference for future UI work; round-trip through JSON parse/serialize is
// unaffected.
//
// export function addCombo(profileIdx: number, combo: unknown): void {
//   const cfg = $state.snapshot(configState.data) as FullConfig;
//   cfg.profiles[profileIdx].combos?.push(combo);
//   configState.data = cfg;
//   configState.isDirty = true;
//   _autoSave.schedule();
// }
//
// export function removeCombo(profileIdx: number, comboIdx: number): void {
//   const cfg = $state.snapshot(configState.data) as FullConfig;
//   cfg.profiles[profileIdx].combos?.splice(comboIdx, 1);
//   configState.data = cfg;
//   configState.isDirty = true;
//   _autoSave.schedule();
// }

// ─────────────────────────────────────────────────────────────
//  MACRO MUTATIONS (global — index 0..MACRO_COUNT-1)
// ─────────────────────────────────────────────────────────────

function _ensureMacros(cfg: FullConfig): MacroDef[] {
  if (!Array.isArray(cfg.macros)) cfg.macros = defaultMacros();
  return cfg.macros;
}

export function setMacroName(idx: number, name: string): void {
  const cfg = $state.snapshot(configState.data) as FullConfig;
  const macros = _ensureMacros(cfg);
  if (!macros[idx]) return;
  macros[idx].name = name.slice(0, MACRO_NAME_MAX_LEN - 1);
  configState.data = cfg;
  configState.isDirty = true;
  _autoSave.schedule();
}

export function setMacroSteps(idx: number, steps: MacroStep[]): void {
  const cfg = $state.snapshot(configState.data) as FullConfig;
  const macros = _ensureMacros(cfg);
  if (!macros[idx]) return;
  macros[idx].steps = ($state.snapshot(steps) as MacroStep[]).slice(0, MACRO_MAX_STEPS);
  configState.data = cfg;
  configState.isDirty = true;
  _autoSave.schedule();
}

/**
 * Creates a macro in the first free slot from the provided steps.
 * Returns the slot index, or `null` if all slots are occupied.
 * Used by live-record when a combo (modifier + key) is captured.
 */
export function createMacroFromSteps(name: string, steps: MacroStep[]): number | null {
  const cfg = $state.snapshot(configState.data) as FullConfig;
  const macros = _ensureMacros(cfg);
  let slot = -1;
  for (let i = 0; i < MACRO_COUNT; i++) {
    if (!isMacroUsed(macros[i])) {
      slot = i;
      break;
    }
  }
  if (slot < 0) {
    toast.error('All macro slots are used');
    return null;
  }
  macros[slot] = {
    name: name.slice(0, MACRO_NAME_MAX_LEN - 1),
    steps: ($state.snapshot(steps) as MacroStep[]).slice(0, MACRO_MAX_STEPS),
  };
  configState.data = cfg;
  configState.isDirty = true;
  _autoSave.schedule();
  return slot;
}

export function clearMacro(idx: number): void {
  const cfg = $state.snapshot(configState.data) as FullConfig;
  const macros = _ensureMacros(cfg);
  if (!macros[idx]) return;
  macros[idx] = { name: '', steps: [] };
  configState.data = cfg;
  configState.isDirty = true;
  _autoSave.schedule();
}

// ─────────────────────────────────────────────────────────────
//  PROFILE & LAYER MUTATIONS (CRUD)
// ─────────────────────────────────────────────────────────────

function _applyOp(result: ops.OpResult): void {
  // Edit ↔ active coupling: the profile selected after a CRUD op (add /
  // duplicate auto-select, delete remap) is also the device's active profile.
  // The op has already realigned active_profile for integrity; we align it on
  // the final selection. The following full-save propagates it to the device.
  result.config.active_profile = result.selection.profile;
  configState.data = result.config;
  configState.activeProfileIndex = result.selection.profile;
  configState.activeLayerIndex = result.selection.layer;
  configState.isDirty = true;
  _autoSave.schedule();
}

function _currentSelection(): Selection {
  return { profile: configState.activeProfileIndex, layer: configState.activeLayerIndex };
}

export function addProfile(template?: ops.ProfileTemplate): void {
  const tpl = template ? ($state.snapshot(template) as ops.ProfileTemplate) : undefined;
  _applyOp(ops.addProfile($state.snapshot(configState.data) as FullConfig, _currentSelection(), tpl));
}

export function deleteProfile(idx: number): void {
  _applyOp(ops.deleteProfile($state.snapshot(configState.data) as FullConfig, _currentSelection(), idx));
}

/** Restores a deleted profile at `idx` (per-toast undo, decoupled from the global undo stack). */
export function restoreProfile(idx: number, profile: ops.ProfileTemplate): void {
  _applyOp(ops.insertProfile($state.snapshot(configState.data) as FullConfig, _currentSelection(), idx, profile));
}

/** Restores a reset/cleared profile's prior state at `idx` (per-toast undo). */
export function restoreProfileState(idx: number, profile: ops.ProfileTemplate): void {
  _applyOp(ops.replaceProfile($state.snapshot(configState.data) as FullConfig, _currentSelection(), idx, profile));
}

export function editProfile(idx: number, patch: ops.ProfilePatch): void {
  _applyOp(ops.editProfile($state.snapshot(configState.data) as FullConfig, _currentSelection(), idx, patch));
}

export function clearProfile(idx: number): void {
  _applyOp(ops.clearProfile($state.snapshot(configState.data) as FullConfig, _currentSelection(), idx));
}

export function addLayer(profileIdx: number): void {
  _applyOp(ops.addLayer($state.snapshot(configState.data) as FullConfig, _currentSelection(), profileIdx));
}

export function duplicateLayer(profileIdx: number, layerIdx: number): void {
  _applyOp(ops.duplicateLayer($state.snapshot(configState.data) as FullConfig, _currentSelection(), profileIdx, layerIdx));
}

export function deleteLayer(profileIdx: number, layerIdx: number): void {
  _applyOp(ops.deleteLayer($state.snapshot(configState.data) as FullConfig, _currentSelection(), profileIdx, layerIdx));
}

/** Restores a deleted layer at `idx` in profile `profileIdx` (per-toast undo). */
export function restoreLayer(profileIdx: number, idx: number, layer: LayerConfig): void {
  _applyOp(
    ops.insertLayer($state.snapshot(configState.data) as FullConfig, _currentSelection(), profileIdx, idx, layer),
  );
}

/** Restores a reset layer's prior state at `idx` in profile `profileIdx` (per-toast undo). */
export function restoreLayerState(profileIdx: number, idx: number, layer: LayerConfig): void {
  _applyOp(
    ops.replaceLayer($state.snapshot(configState.data) as FullConfig, _currentSelection(), profileIdx, idx, layer),
  );
}

export function editLayer(profileIdx: number, layerIdx: number, patch: ops.LayerPatch): void {
  _applyOp(
    ops.editLayer($state.snapshot(configState.data) as FullConfig, _currentSelection(), profileIdx, layerIdx, patch),
  );
}

export function setProfileIcon(profileIdx: number, iconBase64: string): void {
  editProfile(profileIdx, { icon: iconBase64 });
}

export function setProfileLed(profileIdx: number, led: LedProfile | undefined): void {
  const cfg = $state.snapshot(configState.data) as FullConfig;
  if (!cfg.profiles[profileIdx]) return;
  if (led) cfg.profiles[profileIdx].led = led;
  else delete cfg.profiles[profileIdx].led;
  configState.data = cfg;
  configState.isDirty = true;
  _autoSave.schedule();
}

export function setKeyLedOverride(
  profileIdx: number,
  layerIdx: number,
  keyIdx: number,
  override: KeyLedOverride | null,
): void {
  const cfg = $state.snapshot(configState.data) as FullConfig;
  const layer = cfg.profiles[profileIdx]?.layers[layerIdx];
  if (!layer) return;
  if (!layer.key_leds) layer.key_leds = Array(10).fill(null);
  layer.key_leds[keyIdx] = override;
  // Cleanup: if all null, remove the array
  if (layer.key_leds.every((v) => v === null)) delete layer.key_leds;
  configState.data = cfg;
  configState.isDirty = true;
  _autoSave.schedule();
}

