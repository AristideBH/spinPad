<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import * as Drawer from '$shared/components/ui/drawer/index.js';
  import * as Sheet from '$shared/components/ui/sheet/index.js';
  import { IsMobile } from '$shared/store/is-mobile.svelte.js';
  import type { Side } from '$shared/components/ui/sheet/sheet-content.svelte';

  type Props = {
    open?: boolean;
    title: string;
    description?: string;
    /** Hide title visually (kept for a11y). Default true. */
    srOnlyTitle?: boolean;
    /** Sheet side (desktop). Default 'right'. */
    side?: Side;
    /** Breakpoint in px for mobile switch. Default 768. */
    breakpoint?: number;
    /** Drawer dismissible prop (mobile). */
    dismissible?: boolean;
    /** Use vaul NestedRoot on mobile (when opened inside another Drawer). */
    nested?: boolean;
    /** Class override for desktop Sheet.Content. */
    desktopClass?: string;
    /** Class override for mobile Drawer.Content. */
    mobileClass?: string;
    /** Show close button on desktop Sheet. Default true. */
    showCloseButton?: boolean;
    header?: Snippet;
    footer?: Snippet;
    children: Snippet;
  };

  let {
    open = $bindable(false),
    title,
    description,
    srOnlyTitle = true,
    side = 'right',
    breakpoint = 768,
    dismissible = true,
    nested = false,
    desktopClass,
    mobileClass = 'max-h-[85vh]',
    showCloseButton = true,
    header,
    footer,
    children,
  }: Props = $props();

  // breakpoint est une prop "configure-once" : valeur initiale uniquement.
  const isMobile = new IsMobile(untrack(() => breakpoint));
</script>

{#snippet drawerBody()}
  <Drawer.Content class={mobileClass}>
    <Drawer.Header class={srOnlyTitle ? 'sr-only' : undefined}>
      <Drawer.Title>{title}</Drawer.Title>
      {#if description}<Drawer.Description>{description}</Drawer.Description>{/if}
    </Drawer.Header>
    {#if header}{@render header()}{/if}
    {@render children()}
    {#if footer}<Drawer.Footer>{@render footer()}</Drawer.Footer>{/if}
  </Drawer.Content>
{/snippet}

{#if isMobile.current}
  {#if nested}
    <Drawer.NestedRoot bind:open {dismissible}>
      {@render drawerBody()}
    </Drawer.NestedRoot>
  {:else}
    <Drawer.Root bind:open {dismissible}>
      {@render drawerBody()}
    </Drawer.Root>
  {/if}
{:else}
  <Sheet.Root bind:open>
    <Sheet.Content {side} {showCloseButton} class={desktopClass}>
      <Sheet.Header class={srOnlyTitle ? 'sr-only' : undefined}>
        <Sheet.Title>{title}</Sheet.Title>
        {#if description}<Sheet.Description>{description}</Sheet.Description>{/if}
      </Sheet.Header>
      {#if header}{@render header()}{/if}
      {@render children()}
      {#if footer}<Sheet.Footer>{@render footer()}</Sheet.Footer>{/if}
    </Sheet.Content>
  </Sheet.Root>
{/if}
