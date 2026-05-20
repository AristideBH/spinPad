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

<!-- Top navbar -->
<header
  class="sticky top-0 z-50 flex h-14 items-center gap-1 border-b bg-[hsl(var(--card))] px-4"
>
  <!-- Brand -->
  <a
    href="/"
    class="flex items-center gap-2 mr-4 hover:text-primary transition-colors"
  >
    <Keyboard class="size-5 text-primary" />
    <span class="font-bold text-sm">{APP_CONFIG.name}</span>
  </a>

  <Separator orientation="vertical" class="h-5 mr-2" />

  <!-- Nav links (main app) -->
  {#each navItems.filter((n) => n.href !== "/docs") as item}
    <a
      href={item.href}
      class="px-3 py-1.5 rounded-md text-sm transition-colors"
      class:bg-accent={item.match(page.url.pathname)}
      class:test={item.match(page.url.pathname)}
      class:text-muted-foreground={!item.match(page.url.pathname)}
    >
      {item.label}
    </a>
  {/each}

  <div class="flex-1"></div>

  <!-- Dev mode toggle (visible si non connecté et non actif) -->
  {#if !serial.connected && !devMode.active}
    <Button
      variant="ghost"
      size="sm"
      onclick={handleDevMode}
      class="text-muted-foreground hover:text-amber-400 gap-1.5"
    >
      <FlaskConical class="size-4" />
      Mode démo
    </Button>
  {/if}

  <!-- Save button -->
  {#if configState.isDirty}
    <Button size="sm" onclick={saveConfig} class="gap-1.5">
      <Save class="size-4" />
      Sauvegarder
    </Button>
  {/if}

  <!-- Docs link -->
  <a
    href="/docs"
    class="px-3 py-1.5 rounded-md text-sm transition-colors"
    class:bg-accent={page.url.pathname.startsWith("/docs")}
    class:test={page.url.pathname.startsWith("/docs")}
    class:text-muted-foreground={!page.url.pathname.startsWith("/docs")}
  >
    Docs
  </a>

  <!-- Status dot -->
  <div class="flex items-center gap-1.5 ml-2 text-xs text-muted-foreground">
    <div
      class="size-2 rounded-full transition-colors"
      class:bg-emerald-500={serial.connected || devMode.active}
      class:bg-muted={!serial.connected && !devMode.active}
    ></div>
    {#if devMode.active}
      <span class="text-amber-400">Démo</span>
    {:else}
      <span>{serial.connected ? "Connecté" : "Non connecté"}</span>
    {/if}
  </div>

  <ThemeToggle />
</header>

<!-- Dev mode banner -->
<DevModeBanner />

<!-- Page content -->
<main class="px-6 py-6 max-w-5xl mx-auto">
  {@render children()}
</main>
