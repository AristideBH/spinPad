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

/**
 * Snappy scroll-to-top of a scroll container (fixed ~350ms easeOutCubic,
 * distance-independent — unlike native `smooth`). Reduced motion / already-top
 * jumps instantly.
 */
export function scrollToTop(el: HTMLElement | null, reducedMotion = false): void {
  if (!el) return;
  const start = el.scrollTop;
  if (reducedMotion || start === 0) {
    el.scrollTop = 0;
    return;
  }
  const duration = 350;
  const t0 = performance.now();
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  function step(now: number) {
    const t = Math.min(1, (now - t0) / duration);
    el!.scrollTop = start * (1 - ease(t));
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

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
