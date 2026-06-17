// ═══════════════════════════════════════════════════════════════
//  store/deviceStatus.svelte.ts — Live device status polling
//
//  Data source via store/transport.ts:
//    VITE_DEV_MODE=true      → transport/mock.ts
//    VITE_TRANSPORT='http'   → transport/http.ts  (Studio Mode)
//    (default)               → store/serial.svelte.ts (WebSerial)
//
//  Transport error (e.g. serial not connected) → data=null, error=message.
// ═══════════════════════════════════════════════════════════════

import { browser } from '$app/environment';
import { activeStatusTransport, transportMode } from './transport.js';
import { configState, reconcileActiveProfile } from './config.svelte.js';
import { onProfileEvent } from './serial.svelte.js';
import type { DeviceStatus } from '$shared/constants/device-status-schema.js';

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
let _unsubProfile: (() => void) | null = null;

async function _poll(): Promise<void> {
  if (_inFlight) return;
  _inFlight = true;
  try {
    const status = await activeStatusTransport().getDeviceStatus({
      activeProfile: () => configState.data?.active_profile,
      profileCount:  () => configState.data?.profiles?.length,
    });
    deviceStatus.data  = status;
    deviceStatus.error = null;
    // Active profile sync: the device is the source of truth of the live profile.
    if (typeof status.active_profile === 'number') {
      reconcileActiveProfile(status.active_profile);
    }
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
  // Low-latency sync: on the serial transport, also listen to the "profile"
  // events pushed on the monitor stream (in addition to the 5 s polling).
  if (!_unsubProfile && transportMode() === 'serial') {
    _unsubProfile = onProfileEvent(reconcileActiveProfile);
  }
}

export function stopPolling(): void {
  if (_timer) { clearInterval(_timer); _timer = null; }
  if (_unsubProfile) { _unsubProfile(); _unsubProfile = null; }
  _inFlight = false;
}

export function refreshDeviceStatus(): Promise<void> {
  return _poll();
}
