// ═══════════════════════════════════════════════════════════════
//  device-status.js — Mock device_status pour dev mode
//
//  Permet de tester l'UI de la DeviceStatusCard sans clavier
//  physique. Le store deviceStatus route vers ce mock dès que
//  devMode.active === true.
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {'auto' | 'forced_yes' | 'forced_no'} BatterySource
 *
 * @typedef {object} MockOptions
 * @property {'present' | 'absent' | 'low'} [battery]
 * @property {'usb' | 'ble' | 'both'}       [connection]
 * @property {number}                       [batteryPercent]
 */

const FW_VERSION = '1.0.0';
const FW_BUILD   = 'devmock';

/**
 * Construit un device_status mock.
 * @param {MockOptions} opts
 */
export function makeMockDeviceStatus(opts = {}) {
    const battery    = opts.battery    ?? 'present';
    const connection = opts.connection ?? 'usb';
    const pct        = opts.batteryPercent ?? (battery === 'low' ? 12 : 78);

    /** @type {import('../constants/device-status-schema.js').BatteryStatus} */
    const batteryStatus = battery === 'absent'
        ? { present: false }
        : {
              present: true,
              percent: pct,
              voltage_mv: Math.round(3300 + (pct / 100) * 900),
              source: 'auto',
          };

    return {
        fw: {
            version: FW_VERSION,
            build:   FW_BUILD,
            dirty:   true,
        },
        uptime_s: Math.floor((Date.now() - START_TS) / 1000),
        connection: {
            usb: connection === 'usb' || connection === 'both',
            ble: connection === 'ble' || connection === 'both',
            ble_slot: 0,
            studio_mode: false,
        },
        battery: batteryStatus,
    };
}

const START_TS = Date.now();

// ─────────────────────────────────────────────────────────────
//  Simulation de décharge lente
//  La batterie perd 1 % toutes les ~10 lectures du mock (≈ toutes
//  les 50 s avec un polling à 5 s) pour rendre la carte vivante.
// ─────────────────────────────────────────────────────────────

let _pct        = 78;
let _readCount  = 0;

export function tickMockDischarge() {
    _readCount++;
    if (_readCount % 10 === 0 && _pct > 0) _pct--;
    return _pct;
}

export function resetMockDischarge(pct = 78) {
    _pct = pct;
    _readCount = 0;
}

export function currentMockPercent() {
    return _pct;
}
