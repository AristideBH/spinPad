<script lang="ts">
  import { Label } from '$shared/components/ui/label/index.js';
  import {
    addLayer,
    configState,
    deleteLayer,
    duplicateLayer,
    editLayer,
    restoreLayer,
    restoreLayerState,
  } from '$shared/store/config.svelte.js';
  import { toast } from 'svelte-sonner';
  import { getKeypadContext } from './keypad-context.svelte.js';
  import Sortable from '../Sortable.svelte';
  import { CONFIG_MAX_LAYERS, type LayerConfig } from '$shared/constants/config-schema.js';
  import { BadgeCheckIcon, ChevronRightIcon, EllipsisVertical, GripVertical } from '@lucide/svelte';
  import * as RadioGroup from '$shared/components/ui/radio-group/index.js';
  import * as DropdownMenu from '$shared/components/ui/dropdown-menu/index.js';
  import { Button, buttonVariants } from '$shared/components/ui/button/index.js';
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import { ScrollArea } from '$shared/components/ui/scroll-area/index.js';
  import { bindTouchDragScroll, cn, scrollLabelIntoView, scrollShadow } from '$shared/utils.js';
  import { layerColor } from '$shared/constants/layer-colors.js';
  import { BrushCleaning, CopyPlus, Plus, Trash2 } from '@lucide/svelte';
  import * as Kbd from '$shared/components/ui/kbd/index.js';
  import * as InputGroup from '$shared/components/ui/input-group/index.js';
  import { fade } from 'svelte/transition';
  import * as Item from '$shared/components/ui/item/index.js';
  import { simulateTyping } from '$shared/lib/simulate-typing.js';

  interface Props {
    orientation?: 'horizontal' | 'vertical';
  }
  let { orientation = 'vertical' }: Props = $props();

  const ctx = getKeypadContext();

  const horizontal = $derived(orientation === 'horizontal');

  // Fixed width of a tab in horizontal mode. Essential for scrolling: the
  // Sortable only imposes an explicit width (and thus a scrollable overflow)
  // for a NUMERIC colWidth; in 'auto' the track stays at 100% and the tabs
  // overflow without being able to scroll. See the ProfileSwitcher pattern.
  const H_COL_W = 120;

  const sortableGap = $derived<[number, number]>(horizontal ? [6, 0] : [0, 4]);

  let layerValue = $state(String(configState.activeLayerIndex));

  const layerCount = $derived(ctx.profile?.layers?.length ?? 0);

  // Refs of the horizontal scrollable area (edge shadows + touch drag).
  let viewport = $state<HTMLElement | null>(null);
  let rootEl = $state<HTMLElement | null>(null);

  // Sync RadioGroup to store: profile switch resets activeLayerIndex to 0 (ProfileSwitcher),
  // so the selected layer must follow. Mount fire sets the same value -> harmless.
  $effect(() => {
    layerValue = String(configState.activeLayerIndex);
  });

  // Edge shadows (anchored to the non-scrolling Root, position read from the viewport).
  // Horizontal only — refs null otherwise.
  $effect(() => {
    if (!horizontal || !viewport || !rootEl) return;
    return scrollShadow(viewport, rootEl);
  });

  // bits-ui hides the native scrollbars and the touch-action chain via mosaic
  // doesn't engage the native finger-scroll: we drive the horizontal scrolling
  // from the touch drags. A drag started on the handle (data-grip) is
  // left to mosaic for reordering.
  $effect(() => {
    if (!horizontal || !viewport) return;
    return bindTouchDragScroll(viewport);
  });

  // Scroll the active layer tab into view, respecting the sticky add-button on the right.
  $effect(() => {
    const idx = configState.activeLayerIndex;
    const _count = layerCount; // re-fire on add/remove
    if (!horizontal || !viewport) return;
    void scrollLabelIntoView(viewport, `l-${idx}`);
  });

  function onLayerChange(v: string) {
    configState.activeLayerIndex = +v;
    simulateTyping(ctx, { duration: 1000, easing: 'ease-out' });
  }

  function rename(i: number, name: string) {
    editLayer(configState.activeProfileIndex, i, { name });
  }

  // Immediate delete / reset: no dialog. The op enters the history (Ctrl+Z)
  // and the toast offers a direct "Undo" via undo().
  function onDelete(i: number) {
    const layer = ctx.profile?.layers?.[i];
    const name = layer?.name ?? `L${i}`;
    const snapshot = layer ? ($state.snapshot(layer) as LayerConfig) : undefined;
    const profileIdx = configState.activeProfileIndex;
    deleteLayer(profileIdx, i);
    toast(`Layer "${name}" deleted`, {
      action: { label: 'Undo', onClick: () => snapshot && restoreLayer(profileIdx, i, snapshot) },
    });
  }

  function onReset(i: number) {
    const layer = ctx.profile?.layers?.[i];
    const name = layer?.name ?? `L${i}`;
    const snapshot = layer ? ($state.snapshot(layer) as LayerConfig) : undefined;
    const profileIdx = configState.activeProfileIndex;
    ctx.resetLayer(i);
    toast(`Layer "${name}" reset`, {
      action: { label: 'Undo', onClick: () => snapshot && restoreLayerState(profileIdx, i, snapshot) },
    });
  }

  const activeLayerVariant = (i: number) => {
    if (i === configState.activeLayerIndex) return 'default';
    return 'secondary';
  };
</script>

<!-- Reorderable track of layer tabs: identical in both modes (the
     Sortable adapts via `orientation`/`colWidth`). -->
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
              title="Reorder"
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
                    title="Edit layer"
                  >
                    <EllipsisVertical />
                  </DropdownMenu.Trigger>
                </div>

                <DropdownMenu.Content align="end" class="w-45">
                  <div class="px-1.5 py-1">
                    <InputGroup.Root class="h-7">
                      <InputGroup.Input
                        placeholder="Layer name"
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
                    Duplicate
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => onReset(i)}>
                    <BrushCleaning />
                    Reset
                  </DropdownMenu.Item>
                  <DropdownMenu.Item variant="destructive" disabled={layerCount <= 1} onSelect={() => onDelete(i)}>
                    <Trash2 />
                    Delete
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
    title="Add a blank layer"
    onclick={() => addLayer(configState.activeProfileIndex)}
  >
    <Plus class="size-3.5" />
    {#if !horizontal}Add a layer{/if}
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
          <!-- "+" button pinned to the right: stays visible when the track scrolls. -->
          <div data-add-btn class="sticky right-0 z-10 flex items-center rounded-lg ms-auto shrink-0 bg-card border-muted bg-muted">
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
