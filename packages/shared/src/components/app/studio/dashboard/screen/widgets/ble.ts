import { Bluetooth } from '@lucide/svelte';
import { deviceStatus } from '$shared/store/deviceStatus.svelte.js';
import type { WidgetDef } from './types.js';

export const ble: WidgetDef = {
  label: 'Statut BLE',
  icon: Bluetooth,
  size: { minW: 2, maxW: 2, minH: 1, maxH: 1 },
  singleton: true,
  preview: () => (deviceStatus.data?.connection.ble ? 'BLE' : 'BLE --'),
};
