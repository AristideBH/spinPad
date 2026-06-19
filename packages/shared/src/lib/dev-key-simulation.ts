// ═══════════════════════════════════════════════════════════════
//  lib/dev-key-simulation.ts — Shared devMode keyboard → key/encoder mapping
//
//  Used by keyVisuals and trainingMode to simulate device key/encoder
//  events from the physical keyboard when devMode is active (no real
//  device connected). Both can be bound at the same time (keyVisuals is
//  always-on while devMode is active, trainingMode layers on top) and both
//  must react to the same keydown — so this module fans a single
//  dispatcher scope out to every currently-bound handler set, rather than
//  registering one scope per caller.
// ═══════════════════════════════════════════════════════════════

import { keyboardDispatcher, KEYBOARD_PRIORITY, type KeyboardScopeHandle } from './keyboard-dispatcher.js';

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

const _handlers = new Set<DevKeySimulationHandlers>();
let _scope: KeyboardScopeHandle | null = null;

function dispatchToHandlers(e: KeyboardEvent): boolean {
  if (e.repeat) return false;
  const idx = DEV_KEY_MAP[e.code];
  if (idx !== undefined) {
    for (const h of _handlers) h.onKey(idx);
    return true;
  }
  if (e.code === 'ArrowRight') {
    e.preventDefault();
    for (const h of _handlers) h.onEncoderCW?.();
    return true;
  }
  if (e.code === 'ArrowLeft') {
    e.preventDefault();
    for (const h of _handlers) h.onEncoderCCW?.();
    return true;
  }
  if (e.code === 'Space') {
    e.preventDefault();
    for (const h of _handlers) h.onEncoderPress?.();
    return true;
  }
  return false;
}

/** Binds a devMode keydown listener that maps digit/numpad keys + arrows/space to key/encoder events. Returns the cleanup function. */
export function bindDevKeySimulation(handlers: DevKeySimulationHandlers): () => void {
  _handlers.add(handlers);
  if (!_scope) {
    _scope = keyboardDispatcher.push({ priority: KEYBOARD_PRIORITY.DEV_SIM, onKey: dispatchToHandlers });
  }
  return () => {
    _handlers.delete(handlers);
    if (_handlers.size === 0) {
      _scope?.pop();
      _scope = null;
    }
  };
}
