<script>
  import {
    configState,
    setKeyAction,
    setEncoderAction,
  } from "$lib/store/config.svelte.js";
  import { APP_CONFIG } from "$lib/app.config.js";
  import {
    KEYCODES,
    KEYCODES_FLAT,
    getKeycodeLabel,
  } from "$lib/keycodes/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { cn } from "$lib/utils.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "$lib/components/ui/dialog/index.js";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
  } from "$lib/components/ui/select/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import NotConnected from "$lib/components/app/NotConnected.svelte";

  let editingKey = $state(null);
  let editingField = $state(null);
  let searchQuery = $state("");
  let pickerOpen = $state(false);

  // Local string state bound to the Select components (bits-ui requires strings)
  let profileValue = $state(String(configState.activeProfileIndex));
  let layerValue   = $state(String(configState.activeLayerIndex));

  // Sync profile selector → store; reset layer whenever profile changes
  $effect(() => {
    configState.activeProfileIndex = +profileValue;
    layerValue = "0";
    configState.activeLayerIndex = 0;
  });

  // Sync layer selector → store
  $effect(() => {
    configState.activeLayerIndex = +layerValue;
  });

  const profile = $derived(
    configState.data?.profiles?.[configState.activeProfileIndex],
  );
  const layer = $derived(profile?.layers?.[configState.activeLayerIndex]);

  const profileLabel = $derived(profile?.name ?? "Profil");
  const layerLabel   = $derived(layer?.name   ?? "Layer");

  const filteredKeycodes = $derived(
    searchQuery
      ? KEYCODES_FLAT.filter((k) =>
          k.label.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : null,
  );

  function openKeyPicker(keyIndex) {
    editingKey = keyIndex;
    editingField = "key";
    searchQuery = "";
    pickerOpen = true;
  }

  function openEncoderPicker(field) {
    editingKey = null;
    editingField = field;
    searchQuery = "";
    pickerOpen = true;
  }

  function selectKeycode(kc) {
    if (editingField === "key" && editingKey !== null) {
      setKeyAction(
        configState.activeProfileIndex,
        configState.activeLayerIndex,
        editingKey,
        kc.value,
      );
    } else if (editingField === "encoder_cw") {
      setEncoderAction(
        configState.activeProfileIndex,
        configState.activeLayerIndex,
        "cw",
        kc.value,
      );
    } else if (editingField === "encoder_ccw") {
      setEncoderAction(
        configState.activeProfileIndex,
        configState.activeLayerIndex,
        "ccw",
        kc.value,
      );
    } else if (editingField === "encoder_press") {
      setEncoderAction(
        configState.activeProfileIndex,
        configState.activeLayerIndex,
        "press",
        kc.value,
      );
    }
    pickerOpen = false;
  }

  const CATEGORY_COLORS = {
    letter: "bg-blue-950/80 hover:bg-blue-900/80",
    special: "bg-slate-800/80 hover:bg-slate-700/80",
    modifier: "bg-violet-950/80 hover:bg-violet-900/80",
    layer: "bg-green-950/80 hover:bg-green-900/80",
    media: "bg-orange-950/80 hover:bg-orange-900/80",
    firmware: "bg-purple-950/80 hover:bg-purple-900/80",
  };

  // Physical key layout — 4 rows × 3 cols, 10 switches (X-mirrored).
  // Row/col are 1-indexed CSS grid coordinates.
  // SW1: horizontal 2u — spans col 2+3, top row (right side).
  // SW8: col 1, top row (left).
  // SW10: vertical 2u — spans row 3+4, col 1 (left).
  // Visual:
  //   [ SW8 ] [ SW1  (2u wide)  ]
  //   [ SW9 ] [ SW7 ] [ SW2 ]
  //   [ SW10 (2u tall) ] [ SW6 ] [ SW3 ]
  //   [               ] [ SW5 ] [ SW4 ]
  const KEY_LAYOUT = [
    { sw: "SW8",  idx: 1, row: 1, col: 1, rowSpan: 1, colSpan: 1 },
    { sw: "SW1",  idx: 0, row: 1, col: 2, rowSpan: 1, colSpan: 2 },
    { sw: "SW9",  idx: 4, row: 2, col: 1, rowSpan: 1, colSpan: 1 },
    { sw: "SW7",  idx: 3, row: 2, col: 2, rowSpan: 1, colSpan: 1 },
    { sw: "SW2",  idx: 2, row: 2, col: 3, rowSpan: 1, colSpan: 1 },
    { sw: "SW10", idx: 7, row: 3, col: 1, rowSpan: 2, colSpan: 1 },
    { sw: "SW6",  idx: 6, row: 3, col: 2, rowSpan: 1, colSpan: 1 },
    { sw: "SW3",  idx: 5, row: 3, col: 3, rowSpan: 1, colSpan: 1 },
    { sw: "SW5",  idx: 9, row: 4, col: 2, rowSpan: 1, colSpan: 1 },
    { sw: "SW4",  idx: 8, row: 4, col: 3, rowSpan: 1, colSpan: 1 },
  ];
</script>

<svelte:head>
  <title>Keymap — {APP_CONFIG.name}</title>
</svelte:head>

<h2 class="text-xl font-bold mb-6">Keymap</h2>

{#if !configState.data}
  <NotConnected />
{:else}
  <!-- Toolbar -->
  <div class="flex flex-wrap gap-4 mb-6 items-end">
    <div class="flex flex-col gap-1.5">
      <Label>Profil</Label>
      <Select type="single" bind:value={profileValue}>
        <SelectTrigger class="w-40">{profileLabel}</SelectTrigger>
        <SelectContent>
          {#each configState.data.profiles as prof, i}
            <SelectItem value={String(i)} label={prof.name} />
          {/each}
        </SelectContent>
      </Select>
    </div>

    {#if profile}
      <div class="flex flex-col gap-1.5">
        <Label>Layer</Label>
        <Select type="single" bind:value={layerValue}>
          <SelectTrigger class="w-36">{layerLabel}</SelectTrigger>
          <SelectContent>
            {#each profile.layers as l, i}
              <SelectItem value={String(i)} label={l.name} />
            {/each}
          </SelectContent>
        </Select>
      </div>
    {/if}
  </div>

  {#if layer}
    <!-- Custom key layout: 4 rows × 3 cols, SW1 and SW10 are 2u tall -->
    <div
      class="inline-grid gap-1.5 mb-6"
      style="grid-template-rows: repeat(4, 2.75rem); grid-template-columns: repeat(3, 2.75rem);"
    >
      {#each KEY_LAYOUT as key}
        <button
          style="grid-row: {key.row} / span {key.rowSpan}; grid-column: {key.col} / span {key.colSpan};"
          class={cn(
            "rounded-md border text-[10px] font-semibold transition-all flex flex-col items-center justify-center gap-0.5 p-1 cursor-pointer hover:border-primary/50",
            editingKey === key.idx && editingField === "key"
              ? "border-primary bg-primary/20"
              : "bg-card",
          )}
          onclick={() => openKeyPicker(key.idx)}
        >
          <span class="text-[8px] text-muted-foreground">{key.sw}</span>
          <span class="leading-none"
            >{getKeycodeLabel(layer.keys[key.idx] ?? 0)}</span
          >
          {#if key.rowSpan === 2 || key.colSpan === 2}
            <span class="text-[7px] text-muted-foreground/50">2u</span>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Encodeur -->
    <div class="mb-6">
      <p class="text-sm text-muted-foreground mb-2 font-medium">Encodeur</p>
      <div class="flex gap-2">
        {#each [{ field: "encoder_cw", label: "↻ CW", value: layer.encoder?.cw ?? 0 }, { field: "encoder_ccw", label: "↺ CCW", value: layer.encoder?.ccw ?? 0 }, { field: "encoder_press", label: "● Press", value: layer.encoder?.press ?? 0 }] as enc}
          <button
            class={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 rounded-md border text-sm transition-all cursor-pointer hover:border-violet-500/50",
              editingField === enc.field
                ? "border-violet-500 bg-violet-950/40"
                : "  bg-card",
            )}
            onclick={() => openEncoderPicker(enc.field)}
          >
            <span class="text-[10px] text-muted-foreground">{enc.label}</span>
            <span class="font-semibold">{getKeycodeLabel(enc.value)}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Keycode Picker Dialog -->
  <Dialog bind:open={pickerOpen}>
    <DialogContent class="max-w-lg max-h-[80vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Choisir une action</DialogTitle>
      </DialogHeader>

      <Input
        type="text"
        placeholder="Rechercher un keycode..."
        bind:value={searchQuery}
        autofocus
        class="shrink-0"
      />

      <div class="overflow-y-auto flex-1 pr-1 mt-2">
        {#if filteredKeycodes}
          <div class="flex flex-wrap gap-1.5">
            {#each filteredKeycodes as kc}
              <button
                class="px-2.5 py-1 rounded text-xs font-semibold border cursor-pointer transition-all hover:border-primary {CATEGORY_COLORS[
                  kc.category
                ] ?? 'bg-card'}"
                onclick={() => selectKeycode(kc)}>{kc.label}</button
              >
            {/each}
          </div>
        {:else}
          {#each Object.entries(KEYCODES) as [cat, keys]}
            <div class="mb-4">
              <p
                class="text-[10px] uppercase tracking-widest text-muted-foreground mb-2"
              >
                {cat}
              </p>
              <div class="flex flex-wrap gap-1.5">
                {#each keys as kc}
                  <button
                    class="px-2.5 py-1 rounded text-xs font-semibold border cursor-pointer transition-all hover:border-primary {CATEGORY_COLORS[
                      kc.category
                    ] ?? 'bg-card'}"
                    onclick={() => selectKeycode(kc)}>{kc.label}</button
                  >
                {/each}
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </DialogContent>
  </Dialog>
{/if}
