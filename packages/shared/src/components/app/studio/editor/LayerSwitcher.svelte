<script lang="ts">
  import { Label } from '$shared/components/ui/label/index.js';
  import { addLayer, configState, deleteLayer, duplicateLayer, editLayer, undo } from '$shared/store/config.svelte.js';
  import { toast } from 'svelte-sonner';
  import { getKeypadContext } from './keypad-context.svelte.js';
  import Sortable from '../sortable/Sortable.svelte';
  import { CONFIG_MAX_LAYERS, type LayerConfig } from '$shared/constants/config-schema.js';
  import { BadgeCheckIcon, ChevronRightIcon, EllipsisVertical, GripVertical } from '@lucide/svelte';
  import * as RadioGroup from '$shared/components/ui/radio-group/index.js';
  import * as DropdownMenu from '$shared/components/ui/dropdown-menu/index.js';
  import { Button, buttonVariants } from '$shared/components/ui/button/index.js';
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import { ScrollArea } from '$shared/components/ui/scroll-area/index.js';
  import { cn, scrollShadow } from '$shared/utils.js';
  import { layerColor } from '$shared/constants/layer-colors.js';
  import { BrushCleaning, CopyPlus, Plus, Trash2 } from '@lucide/svelte';
  import * as Kbd from '$shared/components/ui/kbd/index.js';
  import * as InputGroup from '$shared/components/ui/input-group/index.js';
  import { fade } from 'svelte/transition';
  import * as Item from '$shared/components/ui/item/index.js';

  interface Props {
    orientation?: 'horizontal' | 'vertical';
  }
  let { orientation = 'vertical' }: Props = $props();

  const ctx = getKeypadContext();

  const horizontal = $derived(orientation === 'horizontal');

  // Largeur fixe d'un onglet en mode horizontal. Indispensable au scroll : le
  // Sortable n'impose une largeur explicite (donc un overflow scrollable) que
  // pour un colWidth NUMÉRIQUE ; en 'auto' la piste reste à 100% et les onglets
  // débordent sans pouvoir défiler. Voir le pattern de ProfileSwitcher.
  const H_COL_W = 120;

  const sortableGap = $derived<[number, number]>(horizontal ? [6, 0] : [0, 4]);

  let layerValue = $state(String(configState.activeLayerIndex));

  const layerCount = $derived(ctx.profile?.layers?.length ?? 0);

  // Refs de la zone scrollable horizontale (ombres de bord + drag tactile).
  let viewport = $state<HTMLElement | null>(null);
  let rootEl = $state<HTMLElement | null>(null);

  // Sync RadioGroup to store: profile switch resets activeLayerIndex to 0 (ProfileSwitcher),
  // so the selected layer must follow. Mount fire sets the same value -> harmless.
  $effect(() => {
    layerValue = String(configState.activeLayerIndex);
  });

  // Ombres de bord (ancrées au Root non défilant, position lue sur le viewport).
  // Uniquement en horizontal — refs nulles autrement.
  $effect(() => {
    if (!horizontal || !viewport || !rootEl) return;
    return scrollShadow(viewport, rootEl);
  });

  // bits-ui masque les scrollbars natives et la chaîne touch-action via mosaic
  // n'engage pas le scroll-doigt natif : on pilote le défilement horizontal
  // depuis les drags tactiles. Un drag démarré sur la poignée (data-grip) est
  // laissé à mosaic pour le réordonnancement.
  $effect(() => {
    if (!horizontal) return;
    const vp = viewport;
    if (!vp) return;
    vp.style.touchAction = 'pan-x';

    let startX = 0;
    let startScroll = 0;
    let dragging = false;

    function onStart(e: TouchEvent) {
      if ((e.target as HTMLElement)?.closest('[data-grip]')) return;
      dragging = true;
      startX = e.touches[0].clientX;
      startScroll = vp!.scrollLeft;
    }
    function onMove(e: TouchEvent) {
      if (!dragging) return;
      vp!.scrollLeft = startScroll - (e.touches[0].clientX - startX);
    }
    function onEnd() {
      dragging = false;
    }

    vp.addEventListener('touchstart', onStart, { passive: true });
    vp.addEventListener('touchmove', onMove, { passive: true });
    vp.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      vp.removeEventListener('touchstart', onStart);
      vp.removeEventListener('touchmove', onMove);
      vp.removeEventListener('touchend', onEnd);
    };
  });

  // Centre le layer actif dans la piste scrollable (no-op si tout tient sans scroll).
  $effect(() => {
    const idx = configState.activeLayerIndex;
    if (!horizontal || !viewport) return;
    requestAnimationFrame(() => {
      if (!viewport || viewport.scrollWidth <= viewport.clientWidth) return;
      const el = viewport.querySelector(`label[for="l-${idx}"]`);
      el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    });
  });

  function onLayerChange(v: string) {
    configState.activeLayerIndex = +v;
  }

  function rename(i: number, name: string) {
    editLayer(configState.activeProfileIndex, i, { name });
  }

  // Suppression / réinitialisation immédiates : pas de dialogue. L'op entre dans
  // l'historique (Ctrl+Z) et le toast offre un « Annuler » direct via undo().
  function onDelete(i: number) {
    const name = ctx.profile?.layers?.[i]?.name ?? `L${i}`;
    deleteLayer(configState.activeProfileIndex, i);
    toast(`Layer « ${name} » supprimé`, {
      action: { label: 'Annuler', onClick: () => undo() },
    });
  }

  function onReset(i: number) {
    const name = ctx.profile?.layers?.[i]?.name ?? `L${i}`;
    ctx.resetLayer(i);
    toast(`Layer « ${name} » réinitialisé`, {
      action: { label: 'Annuler', onClick: () => undo() },
    });
  }

  const activeLayerVariant = (i: number) => {
    if (i === configState.activeLayerIndex) return 'default';
    return 'secondary';
  };
