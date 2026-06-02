<script lang="ts">
  import { Label } from '$shared/components/ui/label/index.js';
  import { getKeycodeLabel, hidUsageToCode } from '$shared/constants/keycodes.js';
  import { layerColor } from '$shared/constants/layer-colors.js';
  import { configState } from '$shared/store/config.svelte.js';
  import { KeyboardLayout } from '$shared/lib/hooks/keyboard-layout.svelte.js';
  import { cn } from '$shared/utils.js';
  import { getKeypadContext } from './keypad-context.svelte.js';
  import { keyVisuals } from '$shared/store/keyVisuals.svelte.js';
  import { serial } from '$shared/store/serial.svelte.js';
  import { devMode } from '$shared/store/devMode.svelte.js';

  const visualsActive = $derived(serial.connected || devMode.active);

  const ctx = getKeypadContext();
  const layout = new KeyboardLayout();

  /**
   * Vrai si le label US affiché diverge du glyphe réel de la disposition hôte
   * (AZERTY, QWERTZ…) pour cette touche. Le keycode reste positionnel (correct
   * au runtime) ; on signale juste que l'étiquette ne correspond pas au clavier.
   * Limité aux keycodes simples à un caractère (lettres, chiffres, symboles).
   */
  function layoutMismatch(value: number): boolean {
    if (!layout.map) return false; // disposition inconnue → ne rien signaler
    if (((value >> 12) & 0xf) !== 0) return false; // type ACTION_TYPE_KC uniquement
    if ((value & 0x0f00) !== 0) return false; // ignorer les keycodes « modifiés » (shift…)
    const code = hidUsageToCode(value & 0xff);
    if (!code) return false;
    const host = layout.map.get(code);
    if (!host || host.length !== 1) return false;
    const us = getKeycodeLabel(value);
    if (us.length !== 1) return false;
    return host.toUpperCase() !== us.toUpperCase();
  }

  const CELL = 72;
  const GAP = 12;
  const isTransposed = $derived(ctx.orientDeg === 90 || ctx.orientDeg === 270);
  const gridW = $derived(isTransposed ? 4 * CELL + 3 * GAP : 3 * CELL + 2 * GAP);
  const gridH = $derived(isTransposed ? 3 * CELL + 2 * GAP : 4 * CELL + 3 * GAP);

  // Shadow/light direction must stay screen-fixed: rotate the keycap depth vector by -orientDeg
  // so the parent grid's rotation cancels out and light always comes from the top.
  const rad = $derived((ctx.orientDeg * Math.PI) / 180);
  const depthX = $derived(Math.round(Math.sin(rad) * 100) / 100);
  const depthY = $derived(Math.round(Math.cos(rad) * 100) / 100);

  // Layers (other than the active one) where a given key index is defined (keycode !== KC_NONE).
  function otherLayers(idx: number): number[] {
    const layers = ctx.profile?.layers ?? [];
    const active = configState.activeLayerIndex;
    const out: number[] = [];
    for (let i = 0; i < layers.length; i++) {
      if (i !== active && (layers[i].keys[idx] ?? 0) !== 0) out.push(i);
    }
    return out;
  }

  const KEY_LAYOUT = [
    { sw: 'SW8', idx: 1, row: 1, col: 1, rowSpan: 1, colSpan: 1 },
    { sw: 'SW1', idx: 0, row: 1, col: 2, rowSpan: 1, colSpan: 2 },
    { sw: 'SW9', idx: 4, row: 2, col: 1, rowSpan: 1, colSpan: 1 },
    { sw: 'SW7', idx: 3, row: 2, col: 2, rowSpan: 1, colSpan: 1 },
    { sw: 'SW2', idx: 2, row: 2, col: 3, rowSpan: 1, colSpan: 1 },
    { sw: 'SW10', idx: 7, row: 3, col: 1, rowSpan: 2, colSpan: 1 },
    { sw: 'SW6', idx: 6, row: 3, col: 2, rowSpan: 1, colSpan: 1 },
    { sw: 'SW3', idx: 5, row: 3, col: 3, rowSpan: 1, colSpan: 1 },
    { sw: 'SW5', idx: 9, row: 4, col: 2, rowSpan: 1, colSpan: 1 },
    { sw: 'SW4', idx: 8, row: 4, col: 3, rowSpan: 1, colSpan: 1 },
  ] as const;
</script>

