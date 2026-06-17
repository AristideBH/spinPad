<script lang="ts">
  import { Button } from '$shared/components/ui/button/index.js';
  import * as Kbd from '$shared/components/ui/kbd/index.js';
  import Keypad from '$lib/components/Keypad.svelte';
  import {
    Keyboard,
    Bluetooth,
    Palette,
    Lightbulb,
    Layers,
    Wrench,
    ArrowRight,
  } from '@lucide/svelte';

  // Hardware facts shown in the banner — all taken from the real specs below,
  // no made-up numbers.
  const stats = [
    { value: '10', label: 'keys + encoder' },
    { value: '4×4', label: 'profiles × layers' },
    { value: 'BLE 5', label: '+ native USB-C' },
    { value: 'WS2812', label: '10 LEDs / key' },
  ];

  // 2-column bento: full row (image) / split / full row (accent) / split.
  // 6 features → 6 cells, exact fill, no empty cell.
  const features = [
    {
      icon: Keyboard,
      title: '10 keys + encoder',
      text: '3×4 layout with SW1 and SW10 in 2u format. Quadrature rotary encoder with click.',
      img: '/img/spinpad.png',
    },
    {
      icon: Bluetooth,
      title: 'USB & Bluetooth',
      text: 'Native HID over USB-C and BLE 5. Switch from one device to another without replugging.',
    },
    {
      icon: Palette,
      title: 'Embedded Studio Mode',
      text: 'Hold SW8+SW9 → WiFi hotspot + config interface served from the macropad.',
    },
    {
      icon: Lightbulb,
      title: 'WS2812 LEDs',
      text: 'Solid, Breathe, Reactive, Mirror, Hyperion effects. Extensible chain.',
      accent: true,
    },
    {
      icon: Layers,
      title: '4 profiles × 4 layers',
      text: 'Up to 16 configurations. Combos, momentary/toggle layers, per-layer encoder.',
    },
    {
      icon: Wrench,
      title: 'Open source',
      text: 'ESP-IDF firmware + SvelteKit Studio. Modify, compile, flash. MIT License.',
    },
  ];

  const steps = [
    {
      title: 'Flash the firmware',
      text: 'In the browser (Chrome/Edge + WebSerial) or via esptool.py.',
    },
    {
      title: 'Plug in the SpinPad',
      text: 'Over USB-C: instantly recognized as an HID keyboard, driver-free.',
    },
    {
      title: 'Configure with Studio',
      text: 'Over USB (WebSerial) or in WiFi Studio Mode, from any device.',
    },
    {
      title: 'Use it',
      text: 'Configs persisted in NVS. Unplug, replug, everything is there.',
    },
  ];
</script>

<svelte:head>
  <title>SpinPad: ESP32-S3 Macropad</title>
  <meta
    name="description"
    content="SpinPad: 10-key macropad + rotary encoder on ESP32-S3. Open source, configurable from the browser."
  />
</svelte:head>

<!-- ░░ Hero: asymmetric split ░░ -->
<section class="relative w-full px-4 pt-12 pb-16 overflow-hidden md:pt-20 md:pb-24">
  <div aria-hidden="true" class="absolute inset-0 -z-10 tech-grid"></div>
  <div class="reveal-hero grid items-center max-w-6xl gap-12 mx-auto lg:grid-cols-[1.05fr_1fr]">
    <div>
      <span
        class="inline-flex items-center px-3 py-1 mb-6 text-xs font-medium tracking-widest uppercase rounded-full bg-spinpad/15 text-spinpad ring-1 ring-spinpad/30"
      >
        Open Source
      </span>
      <h1
        class="font-display text-5xl font-semibold leading-[1.02] tracking-tight text-foreground md:text-6xl lg:text-7xl"
      >
        The macropad that adapts to you
      </h1>
      <p class="mt-6 text-lg leading-relaxed text-muted-foreground max-w-[48ch]">
        10 programmable keys + rotary encoder on ESP32-S3. USB & Bluetooth. Configure
        from the browser, driver-free.
      </p>
      <div class="flex flex-wrap gap-3 mt-9">
        <Button
          href="/studio/"
          class="transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          Open Studio
          <ArrowRight class="size-4" />
        </Button>
        <Button
          variant="outline"
          href="/docs/"
          class="transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          Read the docs
        </Button>
      </div>
    </div>

    <div class="relative flex justify-center lg:justify-end">
      <!-- Brand cyan glow (no generic AI gradient) -->
      <div
        aria-hidden="true"
        class="absolute -inset-10 -z-10 blur-3xl bg-[radial-gradient(circle_at_55%_45%,color-mix(in_oklch,var(--color-spinpad)_32%,transparent),transparent_68%)]"
      ></div>
      <!-- The real SpinPad keypad, rendered in CSS (consistent with Studio) -->
      <Keypad />
    </div>
  </div>
</section>

