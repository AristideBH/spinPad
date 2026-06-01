<script lang="ts">
  import { Label } from '$shared/components/ui/label/index.js';
  import { Input } from '$shared/components/ui/input/index.js';
  import { configState, deleteLayer, editLayer } from '$shared/store/config.svelte.js';
  import { getKeypadContext } from './keypad-context.svelte.js';
  import Sortable from '../sortable/Sortable.svelte';
  import type { LayerConfig } from '$shared/constants/config-schema.js';
  import { GripVertical } from '@lucide/svelte';
  import * as RadioGroup from '$shared/components/ui/radio-group/index.js';
  import * as DropdownMenu from '$shared/components/ui/dropdown-menu/index.js';
  import * as Dialog from '$shared/components/ui/dialog/index.js';
  import { Button, buttonVariants } from '$shared/components/ui/button/index.js';
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import { cn } from '$shared/utils.js';
  import { layerColor } from '$shared/constants/layer-colors.js';
  import { BrushCleaning, MoreVertical, Plus, Trash2 } from '@lucide/svelte';
  import * as Kbd from '$shared/components/ui/kbd/index.js';
  import * as InputGroup from '$shared/components/ui/input-group/index.js';

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

  const activeLayerVariant = (i: number) => {
    if (i === configState.activeLayerIndex) return 'default';
    return 'outline';
  };
</script>

{#if ctx.profile}
  <div class="flex flex-col gap-3 keycap-grid grow min-w-[180px] max-w-[200px]">
    <Label class="ml-2">Layers</Label>

    <RadioGroup.Root bind:value={layerValue} onValueChange={onLayerChange} class="flex flex-col gap-1 ">
      <Sortable
        items={(ctx.profile.layers ?? []) as LayerConfig[]}
        orientation="vertical"
        rowHeight={36}
        gap={[0, 4]}
        getKey={(l, i) => `l-${i}-${l.name ?? ''}`}
        onReorder={(from, to) => editLayer(configState.activeProfileIndex, from, { moveTo: to })}
      >
        {#snippet children({ item: l, index: i, handlePointerDown })}
          <ButtonGroup.Root class="w-full border rounded-lg ">
            <Button
              class={cn('flex items-center justify-center ps-1 pe-0 border-0! cursor-grab touch-none')}
              title="Réordonner"
              size="sm"
              variant={activeLayerVariant(i)}
              onpointerdown={handlePointerDown}
            >
              <GripVertical class="size-3.5" />

              <span class={cn('w-0.5 h-full rounded-none shrink-0', layerColor(i))}></span>
            </Button>
            <Label
              class={cn(
                'grow flex justify-start! gap-2! px-2! border-0! rounded-none!',
                buttonVariants({ variant: activeLayerVariant(i), size: 'sm' }),
              )}
              for="l-{i}"
            >
              <RadioGroup.Item class="hidden" value={String(i)} title={l.name} id="l-{i}" />
              {l.name}
            </Label>

            {#if i === configState.activeLayerIndex}
              <DropdownMenu.Root>
                <!-- & has data-state="open" -->
                <DropdownMenu.Trigger
                  class={cn(
                    buttonVariants({ variant: activeLayerVariant(i), size: 'sm' }),
                    'px-1 border-0 data-[state=open]:bg-foreground/80! ',
                  )}
                  title="Éditer le layer"
                >
                  <MoreVertical />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end" class="w-48">
                  <div class="px-1.5 py-1">
                    <InputGroup.Root class="h-7">
                      <InputGroup.Input
                        placeholder="Nom du layer"
                        value={l.name ?? ''}
                        onkeydown={(e: KeyboardEvent) => {
                          e.stopPropagation();
                          if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                        }}
                        onchange={(e: Event) => rename(i, (e.currentTarget as HTMLInputElement).value)}
                      />
                      <InputGroup.Addon align="inline-end">
                        <Kbd.Root>⏎</Kbd.Root>
                      </InputGroup.Addon>
                    </InputGroup.Root>
                  </div>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item onSelect={() => ctx.resetLayer(i)}>
                    <BrushCleaning />
                    Réinitialiser
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    variant="destructive"
                    disabled={layerCount <= 1}
                    onSelect={() => (pendingDelete = i)}
                  >
                    <Trash2 />
                    Supprimer
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            {/if}
          </ButtonGroup.Root>
        {/snippet}
      </Sortable>
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
{/if}
