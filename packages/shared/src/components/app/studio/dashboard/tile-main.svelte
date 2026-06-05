<script lang="ts">
  import * as Card from '$shared/components/ui/card/index.js';
  import { Badge } from '$shared/components/ui/badge/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import {
    Usb,
    Bluetooth,
    RefreshCw,
    LogOut,
    Lightbulb,
    Activity,
    Settings,
    PanelRightClose,
    PanelRightOpen,
    PanelBottomClose,
    PanelBottomOpen,
  } from '@lucide/svelte';
  import { deviceStatus } from '$shared/store/deviceStatus.svelte.js';
  import { disconnect, serial } from '$shared/store/serial.svelte.js';
  import { ResponsiveSheet } from '$shared/components/ui/responsive-sheet/index.js';
  import SettingsTab from '$shared/components/app/studio/settings/SettingsTab.svelte';
  import { loadConfig, configState } from '$shared/store/config.svelte.js';
  import { trainingMode } from '$shared/store/trainingMode.svelte.js';
  import { devMode } from '$shared/store/devMode.svelte.js';
  import MacroManager from '$shared/components/app/studio/MacroManager.svelte';
  import StatusCard from '../../StatusCard.svelte';
  import SaveBadge from '$shared/components/app/studio/SaveBadge.svelte';
  import LedMatrix from '$shared/components/app/studio/dashboard/led-matrix.svelte';
  import { keyVisuals } from '$shared/store/keyVisuals.svelte.js';
  import { IsMobile } from '$shared/lib/hooks/is-mobile.svelte';
  let {
    showAnnex = false,
    onToggle,
  }: {
    showAnnex?: boolean;
    onToggle?: () => void;
  } = $props();

  let isMobile = $derived(new IsMobile(976));

  async function toggleLiveMode() {
    if (trainingMode.active) await trainingMode.stop();
    else await trainingMode.start();
  }

  type DS = NonNullable<typeof deviceStatus.data>;
  const data = $derived(deviceStatus.data as DS | null);

  // ── Connexion ────────────────────────────────────────────────
  const usbOn = $derived(data?.connection?.usb === true);
  const bleOn = $derived(data?.connection?.ble === true);
  const bleSlot = $derived(data?.connection?.ble_slot ?? 0);

  async function handleReload() {
    await loadConfig();
    // Recharge depuis le device puis re-sélectionne le premier profil (et son premier layer).
    configState.activeProfileIndex = 0;
    configState.activeLayerIndex = 0;
  }

  const bleName = $derived(configState.data?.ble?.device_name ?? 'SpinPad');

  let settingsOpen = $state(false);

  // Stop training mode when device disconnects (unless devMode is on).
  $effect(() => {
    if (!serial.connected && !devMode.active) {
      if (trainingMode.active) trainingMode.stop();
    }
  });
</script>

<Card.Root class="@container/card relative h-full py-0 gap-0 z-10">
  <Card.Header
    class="relative h-full py-4 overflow-hidden isolate shadow-[inset_0_0px_50px_rgba(0,0,0,1)] shadow-black/50"
  >
    <LedMatrix
      mode="flow"
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
    <!-- Vitrine LED en fond d'en-tête : éteinte si rien n'est connecté. -->
    <Card.Description>
      <!-- ══ Connexion ═════════════════════════════════ -->
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
      <Button variant="outline" class="gap-1.5" title="Contrôle LED (à venir)" disabled>
        <Lightbulb /> LED
      </Button>

      <MacroManager />
    </ButtonGroup.Root>

    <Button variant="outline" size="icon" class="ms-auto" onclick={() => (settingsOpen = true)}>
      <Settings />
    </Button>
    <ResponsiveSheet
      bind:open={settingsOpen}
      title="Paramètres"
      description="Toutes les options sont sauvegardées automatiquement."
      srOnlyTitle={false}
      desktopClass="w-full max-w-md"
    >
      {#snippet badge()}
        <SaveBadge />
      {/snippet}
      <div class="flex flex-col w-full h-full max-w-5xl px-4 mx-auto overflow-hidden">
        <SettingsTab />
      </div>
    </ResponsiveSheet>

    <Button variant="outline" size="icon" onclick={onToggle}>
      {#if isMobile.current}
        {#if showAnnex}<PanelBottomOpen />{:else}<PanelBottomClose />{/if}
      {:else}
        {#if showAnnex}<PanelRightOpen />{:else}<PanelRightClose />{/if}
      {/if}
    </Button>

    <ButtonGroup.Root>
      <Button variant="outline" size="icon" onclick={handleReload}>
        <RefreshCw />
      </Button>
      {#if serial.connected}
        <Button variant="outline" size="icon" onclick={disconnect} class="ms-auto gap-1.5">
          <LogOut class="size-4" />
        </Button>
      {/if}
    </ButtonGroup.Root>
  </Card.Footer>
</Card.Root>
