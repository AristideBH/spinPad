// ═══════════════════════════════════════════════════════════════
//  devMode.svelte.js — Mode démo sans device physique
//
//  Quand active === true, les transports de config et de status
//  basculent sur des mocks. Les scénarios (battery, connection)
//  permettent de tester les différentes branches de la
//  DeviceStatusCard à chaud, sans reload.
// ═══════════════════════════════════════════════════════════════

class DevModeState {
    active = $state(import.meta.env.VITE_DEV_MODE === 'true');

    /** Scénario batterie : present (78 %) / absent (pas de batterie) / low (12 %) */
    battery    = $state(/** @type {'present' | 'absent' | 'low'} */ ('present'));

    /** Scénario connexion : usb / ble / both */
    connection = $state(/** @type {'usb' | 'ble' | 'both'} */ ('usb'));
}

export const devMode = new DevModeState();
