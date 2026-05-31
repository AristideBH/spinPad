<script lang="ts">
  import * as Card from '$shared/components/ui/card/index.js';
  import { Badge } from '$shared/components/ui/badge/index.js';
  import { Button, buttonVariants } from '$shared/components/ui/button/index.js';
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import { Usb, Bluetooth, RefreshCw, LogOut, Trash2, Settings2, Lightbulb } from '@lucide/svelte';
  import { deviceStatus } from '$shared/store/deviceStatus.svelte.js';
  import { disconnect, serial } from '$shared/store/serial.svelte.js';
  import * as Drawer from '$shared/components/ui/drawer/index.js';
  import SettingsTab from '$shared/components/app/studio/settings/SettingsTab.svelte';
  import { cn } from '$shared/utils.js';
  import { loadConfig, factoryReset, configState } from '$shared/store/config.svelte.js';
  import MacroManager from '$shared/components/app/studio/MacroManager.svelte';
  import StatusCard from '../../StatusCard.svelte';

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

  const bleName = $derived(configState.data?.ble?.device_name ?? 'SpinPad');
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
    <Button variant="outline" onclick={handleFactoryReset} class="gap-1.5">
      <Lightbulb /> LED
    </Button>
    <MacroManager />

    <Drawer.Root direction="right">
      <Drawer.Trigger class={cn(buttonVariants({ variant: 'outline' }), '')}>
        <Settings2 /> Paramètres
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Settings</Drawer.Title>
          <!-- <Drawer.Description>This action cannot be undone.</Drawer.Description> -->
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

    <ButtonGroup.Root class="ms-auto">
      <Button variant="outline" size="icon" onclick={loadConfig}>
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
