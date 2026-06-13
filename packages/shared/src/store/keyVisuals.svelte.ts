// ═══════════════════════════════════════════════════════════════
//  store/keyVisuals.svelte.ts — Always-on key/encoder visual feedback
//
//  Fires pulse + press-sim animations on KeyGrid and the Knob whenever a
//  key or encoder event arrives from the device (or DevMode keyboard).
//  Active as long as serial is connected or devMode is on — no user toggle
//  required. TrainingMode layered on top for picker logic.
// ═══════════════════════════════════════════════════════════════

import { keyMonitor, onMessage, serial } from './serial.svelte.js';
import { devMode } from './devMode.svelte.js';
import { getActiveEncoderKnob } from '$shared/components/app/studio/editor/encoder/encoder.svelte.js';

const DEV_KEY_MAP: Record<string, number> = {
  Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4,
  Digit6: 5, Digit7: 6, Digit8: 7, Digit9: 8, Digit0: 9,
  Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3, Numpad5: 4,
  Numpad6: 5, Numpad7: 6, Numpad8: 7, Numpad9: 8, Numpad0: 9,
};

class KeyVisualsState {
  pressNonce = $state<number[]>(Array(10).fill(0));
  pressed = $state<boolean[]>(Array(10).fill(false));
  // Encodeur : position cumulée signée (CW +1 / CCW -1) et compteur d'appuis.
  // Réactifs -> consommables par les visualisations (ex. LedMatrix).
  encoderTurn = $state(0);
  encoderPress = $state(0);

  #cleanup: (() => void) | null = null;
  #releaseTimers: Array<ReturnType<typeof setTimeout> | null> = Array(10).fill(null);

  fire(idx: number): void {
    if (idx < 0 || idx >= 10) return;
    this.pressNonce[idx]++;
    this.pressed[idx] = true;
    if (this.#releaseTimers[idx]) clearTimeout(this.#releaseTimers[idx]!);
    this.#releaseTimers[idx] = setTimeout(() => {
      this.pressed[idx] = false;
      this.#releaseTimers[idx] = null;
    }, 120);
  }

  async start(): Promise<void> {
    if (this.#cleanup) return;

    if (devMode.active) {
      const onKey = (e: KeyboardEvent) => {
        if (e.repeat) return;
        const idx = DEV_KEY_MAP[e.code];
        if (idx !== undefined) {
          this.fire(idx);
          return;
        }
        const knob = getActiveEncoderKnob();
        if (e.code === 'ArrowRight') { e.preventDefault(); knob?.pulseCW(); this.encoderTurn++; }
        else if (e.code === 'ArrowLeft') { e.preventDefault(); knob?.pulseCCW(); this.encoderTurn--; }
        else if (e.code === 'Space') { e.preventDefault(); knob?.pulsePress(); this.encoderPress++; }
      };
      window.addEventListener('keydown', onKey, true);
      this.#cleanup = () => window.removeEventListener('keydown', onKey, true);
      return;
    }

    await keyMonitor(true);
    this.#cleanup = onMessage((msg) => {
      const m = msg as Record<string, unknown>;
      if (!m) return;
      if (m['event'] === 'key' && m['state'] === 'down') {
        this.fire(m['idx'] as number);
      } else if (m['event'] === 'encoder') {
        const knob = getActiveEncoderKnob();
        if (m['dir'] === 'cw') { knob?.pulseCW(); this.encoderTurn++; }
        else if (m['dir'] === 'ccw') { knob?.pulseCCW(); this.encoderTurn--; }
        else if (m['dir'] === 'press') { knob?.pulsePress(); this.encoderPress++; }
      }
    });
  }

  async stop(): Promise<void> {
    this.#cleanup?.();
    this.#cleanup = null;
    if (devMode.active) return;
    try { await keyMonitor(false); } catch { /* device may be disconnected */ }
  }
}

export const keyVisuals = new KeyVisualsState();
