<script lang="ts">
  // ───────────────────────────────────────────────────────────────
  //  SizeGrid.svelte — Sélecteur de taille type « tableau Excel »
  //
  //  Grille couvrant [minW..maxW] × [minH..maxH]. Survol → surligne le
  //  rectangle haut-gauche → la cellule. Clic → choisit w×h. Cellules hors
  //  contrainte (carré, pas de place) grisées.
  // ───────────────────────────────────────────────────────────────
  import { cn } from '$shared/utils.js';
  import { WIDGET_GRID_COLS, WIDGET_GRID_ROWS } from '$shared/constants/config-schema.js';
  import type { WidgetSizeRange } from '../widgets/index.js';

  interface Props {
    range: WidgetSizeRange;
    current: { w: number; h: number };
    fits: (w: number, h: number) => boolean;
    onpick: (w: number, h: number) => void;
  }
  let { range, current, fits, onpick }: Props = $props();

  let hover = $state<{ w: number; h: number } | null>(null);

  const cwList = Array.from({ length: WIDGET_GRID_COLS }, (_, i) => i + 1);
  const chList = Array.from({ length: WIDGET_GRID_ROWS }, (_, i) => i + 1);
  const shown = $derived(hover ?? current);

  // Within widget config limits (size range + square constraint)
  const allowed = (w: number, h: number) =>
    w >= range.minW && w <= range.maxW && h >= range.minH && h <= range.maxH && (!range.square || w === h);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex flex-col gap-1" onmouseleave={() => (hover = null)}>
  <div class="grid mx-auto w-fit" style="grid-template-columns:repeat({cwList.length},minmax(0,1fr))">
    {#each chList as ch (ch)}
      {#each cwList as cw (cw)}
        {@const ok = allowed(cw, ch)}
        {@const sel = ok && fits(cw, ch)}
        {@const blocked = ok && !sel}
        {@const inZone = cw <= shown.w && ch <= shown.h}
        {@const hot = sel && inZone}
        {@const isCur = sel && current.w === cw && current.h === ch}
        <button
          type="button"
          disabled={!sel}
          aria-label="{cw}×{ch}"
          onmouseenter={() => sel && (hover = { w: cw, h: ch })}
          onclick={() => sel && onpick(cw, ch)}
          class={cn(
            'aspect-square border transition-all min-w-5 opacity-40',
            !ok &&
              (inZone
                ? 'cursor-not-allowed bg-primary border-primary ring-1 opacity-60 ring-primary/50 '
                : 'cursor-not-allowed bg-muted border-border'),
            blocked && 'cursor-not-allowed bg-muted border-border ',
            sel &&
              (hot
                ? 'bg-primary border-transparent opacity-70 ring-1 ring-primary/70 '
                : 'bg-muted border-border hover:border-primary'),
            isCur && !hover && 'ring-1 ring-primary ',
          )}
        ></button>
      {/each}
    {/each}
  </div>
  <span class="text-[10px] text-center text-muted-foreground tabular-nums">{shown.w}×{shown.h}</span>
</div>
