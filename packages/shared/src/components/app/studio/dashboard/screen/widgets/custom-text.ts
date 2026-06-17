import { Type } from '@lucide/svelte';
import { WIDGET_TYPE } from '$shared/constants/config-schema.js';
import type { WidgetDef } from './types.js';

export const customText: WidgetDef = {
  label: 'Custom text',
  icon: Type,
  size: { minW: 2, maxW: 4, minH: 1, maxH: 1 },
  singleton: false, // duplications allowed
  options: [{ key: 'custom_text', kind: 'text', label: 'Text (12 max)', default: 'Text', max: 12 }],
  preview: (w) => (w.type === WIDGET_TYPE.CUSTOM_TEXT ? w.custom_text || 'Text' : ''),
};
