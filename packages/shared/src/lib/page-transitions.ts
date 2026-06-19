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
