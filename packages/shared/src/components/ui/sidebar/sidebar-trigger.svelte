<script lang="ts">
  import { Button } from '$shared/components/ui/button/index.js';
  import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
  import { cn } from '$shared/utils.js';
  import type { ComponentProps } from 'svelte';
  import { useSidebar } from './context.svelte.js';
  import { Menu } from '@lucide/svelte';

  let {
    ref = $bindable(null),
    class: className,
    onclick,
    ...restProps
  }: ComponentProps<typeof Button> & {
    onclick?: (e: MouseEvent) => void;
  } = $props();

  const sidebar = useSidebar();
</script>

<Button
  bind:ref
  data-sidebar="trigger"
  data-slot="sidebar-trigger"
  variant="ghost"
  size="icon-sm"
  class={cn('cn-sidebar-trigger', className)}
  type="button"
  onclick={(e) => {
    onclick?.(e);
    sidebar.toggle();
  }}
  {...restProps}
>
  <Menu />
  <span class="sr-only">Toggle Sidebar</span>
</Button>
