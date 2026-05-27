<script lang="ts">
  import { connect, serial } from '../../../serial/index.svelte.js';
  import { loadConfig } from '../../../store/config.svelte.js';
  import { Button } from '../../ui/button/index.js';
  import { PlugZap, FlaskConical } from '@lucide/svelte';
  import { devMode } from '../../../store/devMode.svelte.js';

  async function handleConnect() {
    const ok = await connect();
    if (ok) await loadConfig();
  }

  async function handleDevMode() {
    devMode.active = true;
    await loadConfig();
  }
</script>

<div class="flex flex-col items-center gap-4 py-12">
  <Button onclick={handleConnect} size="lg" class="gap-2">
    <PlugZap class="size-5" />
    Connecter le clavier
  </Button>

  {#if serial.error}
    <p class="text-sm text-destructive">{serial.error}</p>
  {/if}

  <div class="mt-2 text-center">
    <Button
      variant="ghost"
      size="sm"
      onclick={handleDevMode}
      class="text-amber-400 hover:text-amber-300 gap-1.5"
    >
      <FlaskConical class="size-4" />
      Lancer le mode démo
    </Button>
    <p class="mt-1 text-xs text-muted-foreground">
      Prérequis : Chrome ou Edge, clavier USB. WebSerial non supporté sur
      Firefox.
    </p>
  </div>
</div>
