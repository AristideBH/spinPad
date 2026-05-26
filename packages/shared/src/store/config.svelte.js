// ═══════════════════════════════════════════════════════════════
//  config.svelte.js — State global de la configuration SpinPad
//
//  Transport sélectionné au build :
//    VITE_TRANSPORT=http  → transport/http.js  (Studio Mode embarqué)
//    (défaut)             → serial/index.svelte.js (WebSerial USB)
//    VITE_DEV_MODE=true   → mock data (développement sans device)
//
//  Features :
//    - Auto-save debounced (800ms) → transport.setConfig()
//    - Undo / Redo via Runed StateHistory (Ctrl+Z / Ctrl+Y)
//    - Import / Export au format .spinpad (JSON avec header)
// ═══════════════════════════════════════════════════════════════

import { browser } from '$app/environment';
import { StateHistory } from 'runed';
import { devMode } from './devMode.svelte.js';
import { MOCK_CONFIG } from '../mock/keyboard-config.js';
import { parseSpinpadFile, createSpinpadFile } from '../constants/config-migrations.js';

// ── Sélection du transport ────────────────────────────────────
// Déterminé au build via la variable d'environnement VITE_TRANSPORT.
// Le branchement statique permet à Vite de tree-shaker le transport inutilisé.

const USE_HTTP = import.meta.env.VITE_TRANSPORT === 'http';

// Import dynamique des transports (les deux sont bundlés, mais seul l'actif est utilisé)
import * as serialTransport from '../serial/index.svelte.js';
import * as httpTransport   from '../transport/http.js';

/** @type {{ getConfig: () => Promise<object>, setConfig: (d: object) => Promise<void>, factoryReset: () => Promise<void> }} */
const transport = USE_HTTP ? httpTransport : serialTransport;

// ─────────────────────────────────────────────────────────────
//  AUTO-SAVE (debounce 800ms)
// ─────────────────────────────────────────────────────────────

let _saveTimer = null;

function _scheduleSave() {
    if (!browser) return;
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
        _saveTimer = null;
        _flushSave();
    }, 800);
}

async function _flushSave() {
    if (!configState.data || devMode.active) return;
    configState.isSaving = true;
    try {
        await transport.setConfig(configState.data);
        configState.isDirty = false;
    } catch (err) {
        configState.loadError = err.message;
        console.error('[config] Erreur auto-save :', err);
    } finally {
        configState.isSaving = false;
    }
}

// ─────────────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────────────

class ConfigState {
    data                = $state(null);
    activeProfileIndex  = $state(0);
    activeLayerIndex    = $state(0);
    isDirty             = $state(false);
    isLoading           = $state(false);
    isSaving            = $state(false);
    loadError           = $state(null);

    /** Profil actuellement sélectionné */
    get activeProfile() {
        return this.data?.profiles?.[this.activeProfileIndex] ?? null;
    }

    /** Layer actuellement sélectionné */
    get activeLayer() {
        return this.activeProfile?.layers?.[this.activeLayerIndex] ?? null;
    }

    /** Nom du transport actif (pour debug/UI) */
    get transportMode() {
        if (devMode.active) return 'mock';
        return USE_HTTP ? 'http' : 'serial';
    }
}

export const configState = new ConfigState();

// ─────────────────────────────────────────────────────────────
//  HISTORIQUE UNDO/REDO (Runed StateHistory)
// ─────────────────────────────────────────────────────────────

// StateHistory suit les mutations de configState.data.
// Initialisé dans $effect.root() pour créer un contexte réactif persistant
// qui survit aux montages/démontages de composants.
let _history = null;

if (browser) {
    $effect.root(() => {
        _history = new StateHistory(
            () => configState.data,
            (v) => {
                configState.data = v ? structuredClone(v) : null;
                configState.isDirty = true;
                _scheduleSave();
            },
            { capacity: 50 }
        );
    });
}

export function undo()    { if (_history?.canUndo) _history.undo(); }
export function redo()    { if (_history?.canRedo) _history.redo(); }
export function canUndo() { return _history?.canUndo ?? false; }
export function canRedo() { return _history?.canRedo ?? false; }

// ─────────────────────────────────────────────────────────────
//  RACCOURCIS CLAVIER (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z)
// ─────────────────────────────────────────────────────────────

if (browser) {
    window.addEventListener('keydown', (e) => {
        // Ignorer si le focus est dans un input/textarea
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;

        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        } else if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            redo();
        }
    });
}

// ─────────────────────────────────────────────────────────────
//  CHARGEMENT
// ─────────────────────────────────────────────────────────────

