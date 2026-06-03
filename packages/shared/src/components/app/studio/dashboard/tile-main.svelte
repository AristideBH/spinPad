<script lang="ts">
  import * as Card from '$shared/components/ui/card/index.js';
  import { Badge } from '$shared/components/ui/badge/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import { Usb, Bluetooth, RefreshCw, LogOut, Settings2, Lightbulb, Activity, ChartLine } from '@lucide/svelte';
  import { deviceStatus } from '$shared/store/deviceStatus.svelte.js';
  import { disconnect, serial } from '$shared/store/serial.svelte.js';
  import { ResponsiveSheet } from '$shared/components/ui/responsive-sheet/index.js';
  import SettingsTab from '$shared/components/app/studio/settings/SettingsTab.svelte';
  import { loadConfig, configState } from '$shared/store/config.svelte.js';
  import { trainingMode } from '$shared/store/trainingMode.svelte.js';
  import { devMode } from '$shared/store/devMode.svelte.js';
  import MacroManager from '$shared/components/app/studio/MacroManager.svelte';
  import StatsTile from '$shared/components/app/studio/dashboard/tile-stats.svelte';
  import StatusCard from '../../StatusCard.svelte';
  import SaveBadge from '$shared/components/app/studio/SaveBadge.svelte';

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
  let statsOpen = $state(false);

  // Stop training mode when device disconnects (unless devMode is on).
  $effect(() => {
    if (!serial.connected && !devMode.active) {
      if (trainingMode.active) trainingMode.stop();
    }
  });
</script>

<Card.Root class="@container/card col-span-full @4xl/main:col-span-3 @4xl/main:row-span-2">
  <Card.Header class="h-full">
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

    <Card.Title class="text-2xl font-semibold @[250px]/card:text-3xl self-end mb-1 mt-6">
      {bleName}
    </Card.Title>

    <Card.Action>
      <StatusCard />
    </Card.Action>
  </Card.Header>

  <Card.Footer class="flex flex-wrap gap-2">
    <Button variant="outline" class="gap-1.5" title="Contrôle LED (à venir)" disabled>
      <Lightbulb /> LED
    </Button>

    <MacroManager />

    {#if serial.connected || devMode.active}
      <Button variant={trainingMode.active ? 'default' : 'outline'} onclick={toggleLiveMode}>
        <Activity /> Training
      </Button>
    {/if}

    <Button variant="outline" onclick={() => (statsOpen = true)}>
      <ChartLine /> Stats
    </Button>
    <ResponsiveSheet
      bind:open={statsOpen}
      title="Statistiques"
      description="Données d'utilisation depuis le dernier reset."
      srOnlyTitle={false}
      desktopClass="w-full sm:max-w-lg"
    >
      <div class="px-4 pb-4">
        <StatsTile />
      </div>
      {#snippet footer()}
        <SaveBadge />
      {/snippet}
    </ResponsiveSheet>

    <Button variant="outline" class="me-auto" onclick={() => (settingsOpen = true)}>
      <Settings2 /> Paramètres
    </Button>
    <ResponsiveSheet
      bind:open={settingsOpen}
      title="Paramètres"
      description="Toutes les options sont sauvegardées automatiquement."
      srOnlyTitle={false}
      desktopClass="w-full sm:max-w-2xl"
    >
      <div class="w-full h-full max-w-5xl px-4 pb-4 mx-auto overflow-y-auto">
        <SettingsTab />
      </div>
      {#snippet footer()}
        <SaveBadge />
      {/snippet}
    </ResponsiveSheet>

    <ButtonGroup.Root>
      <Button variant="outline" size="icon" onclick={handleReload}>
        <RefreshCw />
      </Button>
      {#if serial.connected}
        <Button variant="outline" onclick={disconnect} class="ms-auto gap-1.5">
          <LogOut class="size-4" /> Déconnecter
        </Button>
      {/if}
    </ButtonGroup.Root>
  </Card.Footer>
</Card.Root>
