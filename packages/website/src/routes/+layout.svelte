<script lang="ts">
  import "../app.css";
  import { ModeWatcher } from "mode-watcher";
  import { page } from "$app/stores";

  import * as Breadcrumb from "$shared/components/ui/breadcrumb/index.js";
  import { Separator } from "$shared/components/ui/separator/index.js";
  import * as Sidebar from "$shared/components/ui/sidebar/index.js";
  import AppSidebar from "../lib/components/ui/app-sidebar.svelte";

  import { createHeaderRight } from "$lib/header-right.svelte.js";
  import { getBreadcrumbs } from "$lib/nav.js";

  let { children } = $props();

  const headerRight = createHeaderRight();
  const breadcrumbs = $derived(getBreadcrumbs($page.url.pathname, $page.data?.title as string | undefined));
</script>

<ModeWatcher defaultMode="dark" />

<Sidebar.Provider>
  <AppSidebar />
  <Sidebar.Inset>
    <header class="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 px-4">
      <!-- Left: trigger + breadcrumbs -->
      <div class="flex items-center gap-2 min-w-0">
        <Sidebar.Trigger class="-ms-1" />
        {#if breadcrumbs.length > 0}
          <Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb.Root>
            <Breadcrumb.List>
              {#each breadcrumbs as crumb, i (crumb.url)}
                {#if i > 0}
                  <Breadcrumb.Separator class="hidden md:block" />
                {/if}
                <Breadcrumb.Item class={i < breadcrumbs.length - 1 ? "hidden md:block" : ""}>
                  {#if crumb.current}
                    <Breadcrumb.Page>{crumb.title}</Breadcrumb.Page>
                  {:else}
                    <Breadcrumb.Link href={crumb.url}>{crumb.title}</Breadcrumb.Link>
                  {/if}
                </Breadcrumb.Item>
              {/each}
            </Breadcrumb.List>
          </Breadcrumb.Root>
        {/if}
      </div>

      <!-- Right: dynamic slot for per-page toolbar content -->
      {#if headerRight.current}
        <div class="ms-auto flex items-center gap-2">
          <svelte:component
            this={headerRight.current.component}
            {...headerRight.current.props}
          />
        </div>
      {/if}
    </header>

    <main class="flex flex-col flex-1">
      {@render children()}
    </main>
  </Sidebar.Inset>
</Sidebar.Provider>
