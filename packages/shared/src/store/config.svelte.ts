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

// @ts-ignore - shared workspace n'est pas un dossier Svelte ; résolu au runtime par
// l'alias Vite des workspaces studio/website (résolution variable selon le check).
import { browser } from '$app/environment';
import { StateHistory } from 'runed';
import { toast } from 'svelte-sonner';
import { activeTransport, transportMode as _transportMode } from './transport.js';
import { AutoSave } from './auto-save.js';
import {
  parseSpinpadFile,
  createSpinpadFile,
  parseProfilesFile,
  createProfilesFile,
  SPINPAD_FILE_TYPE,
  SPINPAD_PROFILES_FILE_TYPE,
} from '$shared/constants/config-migrations.js';
import * as ops from '$shared/constants/config-ops.js';
import {
  defaultConfig,
  defaultMacros,
  isMacroUsed,
  MACRO_COUNT,
  MACRO_MAX_STEPS,
  MACRO_NAME_MAX_LEN,
  type FullConfig,
  type MacroDef,
  type MacroStep,
} from '$shared/constants/config-schema.js';
import { serial } from './serial.svelte.js';
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
//  HISTORIQUE UNDO/REDO (Runed StateHistory)
// ─────────────────────────────────────────────────────────────

let _history: StateHistory<FullConfig | null> | null = null;

if (browser) {
  $effect.root(() => {
    _history = new StateHistory(
      () => configState.data,
      (v) => {
        configState.data = v ? ($state.snapshot(v) as FullConfig) : null;
        configState.isDirty = true;
        _autoSave.schedule();
      },
      { capacity: 50 },
    );
  });
}

export function undo(): void {
  if (_history?.canUndo) _history.undo();
}
export function redo(): void {
  if (_history?.canRedo) _history.redo();
}
export function canUndo(): boolean {
  return _history?.canUndo ?? false;
}
export function canRedo(): boolean {
  return _history?.canRedo ?? false;
}

// ─────────────────────────────────────────────────────────────
//  CHARGEMENT
// ─────────────────────────────────────────────────────────────

export async function loadConfig(): Promise<void> {
  configState.isLoading = true;
  configState.loadError = null;
  try {
    // Pas de device branché (hors mode démo / HTTP) → prévisualiser la config
    // par défaut au lieu d'échouer sur "Non connecté".
    if (_transportMode() === 'serial' && !serial.connected) {
      const cfg = defaultConfig();
      configState.data = cfg;
      configState.activeProfileIndex = cfg.active_profile ?? 0;
      configState.isDirty = false;
      return;
    }
    const cfg = await activeTransport().getConfig();
    configState.data = cfg;
    configState.activeProfileIndex = cfg.active_profile ?? 0;
    configState.isDirty = false;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    configState.loadError = msg;
    console.error('[config] Erreur chargement :', err);
    toast.error('Impossible de charger la config', { description: msg });
  } finally {
    configState.isLoading = false;
  }
}

// Garde idempotente pour le `{await}` du gate Studio : ne relance pas un
// chargement si la config est déjà là ou déjà en vol. Throw en cas d'échec
// pour que <svelte:boundary> affiche le snippet `failed`.
let _loadPromise: Promise<void> | null = null;

