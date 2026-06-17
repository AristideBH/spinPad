// ═══════════════════════════════════════════════════════════════
//  store/transport.ts — Single transport seam
//
//  Returns the active transport according to the build mode:
//    VITE_DEV_MODE=true      → mock (dev without device)
//    VITE_TRANSPORT=http     → HTTP (studio embedded on ESP32)
//    (default)               → WebSerial USB
//
//  IMPORTANT: The USE_HTTP constant must stay a literal comparison
//  of import.meta.env.* so that Vite DCE can eliminate the unused
//  transport in each build. Do not replace with a dynamic variable.
// ═══════════════════════════════════════════════════════════════

import { devMode }          from './devMode.svelte.js';
import * as mockTransport   from '$shared/transport/mock.js';
import * as httpTransport   from '$shared/transport/http.js';
import * as serialTransport from './serial.svelte.js';
import type { Transport, DeviceStatusTransport } from '$shared/types/transport.js';

// Intentional string literal — required for Vite tree-shaking.
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
