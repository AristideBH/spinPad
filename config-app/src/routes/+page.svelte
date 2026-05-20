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

  async function handleDevMode() {
    devMode.active = true;
    await loadConfig();
  }

  const isOnline = $derived(serial.connected || devMode.active);
</script>

<svelte:head>
  <title>Dashboard — {APP_CONFIG.name}</title>
</svelte:head>

<!-- Hero -->
<div class="text-center py-10">
  <h1 class="text-3xl font-bold mb-2">{APP_CONFIG.name}</h1>
  <p class="text-muted-foreground text-sm">{APP_CONFIG.tagline}</p>
</div>
