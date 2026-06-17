<script lang="ts">
  import { Button } from '$shared/components/ui/button/index.js';
  import { Lightbulb, X } from '@lucide/svelte';
  import { configState, setKeyLedOverride } from '$shared/store/config.svelte.js';
  import type { LedModeKey } from '$shared/constants/config-schema.js';
  import { getKeypadContext } from '../keypad-context.svelte.js';
  import * as ColorPicker from '$shared/components/ui/color-picker/index.js';
  import * as Popover from '$shared/components/ui/popover/index.js';

  const ctx = getKeypadContext();

  const KEY_EFFECTS: { value: LedModeKey; label: string; desc: string }[] = [
    { value: 'off',     label: 'Off',        desc: 'Turn off this key' },
    { value: 'static',  label: 'Static',     desc: 'Fixed color' },
    { value: 'breathe', label: 'Breathe',    desc: 'Slow pulse' },
    { value: 'alert',   label: 'Alert',      desc: 'Strobe' },
  ];

  const pi = $derived(configState.activeProfileIndex);
  const li = $derived(configState.activeLayerIndex);
  const ki = $derived(ctx.editingKey);

  const currentOverride = $derived(
    ki !== null ? ctx.layer?.key_leds?.[ki] ?? null : null
  );

  const effectVal: LedModeKey = $derived(currentOverride?.effect ?? 'static');
  const hexColor = $derived(
    currentOverride
      ? rgbToHex(currentOverride.r, currentOverride.g, currentOverride.b)
      : '#ffffff'
  );

  let pickerColor = $state('#ffffff');
  $effect(() => {
    const normalized = hexColor.toUpperCase();
    if (pickerColor !== normalized) pickerColor = normalized;
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

  function setEffect(effect: LedModeKey) {
    if (ki === null) return;
    if (effect === 'off') {
      setKeyLedOverride(pi, li, ki, { r: 0, g: 0, b: 0, effect: 'off' });
    } else {
      const rgb = hexToRgb(hexColor) ?? { r: 255, g: 255, b: 255 };
      setKeyLedOverride(pi, li, ki, { ...rgb, effect });
    }
  }

  function setColor(hex: string) {
    if (ki === null) return;
    const rgb = hexToRgb(hex);
    if (!rgb) return;
    setKeyLedOverride(pi, li, ki, { ...rgb, effect: effectVal === 'off' ? 'static' : effectVal });
  }

  function clearOverride() {
    if (ki === null) return;
    setKeyLedOverride(pi, li, ki, null);
  }
</script>

<div class="flex flex-col gap-5 py-2">

  <!-- Current color indicator -->
  <div class="flex items-center gap-3">
    <div
      class="size-8 rounded-full ring-1 ring-border shrink-0"
      style="background:{currentOverride && currentOverride.effect !== 'off' ? hexColor : 'transparent'}"
    ></div>
    <div class="min-w-0">
      <p class="text-sm font-medium">
        {currentOverride ? 'Override active' : 'Inherits from profile / global'}
      </p>
      {#if currentOverride}
        <p class="text-xs text-muted-foreground">{effectVal} · {hexColor.toUpperCase()}</p>
      {/if}
    </div>
    {#if currentOverride}
      <Button variant="ghost" size="icon-sm" onclick={clearOverride} title="Remove the override" class="ms-auto">
        <X class="size-4" />
      </Button>
    {/if}
  </div>

  <!-- Available effects -->
  <div class="grid grid-cols-2 gap-2">
    {#each KEY_EFFECTS as opt (opt.value)}
      <button
        type="button"
        class={[
          'border rounded-lg px-3 py-2 text-left text-xs transition-colors',
          effectVal === opt.value && currentOverride
            ? 'border-primary bg-primary/10 text-primary font-semibold'
            : 'border-border hover:border-primary/50',
        ].join(' ')}
        onclick={() => setEffect(opt.value)}
      >
        <span class="block font-medium">{opt.label}</span>
        <span class="text-muted-foreground">{opt.desc}</span>
      </button>
    {/each}
  </div>

  <!-- Color picker (hidden if off or no override) -->
  {#if currentOverride && currentOverride.effect !== 'off'}
    <div class="flex items-center gap-3">
      <Lightbulb class="size-4 text-muted-foreground shrink-0" />
      <span class="text-sm">Color</span>
      <Popover.Root>
        <Popover.Trigger>
          {#snippet child({ props })}
            <button
              {...props}
              class="ms-auto w-8 h-8 rounded-full border border-border shadow-sm cursor-pointer"
              style="background-color: {pickerColor}"
            ></button>
          {/snippet}
        </Popover.Trigger>
        <Popover.Content class="w-auto p-0!">
          <ColorPicker.Root
            formats={['hsl', 'hex']}
            bind:value={pickerColor}
            onchange={(color) => setColor(color)}
          />
        </Popover.Content>
      </Popover.Root>
    </div>
  {/if}
</div>
