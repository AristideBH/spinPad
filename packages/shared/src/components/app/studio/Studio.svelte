<script lang="ts">
  import { onMount } from 'svelte';
  import { APP_CONFIG } from '$shared/app.config.js';
  import {
    configState,
    redo,
    undo,
    loadConfig,
    saveConfig,
    hasPendingSave,
  } from '$shared/store/config.svelte.js';
  import { devMode } from '$shared/store/devMode.svelte.js';
  import { serial } from '$shared/store/serial.svelte.js';
  import { Toaster } from 'svelte-sonner';
  import ConnectBanner from './connect/ConnectBanner.svelte';
  import Dashboard from './dashboard/Dashboard.svelte';
  import Editor from './editor/Editor.svelte';

  const isOnline = $derived(serial.connected || devMode.active);

  onMount(() => {
    if (!configState.data && !configState.isLoading) loadConfig();
  });

  // Safety net: if an auto-save is still within the debounce window (800ms)
  // when the user leaves/reloads, we flush it immediately and ask for
  // confirmation — since the transport write is asynchronous, the prompt
  // gives the write a chance to complete.
  function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (!hasPendingSave()) return;
    void saveConfig();
    e.preventDefault();
  }

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

<svelte:window onkeydown={handleKeydown} onbeforeunload={handleBeforeUnload} />

<svelte:head>
  <title>{APP_CONFIG.name} — Studio</title>
</svelte:head>

{#if !isOnline}
  <ConnectBanner />
{/if}

<article
  class="@container/main transform-gpu flex flex-col items-stretch w-full max-w-5xl gap-6 px-4 py-4 mx-auto transition-all duration-500 ease-in-out"
  class:disabled={!isOnline}
>
  <Dashboard />
  <Editor />
</article>

<Toaster theme="system" richColors position="bottom-right" />

<style>
  article.disabled {
    pointer-events: none;
    user-select: none;

    --tw-blur: blur(var(--blur-xs));
    filter: var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,)
      var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,);
    overflow: visible;
    max-height: calc(100dvh - 16rem);
    margin-top: calc(var(--spacing) * 32);
  }
</style>
