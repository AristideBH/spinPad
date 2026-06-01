// ═══════════════════════════════════════════════════════════════
//  mock/device-status.ts — Mock device_status pour dev mode
//
//  Permet de tester l'UI de la DeviceStatusCard sans clavier
//  physique. Le store deviceStatus route vers ce mock dès que
//  devMode.active === true.
// ═══════════════════════════════════════════════════════════════

import type { DeviceStatus, DeviceStats } from '$shared/constants/device-status-schema.js';
import type { MockOptions }  from '$shared/types/dev-mode.js';
import { configState } from '$shared/store/config.svelte.js';

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

/**
 * Stats mock — snapshot figé. On régénère uniquement quand le nombre de
 * profils dans la config change, pour que la répartition par profil reste
 * cohérente avec ce qui est chargé dans l'UI.
 */
function makeMockStats(): DeviceStats {
  const profCount = Math.max(1, configState.data?.profiles?.length ?? 4);
  if (!_cachedStats || _cachedProfCount !== profCount) {
    _cachedProfCount = profCount;
    // Distribution décroissante plausible (le profil 1 reste le plus utilisé).
    const weights = Array.from({ length: profCount }, (_, i) => Math.round(14210 / (i + 1)));
    const total = weights.reduce((a, b) => a + b, 0);
    _cachedStats = {
      total_keypresses:       total,
      per_profile_keypresses: weights,
      encoder_steps_total:    3450,
      encoder_steps_cw:       1840,
      encoder_steps_ccw:      1610,
      deep_sleep_s:           412000,
      awake_s:                98000,
      macros_played:          612,
      since_unix_ts:          1_700_000_000,
    };
  }
  return _cachedStats;
}

let _cachedStats: DeviceStats | null = null;
let _cachedProfCount = 0;

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
