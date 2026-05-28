// ═══════════════════════════════════════════════════════════════
//  store/deviceStatus.svelte.ts — Polling du statut device live
//
//  Source des données via store/transport.ts :
//    VITE_DEV_MODE=true      → transport/mock.ts
//    VITE_TRANSPORT='http'   → transport/http.ts  (Studio Mode)
//    (défaut)                → store/serial.svelte.ts (WebSerial)
//
//  Erreur de transport (ex. serial non connecté) → data=null, error=message.
// ═══════════════════════════════════════════════════════════════

import { browser } from '$app/environment';
import { activeStatusTransport } from './transport.js';
import type { DeviceStatus } from '../constants/device-status-schema.js';

class DeviceStatusState {
  data    = $state<DeviceStatus | null>(null);
  loading = $state(false);
  error   = $state<string | null>(null);
}

export const deviceStatus = new DeviceStatusState();

// ─────────────────────────────────────────────────────────────
//  POLLING
// ─────────────────────────────────────────────────────────────

let _timer:   ReturnType<typeof setInterval> | null = null;
let _inFlight = false;

async function _poll(): Promise<void> {
  if (_inFlight) return;
  _inFlight = true;
  try {
    deviceStatus.data  = await activeStatusTransport().getDeviceStatus();
    deviceStatus.error = null;
  } catch (err) {
    deviceStatus.data  = null;
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
