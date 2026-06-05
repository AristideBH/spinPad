<script lang="ts">
  import { Drawer as DrawerPrimitive } from 'vaul-svelte';
  import { cn } from '$shared/utils.js';

  let { ref = $bindable(null), class: className, ...restProps }: DrawerPrimitive.DescriptionProps = $props();
</script>

<DrawerPrimitive.Description
  bind:ref
  data-slot="drawer-description"
  class={cn('text-muted-foreground text-sm text-left mt-1 text-balance w-full', className)}
  {...restProps}
/>
