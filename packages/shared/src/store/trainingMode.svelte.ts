// ═══════════════════════════════════════════════════════════════
//  store/trainingMode.svelte.ts — Training mode (quick config)
//
//  Pressing SWn on the device opens the KeycodePicker for that key
//  in the studio. The firmware suppresses execution of the action
//  during this mode (cf. cmd "training_mode").
//
//  Visual feedback (pulses, press-sim) is handled by keyVisuals which
//  is always-on when connected. trainingMode only manages:
//    - trainingModeCmd (firmware gate)
//    - requestedTarget (picker trigger)
//    - devMode: intercepts keyboard to set requestedTarget for encoder
// ═══════════════════════════════════════════════════════════════

import { trainingModeCmd, onMessage, serial } from './serial.svelte.js';
import { devMode } from './devMode.svelte.js';
import { bindDevKeySimulation } from '$shared/lib/dev-key-simulation.js';

type TrainingTarget = { kind: 'key'; idx: number } | { kind: 'encoder'; field: 'cw' | 'ccw' | 'press' };

class TrainingModeState {
  active = $state(false);
  /** Requested target — read and nulled by Editor.svelte which opens the picker. */
  requestedTarget = $state<TrainingTarget | null>(null);

  #cleanup: (() => void) | null = null;

  #triggerKey(idx: number): void {
    this.requestedTarget = { kind: 'key', idx };
  }

  #triggerEncoder(field: 'cw' | 'ccw' | 'press'): void {
    this.requestedTarget = { kind: 'encoder', field };
  }

  async start(): Promise<void> {
    if (this.active) return;
    if (!devMode.active && !serial.connected) return;
    this.active = true;

    if (devMode.active) {
      this.#cleanup = bindDevKeySimulation({
        onKey: (idx) => this.#triggerKey(idx),
        onEncoderCW: () => this.#triggerEncoder('cw'),
        onEncoderCCW: () => this.#triggerEncoder('ccw'),
        onEncoderPress: () => this.#triggerEncoder('press'),
      });
      return;
    }

    await trainingModeCmd(true);
    this.#cleanup = onMessage((msg) => {
      const m = msg as Record<string, unknown>;
      if (!m) return;
      if (m['event'] === 'key' && m['state'] === 'down') this.#triggerKey(m['idx'] as number);
      else if (m['event'] === 'encoder') this.#triggerEncoder(m['dir'] as 'cw' | 'ccw' | 'press');
    });
  }

  async stop(): Promise<void> {
    if (!this.active) return;
    this.active = false;
    this.#cleanup?.();
    this.#cleanup = null;
    this.requestedTarget = null;
    if (devMode.active) return;
    try {
      await trainingModeCmd(false);
    } catch {
      /* device may be disconnected */
    }
  }

  async toggle(): Promise<void> {
    return this.active ? this.stop() : this.start();
  }
}

export const trainingMode = new TrainingModeState();
