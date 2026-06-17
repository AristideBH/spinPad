// ═══════════════════════════════════════════════════════════════
//  reorder.ts — Derivation of a single move (drag list)
//
//  Pure logic reused by the Sortable wrapper (svelte-mosaic):
//  from the visual order after a drag, recover the
//  (from, to) pair of a single-element move.
// ═══════════════════════════════════════════════════════════════

/**
 * Given the original order `oldOrder` (stable keys) and the resulting
 * visual order `newOrder` (same multiset of keys), recover the
 * single-element move {from, to}, or `null` if no change.
 *
 * A drag in the list = a single relocated element, so this
 * derivation is enough (no need to handle arbitrary permutations).
 */
export function deriveSingleMove(oldOrder: string[], newOrder: string[]): { from: number; to: number } | null {
  const n = oldOrder.length;
  if (n !== newOrder.length) return null;

  let lo = 0;
  while (lo < n && oldOrder[lo] === newOrder[lo]) lo++;
  if (lo === n) return null; // identical

  let hi = n - 1;
  while (hi > lo && oldOrder[hi] === newOrder[hi]) hi--;

  // Element moved forward: oldOrder[lo] reappears at position hi.
  if (newOrder[hi] === oldOrder[lo]) return { from: lo, to: hi };

  // Element moved backward: oldOrder[hi] reappears at position lo.
  if (newOrder[lo] === oldOrder[hi]) return { from: hi, to: lo };

  // Fallback: treat as a move lo→hi.
  return { from: lo, to: hi };
}
