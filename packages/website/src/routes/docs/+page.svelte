<svelte:head>
    <title>Documentation — SpinPad</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-12">
    <h1 class="text-3xl font-bold mb-2">Documentation</h1>
    <p class="text-gray-400 mb-10">Tout ce qu'il faut savoir pour configurer et personnaliser votre SpinPad.</p>

    <div class="grid sm:grid-cols-2 gap-4">
        {#each [
            { href: '/docs/getting-started/', title: 'Démarrage',          icon: '🚀', desc: 'Premier flash, connexion USB, premier keymap.' },
            { href: '/docs/keymap/',          title: 'Keymap',             icon: '⌨️', desc: 'Profils, layers, actions, combos.' },
            { href: '/docs/encoder/',         title: 'Encodeur',           icon: '🎛️', desc: 'Sensibilité, presets, actions par layer.' },
            { href: '/docs/leds/',            title: 'LEDs',               icon: '💡', desc: 'Effets, extension de chaîne, Hyperion.' },
            { href: '/docs/studio-mode/',     title: 'Studio Mode',        icon: '📡', desc: 'Config WiFi embarquée, hotspot, auto-save.' },
            { href: '/docs/orientation/',     title: 'Orientation',        icon: '↕️', desc: 'Rotation du macropad, touches Rotate CW/CCW.' },
            { href: '/docs/ble/',             title: 'Bluetooth',          icon: '📶', desc: 'Jumelage, multi-appareils, profils BLE.' },
            { href: '/docs/firmware-build/',  title: 'Compiler le firmware', icon: '🔧', desc: 'ESP-IDF, ESP32-S3, partition table, SPIFFS.' },
        ] as doc}
            <a
                href={doc.href}
                class="flex gap-4 rounded-xl border border-gray-800 bg-gray-900 p-4 hover:border-spinpad/50 transition-colors group"
            >
                <span class="text-2xl mt-0.5">{doc.icon}</span>
                <div>
                    <p class="font-semibold text-white group-hover:text-spinpad-light transition-colors">{doc.title}</p>
                    <p class="text-sm text-gray-400 mt-0.5">{doc.desc}</p>
                </div>
            </a>
        {/each}
    </div>
</div>
