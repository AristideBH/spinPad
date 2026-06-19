<script lang="ts">
  import { Skeleton } from '$shared/components/ui/skeleton/index.js';
  import { Input } from '$shared/components/ui/input/index.js';
  import { Kbd } from '$shared/components/ui/kbd/index.js';
  import { Field, FieldLabel } from '$shared/components/ui/field/index.js';
  import { Card, CardHeader, CardTitle, CardContent } from '$shared/components/ui/card/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import { Alert, AlertTitle, AlertDescription } from '$shared/components/ui/alert/index.js';
  import { Progress } from '$shared/components/ui/progress/index.js';
  import { Badge } from '$shared/components/ui/badge/index.js';
  import { devMode } from '$shared/store/devMode.svelte.js';
  import LedMatrix from '$shared/components/app/studio/dashboard/led-matrix.svelte';
  import * as Dialog from '$shared/components/ui/dialog/index.js';
  import {
    TriangleAlert,
    Check,
    Zap,
    RotateCcw,
    FlaskConical,
    RefreshCw,
    ExternalLink,
    CircleCheck,
    CircleX,
    Copy,
    Wrench,
    BookOpen,
    PlugZap,
    Unplug,
  } from '@lucide/svelte';
  import { slide } from 'svelte/transition';

  // ── Constants ────────────────────────────────────────────────────────────
  const REPO = 'AristideBH/spinPad';
  // Offsets match .github/workflows/firmware-release.yml's write_flash layout.
  const ASSET_OFFSETS: Record<string, number> = {
    'bootloader.bin': 0x0,
    'partition-table.bin': 0x8000,
    'spinpad.bin': 0x10000,
    'spiffs_image.bin': 0x310000,
  };

  // ── State ────────────────────────────────────────────────────────────────
  type Phase = 'idle' | 'connecting' | 'erasing' | 'flashing' | 'done' | 'error';
  let phase = $state<Phase>('idle');
  let log = $state<string[]>([]);
  let progress = $state(0);
  let errorMsg = $state('');
  let showResult = $state(false);

  // ── Wipe-consent dialog (gates every flash action, real or simulated) ──
  let showConfirm = $state(false);
  let pendingAction = $state<'flash' | 'simulate' | 'simulate-fail' | null>(null);

  interface ReleaseAsset {
    name: string;
    id: number;
    size: number;
  }
  interface Release {
    tag: string;
    name: string;
    date: string;
    htmlUrl: string;
    body: string;
    assets: ReleaseAsset[];
  }

  let releases = $state<Release[]>([]);
  let releasesStatus = $state<'loading' | 'loaded' | 'error'>('loading');
  let releasesError = $state('');
  let selectedTag = $state<string | null>(null);

  let advancedMode = $state(false);

  // ── Device connection (separate from flashing — see studio's ConnectBanner
  // for the same "connect first, act second" pattern) ─────────────────────
  type Connection = 'disconnected' | 'connecting' | 'connected' | 'error';
  let connection = $state<Connection>('disconnected');
  let connectError = $state('');
  let connectedChip = $state('');

  // Live device handles — not reactive state, just held references between
  // the Connect click and the Flash click.
  let activePort: any = null;
  let activeLoader: any = null;

  // Advanced / custom-build fallback — bring your own .bin files.
  let bootloaderFile = $state<File | null>(null);
  let partitionTableFile = $state<File | null>(null);
  let spinpadFile = $state<File | null>(null);
  let spiffsFile = $state<File | null>(null);

  const selectedRelease = $derived(releases.find((r) => r.tag === selectedTag) ?? null);
  const selectedTotalSize = $derived(
    selectedRelease ? selectedRelease.assets.reduce((s, a) => s + a.size, 0) : 0
  );
  const latestTag = $derived(releases[0]?.tag ?? null);
  const flashReady = $derived(advancedMode ? !!spinpadFile : !!selectedRelease);
  // True while a flash is connecting/erasing/writing — the rest of the page locks during this.
  const busy = $derived(phase !== 'idle' && phase !== 'done' && phase !== 'error');
  const changelogPreview = $derived(
    selectedRelease ? selectedRelease.body.trim().slice(0, 280) : ''
  );

  // ── LED showcase (mirrors the dashboard's LedMatrix, see led-matrix.svelte) ─
  const LED_BY_PHASE: Record<
    Phase,
    { mode: 'breathe' | 'sweep' | 'flow' | 'static' | 'alert'; color: string }
  > = {
    idle: { mode: 'static', color: '#000' },
    connecting: { mode: 'sweep', color: '#2262AB' },
    erasing: { mode: 'sweep', color: '#fb923c' },
    flashing: { mode: 'flow', color: '#22c55e' },
    done: { mode: 'static', color: '#22c55e' },
    error: { mode: 'breathe', color: '#ef4444' },
  };
  const ledMode = $derived(LED_BY_PHASE[phase].mode);
  const ledColors = $derived([LED_BY_PHASE[phase].color]);

  // ── WebSerial detection ──────────────────────────────────────────────────
  const hasWebSerial = typeof navigator !== 'undefined' && 'serial' in navigator;

  // ── Helpers ──────────────────────────────────────────────────────────────
  function addLog(msg: string) {
    log = [...log, `[${new Date().toLocaleTimeString()}] ${msg}`];
  }

  function resetPhase() {
    phase = 'idle';
    progress = 0;
    errorMsg = '';
    log = [];
  }

  function wait(ms: number) {
    return new Promise<void>((r) => setTimeout(r, ms));
  }

  function enableDemoMode() {
    devMode.active = true;
    advancedMode = false;
  }

  function disableDemoMode() {
    devMode.active = false;
    resetPhase();
  }

  // ── Releases (real GitHub pull, or simulated in demo mode) ─────────────
  async function fetchRealReleases(): Promise<Release[]> {
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=10`);
    if (!r.ok) throw new Error(`GitHub API: ${r.status}`);
    const data: any[] = await r.json();
    return data
      .map((rel) => ({
        tag: rel.tag_name as string,
        name: rel.name as string,
        date: (rel.published_at as string)?.slice(0, 10) ?? '',
        htmlUrl: rel.html_url as string,
        body: (rel.body as string) ?? '',
        assets: (rel.assets as any[])
          .filter((a) => (a.name as string) in ASSET_OFFSETS)
          .map((a) => ({
            name: a.name as string,
            id: a.id as number,
            size: a.size as number,
          })),
      }))
      .filter((r) => r.assets.length === Object.keys(ASSET_OFFSETS).length);
  }

  function fakeReleaseList(): Release[] {
    const makeAssets = (): ReleaseAsset[] => [
      { name: 'bootloader.bin', id: -1, size: 24_000 },
      { name: 'partition-table.bin', id: -2, size: 3_000 },
      { name: 'spinpad.bin', id: -3, size: 1_180_000 },
      { name: 'spiffs_image.bin', id: -4, size: 380_000 },
    ];
    const make = (tag: string, daysAgo: number): Release => ({
      tag,
      name: tag,
      date: new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 10),
      htmlUrl: `https://github.com/${REPO}/releases/tag/${tag}`,
      body: `## ${tag} (demo)\n\n- Simulated changelog entry for testing the flasher UI.\n- No real firmware was built or flashed.`,
      assets: makeAssets(),
    });
    return [make('firmware/v1.4.0', 2), make('firmware/v1.3.1', 18), make('firmware/v1.3.0', 40)];
  }

  async function loadReleases(isDemo: boolean) {
    releasesStatus = 'loading';
    releasesError = '';
    try {
      if (isDemo) {
        await wait(500);
        releases = fakeReleaseList();
      } else {
        releases = await fetchRealReleases();
      }
      selectedTag = releases[0]?.tag ?? null;
      releasesStatus = 'loaded';
    } catch (e: unknown) {
      releasesError = e instanceof Error ? e.message : String(e);
      releasesStatus = 'error';
    }
  }

  // Auto-load on mount, and again whenever demo mode is toggled.
  $effect(() => {
    loadReleases(devMode.active);
  });

  // ── Building flash images ───────────────────────────────────────────────
  async function fetchAssetBuffer(id: number): Promise<ArrayBuffer> {
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases/assets/${id}`, {
      headers: { Accept: 'application/octet-stream' },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} downloading asset`);
    return r.arrayBuffer();
  }

  async function buildImagesFromRelease(
    rel: Release
  ): Promise<{ offset: number; data: Uint8Array }[]> {
    const images: { offset: number; data: Uint8Array }[] = [];
    for (const asset of rel.assets) {
      const offset = ASSET_OFFSETS[asset.name];
      if (offset === undefined) continue;
      addLog(`Downloading ${asset.name}…`);
      const buf = await fetchAssetBuffer(asset.id);
      images.push({ offset, data: new Uint8Array(buf) });
    }
    return images.sort((a, b) => a.offset - b.offset);
  }

  async function buildImagesFromAdvanced(): Promise<{ offset: number; data: Uint8Array }[]> {
    const entries: [File | null, number][] = [
      [bootloaderFile, 0x0],
      [partitionTableFile, 0x8000],
      [spinpadFile, 0x10000],
      [spiffsFile, 0x310000],
    ];
    const images: { offset: number; data: Uint8Array }[] = [];
    for (const [file, offset] of entries) {
      if (!file) continue;
      const buf = await file.arrayBuffer();
      images.push({ offset, data: new Uint8Array(buf) });
    }
    return images;
  }

  // ── Connect (separate from flashing) ────────────────────────────────────
  async function connectDevice() {
    if (!hasWebSerial) return;
    connection = 'connecting';
    connectError = '';
    try {
      const port = await (navigator as any).serial.requestPort({
        filters: [{ usbVendorId: 0x303a }], // Espressif USB-JTAG
      });
      await port.open({ baudRate: 115200 });

      const { ESPLoader, Transport } = await import('esptool-js');
      const transport = new Transport(port);
      const loader = new ESPLoader({
        transport,
        baudrate: 921600,
        terminal: {
          clean() {},
          writeLine: (msg: string) => addLog(msg),
          write: (msg: string) => addLog(msg),
        },
      });

      const chip = await loader.main();

      activePort = port;
      activeLoader = loader;
      connectedChip = chip;
      connection = 'connected';
    } catch (e: unknown) {
      connection = 'error';
      connectError = e instanceof Error ? e.message : String(e);
    }
  }

  async function disconnectDevice() {
    try {
      await activePort?.close();
    } catch {
      // ignore — port may already be closed (e.g. after a flash + hard reset)
    }
    activePort = null;
    activeLoader = null;
    connectedChip = '';
    connection = 'disconnected';
    resetPhase();
  }

  // ── Flash via WebSerial (esptool-js) ────────────────────────────────────
  async function startFlash() {
    if (connection !== 'connected' || !flashReady) return;
    phase = 'connecting';
    log = [];
    progress = 0;
    errorMsg = '';

    const loader = activeLoader;
    const port = activePort;

    try {
      addLog(`Chip detected: ${connectedChip}`);

      addLog('Reading firmware files…');
      const images = advancedMode
        ? await buildImagesFromAdvanced()
        : await buildImagesFromRelease(selectedRelease!);

      addLog('Erasing…');
      phase = 'erasing';
      await loader.eraseFlash();

      addLog('Flashing in progress…');
      phase = 'flashing';

      const total = images.reduce((s, img) => s + img.data.byteLength, 0);
      const written = images.map(() => 0);
      for (const img of images) {
        addLog(
          `→ 0x${img.offset.toString(16).toUpperCase()} (${(img.data.byteLength / 1024).toFixed(0)} KB)`
        );
      }

      await loader.writeFlash({
        fileArray: images.map((img) => ({ data: img.data, address: img.offset })),
        flashMode: 'keep',
        flashFreq: 'keep',
        flashSize: 'keep',
        eraseAll: false,
        compress: true,
        reportProgress: (fileIndex: number, bytesWritten: number) => {
          written[fileIndex] = bytesWritten;
          const sum = written.reduce((s, n) => s + n, 0);
          progress = Math.round((sum / total) * 100);
        },
      });

      addLog('Restarting…');
      await loader.after('hard_reset');
      await port.close();
      activePort = null;
      activeLoader = null;
      connection = 'disconnected';
      connectedChip = '';

      phase = 'done';
      progress = 100;
      addLog('✅ Flash completed successfully!');
      showResult = true;
    } catch (e: unknown) {
      phase = 'error';
      errorMsg = e instanceof Error ? e.message : String(e);
      addLog(`❌ Error: ${errorMsg}`);
      showResult = true;
    }
  }

  // ── Simulated flash (demo mode) ─────────────────────────────────────────
  async function simulateFlash(fail = false) {
    if (!flashReady) return;
    phase = 'connecting';
    log = [];
    progress = 0;
    errorMsg = '';

    try {
      addLog('Requesting serial port access… (demo)');
      await wait(400);
      addLog('Connecting to port…');
      await wait(400);
      addLog('Connecting to ROM bootloader…');
      await wait(500);
      addLog('Chip detected: ESP32-S3 (demo)');

      phase = 'erasing';
      addLog('Erasing…');
      await wait(800);

      phase = 'flashing';
      addLog('Flashing in progress…');
      if (selectedRelease) {
        for (const asset of selectedRelease.assets) {
          const offset = ASSET_OFFSETS[asset.name];
          addLog(
            `→ 0x${offset.toString(16).toUpperCase()} ${asset.name} (${(asset.size / 1024).toFixed(0)} KB)`
          );
        }
      }

      for (let p = 0; p <= 100; p += 5) {
        if (fail && p >= 50) {
          throw new Error('Packet timeout — device did not respond (demo)');
        }
        progress = p;
        await wait(80);
      }

      addLog('Restarting…');
      await wait(300);
      phase = 'done';
      progress = 100;
      addLog('✅ Flash completed successfully! (demo)');
      showResult = true;
    } catch (e: unknown) {
      phase = 'error';
      errorMsg = e instanceof Error ? e.message : String(e);
      addLog(`❌ Error: ${errorMsg}`);
      showResult = true;
    }
  }

  // ── Copy log to clipboard ────────────────────────────────────────────────
  let showLog = $state(false);
  let logCopied = $state(false);
  async function copyLog() {
    await navigator.clipboard.writeText(log.join('\n'));
    logCopied = true;
    setTimeout(() => (logCopied = false), 1500);
  }

  // ── Wipe-consent gate: every flash trigger opens the confirm dialog first ─
  function requestFlash() {
    pendingAction = devMode.active ? 'simulate' : 'flash';
    showConfirm = true;
  }

  function requestSimulateFailure() {
    pendingAction = 'simulate-fail';
    showConfirm = true;
  }

  function confirmFlash() {
    showConfirm = false;
    if (pendingAction === 'flash') startFlash();
    else if (pendingAction === 'simulate') simulateFlash();
    else if (pendingAction === 'simulate-fail') simulateFlash(true);
    pendingAction = null;
  }

  function cancelFlash() {
    showConfirm = false;
    pendingAction = null;
  }
