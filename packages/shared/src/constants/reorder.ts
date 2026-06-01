// ═══════════════════════════════════════════════════════════════
//  reorder.ts — Dérivation d'un déplacement unique (drag list)
//
//  Logique pure réutilisée par le wrapper Sortable (svelte-mosaic) :
//  à partir de l'ordre visuel après un drag, retrouver le couple
//  (from, to) d'un déplacement d'un seul élément.
// ═══════════════════════════════════════════════════════════════

/**
 * Étant donné l'ordre d'origine `oldOrder` (clés stables) et l'ordre
 * visuel résultant `newOrder` (même multiset de clés), retrouve le
 * déplacement d'un seul élément {from, to}, ou `null` si pas de changement.
 *
 * Un drag dans la liste = un seul élément relocalisé, donc cette
 * dérivation suffit (pas besoin de gérer des permutations arbitraires).
 */
export function deriveSingleMove(oldOrder: string[], newOrder: string[]): { from: number; to: number } | null {
  const n = oldOrder.length;
  if (n !== newOrder.length) return null;

  let lo = 0;
  while (lo < n && oldOrder[lo] === newOrder[lo]) lo++;
  if (lo === n) return null; // identique

  let hi = n - 1;
  while (hi > lo && oldOrder[hi] === newOrder[hi]) hi--;

  // Élément déplacé vers l'avant : oldOrder[lo] réapparaît en position hi.
  if (newOrder[hi] === oldOrder[lo]) return { from: lo, to: hi };

  // Élément déplacé vers l'arrière : oldOrder[hi] réapparaît en position lo.
  if (newOrder[lo] === oldOrder[hi]) return { from: hi, to: lo };

  // Repli : traiter comme un déplacement lo→hi.
  return { from: lo, to: hi };
}
