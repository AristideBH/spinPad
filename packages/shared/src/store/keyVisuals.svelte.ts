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
import { bindDevKeySimulation } from '$shared/lib/dev-key-simulation.js';

class KeyVisualsState {
  pressNonce = $state<number[]>(Array(10).fill(0));
  pressed = $state<boolean[]>(Array(10).fill(false));
  // Encoder: signed cumulative position (CW +1 / CCW -1) and press counter.
  // Reactive -> consumable by the visualizations (e.g. LedMatrix).
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
      this.#cleanup = bindDevKeySimulation({
        onKey: (idx) => this.fire(idx),
        onEncoderCW: () => { getActiveEncoderKnob()?.pulseCW(); this.encoderTurn++; },
        onEncoderCCW: () => { getActiveEncoderKnob()?.pulseCCW(); this.encoderTurn--; },
        onEncoderPress: () => { getActiveEncoderKnob()?.pulsePress(); this.encoderPress++; },
      });
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
