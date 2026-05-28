<script lang="ts">
  import { disconnect, serial } from '$shared/store/serial.svelte.js';
  import {
    loadConfig,
    saveConfig,
    configState,
    factoryReset,
  } from '$shared/store/config.svelte.js';
  import { devMode } from '$shared/store/devMode.svelte.js';
  import { refreshDeviceStatus } from '$shared/store/deviceStatus.svelte.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import { Badge } from '$shared/components/ui/badge/index.js';
  import { CardContent } from '$shared/components/ui/card/index.js';
  import * as Card from '$shared/components/ui/card/index.js';
  import InfoCard from '$shared/components/app/InfoCard.svelte';
  import BatteryTile from './tile-battery.svelte';
  import { Spinner } from '$shared/components/ui/spinner/index.js';
  import * as Item from '$shared/components/ui/item/index.js';
  import { RefreshCw, LogOut, Trash2, FlaskConical } from '@lucide/svelte';
  import FirmwareTile from './tile-firmware.svelte';
  import MainTile from './tile-main.svelte';
  import ScreenTile from './tile-screen.svelte';

  type BatteryScenario = 'present' | 'absent' | 'low';
  type ConnScenario = 'usb' | 'ble' | 'both';
  const BATT_SCENARIOS: { v: BatteryScenario; label: string }[] = [
    { v: 'present', label: '78 %' },
    { v: 'low', label: '12 %' },
    { v: 'absent', label: 'Absente' },
  ];
  const CONN_SCENARIOS: { v: ConnScenario; label: string }[] = [
    { v: 'usb', label: 'USB' },
    { v: 'ble', label: 'BLE' },
    { v: 'both', label: 'USB + BLE' },
  ];

  function setBatt(v: BatteryScenario) {
    devMode.battery = v;
    refreshDeviceStatus();
  }
  function setConn(v: ConnScenario) {
    devMode.connection = v;
    refreshDeviceStatus();
  }

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

<!-- Connection state -->
{#if configState.isLoading}
  <div
    class="flex w-full max-w-xs mx-auto flex-col gap-4 py-12 [--radius:1rem]"
  >
    <Item.Root variant="muted">
      <Item.Media><Spinner /></Item.Media>
      <Item.Content>
        <Item.Title class="line-clamp-1"
          >Chargement de la configuration…</Item.Title
        >
      </Item.Content>
    </Item.Root>
  </div>
{:else if configState.data}
  <!-- Live device status (battery / connection / firmware) -->

  <section
    class="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-5"
  >
    <MainTile />
    <ScreenTile />
    <BatteryTile />
    <FirmwareTile />
    <!-- <InfoCard
      label="Profils"
      value={configState.data.profile_count ??
        configState.data.profiles?.length}
    />
    <InfoCard
      label="Profil actif"
      value={configState.data.profiles?.[configState.data.active_profile]?.name}
    />
    <InfoCard
      label="BLE Device"
      value={configState.data.ble?.slot_names?.[
        configState.data.ble?.active_slot ?? 0
      ]}
    /> -->

    {#if !devMode.active}
      <Card.Root
        class="mb-6 border-amber-500/40! bg-amber-500/5! col-span-full"
      >
        <CardContent class="p-4">
          <div class="flex items-center gap-2 mb-3">
            <FlaskConical class="size-4 text-amber-500" />
            <span
              class="text-xs font-semibold tracking-widest uppercase text-amber-500"
            >
              Scénarios démo
            </span>
          </div>
          <div class="flex flex-col gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <span class="w-20 text-xs text-muted-foreground">Batterie</span>
              {#each BATT_SCENARIOS as s}
                <Button
                  variant={devMode.battery === s.v ? 'default' : 'outline'}
                  size="sm"
                  onclick={() => setBatt(s.v)}
                >
                  {s.label}
                </Button>
              {/each}
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="w-20 text-xs text-muted-foreground">Connexion</span>
              {#each CONN_SCENARIOS as s}
                <Button
                  variant={devMode.connection === s.v ? 'default' : 'outline'}
                  size="sm"
                  onclick={() => setConn(s.v)}
                >
                  {s.label}
                </Button>
              {/each}
            </div>
          </div>
        </CardContent>
      </Card.Root>
    {/if}
  </section>

  <!-- Profiles section -->
  <!-- <h3 class="mb-3 text-base font-semibold">Profils</h3>
  <div class="flex flex-col max-w-md gap-3">
    {#each configState.data.profiles as prof, i}
      {@const isActive = i === configState.data.active_profile}
      <Card.Root class={isActive ? 'border-primary/60' : ''}>
        <CardContent class="flex items-center gap-3 p-4">
          <div
            class="flex items-center justify-center text-sm font-bold rounded-full size-9 shrink-0"
            class:bg-primary={isActive}
            class:text-primary-foreground={isActive}
            class:bg-muted={!isActive}
            class:text-muted-foreground={!isActive}
          >
            {i}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-semibold">{prof.name}</span>
              {#if isActive}
                <Badge variant="default" class="text-[10px] px-1.5 py-0"
                  >Actif</Badge
                >
              {/if}
            </div>
            <p class="text-xs text-muted-foreground">
              {prof.layers?.length ?? 0} layer(s) · {prof.combos?.length ?? 0} combo(s)
            </p>
          </div>
        </CardContent>
      </Card.Root>
    {/each}
  </div> -->
{:else}
  <div class="py-10 text-center">
    <p class="mb-3 text-sm text-muted-foreground">Aucune config chargée.</p>
    <Button variant="outline" onclick={loadConfig}>Charger</Button>
  </div>
{/if}
