<svelte:head>
    <title>SpinPad — Macropad ESP32-S3</title>
    <meta name="description" content="SpinPad : macropad 10 touches + encodeur rotatif sur ESP32-S3. Open source, configurable depuis le navigateur." />
</svelte:head>

<!-- Hero -->
<section class="bg-gray-950 pt-24 pb-20 px-4 text-center">
    <div class="max-w-2xl mx-auto">
        <div class="inline-block mb-4 rounded-full bg-spinpad/20 border border-spinpad/40 px-3 py-1 text-xs text-spinpad font-medium uppercase tracking-widest">
            Open Source
        </div>
        <h1 class="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            Le macropad qui<br/>s'adapte à vous
        </h1>
        <p class="text-lg text-gray-400 mb-8 leading-relaxed">
            10 touches programmables + encodeur rotatif sur ESP32-S3.
            USB & Bluetooth. Configurez depuis le navigateur, sans pilote.
        </p>
        <div class="flex flex-wrap justify-center gap-3">
            <a
                href="/studio/"
                class="px-5 py-2.5 rounded-lg bg-spinpad hover:bg-spinpad/90 text-white font-semibold text-sm transition-colors"
            >Ouvrir Studio</a>
            <a
                href="/docs/"
                class="px-5 py-2.5 rounded-lg border border-gray-600 hover:border-gray-400 text-gray-300 font-semibold text-sm transition-colors"
            >Lire la doc</a>
            <a
                href="/flash/"
                class="px-5 py-2.5 rounded-lg border border-gray-600 hover:border-gray-400 text-gray-300 font-semibold text-sm transition-colors"
            >Flasher le firmware</a>
        </div>
    </div>
</section>

<!-- Features -->
<section class="max-w-5xl mx-auto px-4 py-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

    {#each [
        { icon: '⌨️', title: '10 touches + encodeur',  text: 'Layout 3×4 avec SW1 et SW10 en format 2u. Encodeur rotatif quadrature avec clic.' },
        { icon: '📶', title: 'USB & Bluetooth',        text: 'HID natif sur USB-C et BLE 5. Passez d\'un appareil à l\'autre sans rebrancher.' },
        { icon: '🎨', title: 'Studio Mode embarqué',   text: 'Maintenez SW8+SW9 → hotspot WiFi + interface de config servie depuis le macropad lui-même.' },
        { icon: '💡', title: 'LEDs WS2812',             text: '10 LEDs par touche + chaîne extensible. Effets Solid, Breathe, Reactive, Mirror, Hyperion.' },
        { icon: '🔄', title: '4 profils × 4 layers',   text: 'Jusqu\'à 16 configurations. Combos, momentary/toggle layers, actions encoder par layer.' },
        { icon: '🛠️', title: 'Open source',             text: 'Firmware ESP-IDF + Studio SvelteKit. Modifiez, compilez, flashez. MIT License.' },
    ] as f}
        <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <div class="text-2xl mb-3">{f.icon}</div>
            <h3 class="font-semibold text-white mb-1">{f.title}</h3>
            <p class="text-sm text-gray-400 leading-relaxed">{f.text}</p>
        </div>
    {/each}

</section>

<!-- Studio Mode callout -->
<section class="bg-spinpad/10 border-y border-spinpad/20 py-16 px-4">
    <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-2xl font-bold mb-3">Configuration sans fil</h2>
        <p class="text-gray-400 mb-6 leading-relaxed">
            Maintenez <strong class="text-white">SW8 + SW9</strong> pendant 3 secondes.
            Le SpinPad crée un hotspot WiFi <code class="bg-gray-800 px-1 rounded">SpinPad-Config</code>.
            Connectez-vous et ouvrez <code class="bg-gray-800 px-1 rounded">192.168.4.1</code> —
            Studio se charge depuis le macropad, sans installation.
        </p>
        <img
            src="/studio-preview.png"
            alt="Aperçu de Studio Mode"
            class="rounded-lg border border-gray-700 mx-auto max-w-lg w-full opacity-80"
            onerror="this.style.display='none'"
        />
    </div>
</section>

<!-- Quick start -->
<section class="max-w-3xl mx-auto px-4 py-16">
    <h2 class="text-2xl font-bold mb-8 text-center">Démarrage rapide</h2>
    <ol class="space-y-4">
        {#each [
            { n: '1', title: 'Flasher le firmware', text: 'Utilisez l\'outil de flash dans le navigateur (Chrome/Edge + WebSerial) ou esptool.py.' },
            { n: '2', title: 'Brancher le SpinPad', text: 'Connectez-le en USB-C. Il apparaît immédiatement comme clavier HID, aucun pilote nécessaire.' },
            { n: '3', title: 'Configurer avec Studio', text: 'Depuis le navigateur via USB (WebSerial), ou en Studio Mode WiFi depuis n\'importe quel appareil.' },
            { n: '4', title: 'Utiliser', text: 'Les configs sont persistées en NVS. Débranchez, rebranchez — tout est là.' },
        ] as step}
            <li class="flex gap-4">
                <span class="flex-shrink-0 w-8 h-8 rounded-full bg-spinpad/20 border border-spinpad/40 flex items-center justify-center text-sm font-bold text-spinpad">{step.n}</span>
                <div>
                    <p class="font-semibold text-white">{step.title}</p>
                    <p class="text-sm text-gray-400 mt-0.5">{step.text}</p>
                </div>
            </li>
        {/each}
    </ol>
</section>
