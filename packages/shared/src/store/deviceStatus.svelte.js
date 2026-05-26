// ═══════════════════════════════════════════════════════════════
//  deviceStatus.svelte.js — Polling du statut device live
//
//  Source des données :
//    - devMode.active === true   → transport/mock.js
//    - VITE_TRANSPORT === 'http' → transport/http.js  (Studio Mode)
//    - sinon                     → serial/index.svelte.js (WebSerial)
//
//  Le polling est démarré explicitement par le consommateur
//  (Studio.svelte via $effect quand connecté ou en dev mode).
// ═══════════════════════════════════════════════════════════════

import { browser } from '$app/environment';
import { devMode }  from './devMode.svelte.js';
import { serial }   from '../serial/index.svelte.js';
import * as serialTransport from '../serial/index.svelte.js';
import * as httpTransport   from '../transport/http.js';
import * as mockTransport   from '../transport/mock.js';

const USE_HTTP = import.meta.env.VITE_TRANSPORT === 'http';

function _pickTransport() {
    if (devMode.active) return mockTransport;
    return USE_HTTP ? httpTransport : serialTransport;
}

class DeviceStatusState {
    /** @type {import('../constants/device-status-schema.js').DeviceStatus | null} */
    data    = $state(null);
    loading = $state(false);
    error   = $state(/** @type {string | null} */ (null));
}

export const deviceStatus = new DeviceStatusState();

// ─────────────────────────────────────────────────────────────
//  POLLING
// ─────────────────────────────────────────────────────────────

let _timer    = null;
let _inFlight = false;

async function _poll() {
    if (_inFlight) return;
    _inFlight = true;
    try {
        const transport = _pickTransport();
        if (!devMode.active && !USE_HTTP && !serial.connected) {
            // WebSerial mais pas connecté → skip silencieusement
            deviceStatus.data = null;
            return;
        }
        deviceStatus.data  = await transport.getDeviceStatus();
        deviceStatus.error = null;
    } catch (err) {
        deviceStatus.error = err instanceof Error ? err.message : String(err);
    } finally {
        deviceStatus.loading = false;
        _inFlight = false;
    }
}

export function startPolling(intervalMs = 5000) {
    if (!browser || _timer) return;
    deviceStatus.loading = deviceStatus.data === null;
    _poll();
    _timer = setInterval(_poll, intervalMs);
}

export function stopPolling() {
    if (_timer) { clearInterval(_timer); _timer = null; }
    _inFlight = false;
}

/** Force un refresh immédiat (utile après un changement de scénario dev). */
export function refreshDeviceStatus() {
    return _poll();
}
