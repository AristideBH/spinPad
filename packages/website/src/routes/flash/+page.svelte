<script lang="ts">
  import { Skeleton } from '$shared/components/ui/skeleton/index.js';
  import { Input } from '$shared/components/ui/input/index.js';
  import { Switch } from '$shared/components/ui/switch/index.js';
  import { Kbd } from '$shared/components/ui/kbd/index.js';
  import { Field, FieldLabel } from '$shared/components/ui/field/index.js';

  // ── State ─────────────────────────────────────────────────────────────
  type Phase = 'idle' | 'connecting' | 'erasing' | 'flashing' | 'done' | 'error';
  let phase = $state<Phase>('idle');
  let log = $state<string[]>([]);
  let progress = $state(0);
  let errorMsg = $state('');

  let firmwareFile = $state<File | null>(null);
  let spiffsFile = $state<File | null>(null);
  let flashSpiffs = $state(false);

  interface ReleaseAsset {
    name: string;
    download_url: string;
    size: number;
  }
  interface Release {
    tag: string;
    name: string;
    date: string;
    assets: ReleaseAsset[];
  }
  // Promesse awaited dans le markup via <svelte:boundary> (pending/failed).
  let releasesPromise = $state<Promise<Release[]> | null>(null);

  // ── WebSerial detection ───────────────────────────────────────────────
  const hasWebSerial = typeof navigator !== 'undefined' && 'serial' in navigator;

  // ── Helpers ───────────────────────────────────────────────────────────
  function addLog(msg: string) {
    log = [...log, `[${new Date().toLocaleTimeString()}] ${msg}`];
  }

  function reset() {
    phase = 'idle';
    progress = 0;
    errorMsg = '';
    log = [];
  }

  // ── Charger les releases GitHub ───────────────────────────────────────
  // Throw en cas d'échec : l'erreur remonte au <svelte:boundary> (snippet failed).
  async function fetchReleases(): Promise<Release[]> {
    const r = await fetch('https://api.github.com/repos/Aristide-BH/spinpad/releases?per_page=10');
    if (!r.ok) throw new Error(`GitHub API: ${r.status}`);
    const data: any[] = await r.json();
    return data
      .map((rel) => ({
        tag: rel.tag_name as string,
        name: rel.name as string,
        date: (rel.published_at as string)?.slice(0, 10) ?? '',
        assets: (rel.assets as any[])
          .filter((a) => (a.name as string).endsWith('.bin'))
          .map((a) => ({
            name: a.name as string,
            download_url: a.browser_download_url as string,
            size: a.size as number,
          })),
      }))
      .filter((r) => r.assets.length > 0);
  }

  // ── Flash via WebSerial (esptool-js) ──────────────────────────────────
  async function startFlash() {
    if (!firmwareFile) return;
    phase = 'connecting';
    log = [];
    progress = 0;
    errorMsg = '';

    try {
      addLog("Demande d'accès au port série…");
      const port = await (navigator as any).serial.requestPort({
        filters: [{ usbVendorId: 0x303a }], // Espressif USB-JTAG
      });

      addLog('Connexion au port…');
      await port.open({ baudRate: 115200 });

      addLog('Lecture des fichiers…');
      const firmwareBuf = await firmwareFile.arrayBuffer();
      const images: { offset: number; data: Uint8Array }[] = [{ offset: 0x10000, data: new Uint8Array(firmwareBuf) }];

      if (flashSpiffs && spiffsFile) {
        const spiffsBuf = await spiffsFile.arrayBuffer();
        images.push({ offset: 0x310000, data: new Uint8Array(spiffsBuf) });
      }

      const { ESPLoader, Transport } = await import('esptool-js');

      const transport = new Transport(port);
      const loader = new ESPLoader({
        transport,
        baudrate: 921600,
        romBaudrate: 115200,
        terminal: {
          clean() {},
          writeLine: (msg: string) => addLog(msg),
          write: (msg: string) => addLog(msg),
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
        await loader.flashData(img.data, img.offset, (pct: number) => {
          progress = Math.round(((written + (pct / 100) * img.data.byteLength) / total) * 100);
        });
        written += img.data.byteLength;
      }

      addLog('Redémarrage…');
      await loader.hardReset();
      await port.close();

      phase = 'done';
      progress = 100;
      addLog('✅ Flash terminé avec succès !');
    } catch (e: unknown) {
      phase = 'error';
      errorMsg = e instanceof Error ? e.message : String(e);
      addLog(`❌ Erreur : ${errorMsg}`);
    }
  }

  // ── Télécharger un asset depuis GitHub ────────────────────────────────
  async function downloadAsset(url: string, filename: string) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
    } catch (e: unknown) {
      addLog(`Téléchargement échoué : ${e instanceof Error ? e.message : e}`);
    }
  }
