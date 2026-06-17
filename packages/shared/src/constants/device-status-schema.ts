// ═══════════════════════════════════════════════════════════════
//  device-status-schema.ts — Device telemetry schema
//
//  Firmware endpoint: { "cmd": "device_status" }  (USB serial)
//                  or GET /api/status              (HTTP Studio Mode)
//
//  Designed to be extensible: new sections (sensors, thermal…)
//  can be added without breaking older clients.
// ═══════════════════════════════════════════════════════════════

export type BatterySource = 'auto' | 'forced_yes' | 'forced_no';

export interface BatteryAbsent {
  present: false;
}
export interface BatteryPresent {
  present: true;
  percent:    number;   // 0-100
  voltage_mv: number;   // mV (~3300-4200 LiPo)
  source:     BatterySource;
  charging?:  boolean;
}
export type BatteryStatus = BatteryAbsent | BatteryPresent;

export interface FirmwareInfo {
  version: string;   // ex: "1.0.0"
  build:   string;   // ex: "a1b2c3d" (git short hash, "+" suffix if dirty)
  dirty:   boolean;  // true if built on a modified working tree
}

export interface ConnectionStatus {
  usb:          boolean;
  ble:          boolean;
  ble_slot:     number;   // 0 or 1
  studio_mode:  boolean;  // Studio Mode (AP WiFi) active
}

// ── Usage statistics (persistent counters in NVS) ─────────────
// Granularity: global + per profile (no per-key counter,
// to limit flash wear). Both encoder directions add up
// (they do not cancel out). Optional section: an older firmware
// can omit it without breaking clients.
export interface DeviceStats {
  total_keypresses:        number;    // cumulative total (all keys/profiles)
  per_profile_keypresses:  number[];  // index = profile
  encoder_steps_total:     number;    // CW + CCW (sum, unsigned)
  encoder_steps_cw:        number;
  encoder_steps_ccw:       number;
  deep_sleep_s:            number;    // cumulative time in deep sleep
  awake_s:                 number;    // cumulative time awake
  macros_played?:          number;    // number of macros played
  since_unix_ts?:          number;    // start of the counting period
}

export interface DeviceStatus {
  fw:              FirmwareInfo;
  uptime_s:        number;
  active_profile?: number;       // index of the active profile on the device (studio ↔ device sync)
  connection:      ConnectionStatus;
  battery:         BatteryStatus;
  stats?:          DeviceStats;   // optional — see DeviceStats
}

// ── Config override (serialized in power.battery_present) ─────
// "auto"   → firmware detects via ADC (default)
// "yes"    → force present (skip detection)
// "no"     → force absent (skip ADC, BAS service not advertised)
export type BatteryPresentConfig = 'auto' | 'yes' | 'no';
