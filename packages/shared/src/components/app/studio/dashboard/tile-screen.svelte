<script lang="ts">
  import * as Card from '../../../ui/card/index.js';
  import { Badge } from '../../../ui/badge/index.js';
  import { Button } from '../../../ui/button/index.js';
  import {
    Usb,
    Bluetooth,
    RefreshCw,
    LogOut,
    Trash2,
    SlidersHorizontal,
  } from '@lucide/svelte';
  import { deviceStatus } from '../../../../store/deviceStatus.svelte.js';
  import { disconnect, serial } from '../../../../serial/index.svelte.js';

  import {
    loadConfig,
    saveConfig,
    configState,
    factoryReset,
  } from '../../../../store/config.svelte.js';

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

<Card.Root class="@container/card row-span-2 pb-0">
  <Card.Header class="h-fit ">
    <Card.Description>Screen</Card.Description>
    <Card.Action>
      <Button
        variant="outline"
        class="gap-1.5"
        size="xs"
        on:click={handleFactoryReset}
      >
        <SlidersHorizontal class="size-3" />
      </Button></Card.Action
    >
  </Card.Header>
  <div
    class="flex flex-col items-baseline justify-center h-full gap-4 bg-muted/50 text-balance"
  >
    <span class="p-2 text-sm leading-relaxed text-center text-muted-foreground">
      Aperçu de l'écran du clavier <br />TODO
    </span>
  </div>
</Card.Root>
