<script lang="ts">
  import '../app.css';
  import { ModeWatcher } from 'mode-watcher';
  import { page } from '$app/state';
  import { afterNavigate } from '$app/navigation';
  import { blur } from 'svelte/transition';

  import * as Breadcrumb from '$shared/components/ui/breadcrumb/index.js';
  import DotIcon from '@lucide/svelte/icons/dot';
  import { Separator } from '$shared/components/ui/separator/index.js';
  import * as Sidebar from '$shared/components/ui/sidebar/index.js';
  import AppSidebar from '../lib/components/ui/app-sidebar.svelte';
  import PageCurtain from '$lib/components/PageCurtain.svelte';
  import { scrollToTop } from '$shared/lib/page-transitions.js';
  import { createHeaderTransition } from '$shared/lib/hooks/header-transition.svelte.js';

  import { PersistedState } from 'runed';
  import { createHeaderRight } from '$lib/header-right.svelte.js';
  import { getBreadcrumbs } from '$lib/nav.js';

  let { children } = $props();

  const sidebarOpen = new PersistedState('spinpad-sidebar-open', true);

  const headerRight = createHeaderRight();
  const breadcrumbs = $derived(
    getBreadcrumbs(page.url.pathname, page.data?.title as string | undefined)
  );

  // Blur+fade the per-page header content on nav; reduced motion → plain fade.
  const ht = createHeaderTransition();

  // Studio mounts a JS mosaic grid whose height settles a frame after mount, so
  // a translateY entrance amplifies the reflow into a visible jump. Heavy routes
  // get a pure opacity fade (shift-immune) instead of the per-child stagger.
  const heavyRoute = $derived(page.url.pathname.startsWith('/studio'));

  // Scroll the content area back to top on every navigation. The scroll
  // container is the Sidebar.Inset <main>, not the window, so SvelteKit's own
  // scroll reset doesn't reach it. afterNavigate covers page-to-page nav AND
  // clicking a link to the current URL (SvelteKit treats that as a navigation).
  // Hash-anchor clicks take SvelteKit's early-return path, so they don't fire
  // here. Snappy smooth-scroll; reduced motion / already-at-top jumps instantly.
  let insetEl = $state<HTMLElement | null>(null);

  afterNavigate((nav) => {
    if (nav.type === 'enter') return; // initial load — nothing to scroll
    scrollToTop(insetEl, ht.reducedMotion);
  });
</script>

<ModeWatcher defaultMode="dark" />

<Sidebar.Provider bind:open={sidebarOpen.current}>
  <AppSidebar />
  <Sidebar.Inset bind:ref={insetEl}>
    <header
      class="sticky bottom-0 order-last z-10 flex items-center w-full min-h-16 gap-8 mx-auto border-t shrink-0 border-border/50 bg-background pb-[env(safe-area-inset-bottom)] md:order-0 md:top-0 md:bottom-auto md:h-16 md:border-t-0 md:border-b md:rounded-t-xl md:pb-0"
    >
      <!-- Left: trigger + breadcrumbs -->
      <div class="flex w-full max-w-5xl gap-6 px-4 mx-auto">
        <div class="flex items-center gap-2">
          <Sidebar.Trigger class="-ms-1" />
          <!-- Grid stack so the out-going and in-coming generations overlap
               in one cell during the blur swap (no width reflow). -->
          <div class="grid items-center *:[grid-area:1/1]">
            {#key page.url.pathname}
              <div
                class="flex items-center gap-2"
                in:blur={ht.headerTransition}
                out:blur={ht.headerTransition}
              >
                {#if breadcrumbs.length > 0}
                  <Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
                  <Breadcrumb.Root>
                    <Breadcrumb.List>
                      {#each breadcrumbs as crumb, i (i)}
                        {#if i > 0}
                          {#if !breadcrumbs[i - 1].url && !breadcrumbs[i - 1].current}
                            <!-- separator between a group (folder) and its child -->
                            <Breadcrumb.Separator class="hidden md:block">
                              <DotIcon />
                            </Breadcrumb.Separator>
                          {:else}
                            <Breadcrumb.Separator class="hidden md:block" />
                          {/if}
                        {/if}
                        <Breadcrumb.Item
                          class={i < breadcrumbs.length - 1 ? 'hidden md:block' : ''}
                        >
                          {#if crumb.current}
                            <Breadcrumb.Page>{crumb.title}</Breadcrumb.Page>
                          {:else if crumb.url}
                            <Breadcrumb.Link href={crumb.url}>{crumb.title}</Breadcrumb.Link>
                          {:else}
                            <span class="font-normal text-muted-foreground">{crumb.title}</span>
                          {/if}
                        </Breadcrumb.Item>
                      {/each}
                    </Breadcrumb.List>
                  </Breadcrumb.Root>
                {/if}
              </div>
            {/key}
          </div>
        </div>
        <!-- Right: dynamic slot for per-page toolbar content -->
        {#if headerRight.current}
          <div class="relative grid items-center w-full ms-auto *:[grid-area:1/1] container/main">
            {#key page.url.pathname}
              <div
                class="flex items-center w-full gap-2"
                in:blur={ht.headerTransition}
                out:blur={ht.headerTransition}
              >
                {@render headerRight.current()}
              </div>
            {/key}
          </div>
        {/if}
      </div>
    </header>

    <!-- Content area: curtain (reflects real load state) sits over the keyed
         page content, which fly+fades in (staggered) on every navigation. -->
    <div class="relative flex flex-col flex-1">
      <!-- <PageCurtain direction="bottom" /> -->
      {#key page.url.pathname}
        <div
          class="@container/main flex flex-1 flex-col gap-4 md:gap-6"
          class:page-stagger={!heavyRoute}
          class:page-fade={heavyRoute}
        >
          {@render children()}
        </div>
      {/key}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
