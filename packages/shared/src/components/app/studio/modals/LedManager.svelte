<script lang="ts">
  import { ResponsiveSheet } from '$shared/components/ui/responsive-sheet/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import { Label } from '$shared/components/ui/label/index.js';
  import { Input } from '$shared/components/ui/input/index.js';
  import { Switch } from '$shared/components/ui/switch/index.js';
  import { Lightbulb } from '@lucide/svelte';
  import LedMatrix from '$shared/components/app/studio/dashboard/led-matrix.svelte';
  import OptionGrid from '$shared/components/app/studio/settings/OptionGrid.svelte';
  import SliderField from '$shared/components/app/studio/settings/SliderField.svelte';
  import SettingsField from '$shared/components/app/studio/settings/SettingsField.svelte';
  import SaveBadge from '$shared/components/app/studio/SaveBadge.svelte';
  import { configState, updateConfig } from '$shared/store/config.svelte.js';
  import { type LedMode, GRADIENT_PRESETS } from '$shared/constants/config-schema.js';
  import * as Popover from '$shared/components/ui/popover/index.js';
  import * as ColorPicker from '$shared/components/ui/color-picker/index.js';
  import * as NumberField from '$shared/components/ui/number-field';
  import { Scrubber } from '$shared/components/ui/scrubber';
  import * as Card from '$shared/components/ui/card/index.js';
  import { hexToRgb, rgbToHex } from '$shared/lib/color.js';
  import { SyncedHexColor } from '$shared/lib/hooks/synced-hex-color.svelte.js';

  let open = $state(false);

  const data = $derived(configState.data);
  const ledKey = $derived(data?.led_key);
  const ledExt = $derived(data?.led_extension);

  const ledEffect: LedMode = $derived(ledKey?.effect ?? 'static');
  const hexColor = $derived(rgbToHex(ledKey?.r ?? 255, ledKey?.g ?? 255, ledKey?.b ?? 255));

  // Sync store → picker (e.g., preset applied externally)
  const pickerColor = new SyncedHexColor(() => hexColor);
  pickerColor.bind();

  let extLedCount = $state(configState.data?.led_extension?.count ?? 1);

  $effect(() => {
    extLedCount = ledExt?.count ?? 1;
  });

  $effect(() => {
    if (extLedCount !== (ledExt?.count ?? 1)) {
      updateConfig('led_extension.count', extLedCount);
    }
  });

  const ledExtEnabled = $derived(ledExt?.enabled ?? false);
  const ledExtMode = $derived(ledExt?.mode ?? 0);

  const extLedPickerColor = new SyncedHexColor(() => rgbToHex(ledExt?.r ?? 255, ledExt?.g ?? 255, ledExt?.b ?? 255));
  extLedPickerColor.bind();

  // Local values for the sliders (buffer during the drag)
  let localBrightness = $state(180);
  let localExtBright = $state(128);
  $effect(() => {
    localBrightness = ledKey?.brightness ?? 180;
  });
  $effect(() => {
    localExtBright = ledExt?.brightness ?? 128;
  });

  const KEY_EFFECTS: { value: LedMode; label: string; desc: string }[] = [
    { value: 'off', label: 'Off', desc: 'LEDs off' },
    { value: 'static', label: 'Static', desc: 'Fixed color' },
    { value: 'breathe', label: 'Breathe', desc: 'Slow pulse' },
    { value: 'pulse', label: 'Pulse', desc: 'Double beat' },
    { value: 'flow', label: 'Flow', desc: 'Horizontal wave' },
    { value: 'sweep', label: 'Sweep', desc: 'Traveling band' },
    { value: 'alert', label: 'Alert', desc: 'Strobe' },
    { value: 'rainbow', label: 'Rainbow', desc: 'HSL gradient' },
  ];

  const EXT_MODES = [
    { value: 0, label: 'Off', desc: 'LEDs off' },
    { value: 1, label: 'Mirror', desc: 'Mirrors the keys' },
    { value: 2, label: 'Ambient', desc: 'Gentle breathing' },
    { value: 3, label: 'Static', desc: 'Fixed color' },
    { value: 4, label: 'Reactive', desc: 'Flash on press' },
    { value: 5, label: 'Hyperion', desc: 'External frame' },
  ];

  const isGradientEffect = $derived(ledEffect === 'flow' || ledEffect === 'sweep' || ledEffect === 'rainbow');
  const selectedPreset = $derived(ledKey?.gradient_preset ?? 0);

  const matrixColors: string[] = $derived.by(() => {
    if (ledEffect === 'rainbow') return ['#34d399', '#22d3ee', '#3b82f6', '#34d399'];
    if (ledEffect === 'flow' || ledEffect === 'sweep') {
      return [...(GRADIENT_PRESETS[selectedPreset]?.colors ?? GRADIENT_PRESETS[0].colors)];
    }
    return [hexColor];
  });
  const matrixColorMode: 'solid' | 'gradient' = $derived(isGradientEffect ? 'gradient' : 'solid');
