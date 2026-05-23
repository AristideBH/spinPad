<svelte:head>
    <title>Flash — SpinPad</title>
</svelte:head>

<div class="max-w-2xl mx-auto px-4 py-16 text-center">
    <div class="text-5xl mb-6">⚡</div>
    <h1 class="text-3xl font-bold mb-3">Flasher le firmware</h1>
    <p class="text-gray-400 mb-8 leading-relaxed">
        Mettez à jour le firmware de votre SpinPad directement depuis le navigateur,
        sans installer d'outil.
    </p>

    <div class="flex flex-wrap justify-center gap-3 mb-10">
        <a
            href="https://flash.spinpad.dev"
            target="_blank"
            rel="noopener"
            class="px-5 py-2.5 rounded-lg bg-spinpad hover:bg-spinpad/90 text-white font-semibold text-sm transition-colors"
        >
            Ouvrir l'outil de flash
        </a>
        <a
            href="https://github.com/YOUR_ORG/spinpad/releases"
            target="_blank"
            rel="noopener"
            class="px-5 py-2.5 rounded-lg border border-gray-600 hover:border-gray-400 text-gray-300 font-semibold text-sm transition-colors"
        >
            Releases GitHub
        </a>
    </div>

    <div class="rounded-xl border border-gray-800 bg-gray-900 p-5 text-left space-y-4">
        <h2 class="font-semibold text-sm uppercase tracking-widest text-gray-500">Prérequis</h2>
        <ul class="text-sm text-gray-400 space-y-2">
            <li>• Chrome ou Edge (WebSerial requis)</li>
            <li>• Câble USB-C data (pas uniquement charge)</li>
            <li>• Firmware <code class="bg-gray-800 px-1 rounded">factory.bin</code> depuis les releases</li>
        </ul>

        <h2 class="font-semibold text-sm uppercase tracking-widest text-gray-500 mt-4">En ligne de commande</h2>
        <pre class="text-xs bg-gray-950 rounded-lg p-3 overflow-x-auto text-gray-300"><code>esptool.py -p /dev/ttyACM0 write_flash \
  0x10000  factory.bin \
  0x310000 spiffs.bin</code></pre>
    </div>
</div>
