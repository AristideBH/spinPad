<script lang="ts">
  import "../app.css";
  import { ModeWatcher } from "mode-watcher";

  import * as Breadcrumb from "$shared/components/ui/breadcrumb/index.js";
  import { Separator } from "$shared/components/ui/separator/index.js";
  import * as Sidebar from "$shared/components/ui/sidebar/index.js";
  import AppSidebar from "../lib/components/ui/app-sidebar.svelte";

  let { children } = $props();
</script>

<ModeWatcher defaultMode="dark" />

<Sidebar.Provider>
  <AppSidebar />
  <Sidebar.Inset>
    <header class="flex items-center h-16 gap-2 shrink-0">
      <div class="flex items-center gap-2 px-4">
        <Sidebar.Trigger class="-ms-1" />
        <Separator
          orientation="vertical"
          class="me-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item class="hidden md:block">
              <Breadcrumb.Link href="##">Build Your Application</Breadcrumb.Link
              >
            </Breadcrumb.Item>
            <Breadcrumb.Separator class="hidden md:block" />
            <Breadcrumb.Item>
              <Breadcrumb.Page>Data Fetching</Breadcrumb.Page>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>
      </div>
    </header>
    <div class="flex flex-col flex-1 gap-4 p-4 pt-0">
      <div class="grid gap-4 auto-rows-min md:grid-cols-3">
        <div class="bg-muted/50 aspect-video rounded-xl"></div>
        <div class="bg-muted/50 aspect-video rounded-xl"></div>
        <div class="bg-muted/50 aspect-video rounded-xl"></div>
      </div>
      <div class="flex-1 min-h-screen bg-muted/50 rounded-xl md:min-h-min">
        <main class="flex-1 overflow-y-auto">
          {@render children()}
        </main>
      </div>
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
