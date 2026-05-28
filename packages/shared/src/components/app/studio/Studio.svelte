<script lang="ts">
  import { APP_CONFIG } from '$shared/app.config.js';
  import { redo, undo } from '$shared/store/config.svelte.js';
  import { devMode } from '$shared/store/devMode.svelte.js';
  import { serial } from '$shared/store/serial.svelte.js';
  import { Toaster } from 'svelte-sonner';
  import ConnectBanner from './ConnectBanner.svelte';
  import Dashboard from './dashboard/Dashboard.svelte';
  import KeypadTab from './keypad/KeypadTab.svelte';

  const isOnline = $derived(serial.connected || devMode.active);

  function handleKeydown(e: KeyboardEvent) {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

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
