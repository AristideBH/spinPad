<script lang="ts">
  // ───────────────────────────────────────────────────────────────
  //  ScreenEditor.svelte — OLED widget editor (4×4 mosaic grid)
  //
  //  Span-based model: each widget occupies (x, y, w, h) on a logical
  //  4×4 grid. Drag to reposition (handle), size + options via the
  //  menu (DropdownMenu) — no mouse resizing, no
  //  overlap (collision="none" + bounds). The `editable` prop hides the
  //  handle/menu (preview only). Per-widget metadata: ./widgets registry.
  //  Single source of truth: the config store.
  //
  //  Note: the grid fills the container on both axes (no forced aspect
  //  ratio); mosaic uses uniform tracks, so the OLED's real 10px outer
  //  ring is not reproduced here.
  // ───────────────────────────────────────────────────────────────
  import { Grid, type GridItem, type SnippetArgs, type ColsDefinition } from '@arisbh/svelte-mosaic';
  import { gridHelp } from '@arisbh/svelte-mosaic/helper';
  import { configState, updateConfig } from '$shared/store/config.svelte.js';
  import {
    WIDGET_GRID_COLS,
    WIDGET_GRID_ROWS,
    defaultWidgets,
    type WidgetConfig,
  } from '$shared/constants/config-schema.js';
  import { WIDGET_DEFS, widgetSizes } from './widgets/index.js';
  import OptionControls from './bits/OptionControls.svelte';
  import SizeGrid from './bits/SizeGrid.svelte';
  import * as Item from '$shared/components/ui/item/index.js';
  import * as DropdownMenu from '$shared/components/ui/dropdown-menu/index.js';
  import { buttonVariants } from '$shared/components/ui/button/index.js';
  import { cn } from '$shared/utils.js';
  import { GripVertical, Trash2, EllipsisVertical } from '@lucide/svelte';
  import { fade } from 'svelte/transition';
  import { toast } from 'svelte-sonner';

  interface Props {
    /** Edit mode: shows the drag handle and the options menu. */
    editable?: boolean;
  }
  let { editable = true }: Props = $props();

  let gridRef = $state();
  let openIdx = $state<number | null>(null);

  const COLS = WIDGET_GRID_COLS;
  const ROWS = WIDGET_GRID_ROWS;

  // ── Data (store = source of truth) ──────────────────────────────
  const widgets = $derived<WidgetConfig[]>((configState.data?.display?.widgets ?? defaultWidgets()) as WidgetConfig[]);

  // Adding widgets lives in ScreenAddMenu (tile header). Here we only
  // edit/move/delete the existing widgets.
  function writeWidgets(next: WidgetConfig[]) {
    updateConfig('display.widgets', next);
  }
  function patchWidget(idx: number, patch: Partial<WidgetConfig>) {
    writeWidgets(widgets.map((w, i) => (i === idx ? ({ ...w, ...patch } as WidgetConfig) : w)));
  }
  function removeWidget(idx: number) {
    writeWidgets(widgets.filter((_, i) => i !== idx));
  }

  // Anchor position (clamped to the grid) the widget would have at size w×h.
  function anchorFor(cur: WidgetConfig, w: number, h: number) {
    return { x: Math.min(cur.x, COLS - w), y: Math.min(cur.y, ROWS - h) };
  }

  // Grid occupancy by all widgets except `skip`.
  function occupancyExcept(skip: number): boolean[][] {
    const g = Array.from({ length: ROWS }, () => Array<boolean>(COLS).fill(false));
    widgets.forEach((wd, i) => {
      if (i === skip) return;
      for (let yy = wd.y; yy < wd.y + wd.h; yy++)
        for (let xx = wd.x; xx < wd.x + wd.w; xx++) if (g[yy]?.[xx] !== undefined) g[yy][xx] = true;
    });
    return g;
  }

  // A size is available if the widget fits (without overlap) at its
  // anchor position. Larger sizes with no room are grayed out.
  function canResize(idx: number, w: number, h: number): boolean {
    const { x, y } = anchorFor(widgets[idx], w, h);
    const g = occupancyExcept(idx);
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (g[yy]?.[xx]) return false;
    return true;
  }

  // Change the size: refuses if no room, otherwise clamps the position.
  function setSize(idx: number, w: number, h: number) {
    if (!canResize(idx, w, h)) return;
    const { x, y } = anchorFor(widgets[idx], w, h);
    patchWidget(idx, { w, h, x, y } as Partial<WidgetConfig>);
  }

  // ── mosaic ↔ store bridge (cf. Sortable.svelte) ─────────────────
  const cols: ColsDefinition = [[0, COLS]];

  let gridItems = $state<GridItem[]>([]);
  // Rebuilds from the store; does not depend on gridItems → mosaic's internal
  // mutations during the drag don't re-run the effect.
  $effect(() => {
    gridItems = widgets.map((w, i) => {
      const gi: GridItem = { id: `w-${i}`, data: { index: i } };
      gi[COLS] = gridHelp.item({
        x: w.x,
        y: w.y,
        w: w.w,
        h: w.h,
        customDragger: true,
        resizable: false,
      });
      return gi;
    });
  });

  let draggingIdx = $state<number | null>(null);

  // At the end of a drag: persists the positions if they changed.
  function onPointerUp() {
    let changed = false;
    const next = widgets.map((w, i) => {
      const bp = gridItems.find((g) => (g.data as { index: number }).index === i)?.[COLS];
      if (bp && (bp.x !== w.x || bp.y !== w.y)) {
        changed = true;
        return { ...w, x: bp.x, y: bp.y } as WidgetConfig;
      }
      return w;
    });
    if (changed) {
      writeWidgets(next);
    } else if (draggingIdx !== null) {
      toast.error('Move not possible');
    }
    draggingIdx = null;
  }

  // The grid fills the container on both axes: width via the 4 mosaic
  // columns, height via rowHeight derived from the container's measured
  // height. mosaic carves the gaps INSIDE the items (no external space),
  // so the total height = ROWS × rowHeight → rowHeight = h / ROWS.
  const GAP = 4;
  let gridH = $state(0);
  const rowHeight = $derived(gridH > 0 ? gridH / ROWS : 40);

  // Live clock (Clock widget) — re-renders every second.
  let now = $state(new Date());
  $effect(() => {
    const id = setInterval(() => (now = new Date()), 1000);
    return () => clearInterval(id);
  });
