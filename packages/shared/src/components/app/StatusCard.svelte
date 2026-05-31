<script lang="ts">
  import { serial } from '$shared/store/serial.svelte.js';
  import { devMode } from '$shared/store/devMode.svelte.js';
  import { Spinner } from '$shared/components/ui/spinner/index.js';
  import { deviceStatus } from '$shared/store/deviceStatus.svelte.js';

  import { Badge } from '$shared/components/ui/badge/index.js';
  import { configState, loadConfig } from '$shared/store/config.svelte';

  type DS = NonNullable<typeof deviceStatus.data>;

  const data = $derived(deviceStatus.data as DS | null);
</script>

<Badge variant="secondary">
  {#if configState.isLoading}
    <Spinner />
    Connecting
  {:else}
    <p
      class="size-1.5 mr-0.5 rounded-full transition-colors"
      class:bg-emerald-500={serial.connected && !configState.loadError}
      class:bg-amber-400={!serial.connected && !devMode.active && !serial.reconnecting}
      class:animate-pulse={serial.reconnecting}
      class:bg-yellow-400={serial.reconnecting}
      class:bg-destructive={configState.loadError && !devMode.active}
      class:bg-blue-400={devMode.active}
    ></p>

    {#if devMode.active}
      Démo
    {:else if data?.connection?.studio_mode}
      Studio Mode
    {:else if serial.reconnecting}
      Reconnexion {serial.reconnectAttempt}/{15}…
    {:else if configState.loadError}
      Erreur
    {:else}
      {serial.connected ? 'Connecté' : 'Non connecté'}
    {/if}
  {/if}
</Badge>
