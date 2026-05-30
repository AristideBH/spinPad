<script lang="ts">
  import { serial } from '$shared/store/serial.svelte.js';
  import { devMode } from '$shared/store/devMode.svelte.js';
  import { Spinner } from '$shared/components/ui/spinner/index.js';

  import { Badge } from '$shared/components/ui/badge/index.js';
  import { configState, loadConfig } from '$shared/store/config.svelte';
  import { Button, buttonVariants } from '$shared/components/ui/button';
  import * as Popover from '$shared/components/ui/popover/index.js';
  import { FlaskConical } from '@lucide/svelte';
  import { cn } from '$shared/utils';

  import * as Card from '$shared/components/ui/card/index.js';
  import DemoSettings from './studio/DemoSettings.svelte';

  async function handleDevMode() {
    devMode.active = !devMode.active;
    await loadConfig();
    configState.loadError = null;
  }
</script>

<!-- Dev mode toggle (visible si non connecté et non actif) -->
{#if !serial.connected && devMode.active}
  <Popover.Root>
    <Popover.Trigger class={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
      <FlaskConical class="size-4" />
    </Popover.Trigger>
    <Popover.Content class="w-80">
      <DemoSettings />
    </Popover.Content>
  </Popover.Root>
{/if}

<Badge variant="secondary">
  {#if configState.isLoading}
    <Spinner />
    Connecting
  {:else}
    <div
      class="size-1.5 mr-0.5 rounded-full transition-colors"
      class:bg-emerald-500={serial.connected && !configState.loadError}
      class:bg-amber-400={!serial.connected && !devMode.active && !serial.reconnecting}
      class:animate-pulse={serial.reconnecting}
      class:bg-yellow-400={serial.reconnecting}
      class:bg-destructive={configState.loadError && !devMode.active}
      class:bg-blue-400={devMode.active}
    ></div>

    {#if devMode.active}
      Démo
    {:else if serial.reconnecting}
      Reconnexion {serial.reconnectAttempt}/{15}…
    {:else if configState.loadError}
      Erreur
    {:else}
      {serial.connected ? 'Connecté' : 'Non connecté'}
    {/if}
  {/if}
</Badge>
