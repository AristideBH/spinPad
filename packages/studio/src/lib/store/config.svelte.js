// ═══════════════════════════════════════════════════════════════
//  config.svelte.js — State global de la configuration SpinPad
//
//  Transport sélectionné au build :
//    VITE_TRANSPORT=http  → transport/http.js  (Studio Mode embarqué)
//    (défaut)             → serial/index.svelte.js (WebSerial USB)
//    VITE_DEV_MODE=true   → mock data (développement sans device)
// ═══════════════════════════════════════════════════════════════

import { devMode } from '$lib/store/devMode.svelte.js';
import { MOCK_CONFIG } from '$lib/mock/keyboard-config.js';

// ── Sélection du transport ────────────────────────────────────
// Déterminé au build via la variable d'environnement VITE_TRANSPORT.
// Le branchement statique permet à Vite de tree-shaker le transport inutilisé.

const USE_HTTP = import.meta.env.VITE_TRANSPORT === 'http';

// Import dynamique des transports (les deux sont bundlés, mais seul l'actif est utilisé)
import * as serialTransport from '$lib/serial/index.svelte.js';
import * as httpTransport   from '$lib/transport/http.js';

/** @type {{ getConfig: () => Promise<object>, setConfig: (d: object) => Promise<void>, factoryReset: () => Promise<void> }} */
const transport = USE_HTTP ? httpTransport : serialTransport;

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
//  SAUVEGARDE
// ─────────────────────────────────────────────────────────────

export async function saveConfig() {
    if (!configState.data) return;
    configState.isSaving = true;
    try {
        if (devMode.active) {
            await new Promise(r => setTimeout(r, 200));
            configState.isDirty = false;
            return;
        }
        await transport.setConfig(configState.data);
        configState.isDirty = false;
    } catch (err) {
        configState.loadError = err.message;
        console.error('[config] Erreur sauvegarde :', err);
    } finally {
        configState.isSaving = false;
    }
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
//  MUTATIONS (keymap + encoder)
// ─────────────────────────────────────────────────────────────

export function setKeyAction(profileIdx, layerIdx, keyIndex, actionValue) {
    const cfg = structuredClone(configState.data);
    cfg.profiles[profileIdx].layers[layerIdx].keys[keyIndex] = actionValue;
    configState.data = cfg;
    configState.isDirty = true;
}

export function setEncoderAction(profileIdx, layerIdx, direction, actionValue) {
    const cfg = structuredClone(configState.data);
    cfg.profiles[profileIdx].layers[layerIdx].encoder[direction] = actionValue;
    configState.data = cfg;
    configState.isDirty = true;
}

export function addCombo(profileIdx, combo) {
    const cfg = structuredClone(configState.data);
    cfg.profiles[profileIdx].combos.push(combo);
    configState.data = cfg;
    configState.isDirty = true;
}

export function removeCombo(profileIdx, comboIdx) {
    const cfg = structuredClone(configState.data);
    cfg.profiles[profileIdx].combos.splice(comboIdx, 1);
    configState.data = cfg;
    configState.isDirty = true;
}
