<script lang="ts">
  import { Grid } from '@arisbh/svelte-mosaic';
  import { gridHelp } from '@arisbh/svelte-mosaic/helper';
  import type { GridItem, ColsDefinition, SnippetArgs } from '@arisbh/svelte-mosaic';
  import BatteryTile from './tile-battery.svelte';
  import FirmwareTile from './tile-firmware.svelte';
  import MainTile from './tile-main.svelte';
  import ScreenTile from './screen/tile-screen.svelte';

  // Mosaic breakpoints = max-width semantics: `containerWidth <= threshold`,
  // first match in ascending order. So the mobile threshold carries 2 columns,
  // and a high sentinel threshold carries the 5 desktop columns (default beyond).
  const cols: ColsDefinition = [
    [896, 2], // <= 896px: mobile, 2 columns
    [100000, 5], // beyond: desktop, 5 columns
  ];

  // Static layout (no drag/resize): each tile carries its position for both
  // breakpoints. Keys 5 / 2 = number of columns of the breakpoint.
  let items = $state<GridItem[]>([
    {
      id: 'main',
      data: MainTile,
      5: gridHelp.item({ x: 0, y: 0, w: 3, h: 2 }),
      2: gridHelp.item({ x: 0, y: 0, w: 2, h: 2 }),
    },
    {
      id: 'screen',
      data: ScreenTile,
      5: gridHelp.item({ x: 3, y: 0, w: 1, h: 2 }),
      2: gridHelp.item({ x: 0, y: 2, w: 1, h: 2 }),
    },
    {
      id: 'battery',
      data: BatteryTile,
      5: gridHelp.item({ x: 4, y: 0, w: 1, h: 1 }),
      2: gridHelp.item({ x: 1, y: 2, w: 1, h: 1 }),
    },
    {
      id: 'firmware',
      data: FirmwareTile,
      5: gridHelp.item({ x: 4, y: 1, w: 1, h: 1 }),
      2: gridHelp.item({ x: 1, y: 3, w: 1, h: 1 }),
    },
  ]);
</script>

<div class="w-full">
  <Grid bind:items {cols} rowHeight={124} gap={[16, 16]} readOnly unstyled fastStart>
    {#snippet children({ dataItem }: SnippetArgs)}
      {@const Tile = dataItem.data as typeof MainTile}
      <div class="h-full w-full min-w-0">
        <Tile />
      </div>
    {/snippet}
  </Grid>
</div>
