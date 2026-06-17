// ═══════════════════════════════════════════════════════════════
//  types/dev-mode.ts — Types for the development mode (mock)
// ═══════════════════════════════════════════════════════════════

export type BatteryScenario    = 'present' | 'absent' | 'low';
export type ConnectionScenario = 'usb' | 'ble' | 'both';

export interface MockOptions {
  battery?:        BatteryScenario;
  connection?:     ConnectionScenario;
  batteryPercent?: number;
  activeProfile?:  number;
  profileCount?:   number;
}
