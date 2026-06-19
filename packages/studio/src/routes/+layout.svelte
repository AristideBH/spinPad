<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { featureFlags } from '$shared/store/featureFlags.svelte.js';
  import { ModeWatcher } from 'mode-watcher';
  import StudioToolbar from '$shared/components/app/studio/StudioToolbar.svelte';
  import { page } from '$app/state';
  import { afterNavigate } from '$app/navigation';
  import { blur } from 'svelte/transition';
  import { scrollToTop } from '$shared/lib/page-transitions.js';
  import { createHeaderTransition } from '$shared/lib/hooks/header-transition.svelte.js';

  let { children } = $props();

  const ht = createHeaderTransition();
  const title = $derived((page.data?.title as string | undefined) ?? 'Studio');

  onMount(() => {
    featureFlags.applyFromUrl(new URL(window.location.href));
  });

  afterNavigate((nav) => {
    if (nav.type === 'enter') return;
    scrollToTop(document.documentElement, ht.reducedMotion);
  });
</script>

<ModeWatcher defaultMode="dark" />

<header
  class="sticky bottom-0 order-last z-10 flex items-center w-full min-h-16 gap-8 mx-auto border-t shrink-0 border-border/50 bg-background pb-[env(safe-area-inset-bottom)] md:order-0 md:top-0 md:bottom-auto md:h-16 md:border-t-0 md:border-b"
>
  <div class="flex items-center w-full max-w-5xl gap-6 px-4 mx-auto">
    <div class="flex items-center gap-2">
      <div
        class="flex items-center justify-center text-xs font-bold rounded-lg bg-sidebar-primary text-sidebar-primary-foreground aspect-square size-8"
      >
        SP
      </div>
      <div class="grid items-center *:[grid-area:1/1]">
        {#key title}
          <span class="font-semibold" in:blur={ht.headerTransition} out:blur={ht.headerTransition}>
            {title}
          </span>
        {/key}
      </div>
    </div>
    <div class="flex items-center w-full gap-2 ms-auto">
      <StudioToolbar helpHref="/help" />
    </div>
  </div>
</header>

<main class="items-stretch w-full max-w-5xl py-6 mx-auto">
  {@render children()}
</main>
