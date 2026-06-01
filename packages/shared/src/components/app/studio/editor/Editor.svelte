<script lang="ts">
  import { Button, buttonVariants } from '$shared/components/ui/button/index.js';
  import * as Card from '$shared/components/ui/card/index.js';
  import { configState, exportConfig, importConfig } from '$shared/store/config.svelte.js';
  import { serial } from '$shared/store/serial.svelte.js';
  import { Activity, Download, Share, Upload } from '@lucide/svelte';
  import { createKeypadContext } from '../editor/keypad-context.svelte.js';
  import KeyGrid from '../editor/KeyGrid.svelte';
  import KeycodePicker from '../editor/KeycodePicker.svelte';
  import ProfileSwitcher from '../editor/ProfileSwitcher.svelte';
  import TrainingPanel from '../editor/TrainingPanel.svelte';
  import Encoder from '../editor/Encoder.svelte';
  import LayerSwitcher from '../editor/LayerSwitcher.svelte';
  import * as Dialog from '$shared/components/ui/dialog/index.js';
  import { toast } from 'svelte-sonner';
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';

  const ctx = createKeypadContext();

  // Stop training when device disconnects
  $effect(() => {
    if (!serial.connected && ctx.trainingActive) ctx.stopTraining();
  });

  let fileInput = $state<HTMLInputElement | null>(null);

  function onImportClick() {
    fileInput?.click();
  }

  async function onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      await importConfig(file);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[import]', msg);
      toast.error('Import échoué', { description: msg });
    }
    if (fileInput) {
      fileInput.value = '';
    }
  }

</script>

<Card.Root size="sm">
  <Card.Header class="flex items-start gap-1.5">
    <ProfileSwitcher />

    <ButtonGroup.Root orientation="vertical" aria-label="Media controls" class="h-fit"></ButtonGroup.Root>
    <Card.Action class="flex flex-col items-center h-full gap-2 ml-auto">
      {#if serial.connected}
        <Button
          variant={ctx.trainingActive ? 'default' : 'outline'}
          onclick={() => ctx.toggleTraining()}
          size="icon-lg"
          title="Mode entraînement : voir les touches pressées en temps réel"
        >
          <Activity class="size-3.5" />
          <!-- {ctx.trainingActive ? 'Arrêter' : 'Entraînement'} -->
        </Button>
      {/if}

      <Dialog.Root>
        <Dialog.Trigger class={buttonVariants({ variant: 'outline', size: 'icon-lg' })} title="Import/Export">
          <Share />
        </Dialog.Trigger>
        <Dialog.Content class="sm:max-w-md">
          <Dialog.Header>
            <Dialog.Title>Importer / Exporter</Dialog.Title>
            <Dialog.Description>Sauvegardez ou chargez une configuration au format .spinpad.</Dialog.Description>
          </Dialog.Header>
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              onclick={onImportClick}
              title="Importer une config (.spinpad)"
              disabled={!configState.data}
              class="gap-1.5"
            >
              <Upload class="size-4" /> Importer
            </Button>

            <Button
              variant="outline"
              onclick={exportConfig}
              title="Exporter la config (.spinpad)"
              disabled={!configState.data}
              class="gap-1.5"
            >
              <Download class="size-4" /> Exporter
            </Button>

            <!-- Hidden file input for import -->
            <input bind:this={fileInput} type="file" accept=".spinpad,.json" class="hidden" onchange={onFileSelected} />
          </div>
          <Dialog.Footer class="sm:justify-start">
            <Dialog.Close class={buttonVariants({ variant: 'secondary' })}>Fermer</Dialog.Close>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>

      <!-- {#if ctx.orientDeg !== 0}
        <p class="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
          <span>Orientation</span>
          <span class="px-1 font-mono rounded bg-muted">{ctx.orientDeg}°</span>
        </p>
      {/if} -->
    </Card.Action>
  </Card.Header>

  <!-- Editor -->
  <Card.Content class="flex flex-wrap items-start justify-start gap-4">
    {#if ctx.layer}
      <LayerSwitcher />
      <TrainingPanel />
      <!-- <Macros /> -->

      <div class="flex flex-wrap gap-12 p-6 border grow rounded-2xl justify-evenly">
        <KeyGrid />
        <Encoder />
      </div>
    {/if}
  </Card.Content>
</Card.Root>

<!-- Keycode Picker (two-stage : menu → live-record / liste) -->
<KeycodePicker />
