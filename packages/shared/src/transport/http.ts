// ═══════════════════════════════════════════════════════════════
//  transport/http.ts — Transport HTTP pour Studio Mode embarqué
//
//  Utilisé quand l'app est servie directement depuis le SpinPad.
//  Les requêtes sont relatives (pas de base URL) car l'origine
//  est 192.168.4.1 et le serveur HTTP tourne sur le device.
//
//  Build embedded : VITE_TRANSPORT=http (voir build:embedded)
// ═══════════════════════════════════════════════════════════════

import type { FullConfig }    from '../constants/config-schema.js';
import type { DeviceStatus }  from '../constants/device-status-schema.js';

const BASE = '';   // Relatif à l'origine

export async function getConfig(): Promise<FullConfig> {
  const r = await fetch(`${BASE}/api/config`);
  if (!r.ok) throw new Error(`Erreur HTTP ${r.status} lors du chargement de la config`);
  return r.json() as Promise<FullConfig>;
}

export async function setConfig(data: FullConfig): Promise<{ ok: boolean }> {
  const r = await fetch(`${BASE}/api/config`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`Erreur HTTP ${r.status} lors de la sauvegarde`);
  return r.json() as Promise<{ ok: boolean }>;
}

export async function factoryReset(): Promise<{ ok: boolean }> {
  const r = await fetch(`${BASE}/api/factory_reset`, { method: 'POST' });
  if (!r.ok) throw new Error(`Erreur HTTP ${r.status} lors du factory reset`);
  return r.json() as Promise<{ ok: boolean }>;
}

export async function getDeviceStatus(): Promise<DeviceStatus> {
  const r = await fetch(`${BASE}/api/status`);
  if (!r.ok) throw new Error(`Erreur HTTP ${r.status} lors du chargement du statut`);
  return r.json() as Promise<DeviceStatus>;
}

/** Vérifie si le device est joignable via HTTP. */
export async function ping(): Promise<boolean> {
  try {
    const r = await fetch(`${BASE}/api/config`, { method: 'HEAD' });
    return r.ok;
  } catch {
    return false;
  }
}
