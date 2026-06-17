// ═══════════════════════════════════════════════════════════════
//  mock/device-status.ts — Mock device_status for dev mode
//
//  Allows testing the DeviceStatusCard UI without a physical
//  keyboard. The deviceStatus store routes to this mock as soon as
//  devMode.active === true.
// ═══════════════════════════════════════════════════════════════

import type { DeviceStatus, DeviceStats } from '$shared/constants/device-status-schema.js';
import type { MockOptions } from '$shared/types/dev-mode.js';
import { configState } from '$shared/store/config.svelte.js';

const FW_VERSION = '0.1.0';
const FW_BUILD = 'devmock';

/**
 * Builds a mock device_status.
 */
export function makeMockDeviceStatus(opts: MockOptions = {}): DeviceStatus {
  const battery = opts.battery ?? 'present';
  const connection = opts.connection ?? 'usb';
  const pct = opts.batteryPercent ?? (battery === 'low' ? 12 : 85);

  const usbConnected = connection === 'usb' || connection === 'both';
  const batteryStatus: DeviceStatus['battery'] =
    battery === 'absent'
      ? { present: false }
      : {
          present: true,
          percent: pct,
          voltage_mv: Math.round(3300 + (pct / 100) * 900),
          source: 'auto',
          charging: usbConnected,
        };

  return {
    fw: {
      version: FW_VERSION,
      build: FW_BUILD,
      dirty: true,
    },
    uptime_s: Math.floor((Date.now() - START_TS) / 1000),
    // The mock plays the role of the device: its active profile follows the loaded config.
    active_profile: configState.data?.active_profile ?? 0,
    connection: {
      usb: connection === 'usb' || connection === 'both',
      ble: connection === 'ble' || connection === 'both',
      ble_slot: 0,
      studio_mode: false,
    },
    battery: batteryStatus,
    stats: makeMockStats(),
  };
}

/**
 * Mock stats — frozen snapshot. We regenerate only when the number of
 * profiles in the config changes, so that the per-profile distribution stays
 * consistent with what is loaded in the UI.
 */
function makeMockStats(): DeviceStats {
  const profCount = Math.max(1, configState.data?.profiles?.length ?? 4);
  if (!_cachedStats || _cachedProfCount !== profCount) {
    _cachedProfCount = profCount;
    // Plausible decreasing distribution (profile 1 stays the most used).
    const weights = Array.from({ length: profCount }, (_, i) => Math.round(14210 / (i + 1)));
    const total = weights.reduce((a, b) => a + b, 0);
    _cachedStats = {
      total_keypresses: total,
      per_profile_keypresses: weights,
      encoder_steps_total: 3450,
      encoder_steps_cw: 1840,
      encoder_steps_ccw: 1610,
      deep_sleep_s: 412000,
      awake_s: 98000,
      macros_played: 612,
      since_unix_ts: 1_700_000_000,
    };
  }
  return _cachedStats;
}

let _cachedStats: DeviceStats | null = null;
let _cachedProfCount = 0;

const START_TS = Date.now();

// ─────────────────────────────────────────────────────────────
//  Slow discharge simulation
// ─────────────────────────────────────────────────────────────

let _pct = 85;
let _readCount = 0;

export function tickMockDischarge(): number {
  _readCount++;
  if (_readCount % 50 === 0 && _pct > 0) _pct--;
  return _pct;
}

export function tickMockCharge(): number {
  _readCount++;
  if (_readCount % 50 === 0 && _pct < 100) _pct++;
  return _pct;
}

export function resetMockDischarge(pct = 85): void {
  _pct = pct;
  _readCount = 0;
}

export function currentMockPercent(): number {
  return _pct;
}