<!-- ░░ Specs banner ░░ -->
<section class="w-full px-4">
  <div
    class="reveal grid max-w-6xl grid-cols-2 mx-auto overflow-hidden border divide-x divide-y rounded-2xl border-border/60 divide-border/60 md:grid-cols-4 md:divide-y-0 bg-card/40"
  >
    {#each stats as s (s.label)}
      <div class="flex flex-col gap-1 p-6">
        <span class="font-display text-3xl font-semibold tracking-tight text-spinpad md:text-4xl"
          >{s.value}</span
        >
        <span class="text-sm leading-snug text-muted-foreground">{s.label}</span>
      </div>
    {/each}
  </div>
</section>

<!-- ░░ Features (rhythmic bento) ░░ -->
<section class="w-full px-4 py-20 md:py-28">
  <div class="max-w-6xl mx-auto">
    <h2 class="font-display mb-10 text-3xl font-semibold tracking-tight md:text-4xl">
      Built to be tinkered with
    </h2>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      {#each features as f (f.title)}
        {@const Icon = f.icon}
        {#if f.img}
          <!-- Full row: real product visual + text (horizontal composition) -->
          <div
            class="reveal group relative grid overflow-hidden border md:col-span-2 sm:grid-cols-2 rounded-2xl border-border/60 bg-card"
          >
            <div class="relative overflow-hidden min-h-52">
              <div
                aria-hidden="true"
                class="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,color-mix(in_oklch,var(--color-spinpad)_30%,transparent),transparent_62%)]"
              ></div>
              <img
                src={f.img}
                alt=""
                loading="lazy"
                class="relative object-contain w-full h-full p-8 transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div class="flex flex-col justify-center p-8">
              <Icon class="mb-3 size-6 text-spinpad" />
              <h3 class="font-display mb-2 text-xl font-medium tracking-tight text-foreground">
                {f.title}
              </h3>
              <p class="leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          </div>
        {:else}
          <div
            class="reveal relative flex flex-col p-6 overflow-hidden border rounded-2xl {f.accent
              ? 'md:col-span-2 border-spinpad/30 bg-[linear-gradient(120deg,color-mix(in_oklch,var(--color-spinpad)_18%,var(--color-card)),var(--color-card))]'
              : 'border-border/60 bg-card'}"
          >
            <Icon class="mb-3 size-5 text-spinpad" />
            <h3 class="font-display mb-1 text-lg font-medium tracking-tight text-foreground">
              {f.title}
            </h3>
            <p class="text-sm leading-relaxed text-muted-foreground">{f.text}</p>
          </div>
        {/if}
      {/each}
    </div>
  </div>
</section>

<!-- ░░ Studio Mode (centered moment, real keys) ░░ -->
<section class="w-full px-4 py-20 md:py-28">
  <div
    class="reveal relative max-w-4xl px-6 py-16 mx-auto overflow-hidden text-center border md:px-12 rounded-3xl border-spinpad/25 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--color-spinpad)_12%,var(--color-card)),var(--color-card))]"
  >
    <h2 class="font-display text-3xl font-semibold tracking-tight md:text-4xl">
      Wireless configuration
    </h2>
    <p class="mx-auto mt-4 leading-relaxed text-muted-foreground max-w-[52ch]">
      Hold the combination below for 3 seconds. The SpinPad creates a WiFi hotspot and
      serves Studio from the macropad itself, no installation required.
    </p>

    <div class="flex flex-wrap items-center justify-center gap-3 mt-8 text-base">
      <Kbd.Root class="px-3 py-1.5 text-sm">SW8</Kbd.Root>
      <span class="text-muted-foreground">+</span>
      <Kbd.Root class="px-3 py-1.5 text-sm">SW9</Kbd.Root>
      <ArrowRight class="size-4 text-muted-foreground" />
      <code class="px-2 py-1 text-sm rounded-md bg-background/70 text-spinpad">SpinPad-Config</code>
      <ArrowRight class="size-4 text-muted-foreground" />
      <code class="px-2 py-1 text-sm rounded-md bg-background/70 text-foreground">192.168.4.1</code>
    </div>
  </div>
</section>

<!-- ░░ Quick start (sequential flow) ░░ -->
<section class="w-full px-4 py-20 md:py-28">
  <div class="max-w-6xl mx-auto">
    <h2 class="font-display mb-12 text-3xl font-semibold tracking-tight md:text-4xl">
      Quick start
    </h2>
    <ol class="grid gap-8 md:grid-cols-4 md:gap-6">
      {#each steps as step, i (step.title)}
        <li class="reveal relative flex flex-col">
          <div class="flex items-center gap-3 mb-4">
            <span
              class="font-display flex items-center justify-center text-sm font-semibold rounded-full size-9 shrink-0 bg-spinpad/15 text-spinpad ring-1 ring-spinpad/30"
            >
              {i + 1}
            </span>
            {#if i < steps.length - 1}
              <span class="flex-1 hidden h-px md:block bg-border/70"></span>
            {/if}
          </div>
          <p class="font-display text-lg font-medium tracking-tight text-foreground">{step.title}</p>
          <p class="mt-1 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
        </li>
      {/each}
    </ol>

    <div class="mt-14">
      <Button
        href="/flash/"
        size="lg"
        class="transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
      >
        Flash the firmware
        <ArrowRight class="size-4" />
      </Button>
    </div>
  </div>
</section>
