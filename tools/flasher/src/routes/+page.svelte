<script>
    // ── State ─────────────────────────────────────────────────────
    /** @type {'idle'|'connecting'|'erasing'|'flashing'|'done'|'error'} */
    let phase        = $state('idle');
    let log          = $state(/** @type {string[]} */([]));
    let progress     = $state(0);          // 0–100
    let errorMsg     = $state('');

    // Fichiers sélectionnés
    let firmwareFile  = $state(null);   // .bin firmware (factory)
    let spiffsFile    = $state(null);   // .bin spiffs (optionnel)
    let flashSpiffs   = $state(false);

    // Releases GitHub
    let releases      = $state([]);
    let selectedRelease = $state(null);
    let loadingReleases = $state(false);

    // ── Compatibilité WebSerial ───────────────────────────────────
    const hasWebSerial = typeof navigator !== 'undefined' && 'serial' in navigator;

    // ── Helpers ───────────────────────────────────────────────────
    function addLog(msg) {
        log = [...log, `[${new Date().toLocaleTimeString()}] ${msg}`];
    }

    function reset() {
        phase    = 'idle';
        progress = 0;
        errorMsg = '';
        log      = [];
    }

    // ── Charger les releases GitHub ──────────────────────────────
    async function loadReleases() {
        loadingReleases = true;
        try {
            const r = await fetch(
                'https://api.github.com/repos/YOUR_ORG/spinpad/releases?per_page=10'
            );
            if (!r.ok) throw new Error(`GitHub API: ${r.status}`);
            const data = await r.json();
            releases = data.map(rel => ({
                tag:    rel.tag_name,
                name:   rel.name,
                date:   rel.published_at?.slice(0, 10),
                assets: rel.assets.filter(a => a.name.endsWith('.bin')).map(a => ({
                    name:        a.name,
                    download_url: a.browser_download_url,
                    size:        a.size,
                })),
            })).filter(r => r.assets.length > 0);
        } catch (e) {
            addLog(`Impossible de charger les releases : ${e.message}`);
        } finally {
            loadingReleases = false;
        }
    }

    // ── Flash via WebSerial (esptool.js) ──────────────────────────
    async function startFlash() {
        if (!firmwareFile) return;
        phase = 'connecting';
        log   = [];
        progress = 0;
        errorMsg = '';

        try {
            addLog('Demande d'accès au port série…');

            // Ouvrir le port
            const port = await navigator.serial.requestPort({
                filters: [{ usbVendorId: 0x303A }]  // Espressif USB-JTAG
            });

            addLog('Connexion au port…');
            await port.open({ baudRate: 115200 });

            // Lire les binaires
            addLog('Lecture des fichiers…');
            const firmwareBuf = await firmwareFile.arrayBuffer();
            const images = [
                { offset: 0x10000, data: new Uint8Array(firmwareBuf) },
            ];

            if (flashSpiffs && spiffsFile) {
                const spiffsBuf = await spiffsFile.arrayBuffer();
                images.push({ offset: 0x310000, data: new Uint8Array(spiffsBuf) });
            }

            // Charger esptool.js dynamiquement (évite les soucis de COOP/COEP au build)
            const { ESPLoader, Transport } = await import('@esptool.js/esptool');

            const transport = new Transport(port);
            const loader = new ESPLoader({
                transport,
                baudrate: 921600,
                romBaudrate: 115200,
                terminal: {
                    clean() {},
                    writeLine: msg => addLog(msg),
                    write: msg => addLog(msg),
                },
            });

            addLog('Connexion au bootloader ROM…');
            phase = 'connecting';
            const chip = await loader.main();
            addLog(`Chip détecté : ${chip}`);

            addLog('Effacement…');
            phase = 'erasing';
            await loader.eraseFlash();

            addLog('Flash en cours…');
            phase = 'flashing';

            let written = 0;
            const total = images.reduce((s, img) => s + img.data.byteLength, 0);

            for (const img of images) {
                addLog(`→ 0x${img.offset.toString(16).toUpperCase()} (${(img.data.byteLength / 1024).toFixed(0)} KB)`);
                await loader.flashData(img.data, img.offset, (pct) => {
                    progress = Math.round(((written + pct / 100 * img.data.byteLength) / total) * 100);
                });
                written += img.data.byteLength;
            }

            addLog('Redémarrage…');
            await loader.hardReset();
            await port.close();

            phase    = 'done';
            progress = 100;
            addLog('✅ Flash terminé avec succès !');

        } catch (e) {
            phase    = 'error';
            errorMsg = e.message;
            addLog(`❌ Erreur : ${e.message}`);
        }
    }

    // ── Télécharger un asset depuis GitHub ──────────────────────
    async function downloadAsset(url, filename) {
        try {
            const r = await fetch(url);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const blob = await r.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
        } catch (e) {
            addLog(`Téléchargement échoué : ${e.message}`);
        }
    }
</script>

<div class="max-w-2xl mx-auto px-4 py-8">

    <!-- Header -->
    <div class="mb-8">
        <h1 class="text-2xl font-bold mb-1">SpinPad Flasher</h1>
        <p class="text-gray-400 text-sm">Flash le firmware de votre SpinPad via WebSerial (Chrome / Edge requis).</p>
    </div>

    <!-- WebSerial warning -->
    {#if !hasWebSerial}
        <div class="rounded-lg border border-yellow-600 bg-yellow-950/40 px-4 py-3 mb-6 text-yellow-300 text-sm">
            ⚠️ <strong>WebSerial non disponible.</strong>
            Utilisez Chrome ou Edge (≥89) pour flasher directement depuis le navigateur.
        </div>
    {/if}

    <!-- Releases GitHub -->
    <section class="mb-6">
        <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold">Releases GitHub</h2>
            <button
                class="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
                onclick={loadReleases}
                disabled={loadingReleases}
            >
                {loadingReleases ? 'Chargement…' : 'Charger les releases'}
            </button>
        </div>

        {#if releases.length > 0}
            <div class="space-y-2">
                {#each releases as rel}
                    <div class="rounded-lg border border-gray-700 bg-gray-900 p-3">
                        <div class="flex items-center justify-between mb-2">
                            <div>
                                <span class="font-mono text-sm text-blue-300">{rel.tag}</span>
                                {#if rel.name !== rel.tag}
                                    <span class="text-gray-400 text-sm ml-2">{rel.name}</span>
                                {/if}
                            </div>
                            <span class="text-xs text-gray-500">{rel.date}</span>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            {#each rel.assets as asset}
                                <button
                                    class="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded border border-gray-600 transition-colors"
                                    onclick={() => downloadAsset(asset.download_url, asset.name)}
                                >
                                    ⬇ {asset.name}
                                    <span class="text-gray-500 ml-1">{(asset.size / 1024).toFixed(0)} KB</span>
                                </button>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        {:else if !loadingReleases}
            <p class="text-sm text-gray-500">Cliquez sur "Charger les releases" pour voir les versions disponibles.</p>
        {/if}
    </section>

    <hr class="border-gray-800 mb-6" />

    <!-- Sélection des fichiers -->
    <section class="mb-6 space-y-4">
        <h2 class="font-semibold">Fichiers à flasher</h2>

        <!-- Firmware -->
        <div>
            <label class="block text-sm mb-1 text-gray-300" for="firmware-input">
                Firmware <span class="text-gray-500">(factory.bin — offset 0x10000)</span>
                <span class="text-red-400 ml-1">*</span>
            </label>
            <input
                id="firmware-input"
                type="file"
                accept=".bin"
                class="block w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0
                       file:bg-gray-700 file:text-gray-100 file:cursor-pointer file:hover:bg-gray-600
                       text-gray-400 cursor-pointer"
                onchange={e => firmwareFile = e.target.files?.[0] ?? null}
            />
            {#if firmwareFile}
                <p class="text-xs text-green-400 mt-1">✓ {firmwareFile.name} ({(firmwareFile.size / 1024).toFixed(0)} KB)</p>
            {/if}
        </div>

        <!-- SPIFFS (optionnel) -->
        <div>
            <label class="flex items-center gap-2 text-sm text-gray-300 mb-2 cursor-pointer">
                <input type="checkbox" bind:checked={flashSpiffs} class="accent-blue-500" />
                Flasher le Studio (SPIFFS — offset 0x310000)
            </label>
            {#if flashSpiffs}
                <input
                    type="file"
                    accept=".bin"
                    class="block w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0
                           file:bg-gray-700 file:text-gray-100 file:cursor-pointer file:hover:bg-gray-600
                           text-gray-400 cursor-pointer"
                    onchange={e => spiffsFile = e.target.files?.[0] ?? null}
                />
                {#if spiffsFile}
                    <p class="text-xs text-green-400 mt-1">✓ {spiffsFile.name} ({(spiffsFile.size / 1024).toFixed(0)} KB)</p>
                {/if}
            {/if}
        </div>
    </section>

    <!-- Bouton flash -->
    <div class="flex gap-3 mb-6">
        <button
            class="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed
                   font-semibold text-sm transition-colors"
            disabled={!hasWebSerial || !firmwareFile || (phase !== 'idle' && phase !== 'done' && phase !== 'error')}
            onclick={startFlash}
        >
            {#if phase === 'connecting'}  Connexion…
            {:else if phase === 'erasing'} Effacement…
            {:else if phase === 'flashing'} Flash en cours…
            {:else}                        ⚡ Flasher
            {/if}
        </button>

        {#if phase !== 'idle'}
            <button
                class="px-4 py-2.5 rounded-lg border border-gray-600 hover:bg-gray-800 text-sm transition-colors"
                onclick={reset}
            >
                Réinitialiser
            </button>
        {/if}
    </div>

    <!-- Barre de progression -->
    {#if phase !== 'idle'}
        <div class="mb-4">
            <div class="flex justify-between text-xs text-gray-400 mb-1">
                <span>
                    {#if phase === 'connecting'}  Connexion au bootloader…
                    {:else if phase === 'erasing'} Effacement de la flash…
                    {:else if phase === 'flashing'} Écriture…  {progress}%
                    {:else if phase === 'done'}    Terminé
                    {:else if phase === 'error'}   Erreur
                    {/if}
                </span>
                <span>{progress}%</span>
            </div>
            <div class="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                    class="h-2 rounded-full transition-all duration-200 {phase === 'done' ? 'bg-green-500' : phase === 'error' ? 'bg-red-500' : 'bg-blue-500'}"
                    style="width: {progress}%"
                ></div>
            </div>
        </div>
    {/if}

    <!-- Erreur -->
    {#if phase === 'error'}
        <div class="rounded-lg border border-red-700 bg-red-950/40 px-4 py-3 mb-4 text-red-300 text-sm">
            ❌ {errorMsg}
        </div>
    {/if}

    <!-- Log -->
    {#if log.length > 0}
        <div class="rounded-lg bg-gray-900 border border-gray-800 p-3 font-mono text-xs text-gray-300 max-h-48 overflow-y-auto">
            {#each log as line}
                <div class="leading-relaxed">{line}</div>
            {/each}
        </div>
    {/if}

    <!-- Footer note -->
    <p class="text-xs text-gray-600 mt-6">
        Maintenez <kbd class="bg-gray-800 px-1 rounded">BOOT</kbd> appuyé pendant la connexion
        si le SpinPad ne passe pas automatiquement en mode flash.
    </p>

</div>
