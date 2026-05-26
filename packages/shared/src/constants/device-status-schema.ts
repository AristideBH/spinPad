// ═══════════════════════════════════════════════════════════════
//  device-status-schema.ts — Schéma de télémétrie device
//
//  Endpoint firmware : { "cmd": "device_status" }  (USB serial)
//                   ou GET /api/status              (HTTP Studio Mode)
//
//  Conçu pour être extensible : nouvelles sections (sensors, thermal…)
//  peuvent être ajoutées sans casser les anciens clients.
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
}
export type BatteryStatus = BatteryAbsent | BatteryPresent;

export interface FirmwareInfo {
  version: string;   // ex: "1.0.0"
  build:   string;   // ex: "a1b2c3d" (git short hash, "+" suffix if dirty)
  dirty:   boolean;  // true si build sur un working tree modifié
}

export interface ConnectionStatus {
  usb:          boolean;
  ble:          boolean;
  ble_slot:     number;   // 0 ou 1
  studio_mode:  boolean;  // mode Studio Mode (AP WiFi) actif
}

export interface DeviceStatus {
  fw:         FirmwareInfo;
  uptime_s:   number;
  connection: ConnectionStatus;
  battery:    BatteryStatus;
}

// ── Override config (sérialisé dans power.battery_present) ─────
// "auto"   → firmware détecte via ADC (défaut)
// "yes"    → forcer présente (skip détection)
// "no"     → forcer absente (skip ADC, BAS service non annoncé)
export type BatteryPresentConfig = 'auto' | 'yes' | 'no';