export async function loadConfig() {
    configState.isLoading = true;
    configState.loadError = null;
    try {
        if (devMode.active) {
            await new Promise(r => setTimeout(r, 300));   // Simule latence
            configState.data = structuredClone(MOCK_CONFIG);
            configState.activeProfileIndex = MOCK_CONFIG.active_profile ?? 0;
            configState.isDirty = false;
            return;
        }
        const cfg = await transport.getConfig();
        configState.data = cfg;
        configState.activeProfileIndex = cfg.active_profile ?? 0;
        configState.isDirty = false;
    } catch (err) {
        configState.loadError = err.message;
        console.error('[config] Erreur chargement :', err);
    } finally {
        configState.isLoading = false;
    }
}

// ─────────────────────────────────────────────────────────────
//  SAUVEGARDE MANUELLE (force flush immédiat)
// ─────────────────────────────────────────────────────────────

export async function saveConfig() {
    if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
    await _flushSave();
}

export async function factoryReset() {
    configState.isLoading = true;
    try {
        if (!devMode.active) {
            await transport.factoryReset();
        }
        await loadConfig();   // Recharger après reset
    } catch (err) {
        configState.loadError = err.message;
        console.error('[config] Erreur factory reset :', err);
    } finally {
        configState.isLoading = false;
    }
}

// ─────────────────────────────────────────────────────────────
//  IMPORT / EXPORT .spinpad
// ─────────────────────────────────────────────────────────────

/**
 * Exporte la config courante en fichier .spinpad (JSON structuré).
 * Déclenche un téléchargement dans le navigateur.
 */
export function exportConfig() {
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
}

/**
 * Importe une config depuis un fichier .spinpad ou .json brut.
 * @param {File} file
 * @returns {Promise<void>}
 */
export async function importConfig(file) {
    const text = await file.text();
    let parsed;
    try {
        const raw = JSON.parse(text);
        // Supporte les deux formats : wrapper .spinpad et JSON brut
        parsed = raw._type ? parseSpinpadFile(raw) : raw;
    } catch (err) {
        throw new Error(`Fichier invalide : ${err.message}`);
    }
    configState.data = parsed;
    configState.activeProfileIndex = parsed.active_profile ?? 0;
    configState.isDirty = true;
    _scheduleSave();
}

// ─────────────────────────────────────────────────────────────
//  MUTATIONS (keymap + encoder)
//
//  Toutes les mutations :
//   1. Appliquent le changement via structuredClone (immutabilité)
//   2. Marquent isDirty = true
//   3. Déclenchent l'auto-save (debounce 800ms)
// ─────────────────────────────────────────────────────────────

/**
 * Mise à jour générique d'un champ de config via un chemin pointé (ex: "display.brightness").
 * Crée les objets intermédiaires manquants, marque isDirty et déclenche l'auto-save.
 * À utiliser depuis les composants UI (SettingsTab, etc.) à la place d'un update() local.
 * @param {string} path   Chemin pointé, ex: "display.brightness", "led_extension.enabled"
 * @param {*}      value  Nouvelle valeur
 */
export function updateConfig(path, value) {
    const cfg   = $state.snapshot(configState.data);
    const parts = path.split('.');
    let obj = cfg;
    for (let i = 0; i < parts.length - 1; i++) {
        if (obj[parts[i]] == null) obj[parts[i]] = {};
        obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
    configState.data    = cfg;
    configState.isDirty = true;
    _scheduleSave();
}

export function setKeyAction(profileIdx, layerIdx, keyIndex, actionValue) {
    const cfg = $state.snapshot(configState.data);
    cfg.profiles[profileIdx].layers[layerIdx].keys[keyIndex] = actionValue;
    configState.data = cfg;
    configState.isDirty = true;
    _scheduleSave();
}

export function setEncoderAction(profileIdx, layerIdx, direction, actionValue) {
    const cfg = $state.snapshot(configState.data);
    cfg.profiles[profileIdx].layers[layerIdx].encoder[direction] = actionValue;
    configState.data = cfg;
    configState.isDirty = true;
    _scheduleSave();
}

export function addCombo(profileIdx, combo) {
    const cfg = $state.snapshot(configState.data);
    cfg.profiles[profileIdx].combos.push(combo);
    configState.data = cfg;
    configState.isDirty = true;
    _scheduleSave();
}

export function removeCombo(profileIdx, comboIdx) {
    const cfg = $state.snapshot(configState.data);
    cfg.profiles[profileIdx].combos.splice(comboIdx, 1);
    configState.data = cfg;
    configState.isDirty = true;
    _scheduleSave();
}
