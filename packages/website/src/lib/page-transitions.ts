import { cubicIn, cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

export type CurtainDir = 'top' | 'bottom' | 'left' | 'right';

// [axis, off-screen %] for the curtain's resting (uncovered) position.
const AXIS: Record<CurtainDir, ['X' | 'Y', number]> = {
  bottom: ['Y', 100],
  top: ['Y', -100],
  left: ['X', -100],
  right: ['X', 100],
};

// Honest reduced-motion check, evaluated at transition time (client only).
function reduced(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Curtain slides in from `direction` to cover the content area while the next
 * route loads. Reduced motion collapses to a plain fade.
 */
export function curtainIn(
  _node: Element,
  { direction = 'bottom' as CurtainDir, duration = 340 } = {},
): TransitionConfig {
  if (reduced()) return { duration: 160, css: (t) => `opacity:${t}` };
  const [axis, from] = AXIS[direction];
  return {
    duration,
    easing: cubicOut,
    css: (t) => `transform: translate${axis}(${(1 - t) * from}%)`,
  };
}

/**
 * Once the page is loaded the curtain continues past the opposite edge (a
 * directional wipe, not a retreat), revealing the freshly-mounted content.
 */
export function curtainOut(
  _node: Element,
  { direction = 'bottom' as CurtainDir, duration = 340 } = {},
): TransitionConfig {
  if (reduced()) return { duration: 160, css: (t) => `opacity:${t}` };
  const [axis, from] = AXIS[direction];
  const to = -from;
  return {
    duration,
    easing: cubicIn,
    css: (t) => `transform: translate${axis}(${(1 - t) * to}%)`,
  };
}
