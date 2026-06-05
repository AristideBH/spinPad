import { BatteryFull } from '@lucide/svelte';
import { deviceStatus } from '$shared/store/deviceStatus.svelte.js';
import type { WidgetDef } from './types.js';

export const battery: WidgetDef = {
  label: 'Batterie',
  icon: BatteryFull,
  size: { minW: 2, maxW: 2, minH: 1, maxH: 1 },
  singleton: true,
  preview: () => {
    const b = deviceStatus.data?.battery;
    return b?.present ? `${b.percent}%` : '—%';
  },
};
