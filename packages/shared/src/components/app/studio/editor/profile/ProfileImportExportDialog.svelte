<script lang="ts">
  import { configState, importProfiles, exportProfiles } from '$shared/store/config.svelte.js';
  import * as Dialog from '$shared/components/ui/dialog/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import { Download, Upload } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';

  let { open = $bindable(false) }: { open: boolean } = $props();

  const profileList = $derived(configState.data?.profiles ?? []);
  let selectedExport = $state<Set<number>>(new Set());
  const allSelected = $derived(profileList.length > 0 && selectedExport.size === profileList.length);
  let fileInput = $state<HTMLInputElement | null>(null);

  function toggleSelect(i: number) {
    const next = new Set(selectedExport);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    selectedExport = next;
  }

  function toggleAll() {
    selectedExport = allSelected ? new Set() : new Set(profileList.map((_, i) => i));
  }

  async function onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      await importProfiles(file);
      open = false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Import failed', { description: msg });
    }
    if (fileInput) fileInput.value = '';
  }

  function onExportClick() {
    if (selectedExport.size === 0) return;
    exportProfiles([...selectedExport].sort((a, b) => a - b));
  }
</script>

<Dialog.Root {open} onOpenChange={(o) => { if (!o) open = false; }}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Profiles — import / export</Dialog.Title>
      <Dialog.Description class="text-balance">
        Back up or load profiles (.spinpad-profiles). Importing overwrites the current profiles.
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-muted-foreground">To export</span>
        <Button variant="ghost" size="sm" onclick={toggleAll} disabled={profileList.length === 0}>
          {allSelected ? 'Deselect all' : 'Select all'}
        </Button>
      </div>
      <div class="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
        {#each profileList as p, i (i)}
          {@const checked = selectedExport.has(i)}
          <button
            type="button"
            onclick={() => toggleSelect(i)}
            class={[
              'flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors',
              checked ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50',
            ].join(' ')}
          >
            <span
              class={[
                'flex size-4 shrink-0 items-center justify-center rounded-sm border',
                checked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground',
              ].join(' ')}
              aria-hidden="true"
            >
              {#if checked}✓{/if}
            </span>
            <span class="flex-1 truncate">{p.name?.trim() || `Profile ${i + 1}`}</span>
            <span class="text-xs text-muted-foreground">{p.layers?.length ?? 0} layer(s)</span>
          </button>
        {/each}
      </div>

      <div class="flex gap-2 pt-2 border-t border-border">
        <Button
          variant="outline"
          onclick={() => fileInput?.click()}
          disabled={!configState.data}
          class="gap-1.5"
        >
          <Upload class="size-4" /> Import
        </Button>
        <Button onclick={onExportClick} disabled={selectedExport.size === 0} class="gap-1.5">
          <Download class="size-4" /> Export ({selectedExport.size})
        </Button>
      </div>

      <input
        bind:this={fileInput}
        type="file"
        accept=".spinpad-profiles,.json"
        class="hidden"
        onchange={onFileSelected}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>
