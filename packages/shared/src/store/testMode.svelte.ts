// ═══════════════════════════════════════════════════════════════
//  store/testMode.svelte.ts — Mode test des touches
//
//  Visualisation live des appuis sur le KeyGrid pour vérifier le
//  câblage / la programmation après flash. Aucun compteur persisté
//  (les stats device couvrent l'usage long-terme).
// ═══════════════════════════════════════════════════════════════

import { keyMonitor, onKeyEvent, serial } from './serial.svelte.js';
import { devMode } from './devMode.svelte.js';
import { trainingMode } from './trainingMode.svelte.js';

/** En devMode, mappe les touches physiques 1..9,0 → SW1..SW10 (idx 0..9). */
const DEV_KEY_MAP: Record<string, number> = {
  Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4,
  Digit6: 5, Digit7: 6, Digit8: 7, Digit9: 8, Digit0: 9,
  Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3, Numpad5: 4,
  Numpad6: 5, Numpad7: 6, Numpad8: 7, Numpad9: 8, Numpad0: 9,
};

class TestModeState {
  active = $state(false);
  /** Nonce incrémenté à chaque press — remount le pulse via {#key}. */
  pressNonce = $state<number[]>(Array(10).fill(0));
  /** Flag transitoire (120ms) pour mimer l'état :active. */
  pressed = $state<boolean[]>(Array(10).fill(false));

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
  }

  async start(): Promise<void> {
    if (this.active) return;
    if (!devMode.active && !serial.connected) return;
    // Mutex avec training : un seul mode live actif à la fois.
    if (trainingMode.active) await trainingMode.stop();
    this.active = true;

    // DevMode : pas de device → écoute clavier physique (1..9,0 → SW1..SW10).
    if (devMode.active) {
      const onKey = (e: KeyboardEvent) => {
        if (e.repeat) return;
        const idx = DEV_KEY_MAP[e.code];
        if (idx !== undefined) this.#fire(idx);
      };
      window.addEventListener('keydown', onKey, true);
      this.#cleanup = () => window.removeEventListener('keydown', onKey, true);
      return;
    }

    await keyMonitor(true);
    this.#cleanup = onKeyEvent((evt: { idx: number; state: string }) => {
      if (evt.state === 'down') this.#fire(evt.idx);
    });
  }

  async stop(): Promise<void> {
    if (!this.active) return;
    this.active = false;
    this.#cleanup?.();
    this.#cleanup = null;
    if (devMode.active) return;
    try {
      await keyMonitor(false);
    } catch {
      // device may already be disconnected
    }
  }

  async toggle(): Promise<void> {
    return this.active ? this.stop() : this.start();
  }
}

export const testMode = new TestModeState();