</script>

<div class="flex flex-col h-full gap-3">
  {#if widgets.length === 0}
    <p class="grid flex-1 px-3 pb-3 text-xs text-center text-balance text-muted-foreground/30 place-items-center">
      {editable ? 'No widgets. Use the "Add" menu.' : '(-■_■)'}
    </p>
  {:else}
    <!-- ── Edit grid (fills the container on both axes) ─ -->
    <div class="flex-1 w-full px-1 pt-1 pb-0.5 border-t rounded-t-xl bg-background/50">
      <div class="w-full h-full screen-grid" bind:clientHeight={gridH} bind:this={gridRef}>
        <Grid
          bind:items={gridItems}
          {cols}
          {rowHeight}
          gap={[GAP, GAP]}
          bounds
          rows={ROWS}
          collision="push"
          unstyled
          readOnly={!editable}
          onpointerup={onPointerUp}
          fastStart
          scroller={gridRef as HTMLElement}
        >
          {#snippet children({ movePointerDown, dataItem }: SnippetArgs)}
            {@const idx = (dataItem.data as { index: number }).index}
            {@const w = widgets[idx]}
            {@const txtScale = Math.round(Math.max(8, Math.min(rowHeight * 0.42, 12))) + 'px'}
            {#if w}
              {@const def = WIDGET_DEFS[w.type]}
              {@const Icon = def.icon}
              {@const sizes = widgetSizes(w.type)}
              {@const options = def.options ?? []}
              {@const hasOpts = sizes.length > 1 || options.length > 0}
              <Item.Root
                variant="dark"
                size="xs"
                class="relative gap-1 w-full rounded-xl h-full px-2 py-1! overflow-hidden border-border/60 flex-nowrap"
              >
                <Item.Content class="flex flex-row min-w-0 col-span-2 gap-1.5! items-baseline">
                  {#if editable}
                    <button
                      type="button"
                      data-grip
                      class="flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground cursor-grab touch-none"
                      title="Move"
                      onpointerdown={(e) => {
                        draggingIdx = idx;
                        movePointerDown(e);
                      }}
                    >
                      <GripVertical class="size-3" />
                    </button>
                  {:else}
                    <Icon class="shrink-0 size-3" />
                  {/if}
                  <p style="font-size:{txtScale}" class="-translate-y-[0.1em]">
                    {def.preview(w, now)}
                  </p>
                </Item.Content>

                <!-- options + delete (menu, design aligned with LayerSwitcher) -->
                {#if editable}
                  <Item.Actions>
                    <DropdownMenu.Root open={openIdx === idx} onOpenChange={(v) => (openIdx = v ? idx : null)}>
                      <DropdownMenu.Trigger
                        title="Widget options"
                        class={cn(
                          buttonVariants({ variant: 'ghost', size: 'icon-xs' }),
                          'absolute top-0.5 right-0.5 size-4 p-0.5 z-10 text-muted-foreground hover:bg-muted-foreground/20! hover:text-muted-foreground  data-[state=open]:bg-muted-foreground/50 data-[state=open]:text-muted/50',
                        )}
                      >
                        <EllipsisVertical />
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content align="end" class="w-38">
                        {#if sizes.length > 1}
                          <div class="flex flex-col gap-1.5 px-1.5 py-1.5">
                            <span class="text-xs text-muted-foreground">Size</span>
                            <SizeGrid
                              range={def.size}
                              current={{ w: w.w, h: w.h }}
                              fits={(cw, ch) => canResize(idx, cw, ch)}
                              onpick={(cw, ch) => {
                                setSize(idx, cw, ch);
                                openIdx = null;
                              }}
                            />
                          </div>
                        {/if}

                        {#if options.length > 0}
                          {#if sizes.length > 1}<DropdownMenu.Separator />{/if}
                          <OptionControls
                            widget={w}
                            {options}
                            onPatch={(p) => patchWidget(idx, p)}
                            onClose={() => (openIdx = null)}
                          />
                        {/if}

                        {#if hasOpts}<DropdownMenu.Separator />{/if}
                        <DropdownMenu.Item variant="destructive" onSelect={() => removeWidget(idx)}>
                          <Trash2 />
                          Delete
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </Item.Actions>
                {/if}
              </Item.Root>
            {/if}
          {/snippet}
        </Grid>
      </div>
    </div>
  {/if}
</div>

<style>
  .screen-grid :global(.svlt-grid-container) {
    width: 100% !important;
    height: 100% !important;
  }
</style>
