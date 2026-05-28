<script lang="ts">
  import { connect, serial } from '$shared/store/serial.svelte.js';
  import { loadConfig } from '$shared/store/config.svelte.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import { PlugZap, FlaskConical, FolderCodeIcon } from '@lucide/svelte';
  import { devMode } from '$shared/store/devMode.svelte.js';

  import * as Empty from '$shared/components/ui/empty/index.js';
  import * as Alert from '$shared/components/ui/alert/index.js';

  async function handleConnect() {
    const ok = await connect();
    if (ok) await loadConfig();
  }

  async function handleDevMode() {
    devMode.active = true;
    await loadConfig();
  }
</script>


<Empty.Root>
  <Empty.Header>
    <Empty.Media variant="icon">
      <FolderCodeIcon />
    </Empty.Media>
    <Empty.Title>Connecter votre SpinPad</Empty.Title>
    <Empty.Description>Prérequis : Chrome ou Edge, clavier USB. WebSerial non supporté sur Firefox.</Empty.Description>
  </Empty.Header>
  <Empty.Content>
    <Button onclick={handleConnect} size="lg" class="gap-2">
      <PlugZap class="size-5" />
      Connecter le clavier
    </Button>
    {#if serial.error}
      <Alert.Root variant="destructive" >
        <Alert.Title>Erreur</Alert.Title>
        <Alert.Description>{serial.error}</Alert.Description>
      </Alert.Root>
    {/if}

    <Button variant="ghost" size="sm" onclick={handleDevMode} class="text-amber-400 hover:text-amber-300 gap-1.5">
      <FlaskConical class="size-4" />
      Lancer le mode démo
    </Button>
  </Empty.Content>
</Empty.Root>
