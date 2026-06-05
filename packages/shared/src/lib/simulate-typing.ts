import { keyVisuals } from '$shared/store/keyVisuals.svelte.js';
import type { KeypadContext } from '$shared/components/app/studio/editor/keypad-context.svelte.js';

export type EasingPreset = 'ease-out' | 'ease-in' | 'linear';

export interface SimulateTypingOptions {
  /** Total animation duration in ms. Default: 1800. */
  duration?: number;
  /** Keys per word burst (±1 randomised). Default: 3. */
  keysPerBurst?: number;
  /** Temporal density distribution. Default: 'ease-out' (front-loaded). */
  easing?: EasingPreset;
}

const KEY_COUNT = 10;

function easeRandom(preset: EasingPreset): number {
  const u = Math.random();
  switch (preset) {
    case 'ease-out': return u * u;          // front-loaded
    case 'ease-in':  return 1 - (1 - u) * (1 - u); // back-loaded
    case 'linear':   return u;
  }
}

/**
 * Simulates typing by firing staggered key presses on the KeyGrid.
 * Sets `ctx.simulationActive` while running — `openKeyPicker` is gated by this flag.
 * Returns a cancel fn that clears all pending timeouts immediately.
 */
export function simulateTyping(
  ctx: KeypadContext,
  options: SimulateTypingOptions = {},
): () => void {
  const { duration = 1800, keysPerBurst = 3, easing = 'ease-out' } = options;

  ctx.simulationActive = true;
  const timers: ReturnType<typeof setTimeout>[] = [];

  let cancelled = false;
  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    timers.forEach(clearTimeout);
    ctx.simulationActive = false;
  };

  // Build timestamps: words clustered by easing, keys staggered within each word
  const wordCount = Math.max(2, Math.round(duration / 300));
  const timestamps: number[] = [];

  for (let w = 0; w < wordCount; w++) {
    const wordStart = easeRandom(easing) * (duration - 200);
    const burstSize = keysPerBurst - 1 + Math.floor(Math.random() * 2); // ±1
    for (let k = 0; k < burstSize; k++) {
      const t = wordStart + k * (50 + Math.random() * 80);
      if (t < duration) timestamps.push(t);
    }
  }

  timestamps.sort((a, b) => a - b);

  // Assign keys in time order — no two consecutive presses on the same key
  let prevIdx = -1;
  for (const t of timestamps) {
    let idx: number;
    do { idx = Math.floor(Math.random() * KEY_COUNT); } while (idx === prevIdx);
    prevIdx = idx;
    const captured = idx;
    timers.push(setTimeout(() => keyVisuals.fire(captured), t));
  }

  timers.push(setTimeout(cancel, duration + 150));

  return cancel;
}
