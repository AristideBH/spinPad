class DevModeState {
    active = $state(import.meta.env.VITE_DEV_MODE === 'true');
}
export const devMode = new DevModeState();
