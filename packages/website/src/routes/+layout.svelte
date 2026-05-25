<script lang="ts">
  import "../app.css";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import AppSidebar from "$lib/components/ui/app-sidebar.svelte";
  import { ModeWatcher } from "mode-watcher";

  let { children } = $props();
</script>

<ModeWatcher defaultMode="dark" />

<Sidebar.Provider>
  <AppSidebar />
  <Sidebar.Inset>
    <main class="flex-1 overflow-y-auto">
      {@render children()}
    </main>

    <footer class="border-t border-border py-6 text-center text-sm text-muted-foreground">
      SpinPad — Open source macropad · MIT License
    </footer>
  </Sidebar.Inset>
</Sidebar.Provider>
