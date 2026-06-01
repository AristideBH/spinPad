// ═══════════════════════════════════════════════════════════════
//  mock/device-status.ts — Mock device_status pour dev mode
//
//  Permet de tester l'UI de la DeviceStatusCard sans clavier
//  physique. Le store deviceStatus route vers ce mock dès que
//  devMode.active === true.
// ═══════════════════════════════════════════════════════════════

import type { DeviceStatus, DeviceStats } from '$shared/constants/device-status-schema.js';
import type { MockOptions }  from '$shared/types/dev-mode.js';

const FW_VERSION = '1.0.0';
const FW_BUILD   = 'devmock';

/**
 * Construit un device_status mock.
 */
export function makeMockDeviceStatus(opts: MockOptions = {}): DeviceStatus {
  const battery    = opts.battery    ?? 'present';
  const connection = opts.connection ?? 'usb';
  const pct        = opts.batteryPercent ?? (battery === 'low' ? 12 : 78);

  const batteryStatus: DeviceStatus['battery'] = battery === 'absent'
    ? { present: false }
    : {
        present:    true,
        percent:    pct,
        voltage_mv: Math.round(3300 + (pct / 100) * 900),
        source:     'auto',
      };

  return {
    fw: {
      version: FW_VERSION,
      build:   FW_BUILD,
      dirty:   true,
    },
    uptime_s: Math.floor((Date.now() - START_TS) / 1000),
    connection: {
      usb:         connection === 'usb'  || connection === 'both',
      ble:         connection === 'ble'  || connection === 'both',
      ble_slot:    0,
      studio_mode: false,
    },
    battery: batteryStatus,
    stats: makeMockStats(),
  };
}

/** Stats mock qui progressent doucement à chaque lecture (dev mode). */
function makeMockStats(): DeviceStats {
  _statReads++;
  const cw = 1840 + _statReads * 2;
  const ccw = 1610 + _statReads;
  return {
    total_keypresses:       28473 + _statReads * 3,
    per_profile_keypresses: [14210, 9120, 5143],
    encoder_steps_total:    cw + ccw,
    encoder_steps_cw:       cw,
    encoder_steps_ccw:      ccw,
    deep_sleep_s:           412000,
    awake_s:                98000,
    macros_played:          612 + _statReads,
    since_unix_ts:          1_700_000_000,
  };
}

let _statReads = 0;

const START_TS = Date.now();

// ─────────────────────────────────────────────────────────────
//  Simulation de décharge lente
// ─────────────────────────────────────────────────────────────

let _pct       = 78;
let _readCount = 0;

export function tickMockDischarge(): number {
  _readCount++;
  if (_readCount % 10 === 0 && _pct > 0) _pct--;
  return _pct;
}

export function resetMockDischarge(pct = 78): void {
  _pct       = pct;
  _readCount = 0;
}

export function currentMockPercent(): number {
  return _pct;
}
