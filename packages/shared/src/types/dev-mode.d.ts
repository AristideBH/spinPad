// ═══════════════════════════════════════════════════════════════
//  types/dev-mode.ts — Types pour le mode développement (mock)
// ═══════════════════════════════════════════════════════════════

export type BatteryScenario    = 'present' | 'absent' | 'low';
export type ConnectionScenario = 'usb' | 'ble' | 'both';

export interface MockOptions {
  battery?:        BatteryScenario;
  connection?:     ConnectionScenario;
  batteryPercent?: number;
}
