<script lang="ts">
  import "../app.css";

  import {
    configState, saveConfig,
    undo, redo, canUndo, canRedo,
    exportConfig, importConfig,
  } from "$lib/store/config.svelte.js";
  import { devMode } from "$lib/store/devMode.svelte.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import DevModeBanner from "$lib/components/app/DevModeBanner.svelte";
  import { Save, Undo2, Redo2, Upload, Download, Loader2, Check } from "@lucide/svelte";
  import { ModeWatcher } from "mode-watcher";

  import AppSidebar from "$lib/components/ui/app-sidebar.svelte";
  import StatusCard from "$lib/components/app/StatusCard.svelte";

  let { children } = $props();

  let fileInput: HTMLInputElement;

  function onImportClick() {
    fileInput.click();
  }

  async function onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      await importConfig(file);
    } catch (err: any) {
      console.error('[import]', err.message);
      alert(`Import échoué : ${err.message}`);
    }
    // Reset input pour permettre de re-importer le même fichier
    fileInput.value = '';
  }
</script>

<ModeWatcher />

<Sidebar.Provider class="h-screen">
  <AppSidebar />
  <Sidebar.Inset class="overflow-x-hidden overflow-y-auto">
    <header
      class="flex h-16 shrink-0 border-b items-center gap-2 justify-between sticky top-0 bg-background rounded-t-xl"
    >
      <div class="flex items-center gap-2 px-6">
        <Sidebar.Trigger class="-ms-1" />
      </div>
      <div class="flex items-center gap-2 px-6">
        <!-- Connection status -->
        <StatusCard />

        <Separator orientation="vertical" class="data-[orientation=vertical]:h-4" />

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

        <Separator orientation="vertical" class="data-[orientation=vertical]:h-4" />

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

        <Separator orientation="vertical" class="data-[orientation=vertical]:h-4" />

        <!-- Auto-save indicator / Force save -->
        {#if configState.isSaving}
          <Button size="sm" variant="ghost" class="gap-1.5 text-muted-foreground" disabled>
            <Loader2 class="size-4 animate-spin" />
            Sauvegarde…
          </Button>
        {:else if configState.isDirty}
          <Button size="sm" onclick={saveConfig} class="gap-1.5">
            <Save class="size-4" />
            Sauvegarder
          </Button>
        {:else}
          <Button size="sm" variant="ghost" class="gap-1.5 text-muted-foreground" disabled>
            <Check class="size-4" />
            Sauvegardé
          </Button>
        {/if}

        <!-- Hidden file input for import -->
        <input
          bind:this={fileInput}
          type="file"
          accept=".spinpad,.json"
          class="hidden"
          onchange={onFileSelected}
        />
      </div>
    </header>

    <!-- <DevModeBanner /> -->

    <main class="px-6 py-6 max-w-5xl mx-auto w-full items-stretch">
      {@render children()}
    </main>
  </Sidebar.Inset>
</Sidebar.Provider>
