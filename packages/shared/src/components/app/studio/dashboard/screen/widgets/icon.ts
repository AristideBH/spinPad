import { Image } from '@lucide/svelte';
import { WIDGET_TYPE } from '$shared/constants/config-schema.js';
import type { WidgetDef } from './types.js';

export const icon: WidgetDef = {
  label: 'Icône',
  icon: Image,
  // Tailles carrées (en cellules) ; le firmware met le bitmap 24×24 à l'échelle.
  size: { minW: 2, maxW: 4, minH: 2, maxH: 4, square: true },
  singleton: false,
  options: [{ key: 'icon', kind: 'icon', label: 'Icône', default: '' }],
  preview: (w) => (w.type === WIDGET_TYPE.ICON ? (w.icon ? '' : 'Icône') : ''),
};
