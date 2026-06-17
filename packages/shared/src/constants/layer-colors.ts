// Fixed layer-index → color map. Identical across all profiles.
// Used by KeyGrid (cross-layer dots) and LayerSwitcher (row marker).
// One entry per layer up to CONFIG_MAX_LAYERS (8).

const LAYER_COLORS = [
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

// Smallest color slot (0..LAYER_COLORS.length-1) not used by the existing
// layers. Guarantees distinct colors as long as free slots remain.
// Used when creating/duplicating a layer; the slot then follows the layer.
export function allocColorSlot(layers: ReadonlyArray<{ color?: number }>): number {
  const used = new Set(layers.map((l) => l.color));
  for (let i = 0; i < LAYER_COLORS.length; i++) {
    if (!used.has(i)) return i;
  }
  return layers.length % LAYER_COLORS.length;
}

// Reassigns by position the missing color slot of each layer (in-place
// mutation). Called on every config entry (device load/import) because the
// firmware does not return `color`. Structural typing to avoid a circular
// dependency with config-schema.
export function backfillLayerColors(profiles: ReadonlyArray<{ layers?: Array<{ color?: number }> }>): void {
  for (const p of profiles) {
    (p.layers ?? []).forEach((l, i) => {
      if (typeof l.color !== 'number') l.color = i;
    });
  }
}
