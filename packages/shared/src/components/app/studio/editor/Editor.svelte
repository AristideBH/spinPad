<script lang="ts">
  import { Button, buttonVariants } from '$shared/components/ui/button/index.js';
  import * as Card from '$shared/components/ui/card/index.js';
  import { configState, exportProfiles, importProfiles } from '$shared/store/config.svelte.js';
  import { serial } from '$shared/store/serial.svelte.js';
  import { Activity, Download, Plus, Share, Upload } from '@lucide/svelte';
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
  import { fly } from 'svelte/transition';

  const ctx = createKeypadContext();

  // Stop training when device disconnects
  $effect(() => {
    if (!serial.connected && ctx.trainingActive) ctx.stopTraining();
  });

  let fileInput = $state<HTMLInputElement | null>(null);
  let selectedExport = $state<Set<number>>(new Set());
  let dialogOpen = $state(false);

  const profileList = $derived(configState.data?.profiles ?? []);
  const allSelected = $derived(profileList.length > 0 && selectedExport.size === profileList.length);

  function toggleSelect(i: number) {
    const next = new Set(selectedExport);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    selectedExport = next;
  }

  function toggleAll() {
    selectedExport = allSelected ? new Set() : new Set(profileList.map((_, i) => i));
  }

  function onImportClick() {
    fileInput?.click();
  }

  async function onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      await importProfiles(file);
      dialogOpen = false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[import-profiles]', msg);
      toast.error('Import échoué', { description: msg });
    }
    if (fileInput) {
      fileInput.value = '';
    }
  }

  function onExportClick() {
    if (selectedExport.size === 0) return;
    exportProfiles([...selectedExport].sort((a, b) => a - b));
  }
</script>

<Card.Root size="sm">
  <Card.Header class="flex items-start gap-1.5">
    <ProfileSwitcher />
    <!-- {#if serial.connected}
          <Button
            variant={ctx.trainingActive ? 'default' : 'outline'}
            onclick={() => ctx.toggleTraining()}
            size="sm"
            title="Mode entraînement : voir les touches pressées en temps réel"
          >
            <Activity class="size-3.5" />
          </Button>
        {/if} -->
  </Card.Header>

  <!-- Editor -->
  <div transition:fly={{ y: 20, duration: 350, delay: 200 }} class="relative">
    <Card.Content class="flex flex-wrap items-start justify-start gap-4">
      {#if ctx.layer}
        <div class="grow min-w-[180px] max-w-[200px]">
          <LayerSwitcher />
          <TrainingPanel />
        </div>

        <div class="flex flex-wrap gap-12 p-6 border grow rounded-2xl justify-evenly">
          <KeyGrid />
          <Encoder />
        </div>
      {/if}
    </Card.Content>
  </div>
</Card.Root>

<!-- Keycode Picker (two-stage : menu → live-record / liste) -->
<KeycodePicker />
