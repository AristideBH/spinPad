// Fixed layer-index → color map. Identical across all profiles.
// Used by KeyGrid (cross-layer dots) and LayerSwitcher (row marker).
// One entry per layer up to CONFIG_MAX_LAYERS (8).

export const LAYER_COLORS = [
  'border-b-sky-500!',
  'border-b-emerald-500!',
  'border-b-amber-500!',
  'border-b-rose-500!',
  'border-b-violet-500!',
  'border-b-cyan-500!',
  'border-b-lime-500!',
  'border-b-orange-500!',
] as const;

export function layerColor(i: number): string {
  return LAYER_COLORS[i % LAYER_COLORS.length];
}

// Plus petit slot couleur (0..LAYER_COLORS.length-1) non utilisé par les layers
// existants. Garantit des couleurs distinctes tant qu'il reste des slots libres.
// Utilisé à la création/duplication d'un layer ; le slot suit ensuite le layer.
export function allocColorSlot(layers: ReadonlyArray<{ color?: number }>): number {
  const used = new Set(layers.map((l) => l.color));
  for (let i = 0; i < LAYER_COLORS.length; i++) {
    if (!used.has(i)) return i;
  }
  return layers.length % LAYER_COLORS.length;
}

// Ré-attribue par position le slot couleur manquant de chaque layer (mutation
// en place). Appelé à chaque entrée de config (chargement device/import) car le
// firmware ne renvoie pas `color`. Typage structurel pour éviter une dépendance
// circulaire avec config-schema.
export function backfillLayerColors(
  profiles: ReadonlyArray<{ layers?: Array<{ color?: number }> }>,
): void {
  for (const p of profiles) {
    (p.layers ?? []).forEach((l, i) => {
      if (typeof l.color !== 'number') l.color = i;
    });
  }
}
