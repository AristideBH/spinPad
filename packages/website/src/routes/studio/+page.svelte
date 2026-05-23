<svelte:head>
    <title>Studio — SpinPad</title>
</svelte:head>

<div class="max-w-2xl mx-auto px-4 py-16 text-center">
    <div class="text-5xl mb-6">🎨</div>
    <h1 class="text-3xl font-bold mb-3">SpinPad Studio</h1>
    <p class="text-gray-400 mb-8 leading-relaxed">
        Application de configuration du SpinPad. Fonctionne via USB (WebSerial) depuis Chrome/Edge,
        ou directement depuis votre macropad en Studio Mode (WiFi).
    </p>

    <div class="flex flex-wrap justify-center gap-3 mb-10">
        <a
            href="https://studio.spinpad.dev"
            target="_blank"
            rel="noopener"
            class="px-5 py-2.5 rounded-lg bg-spinpad hover:bg-spinpad/90 text-white font-semibold text-sm transition-colors"
        >
            Ouvrir Studio en ligne
        </a>
        <a
            href="/docs/studio-mode/"
            class="px-5 py-2.5 rounded-lg border border-gray-600 hover:border-gray-400 text-gray-300 font-semibold text-sm transition-colors"
        >
            Studio Mode WiFi
        </a>
    </div>

    <div class="rounded-xl border border-gray-800 bg-gray-900 p-5 text-left">
        <h2 class="font-semibold mb-3 text-sm uppercase tracking-widest text-gray-500">Compatibilité navigateur</h2>
        <table class="w-full text-sm">
            <tbody>
                {#each [
                    { browser: 'Chrome / Chromium',  serial: '✅', ble: '✅' },
                    { browser: 'Edge',               serial: '✅', ble: '✅' },
                    { browser: 'Firefox',            serial: '❌', ble: '❌' },
                    { browser: 'Safari',             serial: '❌', ble: '⚠️ partiel' },
                    { browser: 'Studio Mode WiFi',   serial: '✅', ble: '✅' },
                ] as row}
                    <tr class="border-t border-gray-800">
                        <td class="py-2 text-gray-300">{row.browser}</td>
                        <td class="py-2 text-center">{row.serial}</td>
                        <td class="py-2 text-center">{row.ble}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>
