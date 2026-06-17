// ═══════════════════════════════════════════════════════════════
//  transport/mock.ts — Mock transport for dev mode
//
//  Implements the full Transport and DeviceStatusTransport
//  interfaces without a physical device.
//    getConfig()     → MOCK_CONFIG after 300ms simulated delay
//    setConfig()     → silent no-op
//    factoryReset()  → silent no-op
//    getDeviceStatus() → simulated status based on devMode.battery/connection
// ═══════════════════════════════════════════════════════════════

import { devMode } from '$shared/store/devMode.svelte.js';
import { MOCK_CONFIG } from '$shared/mock/keyboard-config.js';
import {
  makeMockDeviceStatus,
  tickMockDischarge,
  tickMockCharge,
  resetMockDischarge,
} from '$shared/mock/device-status.js';
import type { FullConfig }   from '$shared/constants/config-schema.js';
import type { DeviceStatus } from '$shared/constants/device-status-schema.js';
import type { BatteryScenario } from '$shared/types/dev-mode.js';
import type { DeviceStatusOpts } from '$shared/types/transport.js';

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function setActiveProfile(_idx: number): Promise<{ status: string }> {
  // No-op: in dev mode, the active profile of the "device" follows
  // configState.data (see makeMockDeviceStatus), so the local mutation suffices.
  return { status: 'ok' };
}

// ── Device status transport ───────────────────────────────────

let _prevBattery: BatteryScenario | null = null;

export async function getDeviceStatus(opts: DeviceStatusOpts = {}): Promise<DeviceStatus> {
  await new Promise<void>(r => setTimeout(r, 50));

  if (_prevBattery !== devMode.battery) {
    _prevBattery = devMode.battery;
    if (devMode.battery === 'present') resetMockDischarge(78);
    else if (devMode.battery === 'low') resetMockDischarge(12);
  }

  const usbConnected = devMode.connection === 'usb' || devMode.connection === 'both';
  let pct: number;
  if (devMode.battery === 'low') {
    pct = 12;
  } else if (devMode.battery === 'present') {
    pct = usbConnected ? tickMockCharge() : tickMockDischarge();
  } else {
    pct = 0;
  }

  return makeMockDeviceStatus({
    battery:        devMode.battery,
    connection:     devMode.connection,
    batteryPercent: pct,
    activeProfile:  opts.activeProfile?.(),
    profileCount:   opts.profileCount?.(),
  });
}
