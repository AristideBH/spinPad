<script lang="ts">
  import { cn, type WithElementRef } from '$shared/utils.js';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<main
  bind:this={ref}
  data-slot="sidebar-inset"
  class={cn(
    'bg-background absolute inset-0 md:peer-data-[variant=inset]:mx-2! md:my-2 overflow-y-auto md:peer-data-[variant=inset]:ml-0! md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ms-0! relative flex w-full flex-1 flex-col',
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</main>
