<script lang="ts">
  // ───────────────────────────────────────────────────────────────
  //  ProfileForm — editing a profile draft (creation / tweak)
  //
  //  Edits a LOCAL copy of a ProfileConfig (name, icon, list of
  //  layers by their name) then emits the full profile via `onsubmit`.
  //  No store mutation until the user confirms:
  //  the caller commits via addProfile(draft). The keys stay at 0,
  //  assigned later in the main editor.
  // ───────────────────────────────────────────────────────────────
  import { Input } from '$shared/components/ui/input/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import { Label } from '$shared/components/ui/label/index.js';
  import * as InputGroup from '$shared/components/ui/input-group/index.js';
  import * as ColorPicker from '$shared/components/ui/color-picker/index.js';
  import * as Popover from '$shared/components/ui/popover/index.js';
  import * as Select from '$shared/components/ui/select/index.js';
  import { Switch } from '$shared/components/ui/switch/index.js';
  import IconEditor from '../../IconEditor.svelte';
  import Sortable from '../../Sortable.svelte';
  import { featureFlags } from '$shared/store/featureFlags.svelte.js';
  import {
    defaultProfile,
    defaultLayer,
    CONFIG_MAX_LAYERS,
    MIN_LAYERS,
    type ProfileConfig,
    type LayerConfig,
    type LedModeProfile,
  } from '$shared/constants/config-schema.js';
  import { hexToRgb, rgbToHex } from '$shared/lib/color.js';
  import { SyncedHexColor } from '$shared/lib/hooks/synced-hex-color.svelte.js';
  import { GripVertical, Plus, Trash2 } from '@lucide/svelte';
  import { untrack } from 'svelte';

  interface Props {
    initial?: ProfileConfig;
    submitLabel?: string;
    onsubmit: (profile: ProfileConfig) => void;
    oncancel?: () => void;
  }
  let { initial, submitLabel = 'Add', onsubmit, oncancel }: Props = $props();

  // Isolated local copy (snapshot → structuredClone: no proxy, no shared ref).
  let draft = $state<ProfileConfig>(
    structuredClone($state.snapshot(untrack(() => initial) ?? defaultProfile()) as ProfileConfig),
  );

  const canAddLayer = $derived(draft.layers.length < CONFIG_MAX_LAYERS);
  const canRemoveLayer = $derived(draft.layers.length > MIN_LAYERS);

  function addLayerRow() {
    if (!canAddLayer) return;
    draft.layers.push(defaultLayer(`Layer ${draft.layers.length + 1}`));
  }
  function removeLayerRow(i: number) {
    if (!canRemoveLayer) return;
    draft.layers.splice(i, 1);
  }
  function moveLayer(i: number, to: number) {
    if (to < 0 || to >= draft.layers.length) return;
    const [l] = draft.layers.splice(i, 1);
    draft.layers.splice(to, 0, l);
  }

  function submit() {
    if (!draft.name.trim()) draft.name = 'Profile';
    onsubmit($state.snapshot(draft) as ProfileConfig);
  }

  // ── Icon toggle (mirrors ProfileAppearanceSheet, but on the local draft) ──
  let iconCustomized = $state(!!draft.icon);

  function onIconToggle(v: boolean) {
    iconCustomized = v;
    if (!v) draft.icon = '';
  }

  // ── LED toggle (mirrors ProfileAppearanceSheet, but on the local draft) ──
  const LED_PROFILE_EFFECTS: { value: LedModeProfile; label: string }[] = [
    { value: 'off', label: 'Off' },
    { value: 'static', label: 'Static' },
    { value: 'breathe', label: 'Breathe' },
    { value: 'pulse', label: 'Pulse' },
  ];

  let ledCustomized = $state(!!draft.led);

  const selectedLed = $derived(draft.led?.effect ?? 'static');
  const selectedLedLabel = $derived(LED_PROFILE_EFFECTS.find((o) => o.value === selectedLed)?.label ?? 'Static');

  function onLedToggle(v: boolean) {
    ledCustomized = v;
    if (!v) draft.led = undefined;
    else if (!draft.led) draft.led = { r: 255, g: 255, b: 255, effect: 'static' };
  }

  function onLedModeChange(value: string) {
    if (value === 'off') {
      draft.led = { r: 0, g: 0, b: 0, effect: 'off' };
    } else {
      draft.led = {
        r: draft.led?.r ?? 255,
        g: draft.led?.g ?? 255,
        b: draft.led?.b ?? 255,
        effect: value as LedModeProfile,
      };
    }
  }

  const draftPickerColor = new SyncedHexColor(() =>
    draft.led ? rgbToHex(draft.led.r, draft.led.g, draft.led.b) : '#ffffff',
  );
  draftPickerColor.bind();
