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
    rowHeight: number;
    gap?: [number, number];
    forceMount?: boolean;
    /**
     * Largeur fixe d'une cellule en px (mode horizontal uniquement).
     * Permet de garder des cartes à taille constante et de déborder dans
     * une zone scrollable, au lieu d'être compressées dans la largeur du
     * conteneur. Ignoré en vertical (les items prennent toute la largeur).
     */
    cellWidth?: number;
    getKey: (item: T, index: number) => string;
    onReorder: (from: number, to: number) => void;
    children: Snippet<[{ item: T; index: number; handlePointerDown: (e: PointerEvent) => void }]>;
  }

  let {
    items,
    orientation = 'vertical',
    rowHeight,
    gap = [8, 8],
    forceMount = false,
    cellWidth,
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

  // En horizontal avec cellWidth, on force la largeur du conteneur du Grid
  // (N cellules + gaps) pour que mosaic calcule une largeur de cellule fixe
  // et que le parent scrollable prenne le relais en cas de débordement.
  const containerWidth = $derived(horizontal && cellWidth ? colCount * cellWidth + (colCount - 1) * gap[0] : undefined);

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

<div bind:this={wrapEl} class="sortable-wrap" style={containerWidth ? `width:${containerWidth}px` : undefined}>
  <Grid bind:items={gridItems} {cols} {rowHeight} {gap} unstyled compact onpointerup={onPointerUp}>
    {#snippet children({ movePointerDown, dataItem }: SnippetArgs)}
      {@const payload = dataItem.data as { item: T; index: number }}
      <div transition:fly={{ ...flyDirection, duration: 250, delay: 80 + payload.index * 40 }} class="w-full h-full">
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
</style>
