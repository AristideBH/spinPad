<script lang="ts">
  import "../app.css";

  import { configState, saveConfig } from "$lib/store/config.svelte.js";
  import { devMode } from "$lib/store/devMode.svelte.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import DevModeBanner from "$lib/components/app/DevModeBanner.svelte";
  import { Save } from "@lucide/svelte";
  import { ModeWatcher } from "mode-watcher";

  import AppSidebar from "$lib/components/ui/app-sidebar.svelte";
  import StatusCard from "$lib/components/app/StatusCard.svelte";
  import Breadcrumbs from "$lib/components/app/Breadcrumbs.svelte";

  let { children } = $props();
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
        <Separator
          orientation="vertical"
          class="me-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumbs></Breadcrumbs>
      </div>
      <div class="flex items-center gap-2 px-6">
        <!-- Connection status -->
        <StatusCard />
        <!-- Save button -->
        <Button
          size="sm"
          onclick={saveConfig}
          class="gap-1.5"
          disabled={!configState.isDirty}
        >
          <Save class="size-4" />
          Sauvegarder
        </Button>
      </div>
    </header>

    <!-- <DevModeBanner /> -->

    <main class="px-6 py-6 max-w-5xl mx-auto w-full items-stretch">
      {@render children()}
    </main>
  </Sidebar.Inset>
</Sidebar.Provider>
