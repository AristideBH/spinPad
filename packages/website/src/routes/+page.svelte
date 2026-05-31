<script lang="ts">
  import { Button } from '$shared/components/ui/button/index.js';
  import { Keyboard, Bluetooth, Palette, Lightbulb, Layers, Wrench } from '@lucide/svelte';

  const features = [
    {
      icon: Keyboard,
      title: '10 touches + encodeur',
      text: 'Layout 3×4 avec SW1 et SW10 en format 2u. Encodeur rotatif quadrature avec clic.',
      span: 'md:col-span-2',
      img: '/static/img/spinpad.png',
    },
    {
      icon: Bluetooth,
      title: 'USB & Bluetooth',
      text: "HID natif sur USB-C et BLE 5. Passez d'un appareil à l'autre sans rebrancher.",
      span: '',
    },
    {
      icon: Palette,
      title: 'Studio Mode embarqué',
      text: 'Maintenez SW8+SW9 → hotspot WiFi + interface de config servie depuis le macropad lui-même.',
      span: '',
    },
    {
      icon: Lightbulb,
      title: 'LEDs WS2812',
      text: '10 LEDs par touche + chaîne extensible. Effets Solid, Breathe, Reactive, Mirror, Hyperion.',
      span: 'md:col-span-2',
      accent: true,
    },
    {
      icon: Layers,
      title: '4 profils × 4 layers',
      text: "Jusqu'à 16 configurations. Combos, momentary/toggle layers, actions encoder par layer.",
      span: 'md:col-span-2',
    },
    {
      icon: Wrench,
      title: 'Open source',
      text: 'Firmware ESP-IDF + Studio SvelteKit. Modifiez, compilez, flashez. MIT License.',
      span: '',
    },
  ];
</script>

<svelte:head>
  <title>SpinPad : Macropad ESP32-S3</title>
  <meta
    name="description"
    content="SpinPad : macropad 10 touches + encodeur rotatif sur ESP32-S3. Open source, configurable depuis le navigateur."
  />
</svelte:head>

<!-- Hero -->
<section class="grid items-center max-w-5xl gap-10 px-4 pt-16 pb-20 mx-auto lg:grid-cols-2">
  <div>
    <div
      class="inline-block px-3 py-1 mb-4 text-xs font-medium tracking-widest uppercase border rounded-full bg-spinpad/20 border-spinpad/40 text-spinpad"
    >
      Open Source
    </div>
    <h1 class="mb-4 text-4xl font-bold leading-tight text-foreground sm:text-5xl">
      Le macropad qui s'adapte à vous
    </h1>
    <p class="mb-8 text-lg leading-relaxed text-muted-foreground">
      10 touches programmables + encodeur rotatif sur ESP32-S3. USB & Bluetooth. Configurez depuis
      le navigateur, sans pilote.
    </p>
    <div class="flex flex-wrap gap-3">
      <Button href="/studio/">Ouvrir Studio</Button>
      <Button variant="outline" href="/docs/">Lire la doc</Button>
    </div>
  </div>

  <!-- TODO: remplacer par un vrai rendu du SpinPad -->
  <img
    src="/static/img/spinpad.png"
    alt="Le macropad SpinPad"
    class="object-cover w-full border shadow-sm aspect-5/4 rounded-2xl border-border"
  />
</section>

<!-- Features (bento) -->
<section class="grid max-w-5xl grid-cols-1 gap-4 px-4 py-16 mx-auto md:grid-cols-3">
  {#each features as f (f.title)}
    {@const Icon = f.icon}
    <div
      class="flex flex-col overflow-hidden border rounded-xl {f.span} {f.accent
        ? 'border-spinpad/30 bg-spinpad/10'
        : 'border-border bg-card'}"
    >
      {#if f.img}
        <img
          src={f.img}
          alt=""
          loading="lazy"
          class="object-cover w-full h-32 border-b border-border"
        />
      {/if}
      <div class="flex flex-col p-5">
        <Icon class="mb-3 size-6 text-spinpad" />
        <h3 class="mb-1 font-semibold text-foreground">{f.title}</h3>
        <p class="text-sm leading-relaxed text-muted-foreground">{f.text}</p>
      </div>
    </div>
  {/each}
</section>

<!-- Studio Mode callout -->
<section class="px-4 py-16 bg-spinpad/10 border-y border-spinpad/20">
  <div class="max-w-3xl mx-auto text-center">
    <h2 class="mb-3 text-2xl font-bold">Configuration sans fil</h2>
    <p class="mb-6 leading-relaxed text-muted-foreground">
      Maintenez <strong class="text-foreground">SW8 + SW9</strong> pendant 3 secondes. Le SpinPad
      crée un hotspot WiFi
      <code class="px-1 rounded bg-muted">SpinPad-Config</code>. Connectez-vous et ouvrez
      <code class="px-1 rounded bg-muted">192.168.4.1</code>. Studio se charge depuis le macropad,
      sans installation.
    </p>
    <img
      src="/studio-preview.png"
      alt="Aperçu de Studio Mode"
      class="w-full max-w-lg mx-auto border rounded-lg border-border"
    />
  </div>
</section>

<!-- Quick start -->
<section class="max-w-3xl px-4 py-16 mx-auto">
  <h2 class="mb-8 text-2xl font-bold text-center">Démarrage rapide</h2>
  <ol class="space-y-4">
    {#each [{ n: '1', title: 'Flasher le firmware', text: "Utilisez l'outil de flash dans le navigateur (Chrome/Edge + WebSerial) ou esptool.py." }, { n: '2', title: 'Brancher le SpinPad', text: 'Connectez-le en USB-C. Il apparaît immédiatement comme clavier HID, aucun pilote nécessaire.' }, { n: '3', title: 'Configurer avec Studio', text: "Depuis le navigateur via USB (WebSerial), ou en Studio Mode WiFi depuis n'importe quel appareil." }, { n: '4', title: 'Utiliser', text: 'Les configs sont persistées en NVS. Débranchez, rebranchez, tout est là.' }] as step}
      <li class="flex gap-4">
        <span
          class="flex items-center justify-center w-8 h-8 text-sm font-bold border rounded-full shrink-0 bg-spinpad/20 border-spinpad/40 text-spinpad"
          >{step.n}</span
        >
        <div>
          <p class="font-semibold text-foreground">{step.title}</p>
          <p class="text-sm text-muted-foreground mt-0.5">{step.text}</p>
        </div>
      </li>
    {/each}
  </ol>
  <div class="mt-8 text-center">
    <Button href="/flash/">Flasher le firmware</Button>
  </div>
</section>
