import { MediaQuery } from 'svelte/reactivity';

/**
 * Blur transition config for header content swaps (breadcrumbs, page title).
 * Reduced motion drops the blur amount and shortens duration to a plain fade.
 */
export function createHeaderTransition() {
  const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');
  const headerTransition = $derived(
    reducedMotion.current ? { amount: 0, duration: 120 } : { amount: 6, duration: 200 },
  );

  return {
    get reducedMotion() {
      return reducedMotion.current;
    },
    get headerTransition() {
      return headerTransition;
    },
  };
}
