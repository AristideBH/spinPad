// ═══════════════════════════════════════════════════════════════
//  transport/mock.ts — Transport mock pour dev mode
//
//  Implémente les interfaces Transport et DeviceStatusTransport
//  complètes sans device physique.
//    getConfig()     → MOCK_CONFIG après 300ms de délai simulé
//    setConfig()     → no-op silencieux
//    factoryReset()  → no-op silencieux
//    getDeviceStatus() → statut simulé selon devMode.battery/connection
// ═══════════════════════════════════════════════════════════════

import { devMode } from '$shared/store/devMode.svelte.js';
import { MOCK_CONFIG } from '$shared/mock/keyboard-config.js';
import {
  makeMockDeviceStatus,
  tickMockDischarge,
  resetMockDischarge,
} from '$shared/mock/device-status.js';
import type { FullConfig }   from '$shared/constants/config-schema.js';
import type { DeviceStatus } from '$shared/constants/device-status-schema.js';
import type { BatteryScenario } from '$shared/types/dev-mode.js';

// ── Config transport ──────────────────────────────────────────

export async function getConfig(): Promise<FullConfig> {
  await new Promise<void>(r => setTimeout(r, 300));
  return structuredClone(MOCK_CONFIG) as unknown as FullConfig;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function setConfig(_config: FullConfig): Promise<{ status: string }> {
  // No-op in dev mode — config only lives in memory.
  return { status: 'ok' };
}

export async function factoryReset(): Promise<{ status: string; msg: string }> {
  // No-op in dev mode.
  return { status: 'ok', msg: 'factory_reset' };
}

// ── Device status transport ───────────────────────────────────

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
