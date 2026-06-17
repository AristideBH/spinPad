<script lang="ts">
  // ───────────────────────────────────────────────────────────────
  //  ScreenAddMenu.svelte — OLED widgets "Add" menu
  //
  //  Lives in the tile header. Reads/writes the config store and places the
  //  widget in the first free space of the 4×4 grid (singletons grayed out
  //  once placed). Per-widget metadata: ./widgets registry.
  // ───────────────────────────────────────────────────────────────
  import { configState, updateConfig } from '$shared/store/config.svelte.js';
  import {
    WIDGET_GRID_COLS,
    WIDGET_GRID_ROWS,
    DISPLAY_MAX_WIDGETS,
    defaultWidgets,
    type WidgetConfig,
  } from '$shared/constants/config-schema.js';
  import {
    WIDGET_DEFS,
    PLACEABLE_WIDGET_TYPES,
    widgetDefaultSize,
    createWidget,
    type PlaceableWidgetType,
  } from './widgets/index.js';
  import * as DropdownMenu from '$shared/components/ui/dropdown-menu/index.js';
  import { buttonVariants } from '$shared/components/ui/button/index.js';
  import { cn } from '$shared/utils.js';
  import { Plus } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';

  const COLS = WIDGET_GRID_COLS;
  const ROWS = WIDGET_GRID_ROWS;

  const widgets = $derived<WidgetConfig[]>((configState.data?.display?.widgets ?? defaultWidgets()) as WidgetConfig[]);
  const usedTypes = $derived(new Set(widgets.map((w) => w.type)));
  const full = $derived(widgets.length >= DISPLAY_MAX_WIDGETS);

  function disabled(t: PlaceableWidgetType): boolean {
    if (full) return true;
    return WIDGET_DEFS[t].singleton && usedTypes.has(t);
  }

  // First free space for a w×h box on the 4×4 grid.
  function findFreeSpace(w: number, h: number): { x: number; y: number } | null {
    const g = Array.from({ length: ROWS }, () => Array<boolean>(COLS).fill(false));
    for (const wd of widgets)
      for (let yy = wd.y; yy < wd.y + wd.h; yy++)
        for (let xx = wd.x; xx < wd.x + wd.w; xx++) if (g[yy]?.[xx] !== undefined) g[yy][xx] = true;
    for (let y = 0; y <= ROWS - h; y++)
      for (let x = 0; x <= COLS - w; x++) {
        let ok = true;
        for (let yy = y; yy < y + h && ok; yy++) for (let xx = x; xx < x + w && ok; xx++) if (g[yy][xx]) ok = false;
        if (ok) return { x, y };
      }
    return null;
  }

  function add(type: PlaceableWidgetType) {
    if (disabled(type)) return;
    const size = widgetDefaultSize(type);
    const pos = findFreeSpace(size.w, size.h);
    if (!pos) {
      toast('No more space on the screen. Make some room!');
      return;
    }
    updateConfig('display.widgets', [...widgets, createWidget(type, pos.x, pos.y, size.w, size.h)]);
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    disabled={full}
    title="Add a widget"
    class={cn(buttonVariants({ variant: 'outline', size: 'xs' }), 'gap-1.5 w-fit')}
  >
    Add
    <Plus class="size-3" />
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="start" class="w-45">
    {#each PLACEABLE_WIDGET_TYPES as type (type)}
      {@const def = WIDGET_DEFS[type]}
      {@const Icon = def.icon}
      <DropdownMenu.Item disabled={disabled(type)} onSelect={() => add(type)}>
        <Icon />
        {def.label}
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
