<script lang="ts">
  import { Undo2, Redo2, FlaskConical, Info } from '@lucide/svelte';
  import { undo, redo, canUndo, canRedo } from '$shared/store/config.svelte.js';
  import { serial } from '$shared/store/serial.svelte.js';
  import { devMode } from '$shared/store/devMode.svelte.js';
  import { startPolling, stopPolling } from '$shared/store/deviceStatus.svelte.js';
  import { keyVisuals } from '$shared/store/keyVisuals.svelte.js';
  import { Button, buttonVariants } from '$shared/components/ui/button/index.js';
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import * as Popover from '$shared/components/ui/popover/index.js';
  import DemoSettings from './connect/DemoSettings.svelte';
  import { cn } from '$shared';
  import SaveBadge from './SaveBadge.svelte';
  import { featureFlags } from '$shared/store/featureFlags.svelte';

  let { helpHref = '/docs/studio/layers/' }: { helpHref?: string } = $props();

  // Start polling the device status when connected or in demo mode.
  // The store automatically routes to the right transport (serial / http / mock).
  $effect(() => {
    const shouldPoll = serial.connected || devMode.active || import.meta.env.VITE_TRANSPORT === 'http';
    if (shouldPoll) {
      startPolling(5000);
      return () => stopPolling();
    }
  });

  $effect(() => {
    if (serial.connected || devMode.active) {
      keyVisuals.start();
      return () => keyVisuals.stop();
    }
  });

  const isOnline = $derived(serial.connected || devMode.active);
</script>

{#if isOnline}
  <!-- Auto-save indicator -->
  <SaveBadge />

  <div class="grow"></div>

  <!-- Dev mode toggle (visible as soon as demo mode is active) -->
  {#if featureFlags.testMode}
    {#if devMode.active}
      <Popover.Root>
        <Popover.Trigger class={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
          <FlaskConical class="size-4" />
        </Popover.Trigger>
        <Popover.Content align="end" class="p-0 w-2xs rounded-xl">
          <DemoSettings />
        </Popover.Content>
      </Popover.Root>
    {/if}
  {/if}

  <!-- Undo / Redo -->
  <ButtonGroup.Root>
    <Button size="icon" variant="secondary" onclick={undo} disabled={!canUndo()} title="Undo (Ctrl+Z)">
      <Undo2 class="size-4" />
    </Button>
    <Button size="icon" variant="secondary" onclick={redo} disabled={!canRedo()} title="Redo (Ctrl+Y)">
      <Redo2 class="size-4" />
    </Button>
  </ButtonGroup.Root>

  <Button size="icon" variant="outline" title="Help & documentation" href={helpHref}>
    <Info class="size-4" />
  </Button>
{/if}
