<script lang="ts">
  import { Label } from '$shared/components/ui/label/index.js';
  import { configState, deleteLayer, editLayer } from '$shared/store/config.svelte.js';
  import { getKeypadContext } from './keypad-context.svelte.js';
  import * as RadioGroup from '$shared/components/ui/radio-group/index.js';
  import * as DropdownMenu from '$shared/components/ui/dropdown-menu/index.js';
  import * as Dialog from '$shared/components/ui/dialog/index.js';
  import { Button, buttonVariants } from '$shared/components/ui/button/index.js';
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import { cn } from '$shared/utils.js';
  import { layerColor } from '$shared/constants/layer-colors.js';
  import { BrushCleaning, MoreVertical, Trash2 } from '@lucide/svelte';

  const ctx = getKeypadContext();

  let layerValue = $state(String(configState.activeLayerIndex));
  let pendingDelete = $state<number | null>(null);

  const layerCount = $derived(ctx.profile?.layers?.length ?? 0);

  // Sync RadioGroup to store: profile switch resets activeLayerIndex to 0 (ProfileSwitcher),
  // so the selected layer must follow. Mount fire sets the same value -> harmless.
  $effect(() => {
    layerValue = String(configState.activeLayerIndex);
  });

  function onLayerChange(v: string) {
    configState.activeLayerIndex = +v;
  }

  function rename(i: number, name: string) {
    editLayer(configState.activeProfileIndex, i, { name });
  }

  function confirmDelete() {
    if (pendingDelete !== null) {
      deleteLayer(configState.activeProfileIndex, pendingDelete);
      pendingDelete = null;
    }
  }
</script>

<pre>{JSON.stringify(ctx, null, 2)}</pre>
<!-- {#if ctx.profile}
  <div class="flex flex-col gap-3 keycap-grid grow min-w-[180px] max-w-[200px]">
    <Label class="ml-2">Layers</Label>

    <RadioGroup.Root bind:value={layerValue} onValueChange={onLayerChange} class="flex flex-col gap-1 ">
      {#each ctx.profile.layers ?? [] as l, i (i)}
        <ButtonGroup.Root class="w-full">
          <Label
            class={cn(
              'grow flex justify-start! gap-2! px-2! ps-0! items-center overflow-hidden',
              buttonVariants({ variant: 'outline', size: 'sm' }),
            )}
            for="l-{i}"
          >
            <span class={cn('w-1.5 h-full shrink-0', layerColor(i))}></span>
            <RadioGroup.Item value={String(i)} title={l.name} id="l-{i}" />
            {l.name}
          </Label>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              class={buttonVariants({ variant: 'outline', size: 'icon-sm' })}
              title="Éditer le layer"
            >
              <MoreVertical />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" class="w-48">
              <div class="px-1.5 py-1">
                <input
                  class="w-full px-2 py-1 text-sm bg-transparent border rounded outline-none border-border focus:ring-1 focus:ring-ring"
                  value={l.name ?? ''}
                  placeholder="Nom du layer"
                  onkeydown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                  }}
                  onchange={(e) => rename(i, (e.currentTarget as HTMLInputElement).value)}
                />
              </div>
              <DropdownMenu.Separator />
              <DropdownMenu.Item onSelect={() => ctx.resetLayer(i)}>
                <BrushCleaning />
                Réinitialiser
              </DropdownMenu.Item>
              <DropdownMenu.Item variant="destructive" disabled={layerCount <= 1} onSelect={() => (pendingDelete = i)}>
                <Trash2 />
                Supprimer
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </ButtonGroup.Root>
      {/each}
    </RadioGroup.Root>
  </div>

  <Dialog.Root open={pendingDelete !== null} onOpenChange={(o) => (o ? null : (pendingDelete = null))}>
    <Dialog.Content class="sm:max-w-sm">
      <Dialog.Header>
        <Dialog.Title>Supprimer le layer</Dialog.Title>
        <Dialog.Description>
          {#if pendingDelete !== null}
            Supprimer définitivement le layer « {ctx.profile.layers?.[pendingDelete]?.name ?? `L${pendingDelete}`} » ? Cette
            action peut être annulée avec Ctrl+Z.
          {/if}
        </Dialog.Description>
      </Dialog.Header>
      <Dialog.Footer>
        <Button variant="secondary" onclick={() => (pendingDelete = null)}>Annuler</Button>
        <Button variant="destructive" onclick={confirmDelete}>Supprimer</Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
{/if} -->
