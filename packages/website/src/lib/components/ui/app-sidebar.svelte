<script lang="ts">
  import * as Collapsible from "$lib/components/ui/collapsible/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { page } from "$app/stores";
  import HomeIcon from "@lucide/svelte/icons/house";
  import MonitorIcon from "@lucide/svelte/icons/monitor";
  import ZapIcon from "@lucide/svelte/icons/zap";
  import BookOpenIcon from "@lucide/svelte/icons/book-open";
  import ExternalLinkIcon from "@lucide/svelte/icons/external-link";
  import LifeBuoyIcon from "@lucide/svelte/icons/life-buoy";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import type { ComponentProps } from "svelte";

  let {
    ref = $bindable(null),
    ...restProps
  }: ComponentProps<typeof Sidebar.Root> = $props();

  const docsItems = [
    { title: "Démarrage",   url: "/docs/getting-started/" },
    { title: "Keymap",      url: "/docs/keymap/" },
    { title: "Encodeur",    url: "/docs/encoder/" },
    { title: "LEDs",        url: "/docs/leds/" },
    { title: "Studio Mode", url: "/docs/studio-mode/" },
    { title: "Orientation", url: "/docs/orientation/" },
    { title: "Bluetooth",   url: "/docs/ble/" },
    { title: "Compiler",    url: "/docs/firmware-build/" },
  ];

  let docsOpen = $derived($page.url.pathname.startsWith("/docs"));
  let isHome    = $derived($page.url.pathname === "/");
  let isStudio  = $derived($page.url.pathname.startsWith("/studio"));
  let isFlash   = $derived($page.url.pathname.startsWith("/flash"));
</script>

<Sidebar.Root bind:ref variant="inset" {...restProps}>
  <!-- ── Header / Logo ─────────────────────────────── -->
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg">
          {#snippet child({ props })}
            <a href="/" {...props}>
              <div class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg font-bold text-xs">
                SP
              </div>
              <div class="grid flex-1 text-start text-sm leading-tight">
                <span class="truncate font-semibold">SpinPad</span>
                <span class="truncate text-xs text-muted-foreground">macropad</span>
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

        <!-- Accueil -->
        <Sidebar.MenuItem>
          <Sidebar.MenuButton isActive={isHome} tooltipContent="Accueil">
            {#snippet child({ props })}
              <a href="/" {...props}>
                <HomeIcon />
                <span>Accueil</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>

        <!-- Studio -->
        <Sidebar.MenuItem>
          <Sidebar.MenuButton isActive={isStudio} tooltipContent="Studio">
            {#snippet child({ props })}
              <a href="/studio/app/" {...props}>
                <MonitorIcon />
                <span>Studio</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>

        <!-- Flash -->
        <Sidebar.MenuItem>
          <Sidebar.MenuButton isActive={isFlash} tooltipContent="Flash firmware">
            {#snippet child({ props })}
              <a href="/flash/" {...props}>
                <ZapIcon />
                <span>Flash firmware</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>

        <!-- Documentation (collapsible) -->
        <Collapsible.Root open={docsOpen}>
          {#snippet child({ props })}
            <Sidebar.MenuItem {...props}>
              <Sidebar.MenuButton isActive={docsOpen} tooltipContent="Documentation">
                {#snippet child({ props: btnProps })}
                  <a href="/docs/" {...btnProps}>
                    <BookOpenIcon />
                    <span>Documentation</span>
                  </a>
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
                  {#each docsItems as item (item.title)}
                    <Sidebar.MenuSubItem>
                      <Sidebar.MenuSubButton
                        href={item.url}
                        isActive={$page.url.pathname === item.url}
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

      </Sidebar.Menu>
    </Sidebar.Group>

    <!-- Secondary (bottom) -->
    <Sidebar.Group class="mt-auto">
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton tooltipContent="GitHub">
            {#snippet child({ props })}
              <a href="https://github.com/YOUR_ORG/spinpad" target="_blank" rel="noopener" {...props}>
                <ExternalLinkIcon />
                <span>GitHub</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton tooltipContent="Support / Feedback">
            {#snippet child({ props })}
              <a href="/feedback/" {...props}>
                <LifeBuoyIcon />
                <span>Support / Feedback</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Group>
  </Sidebar.Content>

  <Sidebar.Rail />
</Sidebar.Root>
