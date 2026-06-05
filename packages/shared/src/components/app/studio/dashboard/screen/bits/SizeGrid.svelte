<script lang="ts">
  // ───────────────────────────────────────────────────────────────
  //  SizeGrid.svelte — Sélecteur de taille type « tableau Excel »
  //
  //  Grille couvrant [minW..maxW] × [minH..maxH]. Survol → surligne le
  //  rectangle haut-gauche → la cellule. Clic → choisit w×h. Cellules hors
  //  contrainte (carré, pas de place) grisées.
  // ───────────────────────────────────────────────────────────────
  import { cn } from '$shared/utils.js';
  import type { WidgetSizeRange } from '../widgets/index.js';

  interface Props {
    range: WidgetSizeRange;
    current: { w: number; h: number };
    fits: (w: number, h: number) => boolean;
    onpick: (w: number, h: number) => void;
  }
  let { range, current, fits, onpick }: Props = $props();

  let hover = $state<{ w: number; h: number } | null>(null);

  const cwList = $derived(Array.from({ length: range.maxW - range.minW + 1 }, (_, i) => range.minW + i));
  const chList = $derived(Array.from({ length: range.maxH - range.minH + 1 }, (_, i) => range.minH + i));
  const shown = $derived(hover ?? current);

  const selectable = (w: number, h: number) => (!range.square || w === h) && fits(w, h);
</script>

<div class="flex flex-col gap-1">
  <div class="grid w-fit" style="grid-template-columns:repeat({cwList.length},minmax(0,1fr))">
    {#each chList as ch (ch)}
      {#each cwList as cw (cw)}
        {@const sel = selectable(cw, ch)}
        {@const hot = cw <= shown.w && ch <= shown.h}
        {@const isCur = current.w === cw && current.h === ch}
        <button
          type="button"
          disabled={!sel}
          aria-label="{cw}×{ch}"
          onmouseenter={() => sel && (hover = { w: cw, h: ch })}
          onmouseleave={() => (hover = null)}
          onclick={() => sel && onpick(cw, ch)}
          class={cn(
            'aspect-square border transition-colors min-w-5',
            !sel
              ? 'opacity-20 cursor-not-allowed border-border bg-muted/40'
              : hot
                ? 'bg-primary/50 border-primary/50'
                : 'bg-muted border-border hover:border-primary/50',
            isCur && !hover ? 'ring-1 ring-primary/50 ring-offset-1 ring-offset-popover' : '',
          )}
        ></button>
      {/each}
    {/each}
  </div>
  <span class="text-[10px] text-center text-muted-foreground tabular-nums">{shown.w}×{shown.h}</span>
</div>
