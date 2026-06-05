<script lang="ts" generics="T">
  // ───────────────────────────────────────────────────────────────
  //  Sortable.svelte — Liste réordonnable (drag) sur svelte-mosaic
  //
  //  Enveloppe le Grid de svelte-mosaic pour un usage liste 1-D :
  //  une seule rangée (horizontal) ou une seule colonne (vertical),
  //  poignée de drag personnalisée, et émission d'un (from, to) unique
  //  via onReorder. Le composant ne mute jamais `items` : le parent
  //  applique le déplacement dans le store (source de vérité unique).
  // ───────────────────────────────────────────────────────────────
  import { Grid, type GridItem, type ColsDefinition, type SnippetArgs } from '@arisbh/svelte-mosaic';
  import { gridHelp } from '@arisbh/svelte-mosaic/helper';
  import { deriveSingleMove } from '$shared/constants/reorder.js';
  import type { Snippet } from 'svelte';
  import { fly } from 'svelte/transition';

  interface Props {
    items: T[];
    orientation?: 'horizontal' | 'vertical';
    /** Hauteur de ligne en px, ou "auto" : hauteur pilotée par le contenu (liste 1-D verticale). */
    rowHeight?: number | 'auto';
    /**
     * Largeur de colonne en px (shrink-to-fit, déborde dans une zone scrollable),
     * ou "auto" : largeur pilotée par le contenu (liste 1-D horizontale, le conteneur
     * se réduit au contenu → items condensés à gauche). Ignoré en vertical.
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
  // Alias pour éviter l'ombrage par le snippet `children` du Grid ci-dessous.
  const renderItem = $derived(children);

  const horizontal = $derived(orientation === 'horizontal');
  const colCount = $derived(horizontal ? Math.max(items.length, 1) : 1);
  const cols = $derived<ColsDefinition>([[0, colCount]]);
  const dataOrder = $derived(items.map((it, i) => getKey(it, i)));

  // Largeur fixe horizontale : on garde le chemin éprouvé (grille fluide +
  // largeur de conteneur forcée), au lieu du chemin "colWidth fixe" du module.
  // Seul le mode "auto" passe colWidth au Grid.
  const fixedColWidth = $derived(horizontal && typeof colWidth === 'number' ? colWidth : undefined);
  const forcedWidth = $derived(fixedColWidth ? colCount * fixedColWidth + (colCount - 1) * gap[0] : undefined);
  const gridColWidth = $derived<number | 'auto' | undefined>(colWidth === 'auto' ? 'auto' : undefined);

  // Reconstruit les éléments de grille depuis les données canoniques.
  // Ne dépend pas de `gridItems` → les mutations internes de mosaic
  // pendant le drag ne relancent pas cet effet.
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
        resizable: false, // items toujours 1 unité — pas de redimensionnement
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

  // Verrouille le déplacement sur l'axe de la liste : mosaic suit le pointeur
  // sur X et Y (drag libre 2-D), ce qui fait dériver l'aperçu hors de la liste.
  // On remet à 0 la composante hors-axe du transform de l'item actif.
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
    fastStart
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
  /* Le conteneur interne de mosaic doit remplir l'enveloppe, sinon il
     se réduit à 0 (width:auto) et les cellules sont calculées à 0px. */
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
