<script lang="ts">
  import * as Collapsible from '$shared/components/ui/collapsible/index.js';
  import * as Sidebar from '$shared/components/ui/sidebar/index.js';
  import { page } from '$app/state';
  import HomeIcon from '@lucide/svelte/icons/house';
  import Palette from '@lucide/svelte/icons/Palette';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import LifeBuoyIcon from '@lucide/svelte/icons/life-buoy';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import type { ComponentProps } from 'svelte';
  import { navTree } from '$lib/nav.js';
  import { getDocsTree, type DocTreeNode } from '$lib/docs';
  import { WrenchIcon, ShoppingCart } from '@lucide/svelte';

  let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

  const docsTree = getDocsTree();
  const toolsItem =
    navTree.find((n) => n.url === '/studio/') || navTree.find((n) => n.url === '/flash/')!;
  const toolsChildren = toolsItem.children ?? [];

  let docsOpen = $derived(page.url.pathname.startsWith('/docs'));
  let toolsOpen = $derived(
    page.url.pathname.startsWith('/studio') || page.url.pathname.startsWith('/flash')
  );
  let isHome = $derived(page.url.pathname === '/');
  let isShop = $derived(page.url.pathname === '/shop/');
  let isStudio = $derived(page.url.pathname.startsWith('/studio'));
  let isFlash = $derived(page.url.pathname.startsWith('/flash'));
</script>

<!-- Recursive docs nav: folders render as group markers, docs as links, any depth. -->
{#snippet docNodes(items: DocTreeNode[], depth: number)}
  {#each items as node (node.type === 'folder' ? node.path : node.entry.slug)}
    {#if node.type === 'folder'}
      <li
        class="mt-2 mb-0.5 px-2 text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground"
        style="padding-left: {0.5 + depth * 0.5}rem"
      >
        {node.label}
      </li>
      {@render docNodes(node.children, depth + 1)}
    {:else}
      <Sidebar.MenuSubItem>
        <Sidebar.MenuSubButton
          href={node.entry.url}
          isActive={page.url.pathname === node.entry.url}
        >
          {node.entry.title}
        </Sidebar.MenuSubButton>
      </Sidebar.MenuSubItem>
    {/if}
  {/each}
{/snippet}

<Sidebar.Root bind:ref variant="inset" collapsible="icon" {...restProps}>
  <!-- ── Header / Logo ─────────────────────────────── -->
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg">
          {#snippet child({ props })}
            <a href="/" {...props}>
              <div
                class="flex items-center justify-center text-xs font-bold rounded-lg bg-sidebar-primary text-sidebar-primary-foreground aspect-square size-8"
              >
                SP
              </div>
              <div class="grid flex-1 text-sm leading-tight text-start">
                <span class="font-semibold truncate">SpinPad</span>
                <span class="text-xs truncate text-muted-foreground">macropad</span>
              </div>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>

  <!-- ── Content ───────────────────────────────────── -->
  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton isActive={isHome} tooltipContent="Accueil">
            {#snippet child({ props })}
              <a href="/" {...props}><HomeIcon /><span>Accueil</span></a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton isActive={isShop} tooltipContent="Boutique">
            {#snippet child({ props })}
              <a href="/shop/" {...props}><ShoppingCart /><span>Boutique</span></a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>

        <!-- <Sidebar.MenuItem>
          <Sidebar.MenuButton isActive={isStudio} tooltipContent="Studio">
            {#snippet child({ props })}
              <a href="/studio/" {...props}><Palette /><span>Studio</span></a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>

        <Sidebar.MenuItem>
          <Sidebar.MenuButton isActive={isFlash} tooltipContent="Flash firmware">
            {#snippet child({ props })}
              <a href="/flash/" {...props}><ZapIcon /><span>Flash firmware</span></a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem> -->

        <!-- Tools (collapsible) -->
        <Collapsible.Root open={toolsOpen}>
          {#snippet child({ props })}
            <Sidebar.MenuItem {...props}>
              <Sidebar.MenuButton tooltipContent="Outils">
                {#snippet child({ props: btnProps })}
                  <a href="/studio/" {...btnProps}><WrenchIcon /><span>Outils</span></a>
                {/snippet}
              </Sidebar.MenuButton>
              <Collapsible.Trigger>
                {#snippet child({ props: trigProps })}
                  <Sidebar.MenuAction {...trigProps} class="data-[state=open]:rotate-90">
                    <ChevronRightIcon />
                    <span class="sr-only">Ouvrir/Fermer</span>
                  </Sidebar.MenuAction>
                {/snippet}
              </Collapsible.Trigger>
              <Collapsible.Content>
                <Sidebar.MenuSub>
                  {#each toolsChildren as item (item.title)}
                    <Sidebar.MenuSubItem>
                      <Sidebar.MenuSubButton
                        href={item.url}
                        isActive={page.url.pathname === item.url}
                      >
                        {item.title}
                      </Sidebar.MenuSubButton>
                    </Sidebar.MenuSubItem>
                  {/each}
                </Sidebar.MenuSub>
              </Collapsible.Content>
            </Sidebar.MenuItem>
          {/snippet}
        </Collapsible.Root>
        <!-- Documentation (collapsible) -->
        <Collapsible.Root open={docsOpen}>
          {#snippet child({ props })}
            <Sidebar.MenuItem {...props}>
              <Sidebar.MenuButton isActive={docsOpen} tooltipContent="Documentation">
                {#snippet child({ props: btnProps })}
                  <a href="/docs/" {...btnProps}><BookOpenIcon /><span>Documentation</span></a>
                {/snippet}
              </Sidebar.MenuButton>
              <Collapsible.Trigger>
                {#snippet child({ props: trigProps })}
                  <Sidebar.MenuAction {...trigProps} class="data-[state=open]:rotate-90">
                    <ChevronRightIcon />
                    <span class="sr-only">Ouvrir/Fermer</span>
                  </Sidebar.MenuAction>
                {/snippet}
              </Collapsible.Trigger>
              <Collapsible.Content>
                <Sidebar.MenuSub>
                  {@render docNodes(docsTree, 0)}
                </Sidebar.MenuSub>
              </Collapsible.Content>
            </Sidebar.MenuItem>
          {/snippet}
        </Collapsible.Root>
      </Sidebar.Menu>
    </Sidebar.Group>

    <!-- Secondary (bottom) -->
    <Sidebar.Group class="mt-auto">
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton tooltipContent="GitHub">
            {#snippet child({ props })}
              <a
                href="https://github.com/AristideBH/spinPad"
                target="_blank"
                rel="noopener"
                {...props}
              >
                <ExternalLinkIcon /><span>GitHub</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton tooltipContent="Support / Feedback">
            {#snippet child({ props })}
              <a href="/feedback/" {...props}><LifeBuoyIcon /><span>Support / Feedback</span></a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Group>
  </Sidebar.Content>

  <Sidebar.Rail />
</Sidebar.Root>
