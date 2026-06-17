import { getContext, setContext } from 'svelte';
import type { LayerConfig, ProfileConfig } from '$shared/constants/config-schema.js';
import { configState, setEncoderAction, setKeyAction } from '$shared/store/config.svelte.js';
import { ACTION_TYPES, action } from '$shared/constants/action-types.js';
import { getKeycodeLabel } from '$shared/constants/keycodes.js';
import { SW_BY_IDX } from '$shared/constants/key-layout.js';

const CTX_KEY = Symbol('keypad');

export type KeycodeOption = { value: number; label: string; category: string };

/** Picker navigation steps. */
export type PickerStage = 'menu' | 'record' | 'list' | 'led';

const ENCODER_FIELD_LABEL: Record<string, string> = {
  encoder_cw: 'Encoder → Rotation ↻',
  encoder_ccw: 'Encoder → Rotation ↺',
  encoder_press: 'Encoder → Press',
};

export class KeypadContext {
  // ── Picker ────────────────────────────────────────────────────
  editingKey = $state<number | null>(null);
  editingField = $state<string | null>(null);
  searchQuery = $state('');
  pickerOpen = $state(false);
  pickerStage = $state<PickerStage>('menu');
  simulationActive = $state(false);

  // ── Derived ───────────────────────────────────────────────────
  readonly profile = $derived(
    configState.data?.profiles?.[configState.activeProfileIndex] as ProfileConfig | undefined,
  );
  readonly layer = $derived(this.profile?.layers?.[configState.activeLayerIndex] as LayerConfig | undefined);
  readonly orientDeg = $derived(([0, 90, 180, 270] as const)[configState.data?.orientation ?? 0] ?? 0);

  // Unused — kept for upcoming BLE-slot-name UI work.
  // readonly profile_count = $derived(configState.data?.profiles?.length);
  // readonly active_profile = $derived(configState.activeProfileIndex);
  //
  // getActiveProfile(): ProfileConfig | undefined {
  //   return configState.data?.profiles?.[configState.activeProfileIndex ?? 0];
  // }
  //
  // getBleActiveSlotName(): string | undefined {
  //   return configState.data?.ble?.slot_names?.[configState.data?.ble?.active_slot ?? 0];
  // }

  // ── Picker methods ────────────────────────────────────────────
  openKeyPicker(keyIndex: number): void {
    if (this.simulationActive) return;
    this.editingKey = keyIndex;
    this.editingField = 'key';
    this.searchQuery = '';
    this.pickerStage = 'menu';
    this.pickerOpen = true;
  }

  openEncoderPicker(field: string): void {
    this.editingKey = null;
    this.editingField = field;
    this.searchQuery = '';
    this.pickerStage = 'menu';
    this.pickerOpen = true;
  }

  setStage(stage: PickerStage): void {
    this.searchQuery = '';
    this.pickerStage = stage;
  }

  /** Target being edited: SWx key name, encoder field, or default prompt. */
  readonly editTargetSw = $derived.by(() => {
    if (this.editingField === 'key' && this.editingKey !== null) {
      return SW_BY_IDX[this.editingKey] ?? `Key ${this.editingKey}`;
    }
    if (this.editingField) return ENCODER_FIELD_LABEL[this.editingField] ?? this.editingField;
    return 'Choose an action';
  });

  /** Action currently assigned to the target (only when editing a key), otherwise null. */
  readonly editTargetCurrent = $derived.by(() => {
    if (this.editingField === 'key' && this.editingKey !== null) {
      return getKeycodeLabel(this.layer?.keys?.[this.editingKey] ?? 0, configState.data?.macros);
    }
    return null;
  });

  /** Full text label (for accessible sr-only titles). */
  readonly editTargetLabel = $derived(
    this.editTargetCurrent ? `${this.editTargetSw} · ${this.editTargetCurrent}` : this.editTargetSw,
  );

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

  /** Assigns a macro (by index) to the current field, then closes the picker. */
  assignMacro(idx: number): void {
    this.selectKeycode({ value: action(ACTION_TYPES.ACTION_TYPE_MACRO, idx), label: '', category: 'macro' });
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

}

export function createKeypadContext(): KeypadContext {
  return setContext(CTX_KEY, new KeypadContext());
}

export function getKeypadContext(): KeypadContext {
  return getContext<KeypadContext>(CTX_KEY);
}
