// ═══════════════════════════════════════════════════════════════
//  types/transport.ts — Interfaces des transports SpinPad
//
//  Les deux transports (WebSerial + HTTP) implémentent Transport.
//  DeviceStatusTransport est le sous-ensemble utilisé pour
//  le polling du statut (serial, http, mock).
// ═══════════════════════════════════════════════════════════════

import type { FullConfig } from '../constants/config-schema.js';
import type { DeviceStatus } from '../constants/device-status-schema.js';

/** Interface minimale d'un transport de config. */
export interface Transport {
  getConfig(): Promise<FullConfig>;
  setConfig(data: FullConfig): Promise<unknown>;
  factoryReset(): Promise<unknown>;
}

/** Interface minimale pour le polling de statut. */
export interface DeviceStatusTransport {
  getDeviceStatus(): Promise<DeviceStatus>;
}
