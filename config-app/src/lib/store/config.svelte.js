import { getConfig, setConfig }  from '$lib/serial/index.svelte.js';
import { devMode }               from '$lib/store/devMode.svelte.js';
import { MOCK_CONFIG }           from '$lib/mock/keyboard-config.js';

class ConfigState {
    data               = $state(null);
    activeProfileIndex = $state(0);
    activeLayerIndex   = $state(0);
    isDirty            = $state(false);
    isLoading          = $state(false);
    loadError          = $state(null);

    get activeProfile() {
        return this.data?.profiles?.[this.activeProfileIndex] ?? null;
    }
    get activeLayer() {
        return this.activeProfile?.layers?.[this.activeLayerIndex] ?? null;
    }
}

export const configState = new ConfigState();

export async function loadConfig() {
    configState.isLoading = true;
    configState.loadError = null;
    try {
        if (devMode.active) {
            await new Promise(r => setTimeout(r, 300)); // simule latence
            configState.data               = structuredClone(MOCK_CONFIG);
            configState.activeProfileIndex = MOCK_CONFIG.active_profile ?? 0;
            configState.isDirty            = false;
            return;
        }
        const cfg = await getConfig();
        configState.data               = cfg;
        configState.activeProfileIndex = cfg.active_profile ?? 0;
        configState.isDirty            = false;
    } catch (err) {
        configState.loadError = err.message;
        console.error('Erreur chargement config :', err);
    } finally {
        configState.isLoading = false;
    }
}

export async function saveConfig() {
    configState.isLoading = true;
    try {
        if (devMode.active) {
            await new Promise(r => setTimeout(r, 200));
            configState.isDirty = false;
            return;
        }
        await setConfig(configState.data);
        configState.isDirty = false;
    } catch (err) {
        configState.loadError = err.message;
        console.error('Erreur sauvegarde :', err);
    } finally {
        configState.isLoading = false;
    }
}

export function setKeyAction(profileIdx, layerIdx, keyIndex, actionValue) {
    const cfg = structuredClone(configState.data);
    cfg.profiles[profileIdx].layers[layerIdx].keys[keyIndex] = actionValue;
    configState.data    = cfg;
    configState.isDirty = true;
}

export function setEncoderAction(profileIdx, layerIdx, direction, actionValue) {
    const cfg = structuredClone(configState.data);
    cfg.profiles[profileIdx].layers[layerIdx].encoder[direction] = actionValue;
    configState.data    = cfg;
    configState.isDirty = true;
}

export function addCombo(profileIdx, combo) {
    const cfg = structuredClone(configState.data);
    cfg.profiles[profileIdx].combos.push(combo);
    configState.data    = cfg;
    configState.isDirty = true;
}

export function removeCombo(profileIdx, comboIdx) {
    const cfg = structuredClone(configState.data);
    cfg.profiles[profileIdx].combos.splice(comboIdx, 1);
    configState.data    = cfg;
    configState.isDirty = true;
}
