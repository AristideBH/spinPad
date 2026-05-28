<script lang="ts">
  import * as Card from '$shared/components/ui/card/index.js';
  import { Badge } from '$shared/components/ui/badge/index.js';
  import { Button, buttonVariants } from '$shared/components/ui/button/index.js';
  import { Usb, Bluetooth, RefreshCw, LogOut, Trash2, Save, Settings2 } from '@lucide/svelte';
  import { deviceStatus } from '$shared/store/deviceStatus.svelte.js';
  import { disconnect, serial } from '$shared/store/serial.svelte.js';
  import * as Drawer from '$shared/components/ui/drawer/index.js';
  import SettingsTab from '$shared/components/app/studio/settings/SettingsTab.svelte';
  import { cn } from '$shared/utils.js';


  import {
    loadConfig,
    saveConfig,
    configState,
    factoryReset,
  } from '$shared/store/config.svelte.js';
  import { Spinner } from '$shared/components/ui/spinner/index.js';

  type DS = NonNullable<typeof deviceStatus.data>;
  const data = $derived(deviceStatus.data as DS | null);

  // ── Connexion ────────────────────────────────────────────────
  const usbOn = $derived(data?.connection?.usb === true);
  const bleOn = $derived(data?.connection?.ble === true);
  const bleSlot = $derived(data?.connection?.ble_slot ?? 0);

  async function handleFactoryReset() {
    if (
      !confirm(
        'Remettre la config à zéro ? Toutes les modifications seront perdues.',
      )
    )
      return;
    await factoryReset();
    await loadConfig();
  }
</script>

<Card.Root class="@container/card col-span-3 row-span-2">
  <Card.Header class="h-full">
    <Card.Description>SpinPad</Card.Description>
    <Card.Title
      class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
    >
      SpinPad Pro
    </Card.Title>
    <Card.Action>
      <!-- <Badge variant="outline">+12.5%</Badge> -->
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
      {#if data?.connection?.studio_mode}
        <p class="text-[10px] text-amber-500 uppercase tracking-wider mt-2">
          Studio Mode actif
        </p>
      {/if}
    </Card.Action>
  </Card.Header>

  <Card.Footer class="flex flex-wrap gap-2">
    <!-- Actions -->
    <Button onclick={saveConfig}  disabled={!configState.isDirty} class="gap-1.5">
    {#if configState.isDirty}
      <Spinner /> Sauvegarde
    {:else}
      <Save class="size-4" /> Sauvegardé
    {/if}
    </Button>
    
    <Button variant="outline" onclick={loadConfig} class="gap-1.5">
      <RefreshCw class="size-4" /> Recharger
    </Button>

    <Drawer.Root direction="right">
      <Drawer.Trigger
        class={cn(buttonVariants({ variant: 'outline' }), 'capitalize')}
      >
        <Settings2 /> Paramètres
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Settings</Drawer.Title>
          <Drawer.Description>This action cannot be undone.</Drawer.Description>
        </Drawer.Header>
        <div class="w-full h-full max-w-5xl px-4 mx-auto overflow-y-auto">
          <SettingsTab />
        </div>

        <!-- <Drawer.Footer>
          <Button>Submit</Button>
          <Drawer.Close>Cancel</Drawer.Close>
        </Drawer.Footer> -->
      </Drawer.Content>
    </Drawer.Root>

    {#if serial.connected}
      <Button variant="outline" onclick={disconnect} class="gap-1.5">
        <LogOut class="size-4" /> Déconnecter
      </Button>
      
      <Button
        variant="destructive"
        onclick={handleFactoryReset}
        class="gap-1.5"
      >
        <Trash2 class="size-4" /> Reset usine
      </Button>
    {/if}
  </Card.Footer>
</Card.Root>