</script>

<div class="flex flex-col gap-4 px-4 py-2 overflow-y-auto">
  <div class="flex flex-col gap-1.5">
    <Label for="pf-name">Name</Label>
    <Input id="pf-name" bind:value={draft.name} placeholder="Profile name" maxlength={31} />
  </div>

  {#if featureFlags.profileIconEditing}
    <section class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-medium tracking-wide uppercase text-muted-foreground">Customize icon</h3>
        <Switch checked={iconCustomized} onCheckedChange={onIconToggle} />
      </div>
      {#if iconCustomized}
        <IconEditor value={draft.icon ?? ''} onchange={(b64) => (draft.icon = b64)} />
      {/if}
    </section>
  {/if}

  <section class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <h3 class="text-xs font-medium tracking-wide uppercase text-muted-foreground">Customize LED</h3>
      <Switch checked={ledCustomized} onCheckedChange={onLedToggle} />
    </div>

    {#if ledCustomized}
      <p class="text-xs text-muted-foreground">LED color and effect for this profile.</p>
      <div class="flex flex-row gap-2">
        <div class="flex items-center gap-3">
          <span class="text-sm">Mode</span>
          <Select.Root type="single" name="led-mode" value={selectedLed} onValueChange={onLedModeChange}>
            <Select.Trigger class="w-[180px]">
              {selectedLedLabel}
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                <Select.Label>Mode LED</Select.Label>
                {#each LED_PROFILE_EFFECTS as opt (opt.value)}
                  <Select.Item value={opt.value} label={opt.label}>{opt.label}</Select.Item>
                {/each}
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </div>
        {#if draft.led && draft.led.effect !== 'off'}
          <div class="flex items-center gap-3">
            <span class="text-sm">Color</span>
            <Popover.Root>
              <Popover.Trigger>
                {#snippet child({ props }: { props: Record<string, unknown> })}
                  <button
                    {...props}
                    class="w-8 h-8 border rounded-full shadow-sm cursor-pointer border-border"
                    style="background-color: {draftPickerColor.value}"
                    aria-label="Choose the LED color"
                  ></button>
                {/snippet}
              </Popover.Trigger>
              <Popover.Content class="w-auto p-0!">
                <ColorPicker.Root
                  formats={['hsl', 'hex']}
                  bind:value={draftPickerColor.value}
                  onchange={(color: string) => {
                    const rgb = hexToRgb(color);
                    if (rgb && draft.led) draft.led = { ...draft.led, ...rgb };
                  }}
                />
              </Popover.Content>
            </Popover.Root>
          </div>
        {/if}
      </div>
    {:else}
      <p class="text-xs text-muted-foreground">Inherits LED color and effect from global settings.</p>
    {/if}
  </section>

  <div class="flex flex-col gap-1.5">
    <div class="flex items-center justify-between">
      <Label>Layers ({draft.layers.length}/{CONFIG_MAX_LAYERS})</Label>
      <Button variant="outline" size="sm" disabled={!canAddLayer} onclick={addLayerRow} class="gap-1.5">
        <Plus class="size-4" /> Layer
      </Button>
    </div>
    <div class="flex flex-col gap-1.5">
      <Sortable
        items={draft.layers as LayerConfig[]}
        orientation="vertical"
        rowHeight="auto"
        gap={[0, 6]}
        getKey={(_l, i) => `pf-layer-${i}`}
        onReorder={moveLayer}
      >
        {#snippet children({ item: layer, index: i, handlePointerDown })}
          <InputGroup.Root>
            <InputGroup.Addon align="inline-start">
              <button
                type="button"
                class="flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab touch-none"
                title="Reorder"
                onpointerdown={handlePointerDown}
                onclick={(e) => e.preventDefault()}
              >
                <GripVertical class="size-3.5" />
              </button>
            </InputGroup.Addon>
            <InputGroup.Input bind:value={layer.name} placeholder={`Layer ${i + 1}`} />
            <InputGroup.Addon align="inline-end">
              <Button
                variant="ghost"
                size="icon"
                class="size-6 text-destructive"
                title="Delete the layer"
                disabled={!canRemoveLayer}
                onclick={() => removeLayerRow(i)}
              >
                <Trash2 class="size-3.5" />
              </Button>
            </InputGroup.Addon>
          </InputGroup.Root>
        {/snippet}
      </Sortable>
    </div>
    <p class="text-xs text-muted-foreground">The keys are assigned afterwards in the editor.</p>
  </div>

  <div class="flex justify-end gap-2 pt-2">
    {#if oncancel}
      <Button variant="secondary" onclick={oncancel}>Cancel</Button>
    {/if}
    <Button onclick={submit}>{submitLabel}</Button>
  </div>
</div>
