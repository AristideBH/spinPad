import { Clock } from '@lucide/svelte';
import { WIDGET_TYPE } from '$shared/constants/config-schema.js';
import type { WidgetDef } from './types.js';

export const clock: WidgetDef = {
  label: 'Horloge',
  icon: Clock,
  size: { minW: 2, maxW: 2, minH: 1, maxH: 2 },
  singleton: true,
  options: [
    { key: 'clock_24h', kind: 'bool', label: 'Format 24 h', default: true },
    {
      key: 'clock_show_date',
      kind: 'bool',
      label: 'Afficher la date',
      default: false,
      disabled: (w) => w.h < 2, // date seulement en 2×2
    },
  ],
  preview: (w, now) => {
    if (w.type !== WIDGET_TYPE.CLOCK) return '';
    const h = w.clock_24h ? now.getHours() : now.getHours() % 12 || 12;
    const time = `${String(h).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return w.h >= 2 && w.clock_show_date
      ? `${time} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`
      : time;
  },
};