{#if ctx.layer}
  <div class="flex flex-col gap-3 keycap-grid">
    <span class="flex flex-row items-baseline justify-between gap-1">
      <Label>Clavier</Label>
      {#if ctx.orientDeg !== 0}
        <p class="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
          <span>Orientation</span>
          <span class="px-1 font-mono rounded bg-muted">{ctx.orientDeg}°</span>
        </p>
      {/if}
    </span>

    <div class="relative dark" style="width: {gridW}px; height: {gridH}px;">
      <div
        class="inline-grid transition-transform duration-300 keycap-grid"
        style="
        --keycap-size: {CELL}px;
        --keycap-gap: {GAP}px;
        --orient-deg: {ctx.orientDeg}deg;
        --depth-x: calc(var(--keycap-depth) * {depthX});
        --depth-y: calc(var(--keycap-depth) * {depthY});
        gap: {GAP}px;
        grid-template-rows: repeat(4, {CELL}px);
        grid-template-columns: repeat(3, {CELL}px);
        transform: rotate({ctx.orientDeg}deg);
        transform-origin: center center;
        position: absolute;
        top: 50%; left: 50%;
        translate: -50% -50%;
      "
      >
        <!-- Pass 1 : pulses (peintes avant tous les keycaps ; ne chevauchent jamais les voisines). -->
        {#if visualsActive}
          {#each KEY_LAYOUT as key (key.idx)}
            {#key keyVisuals.pressNonce[key.idx]}
              {#if keyVisuals.pressNonce[key.idx] > 0}
                <span
                  class="keycap-pulse"
                  style="grid-row: {key.row} / span {key.rowSpan}; grid-column: {key.col} / span {key.colSpan};"
                  aria-hidden="true"
                ></span>
              {/if}
            {/key}
          {/each}
        {/if}

        <!-- Pass 2 : keycaps. -->
        {#each KEY_LAYOUT as key}
          <button
            style="grid-row: {key.row} / span {key.rowSpan}; grid-column: {key.col} / span {key.colSpan};"
            class={cn(
              'keycap',
              ctx.editingKey === key.idx && ctx.editingField === 'key' ? 'keycap--active' : '',
              key.sw === 'SW1' || key.sw === 'SW10' ? 'keycap--alt' : '',
              visualsActive && keyVisuals.pressed[key.idx] ? 'keycap--press-sim' : '',
            )}
            onclick={() => ctx.openKeyPicker(key.idx)}
          >
            <div class="keycap-overlay" style="transform: rotate({-ctx.orientDeg}deg)">
              {#if otherLayers(key.idx).length > 0}
                <span class="keycap-dots">
                  {#each otherLayers(key.idx) as li (li)}
                    <span class={cn('keycap-dot', layerColor(li))}></span>
                  {/each}
                </span>
              {/if}
            </div>
            <div class="select-none keycap-labels" style="transform: rotate({-ctx.orientDeg}deg)">
              <span class="keycap-sw">{key.sw}</span>
              <span class={cn('keycap-label', layoutMismatch(ctx.layer.keys[key.idx] ?? 0) && 'keycap-label--mismatch')}
                >{getKeycodeLabel(ctx.layer.keys[key.idx] ?? 0, configState.data?.macros)}</span
              >
              {#if key.rowSpan === 2 || key.colSpan === 2}
                <span class="keycap-size-hint">2u</span>
              {/if}
            </div>
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .keycap-grid {
    --keycap-color: var(--card);
    --keycap-side-color: color-mix(in oklch, var(--keycap-color) 60%, var(--background));
    --keycap-color-active: var(--card);
    --keycap-depth: 4px;
    --keycap-radius: 10px;
    --keycap-label-size: 10px;
    --keycap-sw-size: 8px;
    filter: drop-shadow(
        0px calc(var(--keycap-depth) * 2) 5px color-mix(in oklch, var(--color-background) 5%, transparent)
      )
      drop-shadow(0px 1px 0.75px var(--color-background));
  }

  .keycap {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: var(--keycap-radius);
    background-color: var(--keycap-color);
    box-shadow:
      var(--depth-x) var(--depth-y) 0 var(--keycap-side-color),
      inset 0 1px 0 rgba(255, 255, 255, 0.13),
      inset 0 -1px 0 rgba(0, 0, 0, 0.22);
    cursor: pointer;
    overflow: hidden;
    transition:
      transform 60ms ease-out,
      box-shadow 60ms ease-out;
  }

  .keycap::after {
    content: '';
    position: absolute;
    --depress-offset: 10px;
    width: calc(100% - var(--depress-offset));
    height: calc(100% - var(--depress-offset));
    aspect-ratio: 1;
    border-radius: 500px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(calc(-1 * var(--orient-deg, 0deg)));
    background: linear-gradient(to top, rgba(255, 255, 255, 0.035) 0%, rgba(0, 0, 0, 0.17) 100%);
    pointer-events: none;
  }

  .keycap:hover {
    box-shadow:
      var(--depth-x) var(--depth-y) 0 var(--keycap-side-color),
      inset 0 1px 0 rgba(255, 255, 255, 0.22),
      inset 0 -1px 0 rgba(0, 0, 0, 0.18);
  }

  .keycap:focus-visible {
    outline: 2px solid var(--color-foreground);
    outline-offset: 3px;
  }

  .keycap:active {
    transform: translate(var(--depth-x), var(--depth-y));
    box-shadow:
      0 0 0 rgba(0, 0, 0, 0),
      inset 0 1px 0 rgba(255, 255, 255, 0.07),
      inset 0 -1px 0 rgba(0, 0, 0, 0.12);
  }

  .keycap--active {
    --keycap-color: color-mix(in oklch, var(--keycap-color-active) 25%, var(--card));
    box-shadow:
      var(--depth-x) var(--depth-y) 0 var(--keycap-side-color),
      inset 0 1px 0 rgba(255, 255, 255, 0.18),
      inset 0 -1px 0 rgba(0, 0, 0, 0.22),
      0 0 0 1.5px var(--keycap-color-active);
  }

  .keycap--alt {
    --keycap-color: var(--muted);
  }

  .keycap-labels {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    width: 100%;
    height: 100%;
    pointer-events: none;
    transition: transform 300ms ease;
  }

  .keycap-label {
    font-size: var(--keycap-label-size);
    font-weight: 600;
    line-height: 1;
    color: var(--foreground);
  }

  /* Label US ≠ glyphe de la disposition hôte → souligné pointillé. */
  .keycap-label--mismatch {
    text-decoration: underline dashed;
    text-decoration-thickness: 1px;
    text-underline-offset: 2px;
    text-decoration-color: color-mix(in oklch, var(--muted-foreground) 70%, transparent);
  }

  .keycap-sw {
    font-size: var(--keycap-sw-size);
    color: var(--muted-foreground);
  }

  .keycap-size-hint {
    font-size: 7px;
    color: color-mix(in oklch, var(--muted-foreground) 50%, transparent);
  }

  /* Mimique l'état :active sans interaction souris (mode test). */
  .keycap--press-sim {
    transform: translate(var(--depth-x), var(--depth-y));
    box-shadow:
      0 0 0 rgba(0, 0, 0, 0),
      inset 0 1px 0 rgba(255, 255, 255, 0.07),
      inset 0 -1px 0 rgba(0, 0, 0, 0.12);
  }

  /* Halo qui pulse sous la touche. Placé dans la grid comme item dédié et rendu
     AVANT les .keycap → les keycaps voisines le couvrent toujours (paint order). */
  .keycap-pulse {
    border-radius: var(--keycap-radius);
    pointer-events: none;
    background: radial-gradient(
      closest-side,
      color-mix(in oklch, var(--chart-5) 70%, transparent) 0%,
      color-mix(in oklch, var(--chart-5) 30%, transparent) 55%,
      transparent 100%
    );
    opacity: 0;
    /* opacity: 1 !important; */
    animation: keycap-pulse 350ms ease-out forwards;
    transform-origin: center;
    will-change: transform, opacity;
    margin-bottom: var(--keycap-depth);
  }

  @keyframes keycap-pulse {
    0% {
      opacity: 0;
      transform: scale(0.8) translateY(var(--keycap-depth));
    }
    20% {
      opacity: 0.95;
      transform: scale(1.15) translateY(var(--keycap-depth));
    }
    100% {
      opacity: 0;
      transform: scale(1.55) translateY(var(--keycap-depth));
    }
  }

  .keycap-count {
    position: absolute;
    top: 2px;
    left: 4px;
    font-size: 7px;
    font-weight: 700;
    color: hsl(var(--chart-5));
    pointer-events: none;
  }

  .keycap-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    transition: transform 300ms ease;
  }

  .keycap-dots {
    position: absolute;
    top: 4px;
    right: 4px;
    display: flex;
    gap: 2px;
    flex-direction: column-reverse;
    align-items: center;
  }

  .keycap-dot {
    --size: 4px;
    width: var(--size);
    height: var(--size);
    aspect-ratio: 1;
    border-radius: 9999px;
    box-shadow: 0 0 0 1px color-mix(in oklch, var(--background) 60%, transparent);
    &:first-child {
      /* margin-top: calc(var(--size) / -4); */
    }
  }
</style>
