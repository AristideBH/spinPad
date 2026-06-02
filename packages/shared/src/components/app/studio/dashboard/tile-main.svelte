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
    Trash2,
    Settings2,
    Lightbulb,
    Activity,
    Check,
    ChevronDown,
  } from '@lucide/svelte';
  import { deviceStatus } from '$shared/store/deviceStatus.svelte.js';
  import { disconnect, serial } from '$shared/store/serial.svelte.js';
  import { ResponsiveSheet } from '$shared/components/ui/responsive-sheet/index.js';
  import SettingsTab from '$shared/components/app/studio/settings/SettingsTab.svelte';
  import { loadConfig, factoryReset, configState } from '$shared/store/config.svelte.js';
  import { testMode } from '$shared/store/testMode.svelte.js';
  import { trainingMode } from '$shared/store/trainingMode.svelte.js';
  import { devMode } from '$shared/store/devMode.svelte.js';
  import * as DropdownMenu from '$shared/components/ui/dropdown-menu/index.js';
  import MacroManager from '$shared/components/app/studio/MacroManager.svelte';
  import StatusCard from '../../StatusCard.svelte';

  type LiveMode = 'off' | 'test' | 'training';
  const liveModeLabel = $derived<LiveMode>(testMode.active ? 'test' : trainingMode.active ? 'training' : 'off');

  async function setLiveMode(mode: LiveMode) {
    if (mode === 'test') await testMode.start();
    else if (mode === 'training') await trainingMode.start();
    else {
      await testMode.stop();
      await trainingMode.stop();
    }
  }

  type DS = NonNullable<typeof deviceStatus.data>;
  const data = $derived(deviceStatus.data as DS | null);

  // ── Connexion ────────────────────────────────────────────────
  const usbOn = $derived(data?.connection?.usb === true);
  const bleOn = $derived(data?.connection?.ble === true);
  const bleSlot = $derived(data?.connection?.ble_slot ?? 0);

  async function handleFactoryReset() {
    if (!confirm('Remettre la config à zéro ? Toutes les modifications seront perdues.')) return;
    await factoryReset();
    await loadConfig();
  }

  async function handleReload() {
    await loadConfig();
    // Recharge depuis le device puis re-sélectionne le premier profil (et son premier layer).
    configState.activeProfileIndex = 0;
    configState.activeLayerIndex = 0;
  }

  const bleName = $derived(configState.data?.ble?.device_name ?? 'SpinPad');

  let settingsOpen = $state(false);

  // Stop live modes when device disconnects (unless devMode is on).
  $effect(() => {
    if (!serial.connected && !devMode.active) {
      if (testMode.active) testMode.stop();
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
      <ButtonGroup.Root>
        <Button variant={liveModeLabel === 'off' ? 'outline' : 'default'}>
          {liveModeLabel === 'off' ? 'Live' : liveModeLabel === 'test' ? 'Testing' : 'Training'}
        </Button>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button {...props} variant={liveModeLabel === 'off' ? 'outline' : 'default'}>
                <ChevronDown />
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end" class="min-w-44">
            <DropdownMenu.Item onclick={() => setLiveMode('off')}>
              {#if liveModeLabel === 'off'}
                <Check class="size-3.5" />
              {:else}
                <span class="size-3.5"></span>
              {/if}
              Off
            </DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => setLiveMode('test')}>
              {#if liveModeLabel === 'test'}
                <Check class="size-3.5" />
              {:else}
                <span class="size-3.5"></span>
              {/if}
              Test <span class="ms-auto text-[10px] text-muted-foreground">visualiser</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => setLiveMode('training')}>
              {#if liveModeLabel === 'training'}
                <Check class="size-3.5" />{:else}<span class="size-3.5"></span>{/if}
              Train <span class="ms-auto text-[10px] text-muted-foreground">configurer</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </ButtonGroup.Root>
    {/if}

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
    </ResponsiveSheet>

    <ButtonGroup.Root>
      <Button variant="outline" size="icon" onclick={handleReload}>
        <RefreshCw />
      </Button>
      {#if serial.connected}
        <Button variant="outline" onclick={disconnect} class="ms-auto gap-1.5">
          <LogOut class="size-4" /> Déconnecter
        </Button>

        <!-- <Button variant="destructive" onclick={handleFactoryReset} class="gap-1.5">
          <Trash2 class="size-4" /> Reset usine
        </Button> -->
      {/if}
    </ButtonGroup.Root>
  </Card.Footer>
</Card.Root>
