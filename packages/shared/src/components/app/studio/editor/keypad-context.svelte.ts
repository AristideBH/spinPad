import { getContext, setContext } from 'svelte';
import type { LayerConfig, ProfileConfig } from '$shared/constants/config-schema.js';
import { configState, setEncoderAction, setKeyAction } from '$shared/store/config.svelte.js';
import { keyMonitor, onKeyEvent, serial } from '$shared/store/serial.svelte.js';

const CTX_KEY = Symbol('keypad');

export type KeycodeOption = { value: number; label: string; category: string };

export class KeypadContext {
  // ── Picker ────────────────────────────────────────────────────
  editingKey = $state<number | null>(null);
  editingField = $state<string | null>(null);
  searchQuery = $state('');
  pickerOpen = $state(false);

  // ── Training ──────────────────────────────────────────────────
  trainingActive = $state(false);
  keyPressCounts = $state<number[]>(Array(10).fill(0));
  keyFlash = $state<number[]>(Array(10).fill(0));
  #trainingCleanup: (() => void) | null = null;

  // ── Derived ───────────────────────────────────────────────────
  readonly profile = $derived(
    configState.data?.profiles?.[configState.activeProfileIndex] as ProfileConfig | undefined,
  );
  readonly layer = $derived(this.profile?.layers?.[configState.activeLayerIndex] as LayerConfig | undefined);
  readonly orientDeg = $derived(([0, 90, 180, 270] as const)[configState.data?.orientation ?? 0] ?? 0);

  readonly profile_count = $derived(configState.data?.profiles?.length);
  readonly active_profile = $derived(configState.activeProfileIndex);

  getActiveProfile(): ProfileConfig | undefined {
    return configState.data?.profiles?.[configState.activeProfileIndex ?? 0];
  }

  getBleActiveSlotName(): string | undefined {
    return configState.data?.ble?.slot_names?.[configState.data?.ble?.active_slot ?? 0];
  }

  // ── Picker methods ────────────────────────────────────────────
  openKeyPicker(keyIndex: number): void {
    this.editingKey = keyIndex;
    this.editingField = 'key';
    this.searchQuery = '';
    this.pickerOpen = true;
  }

  openEncoderPicker(field: string): void {
    this.editingKey = null;
    this.editingField = field;
    this.searchQuery = '';
    this.pickerOpen = true;
  }

  selectKeycode(kc: KeycodeOption): void {
    const pi = configState.activeProfileIndex;
    const li = configState.activeLayerIndex;
    if (this.editingField === 'key' && this.editingKey !== null) {
      setKeyAction(pi, li, this.editingKey, kc.value);
    } else if (this.editingField === 'encoder_cw') {
      setEncoderAction(pi, li, 'cw', kc.value);
    } else if (this.editingField === 'encoder_ccw') {
      setEncoderAction(pi, li, 'ccw', kc.value);
    } else if (this.editingField === 'encoder_press') {
      setEncoderAction(pi, li, 'press', kc.value);
    }
    this.pickerOpen = false;
  }

  // ── Training methods ──────────────────────────────────────────
  async toggleTraining(): Promise<void> {
    if (!serial.connected) return;
    this.trainingActive = !this.trainingActive;
    await keyMonitor(this.trainingActive);
    if (this.trainingActive) {
      this.#trainingCleanup = onKeyEvent((evt: { idx: number; state: string }) => {
        if (evt.idx >= 0 && evt.idx < 10 && evt.state === 'down') {
          this.keyPressCounts[evt.idx]++;
          this.keyFlash[evt.idx] = Date.now();
        }
      });
    } else {
      this.#trainingCleanup?.();
      this.#trainingCleanup = null;
    }
  }

  stopTraining(): void {
    this.trainingActive = false;
    this.#trainingCleanup?.();
    this.#trainingCleanup = null;
  }

  resetLayer(layerIdx: number = configState.activeLayerIndex): void {
    const pi = configState.activeProfileIndex;
    const li = layerIdx;
    if (pi === null || li === null) return;
    const layer = this.profile?.layers?.[li];
    if (!layer) return;
    for (let i = 0; i < layer.keys.length; i++) {
      setKeyAction(pi, li, i, 0);
    }
    // setEncoderAction(pi, li, 'cw', 0);
    // setEncoderAction(pi, li, 'ccw', 0);
    // setEncoderAction(pi, li, 'press', 0);
  }

  resetTrainingCounts(): void {
    this.keyPressCounts = Array(10).fill(0);
    this.keyFlash = Array(10).fill(0);
  }

  keyFlashOpacity(idx: number): number {
    const age = Date.now() - this.keyFlash[idx];
    return age > 600 ? 0 : Math.max(0, 1 - age / 600);
  }
}

export function createKeypadContext(): KeypadContext {
  return setContext(CTX_KEY, new KeypadContext());
}

export function getKeypadContext(): KeypadContext {
  return getContext<KeypadContext>(CTX_KEY);
}
