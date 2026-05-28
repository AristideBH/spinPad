<script lang="ts">
  import { getKeycodeLabel } from '$shared/constants/keycodes.js';
  import { cn } from '$shared/utils.js';
  import { getKeypadContext } from './keypad-context.svelte.js';

  const ctx = getKeypadContext();

  const CELL = 72;
  const GAP = 12;
  const isTransposed = $derived(ctx.orientDeg === 90 || ctx.orientDeg === 270);
  const gridW = $derived(isTransposed ? 4 * CELL + 3 * GAP : 3 * CELL + 2 * GAP);
  const gridH = $derived(isTransposed ? 3 * CELL + 2 * GAP : 4 * CELL + 3 * GAP);

  const KEY_LAYOUT = [
    { sw: 'SW8',  idx: 1, row: 1, col: 1, rowSpan: 1, colSpan: 1 },
    { sw: 'SW1',  idx: 0, row: 1, col: 2, rowSpan: 1, colSpan: 2 },
    { sw: 'SW9',  idx: 4, row: 2, col: 1, rowSpan: 1, colSpan: 1 },
    { sw: 'SW7',  idx: 3, row: 2, col: 2, rowSpan: 1, colSpan: 1 },
    { sw: 'SW2',  idx: 2, row: 2, col: 3, rowSpan: 1, colSpan: 1 },
    { sw: 'SW10', idx: 7, row: 3, col: 1, rowSpan: 2, colSpan: 1 },
    { sw: 'SW6',  idx: 6, row: 3, col: 2, rowSpan: 1, colSpan: 1 },
    { sw: 'SW3',  idx: 5, row: 3, col: 3, rowSpan: 1, colSpan: 1 },
    { sw: 'SW5',  idx: 9, row: 4, col: 2, rowSpan: 1, colSpan: 1 },
    { sw: 'SW4',  idx: 8, row: 4, col: 3, rowSpan: 1, colSpan: 1 },
  ] as const;
</script>

{#if ctx.layer}
  <div class="relative mb-6" style="width: {gridW}px; height: {gridH}px;">
    <div
      class="inline-grid transition-transform duration-300 keycap-grid dark"
      style="
        --keycap-size: {CELL}px;
        --keycap-gap: {GAP}px;
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
      {#each KEY_LAYOUT as key}
        <button
          style="grid-row: {key.row} / span {key.rowSpan}; grid-column: {key.col} / span {key.colSpan};"
          class={cn(
            'keycap',
            ctx.editingKey === key.idx && ctx.editingField === 'key' ? 'keycap--active' : '',
            key.sw === 'SW1' || key.sw === 'SW10' ? 'keycap--alt' : '',
          )}
          onclick={() => ctx.openKeyPicker(key.idx)}
        >
          {#if ctx.trainingActive}
            <div class="keycap-flash" style="opacity: {ctx.keyFlashOpacity(key.idx)}"></div>
            {#if ctx.keyPressCounts[key.idx] > 0}
              <span class="keycap-count">{ctx.keyPressCounts[key.idx]}</span>
            {/if}
          {/if}
          <div class="keycap-labels" style="transform: rotate({-ctx.orientDeg}deg)">
            <span class="keycap-sw">{key.sw}</span>
            <span class="keycap-label">{getKeycodeLabel(ctx.layer.keys[key.idx] ?? 0)}</span>
            {#if key.rowSpan === 2 || key.colSpan === 2}
              <span class="keycap-size-hint">2u</span>
            {/if}
          </div>
        </button>
      {/each}
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
  }

  .keycap {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: var(--keycap-radius);
    background-color: var(--keycap-color);
    box-shadow:
      0 var(--keycap-depth) 0 var(--keycap-side-color),
      inset 0 1px 0 rgba(255, 255, 255, 0.13),
      inset 0 -1px 0 rgba(0, 0, 0, 0.22);
    cursor: pointer;
    overflow: hidden;
    transition:
      transform 60ms ease-out,
      box-shadow 60ms ease-out;
  }

  .keycap::before {
    content: '';
    position: absolute;
    --depress-offset: 8px;
    width: calc(100% - var(--depress-offset));
    height: calc(100% - var(--depress-offset));
    aspect-ratio: 1;
    border-radius: 500px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(to top, rgba(255, 255, 255, 0.035) 0%, rgba(0, 0, 0, 0.17) 100%);
    pointer-events: none;
  }

  .keycap:hover {
    box-shadow:
      0 var(--keycap-depth) 0 var(--keycap-side-color),
      inset 0 1px 0 rgba(255, 255, 255, 0.22),
      inset 0 -1px 0 rgba(0, 0, 0, 0.18);
  }

  .keycap:focus-visible {
    outline: 1px solid var(--muted);
    outline-offset: 3px;
  }

  .keycap:active {
    transform: translateY(var(--keycap-depth));
    box-shadow:
      0 0 0 rgba(0, 0, 0, 0),
      inset 0 1px 0 rgba(255, 255, 255, 0.07),
      inset 0 -1px 0 rgba(0, 0, 0, 0.12);
  }

  .keycap--active {
    --keycap-color: color-mix(in oklch, var(--keycap-color-active) 25%, var(--card));
    box-shadow:
      0 var(--keycap-depth) 0 var(--keycap-side-color),
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

  .keycap-sw {
    font-size: var(--keycap-sw-size);
    color: var(--muted-foreground);
  }

  .keycap-size-hint {
    font-size: 7px;
    color: color-mix(in oklch, var(--muted-foreground) 50%, transparent);
  }

  .keycap-flash {
    position: absolute;
    inset: 0;
    border-radius: var(--keycap-radius);
    background: oklch(0.7 0.17 150 / 0.6);
    pointer-events: none;
    transition: opacity 300ms;
  }

  .keycap-count {
    position: absolute;
    top: 2px;
    right: 4px;
    font-size: 7px;
    font-weight: 700;
    color: oklch(0.7 0.17 150);
    pointer-events: none;
  }
</style>
