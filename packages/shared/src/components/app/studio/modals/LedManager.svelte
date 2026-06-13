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

  let open = $state(false);

  const data = $derived(configState.data);
  const ledKey = $derived(data?.led_key);
  const ledExt = $derived(data?.led_extension);

  const ledEffect: LedMode = $derived(ledKey?.effect ?? 'static');
  const hexColor = $derived(rgbToHex(ledKey?.r ?? 255, ledKey?.g ?? 255, ledKey?.b ?? 255));

  let pickerColor = $state(
    rgbToHex(
      configState.data?.led_key?.r ?? 255,
      configState.data?.led_key?.g ?? 255,
      configState.data?.led_key?.b ?? 255,
    ).toUpperCase(),
  );

  let extLedCount = $state(configState.data?.led_extension?.count ?? 1);

  $effect(() => {
    extLedCount = ledExt?.count ?? 1;
  });

  $effect(() => {
    if (extLedCount !== (ledExt?.count ?? 1)) {
      updateConfig('led_extension.count', extLedCount);
    }
  });

  // Sync store → picker (e.g., preset applied externally)
  $effect(() => {
    const normalized = hexColor.toUpperCase();
    if (pickerColor !== normalized) pickerColor = normalized;
  });

  const ledExtEnabled = $derived(ledExt?.enabled ?? false);
  const ledExtMode = $derived(ledExt?.mode ?? 0);

  let extLedPickerColor = $state(
    rgbToHex(
      configState.data?.led_extension?.r ?? 255,
      configState.data?.led_extension?.g ?? 255,
      configState.data?.led_extension?.b ?? 255,
    ).toUpperCase(),
  );
  $effect(() => {
    const normalized = rgbToHex(ledExt?.r ?? 255, ledExt?.g ?? 255, ledExt?.b ?? 255).toUpperCase();
    if (extLedPickerColor !== normalized) extLedPickerColor = normalized;
  });

  // Valeurs locales pour les sliders (buffer pendant le drag)
  let localBrightness = $state(180);
  let localExtBright = $state(128);
  $effect(() => {
    localBrightness = ledKey?.brightness ?? 180;
  });
  $effect(() => {
    localExtBright = ledExt?.brightness ?? 128;
  });

  function rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  }

  function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const m = hex.match(/^#?([0-9a-f]{6})$/i);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
  }

  const KEY_EFFECTS: { value: LedMode; label: string; desc: string }[] = [
    { value: 'off', label: 'Éteint', desc: 'LEDs éteintes' },
    { value: 'static', label: 'Statique', desc: 'Couleur fixe' },
    { value: 'breathe', label: 'Respiration', desc: 'Pulsation lente' },
    { value: 'pulse', label: 'Pulsation', desc: 'Double battement' },
    { value: 'flow', label: 'Flux', desc: 'Vague horizontale' },
    { value: 'sweep', label: 'Balayage', desc: 'Bande voyageuse' },
    { value: 'alert', label: 'Alerte', desc: 'Stroboscopique' },
    { value: 'rainbow', label: 'Arc-en-ciel', desc: 'Gradient HSL' },
  ];

  const EXT_MODES = [
    { value: 0, label: 'Éteint', desc: 'LEDs éteintes' },
    { value: 1, label: 'Mirror', desc: 'Copie les touches' },
    { value: 2, label: 'Ambient', desc: 'Respiration douce' },
    { value: 3, label: 'Statique', desc: 'Couleur fixe' },
    { value: 4, label: 'Réactif', desc: 'Flash sur pression' },
    { value: 5, label: 'Hyperion', desc: 'Frame externe' },
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

<Button variant="outline" class="gap-1.5" title="Contrôle LED" onclick={() => (open = true)}>
  <Lightbulb class="size-4" /> LED
</Button>

<ResponsiveSheet
  bind:open
  title="Contrôle LED"
  description="Effets globaux, couleurs par profil et extension LED."
  srOnlyTitle={false}
  desktopClass="w-full max-w-md!"
>
  {#snippet badge()}
    <SaveBadge class="ms-auto" />
  {/snippet}

  <div class="w-full h-full max-w-md px-4 pt-4 pb-8 mx-auto space-y-6 overflow-y-auto">
    <!-- Préview animée -->
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

    <!-- ── LEDs des touches ────────────────────────────────────── -->
    <Card.Root>
      <Card.Header>
        <Card.Title>LEDs des touches</Card.Title>
      </Card.Header>

      <Card.Content class="flex flex-col gap-5">
        <div>
          <Label class="block mb-3 text-sm">Effet</Label>
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
            <Label class="block mb-1.5 text-sm">Luminosité</Label>
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
            <Label class="block mb-3 text-sm">Palette de dégradé</Label>
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
          <SettingsField label="Couleur" description="Couleur globale par défaut des touches">
            <Popover.Root>
              <Popover.Trigger>
                {#snippet child({ props })}
                  <Button
                    {...props}
                    variant="outline"
                    size="icon"
                    class="bg-(--bg)! rounded-full"
                    style="--bg: {pickerColor}"
                  ></Button>
                {/snippet}
              </Popover.Trigger>
              <Popover.Content class="w-auto p-0!">
                <ColorPicker.Root
                  bind:value={pickerColor}
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

    <!-- ── Extension LED ──────────────────────────────────────── -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Extension LED</Card.Title>
      </Card.Header>

      <Card.Content class="flex flex-col gap-5">
        <SettingsField label="Activer l'extension" description="LEDs WS2812 sur le connecteur d'extension du PCB">
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
            <Label class="block mb-3 text-sm">Mode d'éclairage</Label>
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
            <SettingsField
              label="Couleur"
              description={ledExtMode === 4 ? 'Couleur du flash réactif' : 'Couleur de base'}
            >
              <Popover.Root>
                <Popover.Trigger>
                  {#snippet child({ props })}
                    <button
                      {...props}
                      class="w-8 h-8 border rounded-full shadow-sm cursor-pointer border-border"
                      style="background-color: {extLedPickerColor}"
                    ></button>
                  {/snippet}
                </Popover.Trigger>
                <Popover.Content class="w-auto p-0!">
                  <ColorPicker.Root
                    formats={['hsl', 'hex']}
                    bind:value={extLedPickerColor}
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
            <Label class="block mb-1.5 text-sm">Luminosité extension</Label>
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
