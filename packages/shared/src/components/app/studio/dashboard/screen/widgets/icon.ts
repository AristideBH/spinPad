import { Image } from '@lucide/svelte';
import { WIDGET_TYPE } from '$shared/constants/config-schema.js';
import type { WidgetDef } from './types.js';

export const icon: WidgetDef = {
  label: 'Icon',
  icon: Image,
  // Square sizes (in cells); the firmware scales the 24×24 bitmap.
  size: { minW: 2, maxW: 4, minH: 2, maxH: 4, square: true },
  singleton: false,
  options: [{ key: 'icon', kind: 'icon', label: 'Icon', default: '' }],
  preview: (w) => (w.type === WIDGET_TYPE.ICON ? (w.icon ? '' : 'Icon') : ''),
};