</script>

<!-- Piste réordonnable d'onglets layer : identique dans les deux modes (le
     Sortable s'adapte via `orientation`/`colWidth`). -->
{#snippet tabs()}
  <Sortable
    items={(ctx.profile?.layers ?? []) as LayerConfig[]}
    {orientation}
    rowHeight={horizontal ? 36 : 'auto'}
    colWidth={horizontal ? H_COL_W : undefined}
    gap={sortableGap}
    getKey={(l, i) => `l-${l.color ?? i}`}
    onReorder={(from, to) => editLayer(configState.activeProfileIndex, from, { moveTo: to })}
  >
    {#snippet children({ item: l, index: i, handlePointerDown })}
      {@const isActive = i === configState.activeLayerIndex}
      {@const lc = layerColor(l.color ?? i)}
      <Label for="l-{i}">
        <RadioGroup.Item hidden disabled={isActive} value={String(i)} title={l.name} id="l-{i}" />
        <Item.Root
          variant={isActive ? 'active' : 'card'}
          size="xs"
          class={cn(
            'relative group cursor-pointer px-1.5 py-1 border',
            lc,
            !isActive ? 'hover:border-muted-foreground/15 hover:bg-muted/90' : '',
          )}
        >
          <Item.Media>
            <button
              type="button"
              data-grip
              class="flex items-center justify-center rounded text-muted-foreground hover:text-foreground cursor-grab touch-none"
              title="Réordonner"
              onpointerdown={handlePointerDown}
              onclick={(e) => e.preventDefault()}
            >
              <GripVertical class="size-3.5" />
            </button>
          </Item.Media>

          <Item.Content>
            <Item.Title class="text-sm line-clamp-1">{l.name}</Item.Title>
          </Item.Content>

          {#if isActive}
            <Item.Actions>
              <DropdownMenu.Root>
                <div in:fade={{ duration: 150, delay: 200 }} out:fade={{ duration: 150 }}>
                  <DropdownMenu.Trigger
                    class={cn(
                      buttonVariants({ variant: 'ghost', size: 'icon-xs' }),
                      'absolute top-0 bottom-0 right-0 w-6 h-full z-10 text-muted-foreground hover:bg-muted-foreground/20! hover:text-muted-foreground  data-[state=open]:bg-muted-foreground/50 data-[state=open]:text-muted/50',
                    )}
                    title="Éditer le layer"
                  >
                    <EllipsisVertical />
                  </DropdownMenu.Trigger>
                </div>

                <DropdownMenu.Content align="end" class="w-45">
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
                  <DropdownMenu.Item
                    disabled={layerCount >= CONFIG_MAX_LAYERS}
                    onSelect={() => duplicateLayer(configState.activeProfileIndex, i)}
                  >
                    <CopyPlus />
                    Dupliquer
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => onReset(i)}>
                    <BrushCleaning />
                    Réinitialiser
                  </DropdownMenu.Item>
                  <DropdownMenu.Item variant="destructive" disabled={layerCount <= 1} onSelect={() => onDelete(i)}>
                    <Trash2 />
                    Supprimer
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </Item.Actions>
          {/if}
        </Item.Root>
      </Label>
    {/snippet}
  </Sortable>
{/snippet}

{#snippet addBtn()}
  <Button
    variant="outline"
    size="sm"
    class={cn('shrink-0', horizontal ? '' : 'w-full justify-start! gap-2!')}
    disabled={layerCount >= CONFIG_MAX_LAYERS}
    title="Ajouter un layer vierge"
    onclick={() => addLayer(configState.activeProfileIndex)}
  >
    <Plus class="size-3.5" />
    {#if !horizontal}Ajouter un layer{/if}
  </Button>
{/snippet}

{#if ctx.profile}
  {#if horizontal}
    <div class="flex flex-row items-center gap-2">
      <Label class="mx-2 shrink-0">Layers</Label>
      <ScrollArea
        orientation="horizontal"
        bind:ref={rootEl}
        bind:viewportRef={viewport}
        class="grow min-w-0 [--scroll-shadow-color:var(--popover)]"
      >
        <RadioGroup.Root
          bind:value={layerValue}
          onValueChange={onLayerChange}
          class="flex flex-row items-start w-full gap-2 "
        >
          {@render tabs()}
          <!-- Bouton « + » épinglé à droite : reste visible quand la piste défile. -->
          <div class="sticky right-0 z-20 flex items-center rounded-lg ms-auto shrink-0 bg-card border-muted bg-muted">
            {@render addBtn()}
          </div>
        </RadioGroup.Root>
      </ScrollArea>
    </div>
  {:else}
    <div class="flex flex-col gap-3 keycap-grid">
      <Label class="mx-2">Layers</Label>
      <RadioGroup.Root bind:value={layerValue} onValueChange={onLayerChange} class="flex flex-col gap-1">
        {@render tabs()}
        {@render addBtn()}
      </RadioGroup.Root>
    </div>
  {/if}
{/if}
