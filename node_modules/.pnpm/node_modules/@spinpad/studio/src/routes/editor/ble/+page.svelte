<script>
  import { configState } from "$lib/store/config.svelte.js";
  import { APP_CONFIG } from "$lib/app.config.js";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import NotConnected from "$lib/components/app/NotConnected.svelte";

  function updateSlotName(slotIdx, value) {
    const cfg = structuredClone(configState.data);
    cfg.ble.slot_names[slotIdx] = value;
    configState.data = cfg;
    configState.isDirty = true;
  }

  function updateDeviceName(value) {
    const cfg = structuredClone(configState.data);
    cfg.ble.device_name = value;
    configState.data = cfg;
    configState.isDirty = true;
  }
</script>

<svelte:head>
  <title>BLE — {APP_CONFIG.name}</title>
</svelte:head>

<h2 class="text-xl font-bold mb-6">Configuration BLE</h2>

{#if !configState.data}
  <NotConnected />
{:else}
  <div class="flex flex-col gap-4 max-w-md">
    <Card>
      <CardHeader>
        <CardTitle
          class="text-sm uppercase tracking-widest text-muted-foreground font-semibold"
          >Appareil</CardTitle
        >
      </CardHeader>
      <CardContent class="pt-0">
        <div class="flex flex-col gap-1.5">
          <Label>Nom diffusé en Bluetooth</Label>
          <Input
            value={configState.data.ble.device_name}
            oninput={(e) => updateDeviceName(e.target.value)}
            maxlength={31}
          />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle
          class="text-sm uppercase tracking-widest text-muted-foreground font-semibold"
          >Slots de connexion</CardTitle
        >
      </CardHeader>
      <CardContent class="pt-0 flex flex-col gap-4">
        {#each [0, 1] as slotIdx}
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center gap-2">
              <Badge variant={slotIdx === 0 ? "default" : "secondary"}
                >Slot {slotIdx}</Badge
              >
              <Label class="text-muted-foreground text-xs">
                {slotIdx === 0 ? "Premier appareil" : "Second appareil"}
              </Label>
            </div>
            <Input
              value={configState.data.ble.slot_names[slotIdx]}
              oninput={(e) => updateSlotName(slotIdx, e.target.value)}
            />
          </div>
        {/each}

        <p
          class="text-xs text-muted-foreground bg-muted/50 rounded-md p-3 leading-relaxed"
        >
          <strong class="">Comment switcher ?</strong><br />
          • <strong>SW11</strong> (court appui) = changer d'appareil actif<br />
          • <strong>SW16 + SW17 maintenus 2s</strong> = mode pairing pour le slot
          actif
        </p>
      </CardContent>
    </Card>
  </div>
{/if}
