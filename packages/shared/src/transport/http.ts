// ═══════════════════════════════════════════════════════════════
//  transport/http.ts — HTTP transport for embedded Studio Mode
//
//  Used when the app is served directly from the SpinPad.
//  The requests are relative (no base URL) because the origin
//  is 192.168.4.1 and the HTTP server runs on the device.
//
//  Embedded build: VITE_TRANSPORT=http (see build:embedded)
// ═══════════════════════════════════════════════════════════════

import type { FullConfig }    from '$shared/constants/config-schema.js';
import type { DeviceStatus }  from '$shared/constants/device-status-schema.js';

const BASE = '';   // Relative to the origin

export async function getConfig(): Promise<FullConfig> {
  const r = await fetch(`${BASE}/api/config`);
  if (!r.ok) throw new Error(`HTTP error ${r.status} while loading the config`);
  return r.json() as Promise<FullConfig>;
}

export async function setConfig(data: FullConfig): Promise<{ ok: boolean }> {
  const r = await fetch(`${BASE}/api/config`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`HTTP error ${r.status} while saving`);
  return r.json() as Promise<{ ok: boolean }>;
}

export async function factoryReset(): Promise<{ ok: boolean }> {
  const r = await fetch(`${BASE}/api/factory_reset`, { method: 'POST' });
  if (!r.ok) throw new Error(`HTTP error ${r.status} during factory reset`);
  return r.json() as Promise<{ ok: boolean }>;
}

export async function setActiveProfile(idx: number): Promise<{ ok: boolean }> {
  const r = await fetch(`${BASE}/api/active_profile`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ idx }),
  });
  if (!r.ok) throw new Error(`HTTP error ${r.status} while changing profile`);
  return r.json() as Promise<{ ok: boolean }>;
}

export async function getDeviceStatus(): Promise<DeviceStatus> {
  const r = await fetch(`${BASE}/api/status`);
  if (!r.ok) throw new Error(`HTTP error ${r.status} while loading the status`);
  return r.json() as Promise<DeviceStatus>;
}

/** Checks if the device is reachable via HTTP. */
export async function ping(): Promise<boolean> {
  try {
    const r = await fetch(`${BASE}/api/config`, { method: 'HEAD' });
    return r.ok;
  } catch {
    return false;
  }
}
