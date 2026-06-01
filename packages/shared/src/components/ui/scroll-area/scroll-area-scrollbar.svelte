<script lang="ts">
  import { ScrollArea as ScrollAreaPrimitive } from 'bits-ui';
  import { cn, type WithoutChild } from '$shared/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    orientation = 'vertical',
    children,
    ...restProps
  }: WithoutChild<ScrollAreaPrimitive.ScrollbarProps> = $props();
</script>

<ScrollAreaPrimitive.Scrollbar
  bind:ref
  data-slot="scroll-area-scrollbar"
  data-orientation={orientation}
  {orientation}
  class={cn(
    // Overlay : positionné en absolu pour ne PAS réserver d'espace (pas de
    // padding parasite sous le contenu). Fin par défaut, s'épaissit au
    // survol pour rester accessible.
    'absolute z-20 flex touch-none select-none p-px transition-[width,height] duration-150',
    'data-horizontal:inset-x-0 data-horizontal:bottom-0 data-horizontal:h-1 data-horizontal:flex-col hover:data-horizontal:h-2',
    'data-vertical:inset-y-0 data-vertical:right-0 data-vertical:w-1 hover:data-vertical:w-2',
    className,
  )}
  {...restProps}
>
  {@render children?.()}
  <ScrollAreaPrimitive.Thumb
    data-slot="scroll-area-thumb"
    class="relative flex-1 transition-colors rounded-full bg-border/50 hover:bg-border/70"
  />
</ScrollAreaPrimitive.Scrollbar>
