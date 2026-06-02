// ═══════════════════════════════════════════════════════════════
//  store/trainingMode.svelte.ts — Mode training (config rapide)
//
//  L'appui sur SWn du device ouvre le KeycodePicker de cette touche
//  dans le studio. Le firmware supprime l'exécution de l'action
//  pendant ce mode (cf. cmd "training_mode").
//
//  DevMode encodeur : ArrowLeft/ArrowRight/Space → ccw/cw/press.
//  TODO firmware : streamer {event:"encoder",dir:"cw"|"ccw"|"press"} via
//  _monitor_emit() + gate g_training_mode dans le dispatch encodeur
//  (mêmes hooks que send_action()). Côté store : brancher onKeyEvent sur
//  evt.event === 'encoder' → #fireEncoder(evt.dir).
// ═══════════════════════════════════════════════════════════════

import { keyMonitor, trainingModeCmd, onKeyEvent, serial } from './serial.svelte.js';
import { devMode } from './devMode.svelte.js';
import { testMode } from './testMode.svelte.js';
import { getActiveEncoderKnob } from '$shared/components/app/studio/editor/encoder.svelte.js';

const DEV_KEY_MAP: Record<string, number> = {
  Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4,
  Digit6: 5, Digit7: 6, Digit8: 7, Digit9: 8, Digit0: 9,
  Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3, Numpad5: 4,
  Numpad6: 5, Numpad7: 6, Numpad8: 7, Numpad9: 8, Numpad0: 9,
};

export type TrainingTarget =
  | { kind: 'key'; idx: number }
  | { kind: 'encoder'; field: 'cw' | 'ccw' | 'press' };

class TrainingModeState {
  active = $state(false);
  pressNonce = $state<number[]>(Array(10).fill(0));
  pressed = $state<boolean[]>(Array(10).fill(false));
  /** Cible demandée — lu et nullé par Editor.svelte qui ouvre le picker. */
  requestedTarget = $state<TrainingTarget | null>(null);

  #cleanup: (() => void) | null = null;
  #releaseTimers: Array<ReturnType<typeof setTimeout> | null> = Array(10).fill(null);

  #fire(idx: number): void {
    if (idx < 0 || idx >= 10) return;
    this.pressNonce[idx]++;
    this.pressed[idx] = true;
    if (this.#releaseTimers[idx]) clearTimeout(this.#releaseTimers[idx]!);
    this.#releaseTimers[idx] = setTimeout(() => {
      this.pressed[idx] = false;
      this.#releaseTimers[idx] = null;
    }, 120);
    this.requestedTarget = { kind: 'key', idx };
  }

  #fireEncoder(field: 'cw' | 'ccw' | 'press'): void {
    const knob = getActiveEncoderKnob();
    if (field === 'cw') knob?.pulseCW();
    else if (field === 'ccw') knob?.pulseCCW();
    else knob?.pulsePress();
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
          this.#fire(idx);
          return;
        }
        if (e.code === 'ArrowRight') {
          e.preventDefault();
          this.#fireEncoder('cw');
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          this.#fireEncoder('ccw');
        } else if (e.code === 'Space') {
          e.preventDefault();
          this.#fireEncoder('press');
        }
      };
      window.addEventListener('keydown', onKey, true);
      this.#cleanup = () => window.removeEventListener('keydown', onKey, true);
      return;
    }

    await keyMonitor(true);
    await trainingModeCmd(true);
    this.#cleanup = onKeyEvent((evt: { idx: number; state: string }) => {
      if (evt.state === 'down') this.#fire(evt.idx);
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
      await keyMonitor(false);
    } catch {
      // device may already be disconnected
    }
  }

  async toggle(): Promise<void> {
    return this.active ? this.stop() : this.start();
  }
}

export const trainingMode = new TrainingModeState();
