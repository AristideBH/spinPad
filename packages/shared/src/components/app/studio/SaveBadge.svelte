<script lang="ts">
  import { Check } from '@lucide/svelte';
  import { configState } from '$shared/store/config.svelte.js';
  import { serial } from '$shared/store/serial.svelte.js';
  import { devMode } from '$shared/store/devMode.svelte.js';
  import { Spinner } from '$shared/components/ui/spinner';
  import Badge from '$shared/components/ui/badge/badge.svelte';
  import { cn } from '$shared';

  type Props = {
    class?: string;
  };

  let { class: className = '' }: Props = $props();

  const isOnline = $derived(serial.connected || devMode.active);
</script>

{#if isOnline}
  <Badge variant="ghost" class={cn('gap-1.5 bg-muted/50! text-muted-foreground/80!', className)}>
    {#if configState.isDirty}
      <Spinner /> Saving
    {:else}
      <Check /> Saved
    {/if}
  </Badge>
{/if}
