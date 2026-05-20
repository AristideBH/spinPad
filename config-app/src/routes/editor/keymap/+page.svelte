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

  const profile = $derived(
    configState.data?.profiles?.[configState.activeProfileIndex],
  );
  const layer = $derived(profile?.layers?.[configState.activeLayerIndex]);

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
      <Select
        value={String(configState.activeProfileIndex)}
        onValueChange={(v) => {
          configState.activeProfileIndex = +v;
        }}
      >
        <SelectTrigger class="w-40">
          {configState.data.profiles[configState.activeProfileIndex]?.name ??
            "Profil"}
        </SelectTrigger>
        <SelectContent>
          {#each configState.data.profiles as prof, i}
            <SelectItem value={String(i)}>{prof.name}</SelectItem>
          {/each}
        </SelectContent>
      </Select>
    </div>

    {#if profile}
      <div class="flex flex-col gap-1.5">
        <Label>Layer</Label>
        <Select
          value={String(configState.activeLayerIndex)}
          onValueChange={(v) => {
            configState.activeLayerIndex = +v;
          }}
        >
          <SelectTrigger class="w-36">
            {profile?.layers[configState.activeLayerIndex]?.name ?? "Layer"}
          </SelectTrigger>
          <SelectContent>
            {#each profile.layers as l, i}
              <SelectItem value={String(i)}>{l.name}</SelectItem>
            {/each}
          </SelectContent>
        </Select>
      </div>
    {/if}
  </div>

  {#if layer}
    <!-- Key grid 5×4 -->
    <div class="grid grid-cols-5 gap-1.5 max-w-xs mb-6">
      {#each layer.keys as keyValue, idx}
        <button
          class={cn(
            "aspect-square rounded-md border text-[10px] font-semibold transition-all flex flex-col items-center justify-center gap-0.5 p-1 cursor-pointer hover:border-primary/50",
            editingKey === idx && editingField === "key"
              ? "border-primary bg-primary/20"
              : "  bg-card",
          )}
          onclick={() => openKeyPicker(idx)}
        >
          <span class="text-[8px] text-muted-foreground">SW{idx + 1}</span>
          <span class="leading-none">{getKeycodeLabel(keyValue)}</span>
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
