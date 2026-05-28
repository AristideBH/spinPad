// ═══════════════════════════════════════════════════════════════
//  transport/mock.ts — Transport mock pour dev mode
//
//  Émule getDeviceStatus() sans device physique.
// ═══════════════════════════════════════════════════════════════

import { devMode } from '../store/devMode.svelte.js';
import {
  makeMockDeviceStatus,
  tickMockDischarge,
  resetMockDischarge,
} from '../mock/device-status.js';
import type { DeviceStatus }  from '../constants/device-status-schema.js';
import type { BatteryScenario } from '../types/dev-mode.js';

let _prevBattery: BatteryScenario | null = null;

export async function getDeviceStatus(): Promise<DeviceStatus> {
  await new Promise<void>(r => setTimeout(r, 50));

  if (_prevBattery !== devMode.battery) {
    _prevBattery = devMode.battery;
    if (devMode.battery === 'present') resetMockDischarge(78);
    else if (devMode.battery === 'low') resetMockDischarge(12);
  }

  let pct: number;
  if (devMode.battery === 'low') {
    pct = 12;
  } else if (devMode.battery === 'present') {
    pct = tickMockDischarge();
  } else {
    pct = 0;
  }

  return makeMockDeviceStatus({
    battery:        devMode.battery,
    connection:     devMode.connection,
    batteryPercent: pct,
  });
}
