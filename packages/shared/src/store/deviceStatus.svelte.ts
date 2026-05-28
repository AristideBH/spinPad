// ═══════════════════════════════════════════════════════════════
//  store/deviceStatus.svelte.ts — Polling du statut device live
//
//  Source des données :
//    - devMode.active === true   → transport/mock.ts
//    - VITE_TRANSPORT === 'http' → transport/http.ts  (Studio Mode)
//    - sinon                     → store/serial.svelte.ts (WebSerial)
// ═══════════════════════════════════════════════════════════════

import { browser } from '$app/environment';
import { devMode }  from './devMode.svelte.js';
import { serial }   from './serial.svelte.js';
import * as serialTransport from './serial.svelte.js';
import * as httpTransport   from '../transport/http.js';
import * as mockTransport   from '../transport/mock.js';
import type { DeviceStatus }        from '../constants/device-status-schema.js';
import type { DeviceStatusTransport } from '../types/transport.js';

const USE_HTTP = import.meta.env.VITE_TRANSPORT === 'http';

function _pickTransport(): DeviceStatusTransport {
  if (devMode.active) return mockTransport;
  return USE_HTTP ? httpTransport : serialTransport;
}

class DeviceStatusState {
  data    = $state<DeviceStatus | null>(null);
  loading = $state(false);
  error   = $state<string | null>(null);
}

export const deviceStatus = new DeviceStatusState();

// ─────────────────────────────────────────────────────────────
//  POLLING
// ─────────────────────────────────────────────────────────────

let _timer:    ReturnType<typeof setInterval> | null = null;
let _inFlight  = false;

async function _poll(): Promise<void> {
  if (_inFlight) return;
  _inFlight = true;
  try {
    const transport = _pickTransport();
    if (!devMode.active && !USE_HTTP && !serial.connected) {
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

export function startPolling(intervalMs = 5000): void {
  if (!browser || _timer) return;
  deviceStatus.loading = deviceStatus.data === null;
  _poll();
  _timer = setInterval(_poll, intervalMs);
}

export function stopPolling(): void {
  if (_timer) { clearInterval(_timer); _timer = null; }
  _inFlight = false;
}

export function refreshDeviceStatus(): Promise<void> {
  return _poll();
}
