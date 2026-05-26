<script lang="ts">
  import { Button } from "$shared/components/ui/button/index.js";
</script>

<svelte:head>
  <title>SpinPad — Macropad ESP32-S3</title>
  <meta
    name="description"
    content="SpinPad : macropad 10 touches + encodeur rotatif sur ESP32-S3. Open source, configurable depuis le navigateur."
  />
</svelte:head>

<!-- Hero -->
<section class="px-4 pt-24 pb-20 text-center">
  <div class="max-w-2xl mx-auto">
    <div
      class="inline-block px-3 py-1 mb-4 text-xs font-medium tracking-widest uppercase border rounded-full bg-spinpad/20 border-spinpad/40 text-spinpad"
    >
      Open Source
    </div>
    <h1 class="mb-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
      Le macropad qui<br />s'adapte à vous
    </h1>
    <p class="mb-8 text-lg leading-relaxed text-gray-400">
      10 touches programmables + encodeur rotatif sur ESP32-S3. USB & Bluetooth.
      Configurez depuis le navigateur, sans pilote.
    </p>
    <div class="flex flex-wrap justify-center gap-3">
    
    <Button href="/studio/">Ouvrir Studio</Button>
      <Button variant="outline" href="/docs/">Lire la doc</Button>
      <Button variant="outline" href="/flash/">Flasher le firmware</Button>

    </div>
  </div>
</section>

<!-- Features -->
<section
  class="grid max-w-5xl gap-6 px-4 py-16 mx-auto sm:grid-cols-2 lg:grid-cols-3"
>
  {#each [{ icon: "⌨️", title: "10 touches + encodeur", text: "Layout 3×4 avec SW1 et SW10 en format 2u. Encodeur rotatif quadrature avec clic." }, { icon: "📶", title: "USB & Bluetooth", text: "HID natif sur USB-C et BLE 5. Passez d'un appareil à l'autre sans rebrancher." }, { icon: "🎨", title: "Studio Mode embarqué", text: "Maintenez SW8+SW9 → hotspot WiFi + interface de config servie depuis le macropad lui-même." }, { icon: "💡", title: "LEDs WS2812", text: "10 LEDs par touche + chaîne extensible. Effets Solid, Breathe, Reactive, Mirror, Hyperion." }, { icon: "🔄", title: "4 profils × 4 layers", text: "Jusqu'à 16 configurations. Combos, momentary/toggle layers, actions encoder par layer." }, { icon: "🛠️", title: "Open source", text: "Firmware ESP-IDF + Studio SvelteKit. Modifiez, compilez, flashez. MIT License." }] as f}
    <div class="p-5 border border-muted bg-muted rounded-xl">
      <div class="mb-3 text-2xl">{f.icon}</div>
      <h3 class="mb-1 font-semibold text-white">{f.title}</h3>
      <p class="text-sm leading-relaxed text-gray-400">{f.text}</p>
    </div>
  {/each}
</section>

<!-- Studio Mode callout -->
<section class="px-4 py-16 bg-spinpad/10 border-y border-spinpad/20">
  <div class="max-w-3xl mx-auto text-center">
    <h2 class="mb-3 text-2xl font-bold">Configuration sans fil</h2>
    <p class="mb-6 leading-relaxed text-gray-400">
      Maintenez <strong class="text-white">SW8 + SW9</strong> pendant 3
      secondes. Le SpinPad crée un hotspot WiFi
      <code class="px-1 bg-gray-800 rounded">SpinPad-Config</code>.
      Connectez-vous et ouvrez
      <code class="px-1 bg-gray-800 rounded">192.168.4.1</code> — Studio se charge
      depuis le macropad, sans installation.
    </p>
    <img
      src="/studio-preview.png"
      alt="Aperçu de Studio Mode"
      class="w-full max-w-lg mx-auto border border-gray-700 rounded-lg opacity-80"
    />
  </div>
</section>

<!-- Quick start -->
<section class="max-w-3xl px-4 py-16 mx-auto">
  <h2 class="mb-8 text-2xl font-bold text-center">Démarrage rapide</h2>
  <ol class="space-y-4">
    {#each [{ n: "1", title: "Flasher le firmware", text: "Utilisez l'outil de flash dans le navigateur (Chrome/Edge + WebSerial) ou esptool.py." }, { n: "2", title: "Brancher le SpinPad", text: "Connectez-le en USB-C. Il apparaît immédiatement comme clavier HID, aucun pilote nécessaire." }, { n: "3", title: "Configurer avec Studio", text: "Depuis le navigateur via USB (WebSerial), ou en Studio Mode WiFi depuis n'importe quel appareil." }, { n: "4", title: "Utiliser", text: "Les configs sont persistées en NVS. Débranchez, rebranchez — tout est là." }] as step}
      <li class="flex gap-4">
        <span
          class="flex items-center justify-center w-8 h-8 text-sm font-bold border rounded-full shrink-0 bg-spinpad/20 border-spinpad/40 text-spinpad"
          >{step.n}</span
        >
        <div>
          <p class="font-semibold text-white">{step.title}</p>
          <p class="text-sm text-gray-400 mt-0.5">{step.text}</p>
        </div>
      </li>
    {/each}
  </ol>
</section>
