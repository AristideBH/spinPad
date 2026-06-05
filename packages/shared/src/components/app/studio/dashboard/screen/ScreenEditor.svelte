<script lang="ts">
  // ───────────────────────────────────────────────────────────────
  //  ScreenEditor.svelte — Éditeur de widgets OLED (grille mosaïque 4×4)
  //
  //  Modèle span-based : chaque widget occupe (x, y, w, h) sur une grille
  //  logique 4×4. Drag pour repositionner (poignée), taille + options via le
  //  menu (DropdownMenu) — pas de redimensionnement à la souris, pas de
  //  chevauchement (collision="none" + bounds). La prop `editable` masque
  //  poignée/menu (aperçu seul). Métadonnées par widget : registre ./widgets.
  //  Source de vérité unique : le store config.
  //
  //  Note : la grille remplit le conteneur sur les deux axes (pas de ratio
  //  d'aspect imposé) ; mosaic utilise des pistes uniformes, donc l'anneau
  //  extérieur 10px réel de l'OLED n'est pas reproduit ici.
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

  interface Props {
    /** Mode édition : affiche la poignée de drag et le menu d'options. */
    editable?: boolean;
  }
  let { editable = true }: Props = $props();

  let gridRef = $state();

  const COLS = WIDGET_GRID_COLS;
  const ROWS = WIDGET_GRID_ROWS;

  // ── Données (store = source de vérité) ──────────────────────────
  const widgets = $derived<WidgetConfig[]>((configState.data?.display?.widgets ?? defaultWidgets()) as WidgetConfig[]);

  // L'ajout de widgets vit dans ScreenAddMenu (en-tête de la tuile). Ici on ne
  // fait qu'éditer/déplacer/supprimer les widgets existants.
  function writeWidgets(next: WidgetConfig[]) {
    updateConfig('display.widgets', next);
  }
  function patchWidget(idx: number, patch: Partial<WidgetConfig>) {
    writeWidgets(widgets.map((w, i) => (i === idx ? ({ ...w, ...patch } as WidgetConfig) : w)));
  }
  function removeWidget(idx: number) {
    writeWidgets(widgets.filter((_, i) => i !== idx));
  }

  // Position d'ancrage (clampée à la grille) qu'aurait le widget en taille w×h.
  function anchorFor(cur: WidgetConfig, w: number, h: number) {
    return { x: Math.min(cur.x, COLS - w), y: Math.min(cur.y, ROWS - h) };
  }

  // Occupation de la grille par tous les widgets sauf `skip`.
  function occupancyExcept(skip: number): boolean[][] {
    const g = Array.from({ length: ROWS }, () => Array<boolean>(COLS).fill(false));
    widgets.forEach((wd, i) => {
      if (i === skip) return;
      for (let yy = wd.y; yy < wd.y + wd.h; yy++)
        for (let xx = wd.x; xx < wd.x + wd.w; xx++) if (g[yy]?.[xx] !== undefined) g[yy][xx] = true;
    });
    return g;
  }

  // Une taille est disponible si le widget tient (sans chevauchement) à sa
  // position d'ancrage. Les tailles plus grandes sans place sont grisées.
  function canResize(idx: number, w: number, h: number): boolean {
    const { x, y } = anchorFor(widgets[idx], w, h);
    const g = occupancyExcept(idx);
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (g[yy]?.[xx]) return false;
    return true;
  }

  // Changer la taille : refuse si pas de place, sinon clampe la position.
  function setSize(idx: number, w: number, h: number) {
    if (!canResize(idx, w, h)) return;
    const { x, y } = anchorFor(widgets[idx], w, h);
    patchWidget(idx, { w, h, x, y } as Partial<WidgetConfig>);
  }

  // ── Pont mosaic ↔ store (cf. Sortable.svelte) ───────────────────
  const cols: ColsDefinition = [[0, COLS]];

  let gridItems = $state<GridItem[]>([]);
  // Reconstruit depuis le store ; ne dépend pas de gridItems → les mutations
  // internes de mosaic pendant le drag ne relancent pas l'effet.
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

  // À la fin d'un drag : persiste les positions si elles ont changé.
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
    if (changed) writeWidgets(next);
  }

  // La grille remplit le conteneur sur les deux axes : largeur via les 4
  // colonnes mosaic, hauteur via rowHeight dérivée de la hauteur mesurée du
  // conteneur. mosaic creuse les gaps À L'INTÉRIEUR des items (pas d'espace
  // externe), donc la hauteur totale = ROWS × rowHeight → rowHeight = h / ROWS.
  const GAP = 5;
  let gridH = $state(0);
  const rowHeight = $derived(gridH > 0 ? gridH / ROWS : 40);

  // Horloge live (widget Clock) — re-render chaque seconde.
  let now = $state(new Date());
  $effect(() => {
    const id = setInterval(() => (now = new Date()), 1000);
    return () => clearInterval(id);
  });
</script>

<div class="flex flex-col h-full gap-3">
  {#if widgets.length === 0}
    <p class="grid flex-1 px-3 pb-3 text-xs text-center text-balance text-muted-foreground/30 place-items-center">
      {editable ? 'Aucun widget. Utilisez le menu « Ajouter ».' : '(-■_■)'}
    </p>
  {:else}
    <!-- ── Grille d'édition (remplit le conteneur sur les deux axes) ─ -->
    <div class="flex-1 w-full px-0.5 pt-1 rounded-t-xl border-t bg-background/50">
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
          autoCompress
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
                variant="muted"
                size="xs"
                class="relative gap-1 w-full rounded-xl h-full px-2 py-1! overflow-hidden border-border/60 flex-nowrap"
              >
                <Item.Content class="flex flex-row min-w-0 col-span-2 gap-1.5! items-baseline">
                  {#if editable}
                    <button
                      type="button"
                      data-grip
                      class="flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground cursor-grab touch-none"
                      title="Déplacer"
                      onpointerdown={movePointerDown}
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

                <!-- options + suppression (menu, design aligné sur LayerSwitcher) -->
                {#if editable}
                  <Item.Actions>
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger
                        title="Options du widget"
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
                            <span class="text-xs text-muted-foreground">Taille</span>
                            <SizeGrid
                              range={def.size}
                              current={{ w: w.w, h: w.h }}
                              fits={(cw, ch) => canResize(idx, cw, ch)}
                              onpick={(cw, ch) => setSize(idx, cw, ch)}
                            />
                          </div>
                        {/if}

                        {#if options.length > 0}
                          {#if sizes.length > 1}<DropdownMenu.Separator />{/if}
                          <OptionControls widget={w} {options} onPatch={(p) => patchWidget(idx, p)} />
                        {/if}

                        {#if hasOpts}<DropdownMenu.Separator />{/if}
                        <DropdownMenu.Item variant="destructive" onSelect={() => removeWidget(idx)}>
                          <Trash2 />
                          Supprimer
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
