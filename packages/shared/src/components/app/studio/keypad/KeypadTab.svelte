<script lang="ts">
  import { Button } from '$shared/components/ui/button/index.js';
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$shared/components/ui/dialog/index.js';
  import { Input } from '$shared/components/ui/input/index.js';
  import { Label } from '$shared/components/ui/label/index.js';
  import { KEYCODES, KEYCODES_FLAT, type Keycode } from '$shared/constants/keycodes.js';
  import { configState } from '$shared/store/config.svelte.js';
  import { serial } from '$shared/store/serial.svelte.js';
  import { Activity } from '@lucide/svelte';
  import { createKeypadContext } from './keypad-context.svelte.js';
  import KeyGrid from './KeyGrid.svelte';
  import MacroPad from './MacroPad.svelte';
  import ProfileLayerSwitcher from './ProfileLayerSwitcher.svelte';
  import TrainingPanel from './TrainingPanel.svelte';
  import { Spinner } from '$shared/components/ui/spinner/index.js';
  import * as Item from '$shared/components/ui/item/index.js';
  import Encoder from './Encoder.svelte';

  const ctx = createKeypadContext();

  // Stop training when device disconnects
  $effect(() => {
    if (!serial.connected && ctx.trainingActive) ctx.stopTraining();
  });

  const typedEntries = Object.entries(KEYCODES) as [string, Keycode[]][];

  const filteredKeycodes = $derived(
    ctx.searchQuery
      ? KEYCODES_FLAT.filter((k: Keycode) => k.label.toLowerCase().includes(ctx.searchQuery.toLowerCase()))
      : null,
  );

  const CATEGORY_COLORS: Record<string, string> = {
    letter: 'bg-blue-950/80 hover:bg-blue-900/80',
    number: 'bg-lime-950/80 hover:bg-lime-900/80',
    special: 'bg-slate-800/80 hover:bg-slate-700/80',
    modifier: 'bg-violet-950/80 hover:bg-violet-900/80',
    layer: 'bg-green-950/80 hover:bg-green-900/80',
    media: 'bg-orange-950/80 hover:bg-orange-900/80',
    firmware: 'bg-purple-950/80 hover:bg-purple-900/80',
    macro: 'bg-rose-950/80 hover:bg-rose-900/80',
  };
</script>

<!-- Toolbar -->
<div class="flex flex-wrap items-end justify-start gap-4 mb-6">
  <ProfileLayerSwitcher />

  {#if serial.connected}
    <Button
      variant={ctx.trainingActive ? 'default' : 'outline'}
      size="sm"
      onclick={() => ctx.toggleTraining()}
      class="gap-1.5 ml-auto"
      title="Mode entraînement : voir les touches pressées en temps réel"
    >
      <Activity class="size-3.5" />
      {ctx.trainingActive ? 'Arrêter' : 'Entraînement'}
    </Button>
  {/if}
</div>

{#if ctx.layer}
  {#if ctx.orientDeg !== 0}
    <p class="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
      <span>Orientation</span>
      <span class="px-1 font-mono rounded bg-muted">{ctx.orientDeg}°</span>
    </p>
  {/if}

  <KeyGrid />
  <Encoder />
  <TrainingPanel />
  <MacroPad />
{/if}

<!-- Keycode Picker Dialog -->
<Dialog bind:open={ctx.pickerOpen}>
  <DialogContent class="max-w-lg max-h-[80vh] flex flex-col">
    <DialogHeader>
      <DialogTitle>Choisir une action</DialogTitle>
    </DialogHeader>

    <Input type="text" placeholder="Rechercher un keycode…" bind:value={ctx.searchQuery} autofocus class="shrink-0" />

    <div class="flex-1 pr-1 mt-2 overflow-y-auto">
      {#if filteredKeycodes}
        <div class="flex flex-wrap gap-1.5">
          {#each filteredKeycodes as kc}
            <Button
              class="text-foreground text-xs cursor-pointer {CATEGORY_COLORS[kc.category] ?? 'bg-card'}"
              onclick={() => ctx.selectKeycode(kc)}>{kc.label}</Button
            >
          {/each}
        </div>
      {:else}
        {#each typedEntries as [cat, keys]}
          <div class="mb-4">
            <Label class="mb-2 text-xs uppercase">{cat}</Label>
            <div class="flex flex-wrap gap-1.5">
              {#each keys as kc}
                <Button
                  class="text-foreground text-xs cursor-pointer {CATEGORY_COLORS[kc.category] ?? 'bg-card'}"
                  onclick={() => ctx.selectKeycode(kc)}>{kc.label}</Button
                >
              {/each}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </DialogContent>
</Dialog>
