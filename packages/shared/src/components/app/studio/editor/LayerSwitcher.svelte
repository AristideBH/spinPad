<script lang="ts">
  import { Label } from '$shared/components/ui/label/index.js';
  import { addLayer, configState, deleteLayer, duplicateLayer, editLayer, undo } from '$shared/store/config.svelte.js';
  import { toast } from 'svelte-sonner';
  import { getKeypadContext } from './keypad-context.svelte.js';
  import Sortable from '../sortable/Sortable.svelte';
  import { CONFIG_MAX_LAYERS, type LayerConfig } from '$shared/constants/config-schema.js';
  import { GripVertical } from '@lucide/svelte';
  import * as RadioGroup from '$shared/components/ui/radio-group/index.js';
  import * as DropdownMenu from '$shared/components/ui/dropdown-menu/index.js';
  import { Button, buttonVariants } from '$shared/components/ui/button/index.js';
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import { ScrollArea } from '$shared/components/ui/scroll-area/index.js';
  import { cn, scrollShadow } from '$shared/utils.js';
  import { layerColor } from '$shared/constants/layer-colors.js';
  import { BrushCleaning, CopyPlus, MoreVertical, Plus, Trash2 } from '@lucide/svelte';
  import * as Kbd from '$shared/components/ui/kbd/index.js';
  import * as InputGroup from '$shared/components/ui/input-group/index.js';

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

  // ─── Surface d'édition des styles ──────────────────────────────────────
  // Classes Tailwind par élément interne, variantes vertical/horizontal côte à
  // côte. Les wrappers de layout (ScrollArea, sticky…) vivent dans le markup.
  const s = $derived({
    group: horizontal ? 'w-full min-w-0 border rounded-lg' : 'w-full border rounded-lg',
    grip: horizontal
      ? 'flex items-center justify-center px-1 pe-0 border-0! cursor-grab touch-none '
      : 'flex items-center justify-center ps-1 pe-0 border-0! cursor-grab touch-none',
    label: horizontal
      ? 'grow min-w-0 justify-center! gap-1! px-2! border-0!  truncate'
      : 'grow flex justify-start! gap-2! px-2! border-0! ',
    dropdownTrigger: 'px-1 border-0 data-[state=open]:bg-foreground/80!',
  });

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
      <ButtonGroup.Root class={cn(s.group, 'border ')}>
        <Button
          class={cn(s.grip, ' border-b!', lc)}
          title="Réordonner"
          size="sm"
          variant={activeLayerVariant(i)}
          data-grip
          onpointerdown={handlePointerDown}
        >
          <GripVertical class="size-3.5" />
        </Button>

        <Label
          class={cn(s.label, 'z-20 border-b!', buttonVariants({ variant: activeLayerVariant(i), size: 'sm' }), lc)}
          for="l-{i}"
        >
          <RadioGroup.Item class="hidden" value={String(i)} title={l.name} id="l-{i}" />
          {l.name}
        </Label>

        {#if isActive}
          <DropdownMenu.Root>
            <!-- & has data-state="open" -->
            <DropdownMenu.Trigger
              class={cn(
                buttonVariants({ variant: activeLayerVariant(i), size: 'sm' }),
                s.dropdownTrigger,
                'border-b!',
                lc,
              )}
              title="Éditer le layer"
            >
              <MoreVertical />
            </DropdownMenu.Trigger>
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
        {/if}
      </ButtonGroup.Root>
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
