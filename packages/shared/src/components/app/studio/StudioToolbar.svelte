<script lang="ts">
  import {
    configState,
    saveConfig,
    undo,
    redo,
    canUndo,
    canRedo,
    exportConfig,
    importConfig,
  } from '../../../store/config.svelte.js';
  import { serial } from '../../../store/serial.svelte.js';
  import { devMode } from '../../../store/devMode.svelte.js';
  import {
    startPolling,
    stopPolling,
  } from '../../../store/deviceStatus.svelte.js';
  import * as Drawer from '../../../components/ui/drawer/index.js';
  import SettingsTab from './settings/SettingsTab.svelte';

  // Démarrer le polling du statut device quand connecté ou en mode démo.
  // Le store route automatiquement vers le bon transport (serial / http / mock).
  $effect(() => {
    const shouldPoll =
      serial.connected ||
      devMode.active ||
      import.meta.env.VITE_TRANSPORT === 'http';
    if (shouldPoll) {
      startPolling(5000);
      return () => stopPolling();
    }
  });
  import { Button, buttonVariants } from '../../ui/button/index.js';
  import { Separator } from '../../ui/separator/index.js';
  import StatusCard from '../StatusCard.svelte';
  import { toast } from 'svelte-sonner';
  import {
    Save,
    Undo2,
    Redo2,
    Upload,
    Download,
    LoaderCircle,
    Check,
    Info,
    Settings2,
  } from '@lucide/svelte';
  import { cn } from '../../../utils.js';

  let fileInput = $state<HTMLInputElement | null>(null);

  function onImportClick() {
    fileInput?.click();
  }

  async function onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      await importConfig(file);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[import]', msg);
      toast.error('Import échoué', { description: msg });
    }
    if (fileInput) {
      fileInput.value = '';
    }
  }

  const isOnline = $derived(serial.connected || devMode.active);
</script>

<StatusCard />

<div class="grow"></div>

{#if isOnline}
  <!-- Connection status -->

  <!-- Undo / Redo -->
  <Button
    size="icon"
    variant="ghost"
    onclick={undo}
    disabled={!canUndo()}
    title="Annuler (Ctrl+Z)"
  >
    <Undo2 class="size-4" />
  </Button>
  <Button
    size="icon"
    variant="ghost"
    onclick={redo}
    disabled={!canRedo()}
    title="Rétablir (Ctrl+Y)"
  >
    <Redo2 class="size-4" />
  </Button>

  <Separator orientation="vertical" />

  <!-- Import / Export -->
  <Button
    size="icon"
    variant="ghost"
    onclick={onImportClick}
    title="Importer une config (.spinpad)"
    disabled={!configState.data}
  >
    <Upload class="size-4" />
  </Button>

  <Button
    size="icon"
    variant="ghost"
    onclick={exportConfig}
    title="Exporter la config (.spinpad)"
    disabled={!configState.data}
  >
    <Download class="size-4" />
  </Button>

  <!-- Auto-save indicator / Force save -->
  <!-- {#if configState.isSaving}
      <Button
        size="sm"
        variant="ghost"
        class="gap-1.5 text-muted-foreground"
        disabled
      >
        <LoaderCircle class="size-4 animate-spin" />
        Sauvegarde…
      </Button>
    {:else if configState.isDirty}
      <Button size="sm" onclick={saveConfig} class="gap-1.5">
        <Save class="size-4" />
        Sauvegarder
      </Button>
    {:else}
      <Button
        size="sm"
        variant="ghost"
        class="gap-1.5 text-muted-foreground"
        disabled
      >
        <Check class="size-4" />
        Sauvegardé
      </Button>
    {/if} -->

  <!-- Hidden file input for import -->
  <input
    bind:this={fileInput}
    type="file"
    accept=".spinpad,.json"
    class="hidden"
    onchange={onFileSelected}
  />

  <Drawer.Root direction="top">
    <Drawer.Trigger
      class={cn(buttonVariants({ variant: 'outline' }), 'capitalize')}
    >
      <Settings2 />
    </Drawer.Trigger>
    <Drawer.Content>
      <Drawer.Header>
        <Drawer.Title>Settings</Drawer.Title>
        <Drawer.Description>This action cannot be undone.</Drawer.Description>
      </Drawer.Header>
      <div class="w-full h-full max-w-5xl px-4 mx-auto overflow-y-auto">
        <SettingsTab />
      </div>

      <!-- <Drawer.Footer>
        <Button>Submit</Button>
        <Drawer.Close>Cancel</Drawer.Close>
      </Drawer.Footer> -->
    </Drawer.Content>
  </Drawer.Root>
{/if}
