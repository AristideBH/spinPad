<script lang="ts">
  import { connect, serial } from '$shared/store/serial.svelte.js';
  import { loadConfig } from '$shared/store/config.svelte.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import { PlugZap, FlaskConical, FolderCodeIcon, Command } from '@lucide/svelte';
  import { devMode } from '$shared/store/devMode.svelte.js';

  import * as Empty from '$shared/components/ui/empty/index.js';
  import * as Alert from '$shared/components/ui/alert/index.js';

  async function handleConnect() {
    const ok = await connect();
    if (ok) await loadConfig();
  }

  async function handleDevMode() {
    devMode.active = true;
    serial.connected = true; // mock serial plugged in for the WebSerial-reserved UI
    await loadConfig();
  }
</script>

<Empty.Root
  class="absolute left-0 right-0 z-10 pt-48 mx-auto top-0 bottom-0 bg-linear-to-b from-transparent to-background from-30% to-80%"
>
  <Empty.Header>
    <Empty.Media variant="icon">
      <Command />
    </Empty.Media>
    <Empty.Title>Connect your SpinPad</Empty.Title>
    <Empty.Description>Requirements: Chrome or Edge, USB keyboard. WebSerial not supported on Firefox.</Empty.Description>
  </Empty.Header>
  <Empty.Content>
    <Button onclick={handleConnect} size="lg" class="gap-2">
      <PlugZap class="size-5" />
      Connect the keyboard
    </Button>
    {#if serial.error}
      <Alert.Root variant="destructive">
        <Alert.Title>Error</Alert.Title>
        <Alert.Description>{serial.error}</Alert.Description>
      </Alert.Root>
    {/if}

    <Button variant="ghost" size="sm" onclick={handleDevMode} class="text-amber-400 hover:text-amber-300 gap-1.5">
      <FlaskConical class="size-4" />
      Launch demo mode
    </Button>
  </Empty.Content>
</Empty.Root>
