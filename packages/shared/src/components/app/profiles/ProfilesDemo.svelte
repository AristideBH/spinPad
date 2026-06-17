<script lang="ts">
  import {
    configState,
    loadConfig,
    addProfile,
    deleteProfile,
    editProfile,
    addLayer,
    deleteLayer,
    editLayer,
    setProfileIcon,
  } from '$shared/store/config.svelte.js';
  import { serial, connect, disconnect } from '$shared/store/serial.svelte.js';
  import { listProfilePresets, type ProfilePreset } from '$shared/constants/profile-presets.js';
  import { CONFIG_MAX_PROFILES, CONFIG_MAX_LAYERS } from '$shared/constants/config-schema.js';
  import IconPreview from '../studio/IconPreview.svelte';
  import IconEditor from '../studio/IconEditor.svelte';
  import { Input } from '$shared/components/ui/input/index.js';

  // ── Presets disponibles (builtin + futures sources) ──
  let presets = $state<ProfilePreset[]>([]);
  $effect(() => {
    listProfilePresets().then((p) => (presets = p));
  });

  let showPresetPicker = $state(false);

  const data = $derived(configState.data);
  const profiles = $derived(data?.profiles ?? []);
  const activeIdx = $derived(configState.activeProfileIndex);
  const activeProfile = $derived(profiles[activeIdx]);

  function selectProfile(i: number) {
    configState.activeProfileIndex = i;
    configState.activeLayerIndex = 0;
  }

  function addFromPreset(preset?: ProfilePreset) {
    addProfile(preset?.profile);
    showPresetPicker = false;
  }
</script>

