<script lang="ts">
  import { APP_CONFIG } from "../../../app.config.js";
  import { serial } from "../../../serial/index.svelte.js";
  import { devMode } from "../../../store/devMode.svelte.js";
  import { Toaster } from "svelte-sonner";
  import ConnectBanner from "./ConnectBanner.svelte";
  import DashboardTab from "./daskboard/DashboardTab.svelte";
  import KeypadTab from "./keypad/KeypadTab.svelte";

  const isOnline = $derived(serial.connected || devMode.active);
</script>

<Toaster theme="system" richColors position="bottom-right" />

<svelte:head>
  <title>{APP_CONFIG.name} — Studio</title>
</svelte:head>

{#if !isOnline}
  <ConnectBanner />
  {:else}
  <article class="items-stretch w-full max-w-5xl px-6 py-6 mx-auto">
    <DashboardTab />
    <KeypadTab />
  </article>
  {/if}
