import { Type } from '@lucide/svelte';
import { WIDGET_TYPE } from '$shared/constants/config-schema.js';
import type { WidgetDef } from './types.js';

export const customText: WidgetDef = {
  label: 'Texte personnalisé',
  icon: Type,
  size: { minW: 2, maxW: 4, minH: 1, maxH: 1 },
  singleton: false, // duplications autorisées
  options: [{ key: 'custom_text', kind: 'text', label: 'Texte (12 max)', default: 'Texte', max: 12 }],
  preview: (w) => (w.type === WIDGET_TYPE.CUSTOM_TEXT ? w.custom_text || 'Texte' : ''),
};
