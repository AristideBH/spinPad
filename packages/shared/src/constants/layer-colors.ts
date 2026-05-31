// Fixed layer-index → color map. Identical across all profiles.
// Used by KeyGrid (cross-layer dots) and LayerSwitcher (row marker).
// One entry per layer up to CONFIG_MAX_LAYERS (8).

export const LAYER_COLORS = [
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-lime-500',
  'bg-orange-500',
] as const;

export function layerColor(i: number): string {
  return LAYER_COLORS[i % LAYER_COLORS.length];
}