<div class="flex flex-col max-w-3xl gap-6 p-6 mx-auto">
  <header class="flex flex-wrap items-center gap-3">
    <h1 class="text-lg font-semibold">Demo — Profiles &amp; Layers</h1>
    <span class="px-2 py-0.5 rounded text-xs border border-border text-muted-foreground">
      transport: {configState.transportMode}
    </span>
    <div class="flex items-center gap-2 ml-auto">
      {#if serial.connected}
        <span class="text-xs text-emerald-400">● connected</span>
        <button class="px-2 py-1 text-xs border rounded border-border" onclick={() => disconnect()}>
          Disconnect
        </button>
      {:else}
        <button class="px-2 py-1 text-xs border rounded border-border" onclick={() => connect()}>
          Connect (USB)
        </button>
      {/if}
      <button
        class="px-2 py-1 text-xs border rounded border-border"
        onclick={() => loadConfig()}
        disabled={configState.isLoading}
      >
        {configState.isLoading ? 'Loading…' : 'Load the config'}
      </button>
    </div>
  </header>

  <!-- State -->
  <div class="flex gap-3 text-xs text-muted-foreground">
    <span>isDirty: <b class:text-amber-400={configState.isDirty}>{configState.isDirty}</b></span>
    <span>isSaving: {configState.isSaving}</span>
    {#if configState.loadError}<span class="text-destructive">err: {configState.loadError}</span>{/if}
  </div>

  {#if !data}
    <p class="text-sm text-muted-foreground">
      No config loaded. Click "Load the config" (mock mode via
      <code>VITE_DEV_MODE=true</code>, ou connecte un device).
    </p>
  {:else}
    <!-- ── Profiles ───────────────────────────────────── -->
    <!-- <section class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-medium">Profiles ({profiles.length}/{CONFIG_MAX_PROFILES})</h2>
        <div class="relative">
          <button
            class="px-2 py-1 text-xs border rounded border-border disabled:opacity-40"
            disabled={profiles.length >= CONFIG_MAX_PROFILES}
            onclick={() => (showPresetPicker = !showPresetPicker)}
          >
            + Add
          </button>
          {#if showPresetPicker}
            <div
              class="absolute right-0 z-10 flex flex-col gap-1 p-2 mt-1 border rounded shadow-lg w-60 border-border bg-background"
            >
              <button
                class="flex items-center gap-2 px-2 py-1 text-xs text-left rounded hover:bg-accent"
                onclick={() => addFromPreset()}
              >
                <span class="font-medium">Start from scratch</span>
              </button>
              <div class="my-1 border-t border-border"></div>
              {#each presets as preset (preset.id)}
                <button
                  class="flex items-center gap-2 px-2 py-1 text-left rounded hover:bg-accent"
                  onclick={() => addFromPreset(preset)}
                >
                  <IconPreview value={preset.icon ?? ""} size={28} />
                  <span class="flex flex-col">
                    <span class="text-xs font-medium">{preset.label}</span>
                    {#if preset.description}
                      <span class="text-[10px] text-muted-foreground">{preset.description}</span>
                    {/if}
                  </span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      {#each profiles as profile, i (i)}
        <div
          class="flex items-center gap-3 p-2 border rounded border-border {i === activeIdx
            ? 'ring-1 ring-primary'
            : ''}"
        >
          <button onclick={() => selectProfile(i)} title="Select">
            <IconPreview value={profile.icon ?? ""} size={40} />
          </button>
          <Input
            class="w-auto"
            value={profile.name}
            onchange={(e: Event) => editProfile(i, { name: (e.target as HTMLInputElement).value })}
          />
          <span class="text-xs text-muted-foreground">{profile.layers.length} layer(s)</span>
          <div class="flex gap-1 ml-auto">
            <button
              class="px-1.5 py-0.5 text-xs border rounded border-border disabled:opacity-30"
              disabled={i === 0}
              onclick={() => editProfile(i, { moveTo: i - 1 })}>↑</button
            >
            <button
              class="px-1.5 py-0.5 text-xs border rounded border-border disabled:opacity-30"
              disabled={i === profiles.length - 1}
              onclick={() => editProfile(i, { moveTo: i + 1 })}>↓</button
            >
            <button
              class="px-1.5 py-0.5 text-xs border rounded border-border hover:text-destructive disabled:opacity-30"
              disabled={profiles.length <= 1}
              onclick={() => deleteProfile(i)}>✕</button
            >
          </div>
        </div>
      {/each}
    </section> -->

    <!-- ── Layers of the selected profile ──────────────── -->
    {#if activeProfile}
      <!-- <section class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-medium">
            Layers of "{activeProfile.name}" ({activeProfile.layers.length}/{CONFIG_MAX_LAYERS})
          </h2>
          <button
            class="px-2 py-1 text-xs border rounded border-border disabled:opacity-40"
            disabled={activeProfile.layers.length >= CONFIG_MAX_LAYERS}
            onclick={() => addLayer(activeIdx)}
          >
            + Layer
          </button>
        </div>

        {#each activeProfile.layers as layer, li (li)}
          <div class="flex items-center gap-2 p-2 border rounded border-border">
            <span class="font-mono text-xs text-muted-foreground">L{li}</span>
            <Input
              class="w-auto"
              value={layer.name ?? ''}
              onchange={(e: Event) => editLayer(activeIdx, li, { name: (e.target as HTMLInputElement).value })}
            />
            <div class="flex gap-1 ml-auto">
              <button
                class="px-1.5 py-0.5 text-xs border rounded border-border disabled:opacity-30"
                disabled={li === 0}
                onclick={() => editLayer(activeIdx, li, { moveTo: li - 1 })}>↑</button
              >
              <button
                class="px-1.5 py-0.5 text-xs border rounded border-border disabled:opacity-30"
                disabled={li === activeProfile.layers.length - 1}
                onclick={() => editLayer(activeIdx, li, { moveTo: li + 1 })}>↓</button
              >
              <button
                class="px-1.5 py-0.5 text-xs border rounded border-border hover:text-destructive disabled:opacity-30"
                disabled={activeProfile.layers.length <= 1}
                onclick={() => deleteLayer(activeIdx, li)}>✕</button
              >
            </div>
          </div>
        {/each}
      </section> -->

      <!-- ── Icon editor ───────────────────────────────── -->
      <section class="flex flex-col gap-2">
        <h2 class="text-sm font-medium">Icon of "{activeProfile.name}"</h2>
        <IconEditor value={activeProfile.icon ?? ''} onchange={(b64) => setProfileIcon(activeIdx, b64)} />
      </section>
    {/if}

    <!-- ── Raw JSON (data-flow proof) ──────────────────── -->
    <!-- <section class="flex flex-col gap-2">
      <h2 class="text-sm font-medium">configState.data (JSON)</h2>
      <pre class="p-3 overflow-auto text-xs border rounded max-h-80 border-border bg-muted/30">{JSON.stringify(
          data,
          null,
          2,
        )}</pre>
    </section> -->
  {/if}
</div>
