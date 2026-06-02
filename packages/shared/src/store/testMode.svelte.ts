// ═══════════════════════════════════════════════════════════════
//  store/testMode.svelte.ts — Mode test (kept for UI state only)
//
//  Visual feedback is now always-on via keyVisuals. testMode.active
//  is kept solely to reflect the dropdown label in tile-main.
// ═══════════════════════════════════════════════════════════════

import { trainingMode } from './trainingMode.svelte.js';

class TestModeState {
  active = $state(false);

  async start(): Promise<void> {
    if (this.active) return;
    if (trainingMode.active) await trainingMode.stop();
    this.active = true;
  }

  async stop(): Promise<void> {
    if (!this.active) return;
    this.active = false;
  }

  async toggle(): Promise<void> {
    return this.active ? this.stop() : this.start();
  }
}

export const testMode = new TestModeState();