</script>

<Button variant="outline" class="gap-1.5" title="LED control" onclick={() => (open = true)}>
  <Lightbulb class="size-4" /> Lights
</Button>

<ResponsiveSheet
  bind:open
  title="Lights control"
  description="Global effects, per-profile colors and LED extension."
  srOnlyTitle={false}
  desktopClass="w-full max-w-md!"
>
  {#snippet badge()}
    <SaveBadge class="ms-auto" />
  {/snippet}

  <div class="w-full h-full max-w-md px-4 pt-4 pb-8 mx-auto space-y-6 overflow-y-auto">
    <!-- Animated preview -->
    <div class="w-full border overflow-clip h-42 aspect-video rounded-xl border-border">
      <LedMatrix
        mode={ledEffect}
        color={matrixColorMode}
        colors={matrixColors}
        brightness={0.9}
        cell={8}
        dotRatio={0.6}
        speed={0.6}
        falloff="none"
        class="w-full pointer-events-none aspect-video"
      />
    </div>

    <!-- ── Key LEDs ────────────────────────────────────────────── -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Key LEDs</Card.Title>
      </Card.Header>

      <Card.Content class="flex flex-col gap-5">
        <div>
          <Label class="block mb-3 text-sm">Effect</Label>
          <OptionGrid
            options={KEY_EFFECTS}
            value={ledEffect}
            onSelect={(v) => updateConfig('led_key.effect', v)}
            gridClass="grid grid-cols-4 gap-2"
            buttonClass="flex flex-col gap-0.5 px-2 py-2 text-left"
          >
            {#snippet item(m)}
              <span class="text-xs font-medium leading-tight">{m.label}</span>
              <span class="text-[10px] leading-snug text-muted-foreground">{m.desc}</span>
            {/snippet}
          </OptionGrid>
        </div>

        {#if ledEffect !== 'off'}
          <div class="flex flex-col gap-1.5">
            <Label class="block mb-1.5 text-sm">Brightness</Label>
            <Scrubber
              bind:value={localBrightness}
              min={0}
              max={255}
              step={25.5}
              tickStep={1}
              percentage
              decimals={0}
              onCommit={() => updateConfig('led_key.brightness', localBrightness)}
            />
          </div>
        {/if}

        {#if ledEffect === 'flow' || ledEffect === 'sweep'}
          <div>
            <Label class="block mb-3 text-sm">Gradient palette</Label>
            <div class="grid grid-cols-2 gap-2">
              {#each GRADIENT_PRESETS as preset, i (i)}
                <button
                  type="button"
                  class={[
                    'border rounded-lg px-3 py-2 text-left text-xs transition-colors',
                    selectedPreset === i
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border hover:border-primary/50',
                  ].join(' ')}
                  onclick={() => updateConfig('led_key.gradient_preset', i)}
                >
                  <div
                    class="h-3 rounded mb-1.5"
                    style="background:linear-gradient(90deg,{preset.colors.join(',')})"
                  ></div>
                  <span>{preset.label}</span>
                </button>
              {/each}
            </div>
          </div>
        {:else if ledEffect !== 'rainbow' && ledEffect !== 'off'}
          <SettingsField label="Color" description="Global default color of the keys">
            <Popover.Root>
              <Popover.Trigger>
                {#snippet child({ props })}
                  <Button
                    {...props}
                    variant="outline"
                    size="icon"
                    class="bg-(--bg)! rounded-full"
                    style="--bg: {pickerColor.value}"
                  ></Button>
                {/snippet}
              </Popover.Trigger>
              <Popover.Content class="w-auto p-0!">
                <ColorPicker.Root
                  bind:value={pickerColor.value}
                  onchange={(color) => {
                    const rgb = hexToRgb(color);
                    if (rgb) {
                      updateConfig('led_key.r', rgb.r);
                      updateConfig('led_key.g', rgb.g);
                      updateConfig('led_key.b', rgb.b);
                    }
                  }}
                />
              </Popover.Content>
            </Popover.Root>
          </SettingsField>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- ── LED Extension ──────────────────────────────────────── -->
    <Card.Root>
      <Card.Header>
        <Card.Title>LED Extension</Card.Title>
      </Card.Header>

      <Card.Content class="flex flex-col gap-5">
        <SettingsField label="Enable the extension" description="WS2812 LEDs on the PCB's extension connector">
          <Switch checked={ledExtEnabled} onCheckedChange={(v: boolean) => updateConfig('led_extension.enabled', v)} />
        </SettingsField>

        {#if ledExtEnabled}
          <SettingsField label="Nombre de LEDs" description="1–50 LEDs WS2812">
            <NumberField.Root min={1} max={50} bind:value={extLedCount}>
              <NumberField.Group>
                <NumberField.Decrement />
                <NumberField.Input class="w-20" />
                <NumberField.Increment />
              </NumberField.Group>
            </NumberField.Root>
          </SettingsField>

          <div>
            <Label class="block mb-3 text-sm">Lighting mode</Label>
            <OptionGrid
              options={EXT_MODES}
              value={ledExtMode}
              onSelect={(v) => updateConfig('led_extension.mode', v)}
              gridClass="grid grid-cols-2 gap-2"
              buttonClass="flex flex-col gap-0.5 px-3 py-2.5 text-left"
            >
              {#snippet item(m)}
                <span class="text-sm font-medium">{m.label}</span>
                <span class="text-xs leading-snug text-muted-foreground">{m.desc}</span>
              {/snippet}
            </OptionGrid>
          </div>

          {#if ledExtMode !== 1 && ledExtMode !== 5}
            <SettingsField label="Color" description={ledExtMode === 4 ? 'Reactive flash color' : 'Base color'}>
              <Popover.Root>
                <Popover.Trigger>
                  {#snippet child({ props })}
                    <button
                      {...props}
                      class="w-8 h-8 border rounded-full shadow-sm cursor-pointer border-border"
                      style="background-color: {extLedPickerColor.value}"
                    ></button>
                  {/snippet}
                </Popover.Trigger>
                <Popover.Content class="w-auto p-0!">
                  <ColorPicker.Root
                    formats={['hsl', 'hex']}
                    bind:value={extLedPickerColor.value}
                    onchange={(color) => {
                      const rgb = hexToRgb(color);
                      if (rgb) {
                        updateConfig('led_extension.r', rgb.r);
                        updateConfig('led_extension.g', rgb.g);
                        updateConfig('led_extension.b', rgb.b);
                      }
                    }}
                  />
                </Popover.Content>
              </Popover.Root>
            </SettingsField>
          {/if}
          <div class="flex flex-col gap-1.5">
            <Label class="block mb-1.5 text-sm">Extension brightness</Label>
            <Scrubber
              bind:value={localExtBright}
              min={0}
              max={255}
              step={25.5}
              tickStep={1}
              percentage
              decimals={0}
              onCommit={() => updateConfig('led_key.brightness', localExtBright)}
            />
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
</ResponsiveSheet>
