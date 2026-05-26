<script lang="ts">
  import { PersistedState } from "runed";
  import * as Tabs from "./components/ui/tabs/index.js";
  import DashboardTab from "./components/app/tabs/DashboardTab.svelte";
  import KeypadTab from "./components/app/tabs/KeypadTab.svelte";
  import SettingsTab from "./components/app/tabs/SettingsTab.svelte";
  import { APP_CONFIG } from "./app.config.js";

  import {
    configState,
    saveConfig,
    undo,
    redo,
    canUndo,
    canRedo,
    exportConfig,
    importConfig,
  } from "./store/config.svelte.js";
  import { serial } from "./serial/index.svelte.js";
  import { devMode } from "./store/devMode.svelte.js";
  import { startPolling, stopPolling } from "./store/deviceStatus.svelte.js";

  // Démarrer le polling du statut device quand connecté ou en mode démo.
  // Le store route automatiquement vers le bon transport (serial / http / mock).
  $effect(() => {
    const shouldPoll =
      serial.connected ||
      devMode.active ||
      import.meta.env.VITE_TRANSPORT === "http";
    if (shouldPoll) {
      startPolling(5000);
      return () => stopPolling();
    }
  });
  import { Button } from "./components/ui/button/index.js";
  import { Separator } from "./components/ui/separator/index.js";
  import StatusCard from "./components/app/StatusCard.svelte";
  import {
    Save,
    Undo2,
    Redo2,
    Upload,
    Download,
    Loader2,
    Check,
  } from "@lucide/svelte";

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

  const activeTab = new PersistedState<string>(
    "spinpad-active-tab",
    "dashboard",
  );
</script>

<svelte:head>
  <title>{APP_CONFIG.name} — Studio</title>
</svelte:head>

<header>
  <div class="flex items-center gap-2 px-6">
    <!-- Connection status -->
    <StatusCard />

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

    <!-- Auto-save indicator / Force save -->
    {#if configState.isSaving}
      <Button
        size="sm"
        variant="ghost"
        class="gap-1.5 text-muted-foreground"
        disabled
      >
        <Loader2 class="size-4 animate-spin" />
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

<main class="items-stretch w-full max-w-5xl px-6 py-6 mx-auto">
  <Tabs.Root bind:value={activeTab.current} class="w-full">
    <Tabs.List class="mb-6">
      <Tabs.Trigger value="dashboard">Dashboard</Tabs.Trigger>
      <Tabs.Trigger value="keypad">Keypad</Tabs.Trigger>
      <Tabs.Trigger value="parametres">Paramètres</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="dashboard">
      <DashboardTab />
    </Tabs.Content>

    <Tabs.Content value="keypad">
      <KeypadTab />
    </Tabs.Content>

    <Tabs.Content value="parametres">
      <SettingsTab />
    </Tabs.Content>
  </Tabs.Root>
</main>
