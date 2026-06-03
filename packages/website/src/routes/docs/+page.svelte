<script lang="ts">
  import Search from './Search.svelte';
  import SetHeaderRight from '$lib/SetHeaderRight.svelte';
</script>

{#snippet toolbar()}
  <Search />
{/snippet}

<SetHeaderRight content={toolbar} />

<svelte:head>
    <title>Documentation : SpinPad</title>
</svelte:head>

<div class="max-w-4xl px-4 py-12 mx-auto">
    <h1 class="mb-2 text-3xl font-bold">Documentation</h1>
    <p class="mb-10 text-muted-foreground">Tout ce qu'il faut savoir pour configurer et personnaliser votre SpinPad.</p>

    <div class="grid gap-4 sm:grid-cols-2">
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
                class="flex gap-4 p-4 transition-colors border border-card bg-card rounded-xl hover:border-spinpad/50 group"
            >
                <span class="text-2xl mt-0.5">{doc.icon}</span>
                <div>
                    <p class="font-semibold transition-colors text-foreground group-hover:text-spinpad-light">{doc.title}</p>
                    <p class="text-sm text-muted-foreground mt-0.5">{doc.desc}</p>
                </div>
            </a>
        {/each}
    </div>
</div>
