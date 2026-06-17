// ═══════════════════════════════════════════════════════════════
//  lib/dev-key-simulation.ts — Shared devMode keyboard → key/encoder mapping
//
//  Used by keyVisuals and trainingMode to simulate device key/encoder
//  events from the physical keyboard when devMode is active (no real
//  device connected).
// ═══════════════════════════════════════════════════════════════

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

export interface DevKeySimulationHandlers {
  onKey(idx: number): void;
  onEncoderCW?(): void;
  onEncoderCCW?(): void;
  onEncoderPress?(): void;
}

/** Binds a devMode keydown listener that maps digit/numpad keys + arrows/space to key/encoder events. Returns the cleanup function. */
export function bindDevKeySimulation(handlers: DevKeySimulationHandlers): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const idx = DEV_KEY_MAP[e.code];
    if (idx !== undefined) {
      handlers.onKey(idx);
      return;
    }
    if (e.code === 'ArrowRight') {
      e.preventDefault();
      handlers.onEncoderCW?.();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      handlers.onEncoderCCW?.();
    } else if (e.code === 'Space') {
      e.preventDefault();
      handlers.onEncoderPress?.();
    }
  };
  window.addEventListener('keydown', onKey, true);
  return () => window.removeEventListener('keydown', onKey, true);
}