</script>

<svelte:head>
  <title>Flash firmware : SpinPad</title>
</svelte:head>

<div class="max-w-2xl px-4 py-8 mx-auto">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="mb-1 text-2xl font-bold">SpinPad Flasher</h1>
    <p class="text-sm text-muted-foreground">
      Flashez le firmware de votre SpinPad via WebSerial. Chrome / Edge requis.
    </p>
  </div>

  <!-- WebSerial warning -->
  {#if !hasWebSerial}
    <div class="px-4 py-3 mb-6 text-sm text-yellow-300 border border-yellow-600 rounded-lg bg-yellow-950/40">
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
        onclick={() => (releasesPromise = fetchReleases())}
      >
        {releasesPromise ? 'Recharger les releases' : 'Charger les releases'}
      </button>
    </div>

    {#if releasesPromise}
      <svelte:boundary>
        <div class="space-y-2">
          {#each await releasesPromise as rel (rel.tag)}
            <div class="p-3 border rounded-lg border-border bg-card">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <span class="font-mono text-sm text-blue-300">{rel.tag}</span>
                  {#if rel.name !== rel.tag}
                    <span class="ml-2 text-sm text-muted-foreground">{rel.name}</span>
                  {/if}
                </div>
                <span class="text-xs text-muted-foreground">{rel.date}</span>
              </div>
              <div class="flex flex-wrap gap-2">
                {#each rel.assets as asset (asset.name)}
                  <button
                    class="px-2 py-1 text-xs transition-colors border rounded bg-secondary hover:bg-secondary/80 border-border"
                    onclick={() => downloadAsset(asset.download_url, asset.name)}
                  >
                    ⬇ {asset.name}
                    <span class="ml-1 text-muted-foreground">{(asset.size / 1024).toFixed(0)} KB</span>
                  </button>
                {/each}
              </div>
            </div>
          {:else}
            <p class="text-sm text-muted-foreground">Aucune release trouvée.</p>
          {/each}
        </div>

        {#snippet pending()}
          <div class="space-y-2">
            {#each Array.from({ length: 3 }) as _, i (i)}
              <Skeleton class="w-full h-16 rounded-lg" />
            {/each}
          </div>
        {/snippet}

        {#snippet failed(error, reset)}
          <div class="p-3 border rounded-lg border-destructive/40 bg-destructive/5">
            <p class="mb-2 text-sm text-destructive">
              Impossible de charger les releases : {(error as Error).message}
            </p>
            <button
              class="text-sm text-blue-400 hover:text-blue-300"
              onclick={() => {
                releasesPromise = fetchReleases();
                reset();
              }}
            >
              Réessayer
            </button>
          </div>
        {/snippet}
      </svelte:boundary>
    {:else}
      <p class="text-sm text-muted-foreground">
        Cliquez sur "Charger les releases" pour voir les versions disponibles.
      </p>
    {/if}
  </section>

  <hr class="mb-6 border-border" />

  <!-- Sélection des fichiers -->
  <section class="mb-6 space-y-4">
    <h2 class="font-semibold">Fichiers à flasher</h2>

    <!-- Firmware -->
    <Field>
      <FieldLabel for="firmware-input">
        Firmware <span class="font-normal text-muted-foreground">(factory.bin, offset 0x10000)</span>
        <span class="ml-1 text-destructive">*</span>
      </FieldLabel>
      <Input
        id="firmware-input"
        type="file"
        accept=".bin"
        onchange={(e: Event) => (firmwareFile = (e.target as HTMLInputElement).files?.[0] ?? null)}
      />
      {#if firmwareFile}
        <p class="mt-1 text-xs text-emerald-500">✓ {firmwareFile.name} ({(firmwareFile.size / 1024).toFixed(0)} KB)</p>
      {/if}
    </Field>

    <!-- SPIFFS (optionnel) -->
    <div class="space-y-2">
      <Field orientation="horizontal" class="gap-2">
        <Switch id="flash-spiffs" bind:checked={flashSpiffs} />
        <FieldLabel for="flash-spiffs" class="font-normal">
          Flasher le Studio (SPIFFS, offset 0x310000)
        </FieldLabel>
      </Field>
      {#if flashSpiffs}
        <Input
          type="file"
          accept=".bin"
          onchange={(e: Event) => (spiffsFile = (e.target as HTMLInputElement).files?.[0] ?? null)}
        />
        {#if spiffsFile}
          <p class="mt-1 text-xs text-emerald-500">✓ {spiffsFile.name} ({(spiffsFile.size / 1024).toFixed(0)} KB)</p>
        {/if}
      {/if}
    </div>
  </section>

  <!-- Bouton flash -->
  <div class="flex gap-3 mb-6">
    <button
      class="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed
             font-semibold text-sm text-white transition-colors"
      disabled={!hasWebSerial || !firmwareFile || (phase !== 'idle' && phase !== 'done' && phase !== 'error')}
      onclick={startFlash}
    >
      {#if phase === 'connecting'}
        Connexion…
      {:else if phase === 'erasing'}
        Effacement…
      {:else if phase === 'flashing'}
        Flash en cours…
      {:else}
        ⚡ Flasher
      {/if}
    </button>

    {#if phase !== 'idle'}
      <button
        class="px-4 py-2.5 rounded-lg border border-border hover:bg-secondary text-sm transition-colors"
        onclick={reset}
      >
        Réinitialiser
      </button>
    {/if}
  </div>

  <!-- Barre de progression -->
  {#if phase !== 'idle'}
    <div class="mb-4">
      <div class="flex justify-between mb-1 text-xs text-muted-foreground">
        <span>
          {#if phase === 'connecting'}
            Connexion au bootloader…
          {:else if phase === 'erasing'}
            Effacement de la flash…
          {:else if phase === 'flashing'}
            Écriture… {progress}%
          {:else if phase === 'done'}
            Terminé
          {:else if phase === 'error'}
            Erreur
          {/if}
        </span>
        <span>{progress}%</span>
      </div>
      <div class="w-full h-2 overflow-hidden rounded-full bg-secondary">
        <div
          class="h-2 rounded-full transition-all duration-200
                 {phase === 'done' ? 'bg-green-500' : phase === 'error' ? 'bg-red-500' : 'bg-blue-500'}"
          style="width: {progress}%"
        ></div>
      </div>
    </div>
  {/if}

  <!-- Erreur -->
  {#if phase === 'error'}
    <div class="px-4 py-3 mb-4 text-sm text-red-300 border border-red-700 rounded-lg bg-red-950/40">
      ❌ {errorMsg}
    </div>
  {/if}

  <!-- Log -->
  {#if log.length > 0}
    <div
      class="p-3 overflow-y-auto font-mono text-xs border rounded-lg bg-card border-border text-muted-foreground max-h-48"
    >
      {#each log as line (line)}
        <div class="leading-relaxed">{line}</div>
      {/each}
    </div>
  {/if}

  <!-- Footer note -->
  <p class="mt-6 text-xs text-muted-foreground">
    Maintenez <Kbd>BOOT</Kbd> appuyé pendant la connexion si le SpinPad ne passe pas automatiquement
    en mode flash.
  </p>
</div>
