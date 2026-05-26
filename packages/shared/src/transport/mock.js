// ═══════════════════════════════════════════════════════════════
//  transport/mock.js — Transport mock pour dev mode
//
//  Émule getDeviceStatus() sans device physique. Lit les options
//  de simulation depuis devMode.* (battery, connection scenarios).
//
//  Comportement par scénario batterie :
//    - 'present' → 78 % au démarrage, décharge lente (-1 %/~50 s)
//    - 'low'     → 12 % fixe
//    - 'absent'  → batterie absente
// ═══════════════════════════════════════════════════════════════

import { devMode } from '../store/devMode.svelte.js';
import {
    makeMockDeviceStatus,
    tickMockDischarge,
    resetMockDischarge,
} from '../mock/device-status.js';

let _prevBattery = /** @type {string | null} */ (null);

/**
 * Renvoie un device_status mock fondé sur l'état devMode courant.
 * @returns {Promise<import('../constants/device-status-schema.js').DeviceStatus>}
 */
export async function getDeviceStatus() {
    await new Promise(r => setTimeout(r, 50)); // micro-latence

    // Reset du compteur de décharge si l'utilisateur change de scénario
    if (_prevBattery !== devMode.battery) {
        _prevBattery = devMode.battery;
        if (devMode.battery === 'present') resetMockDischarge(78);
        else if (devMode.battery === 'low') resetMockDischarge(12);
    }

    let pct;
    if (devMode.battery === 'low') {
        pct = 12;  // fixé, pas de décharge
    } else if (devMode.battery === 'present') {
        pct = tickMockDischarge();
    } else {
        pct = 0;  // ignoré quand absent
    }

    return makeMockDeviceStatus({
        battery:        devMode.battery,
        connection:     devMode.connection,
        batteryPercent: pct,
    });
}
