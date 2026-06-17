// ═══════════════════════════════════════════════════════════════
//  types/transport.ts — SpinPad transport interfaces
//
//  Both transports (WebSerial + HTTP) implement Transport.
//  DeviceStatusTransport is the subset used for status polling
//  (serial, http, mock).
// ═══════════════════════════════════════════════════════════════

import type { FullConfig } from '$shared/constants/config-schema.js';
import type { DeviceStatus } from '$shared/constants/device-status-schema.js';

/** Minimal interface of a config transport. */
export interface Transport {
  getConfig(): Promise<FullConfig>;
  setConfig(data: FullConfig): Promise<unknown>;
  factoryReset(): Promise<unknown>;
  /** Lightweight switch of the active profile without resending the whole config. */
  setActiveProfile(idx: number): Promise<unknown>;
}

/** Minimal interface for status polling. */
export interface DeviceStatusTransport {
  getDeviceStatus(): Promise<DeviceStatus>;
}
