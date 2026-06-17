// ═══════════════════════════════════════════════════════════════
//  store/devMode.svelte.ts — Demo mode without physical device
//
//  When active === true, the config and status transports switch
//  to mocks. The scenarios allow testing the different branches of
//  the DeviceStatusCard on the fly.
// ═══════════════════════════════════════════════════════════════

import type { BatteryScenario, ConnectionScenario } from '$shared/types/dev-mode.js';

class DevModeState {
  active     = $state(false);
  battery    = $state<BatteryScenario>('present');
  connection = $state<ConnectionScenario>('usb');
}

export const devMode = new DevModeState();
