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
