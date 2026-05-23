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

  const isOnline = $derived(serial.connected || devMode.active);
</script>

<svelte:head>
  <title>Dashboard — {APP_CONFIG.name}</title>
</svelte:head>

<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
  <div class="grid auto-rows-min gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
    <div class="bg-muted/50 aspect-video rounded-xl"></div>
  </div>
  <div class="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min"></div>
</div>
