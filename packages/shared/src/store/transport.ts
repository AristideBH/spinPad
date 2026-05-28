// ═══════════════════════════════════════════════════════════════
//  store/transport.ts — Seam de transport unique
//
//  Retourne le transport actif selon le mode de build :
//    VITE_DEV_MODE=true      → mock (dev sans device)
//    VITE_TRANSPORT=http     → HTTP (studio embarqué sur ESP32)
//    (défaut)                → WebSerial USB
//
//  IMPORTANT : La constante USE_HTTP doit rester une comparaison
//  littérale de import.meta.env.* pour que Vite DCE puisse éliminer
//  le transport inutilisé dans chaque build. Ne pas remplacer par
//  une variable dynamique.
// ═══════════════════════════════════════════════════════════════

import { devMode }          from './devMode.svelte.js';
import * as mockTransport   from '../transport/mock.js';
import * as httpTransport   from '../transport/http.js';
import * as serialTransport from './serial.svelte.js';
import type { Transport, DeviceStatusTransport } from '../types/transport.js';

// Littéral de chaîne intentionnel — nécessaire pour le tree-shaking Vite.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const USE_HTTP = import.meta.env.VITE_TRANSPORT === 'http';

export function activeTransport(): Transport {
  if (devMode.active) return mockTransport as Transport;
  return (USE_HTTP ? httpTransport : serialTransport) as Transport;
}

export function activeStatusTransport(): DeviceStatusTransport {
  if (devMode.active) return mockTransport;
  return (USE_HTTP ? httpTransport : serialTransport) as DeviceStatusTransport;
}

export function transportMode(): 'mock' | 'http' | 'serial' {
  if (devMode.active) return 'mock';
  return USE_HTTP ? 'http' : 'serial';
}
