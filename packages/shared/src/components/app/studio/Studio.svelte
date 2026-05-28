<script lang="ts">
  import { APP_CONFIG } from '$shared/app.config.js';
  import { configState, loadConfig, redo, undo } from '$shared/store/config.svelte.js';
  import { devMode } from '$shared/store/devMode.svelte.js';
  import { serial } from '$shared/store/serial.svelte.js';
  import { Toaster } from 'svelte-sonner';
  import { Spinner } from '$shared/components/ui/spinner/index.js';
  import * as Item from '$shared/components/ui/item/index.js';
  import ConnectBanner from './ConnectBanner.svelte';
  import Dashboard from './dashboard/Dashboard.svelte';
  import KeypadTab from './keypad/KeypadTab.svelte';
  import { Button } from '$shared/components/ui/button';

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
{:else if configState.isLoading}
  <div class="flex w-full max-w-xs mx-auto flex-col gap-4 py-12 [--radius:1rem]">
    <Item.Root variant="muted">
      <Item.Media><Spinner /></Item.Media>
      <Item.Content>
        <Item.Title class="line-clamp-1">Chargement de la configuration…</Item.Title>
      </Item.Content>
    </Item.Root>
  </div>
{:else if configState.data}
  <article class="flex flex-col items-stretch w-full max-w-5xl gap-6 px-6 py-6 mx-auto">
    <Dashboard />
    <KeypadTab />
  </article>
{:else}
  <div class="py-10 text-center">
    <p class="mb-3 text-sm text-muted-foreground">Aucune config chargée.</p>
    <Button variant="outline" onclick={loadConfig}>Charger</Button>
  </div>
{/if}

<Toaster theme="system" richColors position="bottom-right" />
