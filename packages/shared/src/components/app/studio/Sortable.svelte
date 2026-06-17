<script lang="ts" generics="T">
  // ───────────────────────────────────────────────────────────────
  //  Sortable.svelte — Reorderable list (drag) on svelte-mosaic
  //
  //  Wraps svelte-mosaic's Grid for 1-D list usage:
  //  a single row (horizontal) or a single column (vertical),
  //  custom drag handle, and emission of a single (from, to)
  //  via onReorder. The component never mutates `items`: the parent
  //  applies the move in the store (single source of truth).
  // ───────────────────────────────────────────────────────────────
  import { Grid, type GridItem, type ColsDefinition, type SnippetArgs } from '@arisbh/svelte-mosaic';
  import { gridHelp } from '@arisbh/svelte-mosaic/helper';
  import { deriveSingleMove } from '$shared/constants/reorder.js';
  import type { Snippet } from 'svelte';
  import { fly } from 'svelte/transition';

  interface Props {
    items: T[];
    orientation?: 'horizontal' | 'vertical';
    /** Row height in px, or "auto": content-driven height (1-D vertical list). */
    rowHeight?: number | 'auto';
    /**
     * Column width in px (shrink-to-fit, overflows into a scrollable area),
     * or "auto": content-driven width (1-D horizontal list, the container
     * shrinks to the content → items condensed on the left). Ignored in vertical.
     */
    colWidth?: number | 'auto';
    gap?: [number, number];
    getKey: (item: T, index: number) => string;
    onReorder: (from: number, to: number) => void;
    children: Snippet<[{ item: T; index: number; handlePointerDown: (e: PointerEvent) => void }]>;
  }

  let {
    items,
    orientation = 'vertical',
    rowHeight = 'auto',
    colWidth,
    gap = [8, 8],
    getKey,
    onReorder,
    children,
  }: Props = $props();
  // Alias to avoid shadowing by the Grid's `children` snippet below.
  const renderItem = $derived(children);

  const horizontal = $derived(orientation === 'horizontal');
  const colCount = $derived(horizontal ? Math.max(items.length, 1) : 1);
  const cols = $derived<ColsDefinition>([[0, colCount]]);
  const dataOrder = $derived(items.map((it, i) => getKey(it, i)));

  // Horizontal fixed width: we keep the proven path (fluid grid +
  // forced container width), instead of the module's "fixed colWidth" path.
  // Only the "auto" mode passes colWidth to the Grid.
  const fixedColWidth = $derived(horizontal && typeof colWidth === 'number' ? colWidth : undefined);
  const forcedWidth = $derived(fixedColWidth ? colCount * fixedColWidth + (colCount - 1) * gap[0] : undefined);
  const gridColWidth = $derived<number | 'auto' | undefined>(colWidth === 'auto' ? 'auto' : undefined);

  // Rebuilds the grid elements from the canonical data.
  // Does not depend on `gridItems` → mosaic's internal mutations
  // during the drag don't re-run this effect.
  let gridItems = $state<GridItem[]>([]);
  $effect(() => {
    gridItems = items.map((it, i) => {
      const gi: GridItem = { id: getKey(it, i), data: { item: it, index: i } };
      gi[colCount] = gridHelp.item({
        x: horizontal ? i : 0,
        y: horizontal ? 0 : i,
        w: 1,
        h: 1,
        customDragger: true,
        resizable: false, // items always 1 unit — no resizing
      });
      return gi;
    });
  });

  function visualOrder(): string[] {
    return [...gridItems]
      .sort((a, b) => {
        const pa = a[colCount];
        const pb = b[colCount];
        if (!pa || !pb) return 0;
        return horizontal ? pa.x - pb.x : pa.y - pb.y;
      })
      .map((g) => g.id);
  }

  function onPointerUp() {
    const move = deriveSingleMove(dataOrder, visualOrder());
    if (move) onReorder(move.from, move.to);
  }

  // Locks the move to the list's axis: mosaic follows the pointer
  // on X and Y (free 2-D drag), which makes the preview drift outside the list.
  // We reset the off-axis component of the active item's transform to 0.
  let wrapEl = $state<HTMLDivElement | null>(null);
  $effect(() => {
    if (!wrapEl) return;
    const el = wrapEl;
    const lockX = !horizontal; // liste verticale → on bloque X (et inversement)
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        const t = m.target as HTMLElement;
        if (!t.classList || !t.classList.contains('svlt-grid-active')) continue;
        const match = /translate\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px\s*\)/.exec(t.style.transform);
        if (!match) continue;
        const x = parseFloat(match[1]);
        const y = parseFloat(match[2]);
        if (lockX && x !== 0) t.style.transform = `translate(0px, ${y}px)`;
        else if (!lockX && y !== 0) t.style.transform = `translate(${x}px, 0px)`;
      }
    });
    obs.observe(el, { attributes: true, attributeFilter: ['style'], subtree: true });
    return () => obs.disconnect();
  });

  const flyDistance = 20;
  const flyDirection = $derived(horizontal ? { x: flyDistance, y: 0 } : { x: 0, y: flyDistance });
</script>

<div
  bind:this={wrapEl}
  class="sortable-wrap"
  style={[forcedWidth ? `width:${forcedWidth}px` : '', horizontal ? 'touch-action:pan-x' : '']
    .filter(Boolean)
    .join(';') || undefined}
>
  <Grid
    bind:items={gridItems}
    {cols}
    {rowHeight}
    colWidth={gridColWidth}
    {gap}
    unstyled
    compact
    onpointerup={onPointerUp}
    fastStart={true}
    scroller={wrapEl as HTMLElement}
  >
    {#snippet children({ movePointerDown, dataItem }: SnippetArgs)}
      {@const payload = dataItem.data as { item: T; index: number }}
      <div
        transition:fly={{ ...flyDirection, duration: 250, delay: 80 + payload.index * 40 }}
        class={horizontal ? 'h-full' : 'w-full h-full'}
      >
        {@render renderItem({ item: payload.item, index: payload.index, handlePointerDown: movePointerDown })}
      </div>
    {/snippet}
  </Grid>
</div>

<style>
  /* mosaic's inner container must fill the wrapper, otherwise it
     shrinks to 0 (width:auto) and the cells are computed at 0px. */
  .sortable-wrap {
    width: 100%;
    position: relative;
  }
  .sortable-wrap :global(.svlt-grid-container) {
    width: 100%;
  }

  /* Allow horizontal scroll on touch when used inside a horizontal ScrollArea.
     touch-none on the drag handle overrides this for intentional drag. */
  .sortable-wrap[style*='touch-action:pan-x'] :global(.svlt-grid-item) {
    touch-action: pan-x;
  }
</style>
