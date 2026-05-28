<script lang="ts">
  import { APP_CONFIG } from "../../../app.config.js";
  import { serial } from "../../../store/serial.svelte.js";
  import { devMode } from "../../../store/devMode.svelte.js";
  import { Toaster } from "svelte-sonner";
  import ConnectBanner from "./ConnectBanner.svelte";
  import Dashboard from "./dashboard/Dashboard.svelte";
  import KeypadTab from "./keypad/KeypadTab.svelte";

  const isOnline = $derived(serial.connected || devMode.active);
</script>


<svelte:head>
  <title>{APP_CONFIG.name} — Studio</title>
</svelte:head>

{#if !isOnline}
  <ConnectBanner />
{:else}
  <article class="flex flex-col items-stretch w-full max-w-5xl gap-6 px-6 py-6 mx-auto">
    <Dashboard />
    <KeypadTab />
  </article>
{/if}

<Toaster theme="system" richColors position="bottom-right" />
