<script lang="ts">
  import {
    configState, saveConfig,
    undo, redo, canUndo, canRedo,
    exportConfig, importConfig,
  } from "$lib/store/config.svelte.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import StatusCard from "$lib/components/app/StatusCard.svelte";
  import { Save, Undo2, Redo2, Upload, Download, Loader2, Check } from "@lucide/svelte";

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[import]", msg);
      alert(`Import échoué : ${msg}`);
    }
    fileInput.value = "";
  }
</script>

<!-- Studio toolbar (sticky header inside the sidebar inset) -->
<header class="flex h-14 shrink-0 border-b items-center gap-2 justify-between sticky top-0 bg-background z-10 px-4">
  <div class="flex items-center gap-2">
    <Sidebar.Trigger class="-ms-1" />
    <span class="text-sm font-medium text-muted-foreground">Studio</span>
  </div>
  <div class="flex items-center gap-2">
    <StatusCard />
    <Separator orientation="vertical" class="data-[orientation=vertical]:h-4" />

    <!-- Undo / Redo -->
    <Button size="icon" variant="ghost" onclick={undo} disabled={!canUndo()} title="Annuler (Ctrl+Z)">
      <Undo2 class="size-4" />
    </Button>
    <Button size="icon" variant="ghost" onclick={redo} disabled={!canRedo()} title="Rétablir (Ctrl+Y)">
      <Redo2 class="size-4" />
    </Button>

    <Separator orientation="vertical" class="data-[orientation=vertical]:h-4" />

    <!-- Import / Export -->
    <Button size="icon" variant="ghost" onclick={onImportClick} title="Importer (.spinpad)" disabled={!configState.data}>
      <Upload class="size-4" />
    </Button>
    <Button size="icon" variant="ghost" onclick={exportConfig} title="Exporter (.spinpad)" disabled={!configState.data}>
      <Download class="size-4" />
    </Button>

    <Separator orientation="vertical" class="data-[orientation=vertical]:h-4" />

    <!-- Auto-save indicator -->
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

    <input
      bind:this={fileInput}
      type="file"
      accept=".spinpad,.json"
      class="hidden"
      onchange={onFileSelected}
    />
  </div>
</header>

<div class="px-6 py-6 max-w-5xl mx-auto w-full">
  {@render children()}
</div>
