<script lang="ts">
  import { PROFILE_ICON_W, PROFILE_ICON_H } from '$shared/constants/config-schema.js';
  import {
    emptyGrid,
    setPixel,
    gridToBase64,
    base64ToGrid,
    gridToImageData,
    imageDataToGrid,
    fillIconPixels,
    drawLine,
    drawRect,
    drawRectFill,
    drawEllipse,
    drawEllipseFill,
    type BoolGrid,
  } from '$shared/constants/profile-icon.js';
  import { PROFILE_ICON_LIBRARY } from '$shared/constants/profile-icon-library.js';
  import {
    Pencil,
    Minus,
    Square,
    SquareDashed,
    Circle,
    Disc3,
    Trash2,
    FlipHorizontal2,
    Save,
    RotateCcw,
    Upload,
    Download,
    Copy,
    Check,
    Contrast,
  } from '@lucide/svelte';
  import { Input } from '$shared/components/ui/input/index.js';
  import { Slider } from '$shared/components/ui/slider/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import * as Select from '$shared/components/ui/select/index.js';

  interface Props {
    value?: string; // current base64 (external prop)
    onchange?: (b64: string) => void;
    cell?: number; // px per cell in the editor
  }
  let { value = '', onchange, cell = 12 }: Props = $props();

  // ── Tools ────────────────────────────────────────────────────
  type Tool = 'pen' | 'line' | 'rect' | 'rectFill' | 'ellipse' | 'ellipseFill';
  const TOOLS: { id: Tool; label: string; icon: any; fill?: boolean }[] = [
    { id: 'pen', label: 'Pen', icon: Pencil },
    { id: 'line', label: 'Line', icon: Minus },
    { id: 'rectFill', label: 'Filled rect.', icon: Square, fill: true },
    { id: 'rect', label: 'Rectangle', icon: Square },
    { id: 'ellipseFill', label: 'Filled ellipse', icon: Circle, fill: true },
    { id: 'ellipse', label: 'Ellipse', icon: Circle },
  ];

  // ── State ────────────────────────────────────────────────────
  let grid = $state<BoolGrid>(emptyGrid());
  let saved = $state<BoolGrid>(emptyGrid()); // snapshot at last Save
  let synced = $state<string | undefined>(undefined);
  let dirty = $state(false); // modified since last Save
  let tool = $state<Tool>('pen');
  let fileInput = $state<HTMLInputElement | null>(null);

  // Import threshold
  let threshold = $state(128);

  // Copy feedback
  let copied = $state(false);

  const W = PROFILE_ICON_W;
  const H = PROFILE_ICON_H;
  const px = $derived(W * cell);
  const py = $derived(H * cell);

  // base64 of the current drawing (updated on every stroke)
  const currentBase64 = $derived(gridToBase64(grid));

  // ── Sync external prop → grid ────────────────────────────────
  $effect(() => {
    if (value !== synced) {
      grid = base64ToGrid(value);
      saved = grid.slice();
      synced = value;
      dirty = false;
    }
  });

  // ── Editor rendering (attachment: re-runs on grid/cell/px/py) ──
  const renderEditor = (el: HTMLCanvasElement) => {
    const ctx = el.getContext('2d');
    if (!ctx) return;

    fillIconPixels(ctx, grid, cell, px, py);

    // Grille
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= W; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cell + 0.5, 0);
      ctx.lineTo(i * cell + 0.5, py);
      ctx.stroke();
    }
    for (let j = 0; j <= H; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * cell + 0.5);
      ctx.lineTo(px, j * cell + 0.5);
      ctx.stroke();
    }

    // Crosshair centre
    const cx = (W / 2) * cell + 0.5;
    const cy = (H / 2) * cell + 0.5;
    ctx.strokeStyle = 'rgba(255,80,80,0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, py);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(px, cy);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // ── Full-size preview rendering (attachment: re-runs on grid) ──
  const renderPreview = (el: HTMLCanvasElement) => {
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(gridToImageData(grid, 1), 0, 0);
  };

  // ── Interaction ───────────────────────────────────────────────
  let drawing = $state(false);
  let paintOn = $state(true);
  let start = $state<{ x: number; y: number } | null>(null);
  let baseGrid: BoolGrid = emptyGrid();

  function cellAt(e: PointerEvent): { x: number; y: number } | null {
    const el = e.currentTarget as HTMLCanvasElement;
    const rect = el.getBoundingClientRect();
    const scaleX = el.width / rect.width;
    const scaleY = el.height / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / cell);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / cell);
    if (x < 0 || x >= W || y < 0 || y >= H) return null;
    return { x, y };
  }

  function applyShape(from: { x: number; y: number }, to: { x: number; y: number }, on: boolean) {
    const g = baseGrid.slice();
    switch (tool) {
      case 'line':
        drawLine(g, from.x, from.y, to.x, to.y, on);
        break;
      case 'rect':
        drawRect(g, from.x, from.y, to.x, to.y, on);
        break;
      case 'rectFill':
        drawRectFill(g, from.x, from.y, to.x, to.y, on);
        break;
      case 'ellipse':
        drawEllipse(g, from.x, from.y, to.x, to.y, on);
        break;
      case 'ellipseFill':
        drawEllipseFill(g, from.x, from.y, to.x, to.y, on);
        break;
    }
    grid = g;
    dirty = true;
  }

  function onPointerDown(e: PointerEvent) {
    const c = cellAt(e);
    if (!c) return;
    e.preventDefault();
    drawing = true;
    paintOn = e.button !== 2;
    start = c;
    baseGrid = grid.slice();
    if (tool === 'pen') {
      const next = grid.slice();
      setPixel(next, c.x, c.y, paintOn);
      grid = next;
      dirty = true;
    }
    (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!drawing || !start) return;
    const c = cellAt(e);
    if (!c) return;
    if (tool === 'pen') {
      const next = grid.slice();
      drawLine(next, start.x, start.y, c.x, c.y, paintOn);
      grid = next;
      dirty = true;
      start = c;
    } else {
      applyShape(start, c, paintOn);
    }
  }

  function onPointerUp() {
    if (!drawing) return;
    drawing = false;
    start = null;
    // No emit here — the user must click Save
  }

  // ── Save / Reset ─────────────────────────────────────────────
  function save() {
    const b64 = currentBase64;
    saved = grid.slice();
    synced = b64;
    dirty = false;
    onchange?.(b64);
  }

  function reset() {
    grid = saved.slice();
    dirty = false;
  }

  // ── Presets (Select) ──────────────────────────────────────────
  const CUSTOM_ICON = '__custom__';
  const matchedPreset = $derived(PROFILE_ICON_LIBRARY.find((e) => e.data === currentBase64) ?? null);
  const selectedPreset = $derived(matchedPreset?.id ?? CUSTOM_ICON);

  function onPresetChange(id: string) {
    const entry = PROFILE_ICON_LIBRARY.find((e) => e.id === id);
    if (entry) loadPreset(entry.grid);
  }

  // ── Actions rapides ───────────────────────────────────────────
  function loadPreset(g: BoolGrid) {
    grid = g.slice();
    dirty = true;
  }

  function clear() {
    grid = emptyGrid();
    dirty = true;
  }

  function invert() {
    grid = grid.map((p) => !p);
    dirty = true;
  }

  // ── Copy base64 ──────────────────────────────────────────────
  async function copyBase64() {
    await navigator.clipboard.writeText(currentBase64);
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }

  // ── Export PNG ────────────────────────────────────────────────
  function exportPng() {
    const scale = 8;
    const off = document.createElement('canvas');
    off.width = W * scale;
    off.height = H * scale;
    const ctx = off.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(gridToImageData(grid, scale), 0, 0);
    off.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'spinpad-icon.png';
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  // ── Import image ─────────────────────────────────────────────
  function importFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const off = document.createElement('canvas');
      off.width = img.width;
      off.height = img.height;
      const ctx = off.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      grid = imageDataToGrid(ctx.getImageData(0, 0, img.width, img.height), threshold);
      dirty = true;
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
    (e.target as HTMLInputElement).value = '';
  }
