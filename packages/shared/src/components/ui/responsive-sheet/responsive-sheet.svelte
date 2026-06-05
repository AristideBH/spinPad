<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import * as Drawer from '$shared/components/ui/drawer/index.js';
  import * as Sheet from '$shared/components/ui/sheet/index.js';
  import * as Dialog from '$shared/components/ui/dialog/index.js';
  import { IsMobile } from '$shared/store/is-mobile.svelte.js';
  import type { Side } from '$shared/components/ui/sheet/sheet-content.svelte';
  import { cn } from '$shared';

  type Props = {
    open?: boolean;
    title: string;
    description?: string;
    /** Hide title visually (kept for a11y). Default true. */
    srOnlyTitle?: boolean;
    /** Desktop presentation: side panel ('sheet') or centered popup ('dialog'). Default 'sheet'. */
    desktop?: 'sheet' | 'dialog';
    /** Sheet side (desktop, 'sheet' only). Default 'right'. */
    side?: Side;
    /** Breakpoint in px for mobile switch. Default 768. */
    breakpoint?: number;
    /** Drawer dismissible prop (mobile). */
    dismissible?: boolean;
    /** Use vaul NestedRoot on mobile (when opened inside another Drawer). */
    nested?: boolean;
    /** Class override for desktop Sheet/Dialog.Content. */
    desktopClass?: string;
    /** Class override for mobile Drawer.Content. */
    mobileClass?: string;
    /** Show close button on desktop Sheet/Dialog. Default true. */
    showCloseButton?: boolean;
    header?: Snippet;
    /** Header-end slot (e.g. auto-saved badge). Rendered next to the title. */
    badge?: Snippet;
    footer?: Snippet;
    children: Snippet;
  };

  let {
    open = $bindable(false),
    title,
    description,
    srOnlyTitle = true,
    desktop = 'sheet',
    side = 'right',
    breakpoint = 768,
    dismissible = true,
    nested = false,
    desktopClass = 'min-h-[85dvh]',
    mobileClass = 'max-h-[85dvh]',
    showCloseButton = true,
    header,
    badge,
    footer,
    children,
  }: Props = $props();

  // breakpoint est une prop "configure-once" : valeur initiale uniquement.
  const isMobile = new IsMobile(untrack(() => breakpoint));
</script>

{#snippet drawerBody()}
  <Drawer.Content class={mobileClass}>
    <Drawer.Header class={cn('w-full max-w-md mx-auto ', srOnlyTitle ? 'sr-only' : undefined)}>
      <div class="flex items-center gap-2">
        <Drawer.Title>{title}</Drawer.Title>
        {#if badge && !srOnlyTitle}<span class="ms-auto">{@render badge()}</span>{/if}
      </div>
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
{:else if desktop === 'dialog'}
  <Dialog.Root bind:open>
    <Dialog.Content {showCloseButton} class={desktopClass}>
      <Dialog.Header class={cn('', srOnlyTitle ? 'sr-only' : undefined)}>
        <div class="flex items-center gap-2 pe-8">
          <Dialog.Title>{title}</Dialog.Title>
          {#if badge && !srOnlyTitle}<span class="ms-auto">{@render badge()}</span>{/if}
        </div>
        {#if description}<Dialog.Description>{description}</Dialog.Description>{/if}
      </Dialog.Header>
      {#if header}{@render header()}{/if}
      {@render children()}
      {#if footer}<Dialog.Footer>{@render footer()}</Dialog.Footer>{/if}
    </Dialog.Content>
  </Dialog.Root>
{:else}
  <Sheet.Root bind:open>
    <Sheet.Content {side} {showCloseButton} class={desktopClass}>
      <Sheet.Header class={cn('', srOnlyTitle ? 'sr-only' : undefined)}>
        <div class="flex items-center max-w-md gap-2 pe-8">
          <Sheet.Title>{title}</Sheet.Title>
          {#if badge && !srOnlyTitle}<span class="ms-auto">{@render badge()}</span>{/if}
        </div>
        {#if description}<Sheet.Description>{description}</Sheet.Description>{/if}
      </Sheet.Header>
      {#if header}{@render header()}{/if}
      {@render children()}
      {#if footer}<Sheet.Footer>{@render footer()}</Sheet.Footer>{/if}
    </Sheet.Content>
  </Sheet.Root>
{/if}
