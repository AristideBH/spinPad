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
  import { KEY_LAYOUT } from '$shared/constants/key-layout.js';

  const visualsActive = $derived(serial.connected || devMode.active);

  const ctx = getKeypadContext();
  const layout = new KeyboardLayout();

  /**
   * True if the displayed US label diverges from the real glyph of the host
   * layout (AZERTY, QWERTZ…) for this key. The keycode stays positional (correct
   * at runtime); we just flag that the label doesn't match the keyboard.
   * Limited to simple single-character keycodes (letters, digits, symbols).
   */
  function layoutMismatch(value: number): boolean {
    if (!layout.map) return false; // unknown layout → flag nothing
    if (((value >> 12) & 0xf) !== 0) return false; // ACTION_TYPE_KC type only
    if ((value & 0x0f00) !== 0) return false; // ignore "modified" keycodes (shift…)
    const code = hidUsageToCode(value & 0xff);
    if (!code) return false;
    const host = layout.map.get(code);
    if (!host || host.length !== 1) return false;
    const us = getKeycodeLabel(value);
    if (us.length !== 1) return false;
    return host.toUpperCase() !== us.toUpperCase();
  }

  const CELL = 84;
  const GAP = 16;
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
</script>

{#if ctx.layer}
  <div class="flex flex-col gap-3 keycap-grid">
    <span class="flex flex-row items-baseline justify-between gap-1">
      <Label>Keypad</Label>
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
        <!-- Pass 1: pulses (painted before all keycaps; never overlap the neighbors). -->
        {#if visualsActive}
          {@const led = ctx.profile?.led}
          {@const pulseColor = led ? `rgb(${led.r},${led.g},${led.b})` : undefined}
          {#each KEY_LAYOUT as key (key.idx)}
            {@const kl = ctx.layer?.key_leds?.[key.idx]}
            {@const keyOverrideColor =
              kl && (kl.effect ?? 'off') !== 'off' ? `rgb(${kl.r},${kl.g},${kl.b})` : undefined}
            {@const finalPulseColor = keyOverrideColor ?? pulseColor}
            {#key keyVisuals.pressNonce[key.idx]}
              {#if keyVisuals.pressNonce[key.idx] > 0}
                <span
                  class="keycap-pulse"
                  aria-hidden="true"
                  style=" grid-row: {key.row} / span {key.rowSpan}; 
                          grid-column: {key.col} / span {key.colSpan}; 
                          {finalPulseColor ? ` --pulse-color: ${finalPulseColor};` : ''}"
                ></span>
              {/if}
            {/key}
          {/each}
        {/if}

        <!-- Pass 2 : keycaps. -->
        {#each KEY_LAYOUT as key (key.idx)}
          <button
            style="grid-row: {key.row} / span {key.rowSpan}; grid-column: {key.col} / span {key.colSpan};"
            class={cn(
              'keycap',
              ctx.editingKey === key.idx && ctx.editingField === 'key' ? 'keycap--active' : '',
              key.rowSpan === 2 || key.colSpan === 2 ? 'keycap--alt' : '',
              visualsActive && keyVisuals.pressed[key.idx] ? 'keycap--press-sim' : '',
            )}
            onclick={() => ctx.openKeyPicker(key.idx)}
          >
            <div class="keycap-overlay" style="transform: rotate({-ctx.orientDeg}deg)">
              {#if otherLayers(key.idx).length > 0}
                <span class="keycap-dots">
                  {#each otherLayers(key.idx) as li (li)}
                    <span class={cn('keycap-dot border-b-4', layerColor(ctx.profile?.layers?.[li]?.color ?? li))}
                    ></span>
                  {/each}
                </span>
              {/if}
              {#if (ctx.layer?.key_leds?.[key.idx]?.effect ?? 'off') !== 'off'}
                {@const kl = ctx.layer!.key_leds![key.idx]!}
                <span
                  class="keycap-led-dot"
                  style="background:rgb({kl.r},{kl.g},{kl.b});box-shadow:0 0 5px 0px rgb({kl.r},{kl.g},{kl.b})"
                ></span>
              {:else}
                <span class="keycap-led-dot" style="background:rgb(0,0,0)"></span>
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
    /* Screen-fixed top/bottom highlight directions — counter the grid rotation. */
    --top-x: calc(-1px * sin(var(--orient-deg)));
    --top-y: calc(-1px * cos(var(--orient-deg)));
    box-shadow:
      var(--depth-x) var(--depth-y) 0 var(--keycap-side-color),
      inset calc(-1 * var(--top-x)) calc(-1 * var(--top-y)) 0 rgba(255, 255, 255, 0.13),
      inset var(--top-x) var(--top-y) 0 rgba(0, 0, 0, 0.22);
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
    border-radius: 500px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(calc(-1 * var(--orient-deg)), rgba(255, 255, 255, 0.035) 0%, rgba(0, 0, 0, 0.17) 100%);
    box-shadow: inset calc(1 * var(--top-x)) calc(1 * var(--top-y)) 0 rgba(255, 255, 255, 0.03);
    pointer-events: none;
    filter: blur(0.65px);
    /* filter: blur(0px); */
  }

  .keycap:hover {
    box-shadow:
      var(--depth-x) var(--depth-y) 0 var(--keycap-side-color),
      inset calc(-1 * var(--top-x)) calc(-1 * var(--top-y)) 0 rgba(255, 255, 255, 0.22),
      inset var(--top-x) var(--top-y) 0 rgba(0, 0, 0, 0.18);
  }

  .keycap:focus-visible {
    outline: 2px solid var(--color-foreground);
    outline-offset: 3px;
  }

  .keycap:active {
    transform: translate(var(--depth-x), var(--depth-y));
    box-shadow:
      0 0 0 rgba(0, 0, 0, 0),
      inset calc(-1 * var(--top-x)) calc(-1 * var(--top-y)) 0 rgba(255, 255, 255, 0.07),
      inset var(--top-x) var(--top-y) 0 rgba(0, 0, 0, 0.12);
  }

  /* .keycap--active {
    --keycap-color: color-mix(in oklch, var(--keycap-color-active) 25%, var(--card));
    box-shadow:
      var(--depth-x) var(--depth-y) 0 var(--keycap-side-color),
      inset calc(-1 * var(--top-x)) calc(-1 * var(--top-y)) 0 rgba(255, 255, 255, 0.18),
      inset var(--top-x) var(--top-y) 0 rgba(0, 0, 0, 0.22),
      0 0 0 1.5px var(--keycap-color-active);
  } */

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

  /* US label ≠ host layout glyph → dashed underline. */
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

  /* Mimics the :active state without mouse interaction (test mode). */
  .keycap--press-sim {
    transform: translate(var(--depth-x), var(--depth-y));
    box-shadow:
      0 0 0 rgba(0, 0, 0, 0),
      inset var(--top-x) var(--top-y) 0 rgba(255, 255, 255, 0.07),
      inset calc(-1 * var(--top-x)) calc(-1 * var(--top-y)) 0 rgba(0, 0, 0, 0.12);
  }

  /* Halo that pulses under the key. Placed in the grid as a dedicated item and rendered
     BEFORE the .keycap → neighboring keycaps always cover it (paint order). */
  .keycap-pulse {
    border-radius: var(--keycap-radius);
    pointer-events: none;
    --pulse-color: var(--chart-5);
    --pulse-boosted: oklch(from var(--pulse-color) min(calc(l + 1), 0.95) calc(c * 1.4) h);
    background: radial-gradient(
      closest-side,
      color-mix(in oklch, var(--pulse-boosted) 85%, transparent) 0%,
      color-mix(in oklch, var(--pulse-boosted) 35%, transparent) 55%,
      transparent 100%
    );
    opacity: 0;
    /* opacity: 1 !important; */
    animation: keycap-pulse 350ms ease-out forwards;
    transform-origin: center;
    will-change: transform, opacity;
  }

  @keyframes keycap-pulse {
    0% {
      opacity: 0;
      transform: scale(0.8) translate(var(--depth-x), var(--depth-y));
    }
    20% {
      opacity: 0.95;
      transform: scale(1.15) translate(var(--depth-x), var(--depth-y));
    }
    100% {
      opacity: 0;
      transform: scale(1.55) translate(var(--depth-x), var(--depth-y));
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
  }
</style>