export function ensureConfigLoaded(): Promise<void> {
  if (configState.data) return Promise.resolve();
  if (!_loadPromise) {
    _loadPromise = (async () => {
      await loadConfig();
      if (configState.loadError) throw new Error(configState.loadError);
    })().finally(() => {
      _loadPromise = null;
    });
  }
  return _loadPromise;
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
  const blob = new Blob([JSON.stringify(wrapper, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spinpad-config-${new Date().toISOString().slice(0, 10)}.spinpad`;
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
    if (raw['_type'] === SPINPAD_PROFILES_FILE_TYPE) {
      throw new Error('Ce fichier contient des profils — utilise « Importer profils ».');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsed = (raw['_type'] ? parseSpinpadFile(raw) : raw) as any as FullConfig;
  } catch (err) {
    throw new Error(`Fichier invalide : ${err instanceof Error ? err.message : String(err)}`);
  }
  configState.data = parsed;
  configState.activeProfileIndex = parsed.active_profile ?? 0;
  configState.isDirty = true;
  _autoSave.schedule();
  toast.success('Config importée', { description: file.name });
}

// ─────────────────────────────────────────────────────────────
//  IMPORT / EXPORT profils (.spinpad-profiles)
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
  const blob = new Blob([JSON.stringify(wrapper, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const stem =
    selected.length === 1
      ? _filenameSafe(selected[0].name ?? 'profile')
      : `profiles-${selected.length}`;
  a.download = `spinpad-${stem}-${new Date().toISOString().slice(0, 10)}.spinpad-profiles`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success(`${selected.length} profil(s) exporté(s)`);
}

export async function importProfiles(file: File): Promise<void> {
  const text = await file.text();
  let profiles;
  try {
    const raw = JSON.parse(text) as Record<string, unknown>;
    if (raw['_type'] === SPINPAD_FILE_TYPE) {
      throw new Error('Ce fichier contient une config complète — utilise « Importer config ».');
    }
    profiles = parseProfilesFile(raw).profiles;
  } catch (err) {
    throw new Error(`Fichier invalide : ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!configState.data) throw new Error('Aucune config chargée.');
  const cfg = $state.snapshot(configState.data) as FullConfig;
  cfg.profiles = profiles;
  if (cfg.active_profile >= profiles.length) cfg.active_profile = 0;
  configState.data = cfg;
  configState.activeProfileIndex = cfg.active_profile;
  configState.activeLayerIndex = 0;
  configState.isDirty = true;
  _autoSave.schedule();
  toast.success(`${profiles.length} profil(s) importé(s)`, { description: file.name });
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
  const enc = cfg.profiles[profileIdx].layers[layerIdx].encoder;
  if (enc) enc[direction] = actionValue;
  configState.data = cfg;
  configState.isDirty = true;
  _autoSave.schedule();
}

// ─────────────────────────────────────────────────────────────
//  PROFIL ACTIF (couplé device ↔ studio)
// ─────────────────────────────────────────────────────────────

// Dernier index poussé au device — garde anti-écho pour le réconciliateur
// (évite de renvoyer au device une valeur qu'il vient de nous signaler).
let _lastSentActiveProfile = -1;

/**
 * Définit le profil actif côté studio ET device (couplage edit ↔ active).
 *
 * - Mutation EN PLACE de `data.active_profile` : pas d'entrée d'undo ni de
 *   full-save (un switch de profil n'est pas une édition annulable), mais la
 *   config reste cohérente pour le prochain `setConfig` (évite le clobber du
 *   profil actif persisté sur le device).
 * - `push: true` (défaut) → pousse la bascule légère au device.
 *   `push: false` → utilisé par le réconciliateur quand le device est déjà la
 *   source de vérité (on ne lui renvoie pas la valeur).
 */
export function setActiveProfileLocal(idx: number, opts: { push?: boolean } = {}): void {
  const data = configState.data;
  if (!data) return;
  const max = Math.max(0, data.profiles.length - 1);
  const clamped = Math.min(Math.max(idx, 0), max);

  data.active_profile = clamped; // mutation en place → pas d'history/full-save
  configState.activeProfileIndex = clamped;
  configState.activeLayerIndex = 0;

  if (opts.push ?? true) {
    _lastSentActiveProfile = clamped;
    void activeTransport()
      .setActiveProfile(clamped)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        // « Non connecté » est normal en mode preview (serial sans device).
        if (msg !== 'Non connecté') console.error('[config] setActiveProfile échec :', msg);
      });
  }
}

/**
 * Réconcilie le profil actif rapporté par le device avec l'état studio.
 * Appelé depuis le polling device_status et l'événement « profile » du
 * moniteur. Le device est la source de vérité du « profil live » : si l'index
 * diverge, on aligne le studio SANS renvoyer au device (pas d'écho/boucle).
 */
export function reconcileActiveProfile(deviceIdx: number): void {
  const data = configState.data;
  if (!data || typeof deviceIdx !== 'number' || deviceIdx < 0) return;
  if (deviceIdx === data.active_profile) return; // déjà synchro → no-op
  if (deviceIdx === _lastSentActiveProfile) {
    // C'est l'écho de notre propre push : on est déjà aligné localement.
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
//  MUTATIONS MACROS (globales — index 0..MACRO_COUNT-1)
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
 * Crée une macro dans le premier slot libre à partir d'étapes fournies.
 * Retourne l'index du slot, ou `null` si tous les slots sont occupés.
 * Utilisé par le live-record quand un combo (modificateur + touche) est capturé.
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
    toast.error('Tous les slots de macro sont utilisés');
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
//  MUTATIONS PROFILS & LAYERS (CRUD)
// ─────────────────────────────────────────────────────────────

function _applyOp(result: ops.OpResult): void {
  // Couplage edit ↔ active : le profil sélectionné après une op CRUD (add /
  // duplicate auto-select, delete remap) est aussi le profil actif du device.
  // L'op a déjà recalé active_profile pour l'intégrité ; on l'aligne sur la
  // sélection finale. Le full-save qui suit le propage au device.
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

export function editProfile(idx: number, patch: ops.ProfilePatch): void {
  _applyOp(ops.editProfile($state.snapshot(configState.data) as FullConfig, _currentSelection(), idx, patch));
}

export function clearProfile(idx: number): void {
  _applyOp(ops.clearProfile($state.snapshot(configState.data) as FullConfig, _currentSelection(), idx));
}

export function addLayer(profileIdx: number): void {
  _applyOp(ops.addLayer($state.snapshot(configState.data) as FullConfig, _currentSelection(), profileIdx));
}

export function deleteLayer(profileIdx: number, layerIdx: number): void {
  _applyOp(ops.deleteLayer($state.snapshot(configState.data) as FullConfig, _currentSelection(), profileIdx, layerIdx));
}

export function editLayer(profileIdx: number, layerIdx: number, patch: ops.LayerPatch): void {
  _applyOp(
    ops.editLayer($state.snapshot(configState.data) as FullConfig, _currentSelection(), profileIdx, layerIdx, patch),
  );
}

export function setProfileIcon(profileIdx: number, iconBase64: string): void {
  editProfile(profileIdx, { icon: iconBase64 });
}
