<script lang="ts">
  import '../app.css';
  import { ModeWatcher } from 'mode-watcher';
  import { page } from '$app/stores';

  import * as Breadcrumb from '$shared/components/ui/breadcrumb/index.js';
  import { Separator } from '$shared/components/ui/separator/index.js';
  import * as Sidebar from '$shared/components/ui/sidebar/index.js';
  import AppSidebar from '../lib/components/ui/app-sidebar.svelte';

  import { PersistedState } from 'runed';
  import { createHeaderRight } from '$lib/header-right.svelte.js';
  import { getBreadcrumbs } from '$lib/nav.js';

  let { children } = $props();

  const sidebarOpen = new PersistedState('spinpad-sidebar-open', true);

  const headerRight = createHeaderRight();
  const breadcrumbs = $derived(
    getBreadcrumbs($page.url.pathname, $page.data?.title as string | undefined)
  );
</script>

<ModeWatcher defaultMode="dark" />

<Sidebar.Provider bind:open={sidebarOpen.current}>
  <AppSidebar />
  <Sidebar.Inset>
    <header
      class="sticky top-0 z-20 flex items-center w-full h-16 max-w-5xl gap-8 px-4 mx-auto border-b shrink-0 border-border/50 bg-background rounded-t-2xl"
    >
      <!-- Left: trigger + breadcrumbs -->
      <div class="flex items-center min-w-0 gap-2">
        <Sidebar.Trigger class="-ms-1" />
        {#if breadcrumbs.length > 0}
          <Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb.Root>
            <Breadcrumb.List>
              {#each breadcrumbs as crumb, i (crumb.url)}
                {#if i > 0}
                  <Breadcrumb.Separator class="hidden md:block" />
                {/if}
                <Breadcrumb.Item class={i < breadcrumbs.length - 1 ? 'hidden md:block' : ''}>
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
        <div class="relative flex items-center w-full gap-2 ms-auto container/main">
          {@render headerRight.current()}
        </div>
      {/if}
    </header>
    <div class="@container/main flex flex-1 flex-col gap-4 md:gap-6">
      {@render children()}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
