<script lang="ts">
  import { Grid } from '@arisbh/svelte-mosaic';
  import { gridHelp } from '@arisbh/svelte-mosaic/helper';
  import type {
    GridItem,
    ColsDefinition,
    SnippetArgs,
    GridController,
    GridControllerInterface,
  } from '@arisbh/svelte-mosaic';
  import BatteryTile from './tile-battery.svelte';
  import FirmwareTile from './tile-firmware.svelte';
  import MainTile from './tile-main.svelte';
  import ScreenTile from './screen/tile-screen.svelte';
  import { fade, fly, slide } from 'svelte/transition';
  import { PersistedState } from 'runed';

  interface ExtendedGridItem<TData = unknown> extends GridItem<TData> {
    hide?: boolean;
  }
  // Mosaic breakpoints = max-width semantics: `containerWidth <= threshold`,
  // first match in ascending order. So the mobile threshold carries 2 columns,
  // and a high sentinel threshold carries the 5 desktop columns (default beyond).
  const MOBILE_COLS = 2;
  const cols: ColsDefinition = [
    [896, MOBILE_COLS], // <= 896px: mobile, 2 columns
    [100000, 5], // beyond: desktop, 5 columns
  ];

  const tileHidden = new PersistedState('spinpad-dashboard-tile-hidden', false);
  let activeCols = $state(5);
  let isMobile = $derived(activeCols === MOBILE_COLS);

  let inDirection = $derived.by(() => {
    if (isMobile) {
      return { y: -20, x: 0 };
    }
    return { y: 0, x: -20 };
  });
  let outDirection = $derived.by(() => {
    if (isMobile) {
      return { y: -20, x: 0 };
    }
    return { y: 0, x: -20 };
  });

  // Static layout (no drag/resize): each tile carries its position for both
  // breakpoints. Keys 5 / 2 = number of columns of the breakpoint.
  let items = $derived<ExtendedGridItem[]>([
    {
      id: 'main',
      data: MainTile,
      5: gridHelp.item({ x: 0, y: 0, w: tileHidden.current ? 5 : 3, h: 2 }),
      2: gridHelp.item({ x: 0, y: 0, w: 2, h: tileHidden.current ? 4 : 2 }),
    },
    {
      id: 'screen',
      data: ScreenTile,
      hide: tileHidden.current,
      5: gridHelp.item({ x: 3, y: 0, w: 1, h: 2 }),
      2: gridHelp.item({ x: 0, y: 2, w: 1, h: 2 }),
    },
    {
      id: 'battery',
      data: BatteryTile,
      hide: tileHidden.current,
      5: gridHelp.item({ x: 4, y: 0, w: 1, h: 1 }),
      2: gridHelp.item({ x: 1, y: 2, w: 1, h: 1 }),
    },
    {
      id: 'firmware',
      data: FirmwareTile,
      hide: tileHidden.current,
      5: gridHelp.item({ x: 4, y: 1, w: 1, h: 1 }),
      2: gridHelp.item({ x: 1, y: 3, w: 1, h: 1 }),
    },
  ]);
</script>

<div
  class="w-full dashboard transition-all overflow-hidden duration-450 ease-out will-change-[height]
  {tileHidden.current ? 'h-60 delay-50' : isMobile ? 'h-122' : 'h-60'}"
>
  <Grid
    bind:items
    {cols}
    rowHeight={tileHidden.current && isMobile ? 62 : 124}
    gap={[16, 16]}
    readOnly
    unstyled
    fastStart
    onmount={(e) => (activeCols = e.cols)}
    onresize={(e) => (activeCols = e.cols)}
  >
    {#snippet children({ dataItem, index, item }: SnippetArgs)}
      {@const Tile = dataItem.data as typeof MainTile}
      {@const hidden = (dataItem as ExtendedGridItem).hide}
      {#if !hidden}
        <div
          class="w-full h-full min-w-0 isolate transition-all {dataItem.id === 'main' ? 'z-20' : 'z-10'}"
          in:fly={{ ...inDirection, delay: (index + 1) * 50 + 100 }}
          out:fly={{ ...outDirection }}
        >
          {#if dataItem.id === 'main'}
            <Tile bind:tileHidden={tileHidden.current} />
          {:else}
            <Tile />
          {/if}
        </div>
      {/if}
    {/snippet}
  </Grid>
</div>

<style>
  :global(.dashboard > .svlt-grid-container) {
    :global(& > .svlt-grid-item:first-of-type) {
      z-index: 1;
    }

    /* The library's inline style only transitions transform/opacity, not
       width/height, so breakpoint-driven resizes snap. readOnly disables
       drag/resize interactions, so it's safe to extend the transition here. */
    :global(& > .svlt-grid-item) {
      transition:
        transform 0.2s ease-in-out,
        width 0.2s ease-in-out,
        height 0.2s ease-in-out !important;
    }
  }
</style>
