<script>
  import "../app.css";

  import { page } from "$app/state";
  import { serial } from "$lib/serial/index.svelte.js";
  import {
    configState,
    saveConfig,
    loadConfig,
  } from "$lib/store/config.svelte.js";
  import { devMode } from "$lib/store/devMode.svelte.js";
  import { APP_CONFIG } from "$lib/app.config.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import ThemeToggle from "$lib/components/app/ThemeToggle.svelte";
  import DevModeBanner from "$lib/components/app/DevModeBanner.svelte";
  import { Keyboard, FlaskConical, Save } from "@lucide/svelte";
  import { ModeWatcher } from "mode-watcher";

  import AppSidebar from "$lib/components/ui/app-sidebar.svelte";
  import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import StatusCard from "$lib/components/app/StatusCard.svelte";

  let { children } = $props();

  const navItems = [
    { href: "/", label: "Dashboard", match: (p) => p === "/" },
    { href: "/keymap", label: "Keymap", match: (p) => p.startsWith("/keymap") },
    {
      href: "/profiles",
      label: "Profils",
      match: (p) => p.startsWith("/profiles"),
    },
    { href: "/ble", label: "BLE", match: (p) => p.startsWith("/ble") },
    {
      href: "/display",
      label: "Écran",
      match: (p) => p.startsWith("/display"),
    },
    { href: "/docs", label: "Docs", match: (p) => p.startsWith("/docs") },
  ];

  async function handleDevMode() {
    devMode.active = true;
    await loadConfig();
  }
</script>

<ModeWatcher />

<Sidebar.Provider>
  <AppSidebar />
  <Sidebar.Inset>
    <header class="flex h-16 shrink-0 items-center gap-2 justify-between">
      <div class="flex items-center gap-2 px-6">
        <Sidebar.Trigger class="-ms-1" />
        <Separator
          orientation="vertical"
          class="me-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item class="hidden md:block">
              <Breadcrumb.Link href="/editor">Editor</Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator class="hidden md:block" />
            <Breadcrumb.Item>
              <Breadcrumb.Page>Dashboard</Breadcrumb.Page>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>
      </div>
      <div class="flex items-center gap-2 px-6">
        <!-- Dev mode toggle (visible si non connecté et non actif) -->
        <!-- {#if !serial.connected && !devMode.active}
          <Button
            variant="ghost"
            size="sm"
            onclick={handleDevMode}
            class="text-muted-foreground hover:text-amber-400 gap-1.5"
          >
            <FlaskConical class="size-4" />
            Mode démo
          </Button>
        {/if} -->
        <StatusCard></StatusCard>
        <!-- Save button -->
        {#if configState.isDirty}
          <Button size="sm" onclick={saveConfig} class="gap-1.5">
            <Save class="size-4" />
            Sauvegarder
          </Button>
        {/if}
      </div>
    </header>
    <DevModeBanner />
    <main class="px-6 py-6">
      {@render children()}
    </main>
  </Sidebar.Inset>
</Sidebar.Provider>