</script>

<div class="flex flex-col gap-3">
  <!-- ── Barre d'outils ── -->
  <div class="flex flex-wrap items-center gap-1">
    <ButtonGroup.Root>
      {#each TOOLS as t (t.id)}
        {@const isActive = tool === t.id}
        <Button title={t.label} variant={isActive ? 'default' : 'secondary'} onclick={() => (tool = t.id)}>
          <t.icon size={14} class={t?.fill ? 'fill-current' : ''} />
        </Button>
      {/each}
    </ButtonGroup.Root>

    <!-- Inverser -->
    <ButtonGroup.Root>
      <Button title="Inverser" variant="secondary" class="" onclick={invert}>
        <Contrast size={14} />
      </Button>

      <!-- Effacer -->
      <Button title="Effacer" variant="secondary" class="" onclick={clear}>
        <Trash2 size={14} />
      </Button>

      <!-- Reset -->
      <Button title="Discard changes" variant="secondary" disabled={!dirty} onclick={reset}>
        <RotateCcw size={14} />
      </Button>
    </ButtonGroup.Root>

    <!-- Save -->
    <Button title="Save" disabled={!dirty} onclick={save}>
      <Save size={14} />
    </Button>

    <span class="ml-2 text-[10px] text-muted-foreground"> left click: paint · right click: erase </span>
  </div>

  <!-- ── Zone de dessin + preview ── -->
  <div class="flex items-start gap-3">
    <!-- Canvas principal -->
    <canvas
      {@attach renderEditor}
      width={px}
      height={py}
      class="border rounded select-none cursor-crosshair border-border touch-none"
      style="image-rendering: pixelated;"
      onpointerdown={onPointerDown}
      onpointermove={onPointerMove}
      onpointerup={onPointerUp}
      onpointerleave={onPointerUp}
      oncontextmenu={(e) => e.preventDefault()}
    ></canvas>

    <!-- Full-size 24×24 preview -->
    <div class="flex flex-col items-center gap-1">
      <span class="text-[9px] text-muted-foreground">24×24</span>
      <canvas
        {@attach renderPreview}
        width={W}
        height={H}
        class="border rounded border-border"
        style="image-rendering: pixelated; width: {W}px; height: {H}px;"
      ></canvas>
    </div>
  </div>

  <!-- ── Presets ── -->
  <div class="flex flex-wrap items-center gap-2">
    <span class="text-xs text-muted-foreground">Presets:</span>
    <Select.Root type="single" name="icon-presets" value={selectedPreset} onValueChange={onPresetChange}>
      <Select.Trigger class="w-[180px]">
        {matchedPreset ? matchedPreset.label : 'Custom'}
      </Select.Trigger>
      <Select.Content>
        <Select.Group>
          <Select.Label>Presets</Select.Label>
          {#each PROFILE_ICON_LIBRARY as entry (entry.id)}
            <Select.Item value={entry.id} label={entry.label}>{entry.label}</Select.Item>
          {/each}
          {#if !matchedPreset}
            <Select.Item value={CUSTOM_ICON} label="Custom" disabled>Custom</Select.Item>
          {/if}
        </Select.Group>
      </Select.Content>
    </Select.Root>
  </div>

  <!-- ── Export / Import ── -->
  <div class="flex flex-wrap items-center gap-2">
    <Button title="Export PNG" onclick={exportPng}>
      <Download size={12} /> PNG
    </Button>
    <Button title="Import an image" onclick={() => fileInput?.click()}>
      <Upload size={12} /> Image
    </Button>
    <input bind:this={fileInput} type="file" accept="image/*" class="hidden" onchange={importFile} />

    <!-- Threshold import -->
    <div class="flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <span>Import threshold</span>
      <Slider type="single" min={0} max={255} step={1} bind:value={threshold} class="w-20" />
      <span class="w-6 text-right tabular-nums">{threshold}</span>
    </div>
  </div>

  <!-- ── Dev panel (collapsible) ── -->
  <details class="text-[10px] border border-dashed border-border rounded">
    <summary class="px-2 py-1 cursor-pointer select-none text-muted-foreground hover:text-foreground">
      Dev — update profile-icon-library.ts
    </summary>
    <div class="flex flex-col gap-2 p-2">
      <!-- ── base64 field ── -->
      <div class="flex items-center gap-2">
        <Input
          type="text"
          readonly
          value={currentBase64}
          class="flex-1 min-w-0 font-mono text-[10px] truncate text-muted-foreground"
          onclick={(e: Event) => (e.target as HTMLInputElement).select()}
        />
        <Button variant="outline" title="Copy the base64" onclick={copyBase64}>
          {#if copied}
            <Check size={14} class="text-green-500" />
          {:else}
            <Copy size={14} />
          {/if}
        </Button>
      </div>
      <p class="text-muted-foreground">
        Copy the line below to replace an entry in
        <code>profile-icon-library.ts</code>.
      </p>
      <pre
        class="bg-muted rounded p-2 text-[10px] font-mono overflow-x-auto whitespace-pre-wrap break-all select-all">entry('id', 'Label', '{currentBase64}'),</pre>
      <p class="text-muted-foreground">Raw base64:</p>
      <pre
        class="bg-muted rounded p-2 text-[10px] font-mono overflow-x-auto whitespace-pre-wrap break-all select-all">{currentBase64}</pre>
    </div>
  </details>
</div>
