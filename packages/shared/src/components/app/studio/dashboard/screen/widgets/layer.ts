import { Layers } from '@lucide/svelte';
import { configState } from '$shared/store/config.svelte.js';
import { WIDGET_TYPE } from '$shared/constants/config-schema.js';
import type { WidgetDef } from './types.js';

export const layer: WidgetDef = {
  label: 'Layer actif',
  icon: Layers,
  size: { minW: 2, maxW: 2, minH: 1, maxH: 1 },
  singleton: true,
  preview: (w) => {
    if (w.type !== WIDGET_TYPE.LAYER) return '';
    const name = configState.activeLayer?.name ?? `L${configState.activeLayerIndex + 1}`;
    return w.w >= 2 ? `L:${name}` : String(configState.activeLayerIndex + 1);
  },
};
