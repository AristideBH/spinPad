// ═══════════════════════════════════════════════════════════════
//  store/devMode.svelte.ts — Mode démo sans device physique
//
//  Quand active === true, les transports de config et de status
//  basculent sur des mocks. Les scénarios permettent de tester
//  les différentes branches de la DeviceStatusCard à chaud.
// ═══════════════════════════════════════════════════════════════

import type { BatteryScenario, ConnectionScenario } from '../types/dev-mode.js';

class DevModeState {
  active     = $state(import.meta.env.VITE_DEV_MODE === 'true');
  battery    = $state<BatteryScenario>('present');
  connection = $state<ConnectionScenario>('usb');
}

export const devMode = new DevModeState();
