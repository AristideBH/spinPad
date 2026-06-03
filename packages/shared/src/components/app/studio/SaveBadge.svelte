<script lang="ts">
  import { Check } from '@lucide/svelte';
  import { configState } from '$shared/store/config.svelte.js';
  import { serial } from '$shared/store/serial.svelte.js';
  import { devMode } from '$shared/store/devMode.svelte.js';
  import { Spinner } from '$shared/components/ui/spinner';
  import Badge from '$shared/components/ui/badge/badge.svelte';

  const isOnline = $derived(serial.connected || devMode.active);
</script>

{#if isOnline}
  <Badge variant="ghost" class="gap-1.5 bg-muted/50! text-muted-foreground/80!">
    {#if configState.isDirty}
      <Spinner /> Sauvegarde
    {:else}
      <Check /> Sauvegardé
    {/if}
  </Badge>
{/if}
