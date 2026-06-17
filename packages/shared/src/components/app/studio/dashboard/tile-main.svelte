<script lang="ts">
  import * as Card from '$shared/components/ui/card/index.js';
  import { Badge } from '$shared/components/ui/badge/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import { Usb, Bluetooth, RefreshCw, LogOut, Activity, Settings } from '@lucide/svelte';
  import { deviceStatus } from '$shared/store/deviceStatus.svelte.js';
  import { disconnect, serial } from '$shared/store/serial.svelte.js';
  import { ResponsiveSheet } from '$shared/components/ui/responsive-sheet/index.js';
  import SettingsTab from '$shared/components/app/studio/settings/SettingsTab.svelte';
  import { loadConfig, configState } from '$shared/store/config.svelte.js';
  import { trainingMode } from '$shared/store/trainingMode.svelte.js';
  import { devMode } from '$shared/store/devMode.svelte.js';
  import MacroManager from '$shared/components/app/studio/modals/MacroManager.svelte';
  import LedManager from '$shared/components/app/studio/modals/LedManager.svelte';
  import StatusCard from './StatusCard.svelte';
  import SaveBadge from '$shared/components/app/studio/SaveBadge.svelte';
  import LedMatrix from '$shared/components/app/studio/dashboard/led-matrix.svelte';
  import { keyVisuals } from '$shared/store/keyVisuals.svelte.js';
  import { type LedMode, GRADIENT_PRESETS } from '$shared/constants/config-schema.js';

  async function toggleLiveMode() {
    if (trainingMode.active) await trainingMode.stop();
    else await trainingMode.start();
  }

  type DS = NonNullable<typeof deviceStatus.data>;
  const data = $derived(deviceStatus.data as DS | null);

  // ── Connection ───────────────────────────────────────────────
  const usbOn = $derived(data?.connection?.usb === true);
  const bleOn = $derived(data?.connection?.ble === true);
  const bleSlot = $derived(data?.connection?.ble_slot ?? 0);

  async function handleReload() {
    await loadConfig();
    // Reload from the device then re-select the first profile (and its first layer).
    configState.activeProfileIndex = 0;
    configState.activeLayerIndex = 0;
  }

  const bleName = $derived(configState.data?.ble?.device_name ?? 'SpinPad');

  let settingsOpen = $state(false);

  // ── LED matrix sync (global + active profile) ────────────────
  const activeProfile = $derived(configState.data?.profiles?.[configState.activeProfileIndex]);

  const matrixMode = $derived<LedMode>(
    (activeProfile?.led?.effect ?? configState.data?.led_key?.effect ?? 'static') as LedMode,
  );
  const matrixColorMode = $derived<'solid' | 'gradient'>(
    matrixMode === 'rainbow' || matrixMode === 'flow' || matrixMode === 'sweep' ? 'gradient' : 'solid',
  );
  const matrixColors = $derived.by((): string[] => {
    if (matrixMode === 'rainbow') return ['#34d399', '#22d3ee', '#3b82f6', '#34d399'];
    const gl = configState.data?.led_key;
    if ((matrixMode === 'flow' || matrixMode === 'sweep') && gl?.gradient_preset !== undefined) {
      return [...(GRADIENT_PRESETS[gl.gradient_preset]?.colors ?? GRADIENT_PRESETS[0].colors)];
    }
    const pl = activeProfile?.led;
    const r = pl?.r ?? gl?.r ?? 255;
    const g = pl?.g ?? gl?.g ?? 255;
    const b = pl?.b ?? gl?.b ?? 255;
    return [`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`];
  });

  // Stop training mode when device disconnects (unless devMode is on).
  $effect(() => {
    if (!serial.connected && !devMode.active) {
      if (trainingMode.active) trainingMode.stop();
    }
  });
</script>

<Card.Root class="@container/card relative h-full py-0 gap-0 z-10 w-full">
  <Card.Header
    class="relative h-full py-4 overflow-hidden isolate shadow-[inset_0_0px_50px_rgba(0,0,0,1)] shadow-black/50"
  >
    <LedMatrix
      mode={matrixMode}
      color={matrixColorMode}
      colors={matrixColors}
      muted={serial.connected || devMode.active ? false : true}
      brightness={0.85}
      cell={6}
      dotRatio={0.7}
      speed={0.5}
      pulses={() => [...keyVisuals.pressNonce, keyVisuals.encoderPress]}
      rotation={() => keyVisuals.encoderTurn}
      pop={0.5}
      eqGain={0.25}
      class="absolute inset-0 pointer-events-none -z-10"
    />
    <!-- LED showcase as header background: off if nothing is connected. -->
    <Card.Description>
      <!-- ══ Connection ════════════════════════════════ -->
      <div class="flex flex-wrap gap-2">
        <Badge variant={usbOn ? 'default' : 'outline'} class="gap-1">
          <Usb class="size-3" />
          USB {usbOn ? 'ON' : 'OFF'}
        </Badge>
        <Badge variant={bleOn ? 'default' : 'outline'} class="gap-1">
          <Bluetooth class="size-3" />
          BLE {bleOn ? `slot ${bleSlot}` : 'OFF'}
        </Badge>
      </div>
    </Card.Description>

    <Card.Title class="text-3xl font-semibold text-shadow-lg  @[250px]/card:text-4xl self-end mt-20">
      {bleName}
    </Card.Title>

    <Card.Action>
      <StatusCard />
    </Card.Action>
  </Card.Header>

  <Card.Footer class="flex flex-wrap gap-2">
    {#if serial.connected || devMode.active}
      <Button variant={trainingMode.active ? 'default' : 'outline'} onclick={toggleLiveMode}>
        <Activity /> Training
      </Button>
    {/if}
    <ButtonGroup.Root>
      <LedManager />
      <MacroManager />
    </ButtonGroup.Root>

    <Button variant="outline" size="icon" class="ms-auto" onclick={() => (settingsOpen = true)}>
      <Settings />
    </Button>
    <ResponsiveSheet
      bind:open={settingsOpen}
      title="Settings"
      description="All options are saved automatically."
      srOnlyTitle={false}
      desktopClass="w-full max-w-md!"
    >
      {#snippet badge()}
        <SaveBadge class="ms-auto" />
      {/snippet}
      <div class="flex flex-col w-full h-full max-w-5xl px-4 pt-4 mx-auto overflow-hidden">
        <SettingsTab />
      </div>
    </ResponsiveSheet>

    <!-- <ButtonGroup.Root>
      <Button variant="outline" size="icon" onclick={handleReload}>
        <RefreshCw />
      </Button>
      {#if serial.connected}
        <Button variant="outline" size="icon" onclick={disconnect} class="ms-auto gap-1.5">
          <LogOut class="size-4" />
        </Button>
      {/if}
    </ButtonGroup.Root> -->
  </Card.Footer>
</Card.Root>