</script>

<svelte:head>
  <title>Flash firmware: SpinPad</title>
</svelte:head>

<div class="w-full max-w-5xl px-4 py-8 mx-auto space-y-6">
  <!-- Header -->
  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="mb-1 text-2xl font-bold">SpinPad Flasher</h1>
      <p class="text-sm text-muted-foreground">
        Flash your SpinPad's firmware via WebSerial. Chrome / Edge required.
      </p>
    </div>
    <Button
      variant={devMode.active ? 'default' : 'outline'}
      size="sm"
      disabled={busy}
      onclick={() => (devMode.active ? disableDemoMode() : enableDemoMode())}
    >
      <FlaskConical class="size-4" />
      {devMode.active ? 'Exit demo mode' : 'Demo mode'}
    </Button>
  </div>

  {#if devMode.active}
    <Alert>
      <FlaskConical class="size-4" />
      <AlertTitle>Demo mode</AlertTitle>
      <AlertDescription>
        Releases and the flash sequence are simulated — no network, device, or WebSerial required.
      </AlertDescription>
    </Alert>
  {/if}

  <!-- WebSerial warning -->
  {#if !hasWebSerial && !devMode.active}
    <Alert>
      <TriangleAlert class="size-4" />
      <AlertTitle>WebSerial not available</AlertTitle>
      <AlertDescription
        >Use Chrome or Edge (≥89) to flash directly from the browser.</AlertDescription
      >
    </Alert>
  {/if}

  <!-- Releases + flash target lock while a flash is in progress -->
  <div
    class={busy ? 'grid grid-cols-1 gap-4 pointer-events-none opacity-60 md:grid-cols-2' : 'grid grid-cols-1 gap-4 md:grid-cols-2'}
    aria-disabled={busy}
    inert={busy}
  >
    <!-- Firmware release -->
    <Card>
      <CardHeader class="flex items-center justify-between">
        <CardTitle>Firmware release</CardTitle>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={releasesStatus === 'loading' || busy}
          onclick={() => loadReleases(devMode.active)}
        >
          <RefreshCw class={releasesStatus === 'loading' ? 'size-4 animate-spin' : 'size-4'} />
        </Button>
      </CardHeader>
      <CardContent>
        {#if releasesStatus === 'loading'}
          <div class="space-y-2">
            {#each Array.from({ length: 3 }) as _, i (i)}
              <Skeleton class="w-full h-16 rounded-lg" />
            {/each}
          </div>
        {:else if releasesStatus === 'error'}
          <Alert variant="destructive">
            <AlertTitle>Unable to load releases</AlertTitle>
            <AlertDescription>{releasesError}</AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              class="mt-2"
              onclick={() => loadReleases(devMode.active)}
            >
              Retry
            </Button>
          </Alert>
        {:else if releases.length === 0}
          <p class="text-sm text-muted-foreground">No releases found.</p>
        {:else}
          <div class="space-y-2">
            {#each releases as rel (rel.tag)}
              <div
                role="radio"
                aria-checked={selectedTag === rel.tag}
                tabindex={0}
                class={selectedTag === rel.tag
                  ? 'p-3 border rounded-lg cursor-pointer transition-colors border-primary bg-primary/5'
                  : 'p-3 border rounded-lg cursor-pointer transition-colors border-border bg-card hover:bg-secondary/40'}
                onclick={() => (selectedTag = rel.tag)}
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectedTag = rel.tag;
                  }
                }}
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="flex items-center gap-1.5 font-mono text-sm text-primary">
                    {#if selectedTag === rel.tag}<Check class="size-3.5" />{/if}
                    {rel.tag}
                    {#if rel.tag === latestTag}<Badge variant="secondary">Latest</Badge>{/if}
                  </span>
                  <span class="text-xs text-muted-foreground">{rel.date}</span>
                </div>
                <span class="text-xs text-muted-foreground">
                  {(rel.assets.reduce((s, a) => s + a.size, 0) / 1024).toFixed(0)} KB
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Flash target -->
    <Card>
      <CardHeader class="flex items-center justify-between">
        <CardTitle>{advancedMode ? 'Custom files' : 'Ready to flash'}</CardTitle>
        {#if !devMode.active}
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onclick={() => (advancedMode = !advancedMode)}
          >
            {advancedMode ? 'Use a release' : 'Advanced: custom files'}
          </Button>
        {/if}
      </CardHeader>
      <CardContent class="space-y-4">
        {#if advancedMode}
          {#snippet fileStatus(file: File | null)}
            {#if file}
              <p class="flex items-center gap-1 mt-1 text-xs text-primary">
                <Check class="size-3" />
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </p>
            {/if}
          {/snippet}

          <Field>
            <FieldLabel for="bootloader-input">
              Bootloader <span class="font-normal text-muted-foreground">(offset 0x0)</span>
            </FieldLabel>
            <Input
              id="bootloader-input"
              type="file"
              accept=".bin"
              onchange={(e: Event) =>
                (bootloaderFile = (e.target as HTMLInputElement).files?.[0] ?? null)}
            />
            {@render fileStatus(bootloaderFile)}
          </Field>

          <Field>
            <FieldLabel for="partition-input">
              Partition table <span class="font-normal text-muted-foreground">(offset 0x8000)</span>
            </FieldLabel>
            <Input
              id="partition-input"
              type="file"
              accept=".bin"
              onchange={(e: Event) =>
                (partitionTableFile = (e.target as HTMLInputElement).files?.[0] ?? null)}
            />
            {@render fileStatus(partitionTableFile)}
          </Field>

          <Field>
            <FieldLabel for="spinpad-input">
              Firmware <span class="font-normal text-muted-foreground"
                >(spinpad.bin, offset 0x10000)</span
              >
              <span class="ml-1 text-destructive">*</span>
            </FieldLabel>
            <Input
              id="spinpad-input"
              type="file"
              accept=".bin"
              onchange={(e: Event) =>
                (spinpadFile = (e.target as HTMLInputElement).files?.[0] ?? null)}
            />
            {@render fileStatus(spinpadFile)}
          </Field>

          <Field>
            <FieldLabel for="spiffs-input">
              Studio Mode <span class="font-normal text-muted-foreground"
                >(SPIFFS, offset 0x310000)</span
              >
            </FieldLabel>
            <Input
              id="spiffs-input"
              type="file"
              accept=".bin"
              onchange={(e: Event) =>
                (spiffsFile = (e.target as HTMLInputElement).files?.[0] ?? null)}
            />
            {@render fileStatus(spiffsFile)}
          </Field>
        {:else if selectedRelease}
          <div class="space-y-1 text-sm">
            <p class="flex items-center gap-1.5 font-mono text-primary">
              <Check class="size-3.5" />
              {selectedRelease.tag}
              {#if selectedRelease.tag === latestTag}<Badge variant="secondary">Latest</Badge>{/if}
            </p>
            <p class="text-muted-foreground">
              {selectedRelease.assets.length} files · {(selectedTotalSize / 1024).toFixed(0)} KB
            </p>
          </div>
          <p class="text-xs text-muted-foreground">
            Bootloader, partition table, firmware and Studio Mode (SPIFFS) will all be flashed
            together.
          </p>

          {#if selectedRelease.body}
            <div class="pt-2 border-t border-border">
              <p class="mb-1 text-xs font-medium text-muted-foreground">Changelog</p>
              <p class="text-xs whitespace-pre-line text-muted-foreground">
                {changelogPreview}{selectedRelease.body.length > 280 ? '…' : ''}
              </p>
              {#if devMode.active}
                <span class="inline-flex items-center gap-0.5 mt-1 text-xs text-muted-foreground">
                  View full release on GitHub (demo)
                </span>
              {:else}
                <a
                  href={selectedRelease.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  class="inline-flex items-center gap-0.5 mt-1 text-xs hover:text-primary"
                >
                  View full release on GitHub <ExternalLink class="size-3" />
                </a>
              {/if}
            </div>
          {/if}
        {:else}
          <p class="text-sm text-muted-foreground">Select a release to flash.</p>
        {/if}
      </CardContent>
    </Card>
  </div>

  <!-- Connect (separate from flashing) -->
  {#if !devMode.active}
    {#if connection === 'connected'}
      <Alert>
        <PlugZap class="size-4" />
        <AlertTitle>{connectedChip} connected</AlertTitle>
        <AlertDescription>Ready to flash.</AlertDescription>
        <Button variant="ghost" size="sm" class="mt-2" disabled={busy} onclick={disconnectDevice}>
          <Unplug class="size-4" /> Disconnect
        </Button>
      </Alert>
    {:else}
      <Alert variant={connection === 'error' ? 'destructive' : 'default'}>
        <PlugZap class="size-4" />
        <AlertTitle>Connect your SpinPad</AlertTitle>
        <AlertDescription>
          {#if connection === 'error'}
            {connectError}
          {:else}
            Plug it in over USB, then connect to put it in flashing mode.
          {/if}
        </AlertDescription>
        <Button
          size="sm"
          class="mt-2"
          disabled={!hasWebSerial || connection === 'connecting' || busy}
          onclick={connectDevice}
        >
          <PlugZap class="size-4" />
          {connection === 'connecting' ? 'Connecting…' : 'Connect device'}
        </Button>
      </Alert>
    {/if}
  {/if}

  <!-- Flash action -->
  <Card>
    <CardContent class="space-y-4">
      <div
        class="p-4 border relative rounded-lg space-y-4 border-border bg-card shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)]"
      >
        <LedMatrix
          mode={ledMode}
          color="solid"
          colors={ledColors}
          falloff="none"
          cell={6}
          dotRatio={0.7}
          brightness={0.2}
          class="absolute inset-0 max-h-32 mask-b-from-20% mask-b-to-80% z-10 pointer-events-none"
        />
        <div class="z-20">
          <div class="flex items-baseline justify-between mt-3 mb-1">
            <span class="font-mono text-2xl font-bold tabular-nums">
              {#if phase === 'idle'}
                Ready
              {:else}
                {progress}%
              {/if}
            </span>
            <span class="text-xs text-muted-foreground">
              {#if phase === 'connecting'}
                Connecting to bootloader…
              {:else if phase === 'erasing'}
                Erasing flash…
              {:else if phase === 'flashing'}
                Writing…
              {:else if phase === 'done'}
                Done
              {:else if phase === 'error'}
                Error
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-xs"
                  onclick={() => {
                    showLog = !showLog;
                  }}
                >
                  View log
                </Button>
              {/if}
            </span>
          </div>
          <Progress value={progress} />
        </div>
        <!-- Log -->
        {#if log.length > 0 && showLog}
          <div
            transition:slide
            class="p-3 overflow-y-auto font-mono text-xs border rounded-lg border-border text-muted-foreground max-h-48"
          >
            {#each log as line (line)}
              <div class="leading-relaxed">{line}</div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="flex gap-3">
        <Button
          disabled={(!devMode.active && connection !== 'connected') || !flashReady || busy}
          onclick={requestFlash}
        >
          <Zap class="size-4" />
          {#if phase === 'connecting'}
            Connecting…
          {:else if phase === 'erasing'}
            Erasing…
          {:else if phase === 'flashing'}
            Flashing in progress…
          {:else}
            Flash
          {/if}
        </Button>

        {#if devMode.active}
          <Button
            variant="outline"
            disabled={!flashReady || busy}
            onclick={requestSimulateFailure}
          >
            <TriangleAlert class="size-4" />
            Simulate failure
          </Button>
        {/if}

        {#if phase !== 'idle'}
          <Button variant="outline" onclick={resetPhase}>
            <RotateCcw class="size-4" />
            Reset
          </Button>
        {/if}
      </div>
    </CardContent>
  </Card>

  <!-- Error -->
  <!-- {#if phase === 'error'}
    <Alert variant="destructive">
      <AlertTitle>Flash failed</AlertTitle>
      <AlertDescription>{errorMsg}</AlertDescription>
    </Alert>
  {/if} -->

  <!-- Footer note -->
  <p class="text-xs text-muted-foreground">
    Hold <Kbd>BOOT</Kbd> down during connection if the SpinPad doesn't automatically switch to flash mode.
  </p>
</div>

<Dialog.Root bind:open={showResult}>
  <Dialog.Content class="sm:max-w-md">
    {#if phase === 'error'}
      <Dialog.Header>
        <div
          class="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-destructive/10"
        >
          <CircleX class="text-destructive size-6" />
        </div>
        <Dialog.Title class="text-center">Flash failed</Dialog.Title>
        <Dialog.Description class="text-center">{errorMsg}</Dialog.Description>
      </Dialog.Header>

      <div class="space-y-3">
        <Button class="w-full" variant="outline" onclick={copyLog}>
          <Copy class="size-4" />
          {logCopied ? 'Copied!' : 'Copy log'}
        </Button>
        <Button
          class="w-full"
          variant="outline"
          onclick={() => {
            showResult = false;
            resetPhase();
          }}
        >
          <RotateCcw class="size-4" /> Try again
        </Button>
      </div>
    {:else}
      <Dialog.Header>
        <div
          class="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10"
        >
          <CircleCheck class="text-primary size-6" />
        </div>
        <Dialog.Title class="text-center">Flash complete</Dialog.Title>
        <Dialog.Description class="text-center">
          Your SpinPad is running {selectedRelease?.tag ?? 'the new firmware'}. Time to customize
          it.
        </Dialog.Description>
      </Dialog.Header>

      <div class="space-y-3">
        <Button class="w-full" href="/studio/">
          <Wrench class="size-4" /> Open Studio
        </Button>
        <p class="text-xs text-center text-muted-foreground">
          Using Studio Mode (embedded)? Connect to your SpinPad's WiFi network and open its IP
          address in a browser.
        </p>
      </div>

      <Dialog.Footer class="justify-center">
        <Button variant="ghost" size="sm" href="/docs/getting-started/">
          <BookOpen class="size-4" /> Read the docs
        </Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showConfirm}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <div
        class="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-destructive/10"
      >
        <TriangleAlert class="text-destructive size-6" />
      </div>
      <Dialog.Title class="text-center">This will erase your SpinPad</Dialog.Title>
      <Dialog.Description class="text-center">
        Flashing overwrites the bootloader, partition table, firmware, and Studio Mode storage.
        All profiles, layers, and settings currently on the device will be permanently lost.
      </Dialog.Description>
    </Dialog.Header>

    <p class="text-sm text-center text-muted-foreground">
      <a href="/docs/getting-started/" class="underline hover:text-primary">
        Back up or export your settings
      </a>
      first if you haven't already.
    </p>

    <Dialog.Footer class="gap-2 sm:justify-center">
      <Button variant="outline" class="flex-1" onclick={cancelFlash}>Cancel</Button>
      <Button variant="destructive" class="flex-1" onclick={confirmFlash}>
        <Zap class="size-4" /> Flash now
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
