// ═══════════════════════════════════════════════════════════════
//  store/trainingMode.svelte.ts — Mode training (config rapide)
//
//  L'appui sur SWn du device ouvre le KeycodePicker de cette touche
//  dans le studio. Le firmware supprime l'exécution de l'action
//  pendant ce mode (cf. cmd "training_mode").
//
//  Visual feedback (pulses, press-sim) is handled by keyVisuals which
//  is always-on when connected. trainingMode only manages:
//    - trainingModeCmd (firmware gate)
//    - requestedTarget (picker trigger)
//    - devMode: intercepts keyboard to set requestedTarget for encoder
// ═══════════════════════════════════════════════════════════════

import { trainingModeCmd, onMessage, serial } from './serial.svelte.js';
import { devMode } from './devMode.svelte.js';
import { testMode } from './testMode.svelte.js';

const DEV_KEY_MAP: Record<string, number> = {
  Digit1: 0,
  Digit2: 1,
  Digit3: 2,
  Digit4: 3,
  Digit5: 4,
  Digit6: 5,
  Digit7: 6,
  Digit8: 7,
  Digit9: 8,
  Digit0: 9,
  Numpad1: 0,
  Numpad2: 1,
  Numpad3: 2,
  Numpad4: 3,
  Numpad5: 4,
  Numpad6: 5,
  Numpad7: 6,
  Numpad8: 7,
  Numpad9: 8,
  Numpad0: 9,
};

type TrainingTarget = { kind: 'key'; idx: number } | { kind: 'encoder'; field: 'cw' | 'ccw' | 'press' };

class TrainingModeState {
  active = $state(false);
  /** Cible demandée — lu et nullé par Editor.svelte qui ouvre le picker. */
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
    if (testMode.active) await testMode.stop();
    this.active = true;

    if (devMode.active) {
      const onKey = (e: KeyboardEvent) => {
        if (e.repeat) return;
        const idx = DEV_KEY_MAP[e.code];
        if (idx !== undefined) {
          this.#triggerKey(idx);
          return;
        }
        if (e.code === 'ArrowRight') {
          e.preventDefault();
          this.#triggerEncoder('cw');
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          this.#triggerEncoder('ccw');
        } else if (e.code === 'Space') {
          e.preventDefault();
          this.#triggerEncoder('press');
        }
      };
      window.addEventListener('keydown', onKey, true);
      this.#cleanup = () => window.removeEventListener('keydown', onKey, true);
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
