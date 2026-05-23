<script>
  import {
    connect,
    disconnect,
    factoryReset,
    serial,
  } from "$lib/serial/index.svelte.js";
  import {
    loadConfig,
    saveConfig,
    configState,
  } from "$lib/store/config.svelte.js";
  import { devMode } from "$lib/store/devMode.svelte.js";
  import { APP_CONFIG } from "$lib/app.config.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import InfoCard from "$lib/components/app/InfoCard.svelte";
  import {
    Plug,
    PlugZap,
    RefreshCw,
    LogOut,
    Trash2,
    FlaskConical,
  } from "@lucide/svelte";
  import * as Item from "$lib/components/ui/item/index.js";
  import { Spinner } from "$lib/components/ui/spinner/index.js";

  async function handleConnect() {
    const ok = await connect();
    if (ok) await loadConfig();
  }

  async function handleFactoryReset() {
    if (
      !confirm(
        "Remettre la config à zéro ? Toutes les modifications seront perdues.",
      )
    )
      return;
    await factoryReset();
    await loadConfig();
  }

  async function handleDevMode() {
    devMode.active = true;
    await loadConfig();
  }

  const isOnline = $derived(serial.connected || devMode.active);
</script>

<svelte:head>
  <title>Editor — {APP_CONFIG.name}</title>
</svelte:head>

<!-- Hero -->
<div class="text-center py-10">
  <h1 class="text-3xl font-bold mb-2">{APP_CONFIG.name}</h1>
  <p class="text-muted-foreground text-sm">{APP_CONFIG.tagline}</p>
</div>

{#if !isOnline}
  <!-- Not connected -->
  <div class="flex flex-col items-center gap-4 mt-4">
    <Button onclick={handleConnect} size="lg" class="gap-2">
      <PlugZap class="size-5" />
      Connecter le clavier
    </Button>

    {#if serial.error}
      <p class="text-destructive text-sm">{serial.error}</p>
    {/if}

    <div class="mt-2 text-center">
      <Button
        variant="ghost"
        size="sm"
        onclick={handleDevMode}
        class="text-amber-400 hover:text-amber-300 gap-1.5"
      >
        <FlaskConical class="size-4" />
        Lancer le mode démo
      </Button>
      <p class="text-xs text-muted-foreground mt-1">
        Prérequis : Chrome ou Edge, clavier USB. WebSerial non supporté sur
        Firefox.
      </p>
    </div>
  </div>
{:else if configState.isLoading}
  <div class="flex w-full max-w-xs mx-auto flex-col gap-4 [--radius:1rem]">
    <Item.Root variant="muted">
      <Item.Media>
        <Spinner />
      </Item.Media>
      <Item.Content>
        <Item.Title class="line-clamp-1"
          >Chargement de la configuration...</Item.Title
        >
      </Item.Content>
    </Item.Root>
  </div>
{:else if configState.data}
  <!-- Info grid -->
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
    <InfoCard
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
        configState.data.ble?.active_slot
      ]}
    />
    <InfoCard
      label="Sleep timeout"
      value="{configState.data.power?.sleep_timeout_s}s"
    />
    <InfoCard label="Version" value="v{configState.data.version}" />
  </div>

  {#if configState.loadError}
    <p class="text-destructive text-sm mt-4">{configState.loadError}</p>
  {/if}
{:else}
  <div class="text-center mt-10">
    <p class="text-muted-foreground text-sm mb-3">Aucune config chargée.</p>
    <Button variant="outline" onclick={loadConfig}>Charger</Button>
  </div>
{/if}
<!-- Actions -->
<div class="flex flex-wrap gap-2">
  {#if configState.isDirty}
    <Button onclick={saveConfig} class="gap-1.5">💾 Sauvegarder</Button>
  {/if}
  <Button variant="outline" onclick={loadConfig} class="gap-1.5">
    <RefreshCw class="size-4" /> Recharger
  </Button>
  {#if serial.connected}
    <Button variant="outline" onclick={disconnect} class="gap-1.5">
      <LogOut class="size-4" /> Déconnecter
    </Button>
    <Button variant="destructive" onclick={handleFactoryReset} class="gap-1.5">
      <Trash2 class="size-4" /> Reset usine
    </Button>
  {/if}
</div>
