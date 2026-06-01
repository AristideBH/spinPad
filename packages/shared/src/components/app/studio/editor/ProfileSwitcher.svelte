<script lang="ts">
  import { Label } from '$shared/components/ui/label/index.js';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$shared/components/ui/select/index.js';
  import * as RadioGroup from '$shared/components/ui/radio-group/index.js';

  import { configState, editProfile } from '$shared/store/config.svelte.js';
  import { getKeypadContext } from './keypad-context.svelte.js';
  import Sortable from '../sortable/Sortable.svelte';
  import type { ProfileConfig } from '$shared/constants/config-schema.js';
  import * as Tabs from '$shared/components/ui/tabs/index.js';
  import * as Card from '$shared/components/ui/card/index.js';
  import { Button, buttonVariants } from '$shared/components/ui/button/index.js';
  import * as Item from '$shared/components/ui/item/index.js';
  import { ScrollArea } from '$shared/components/ui/scroll-area/index.js';
  import { cn, scrollShadow } from '$shared/utils.js';
  import {
    Archive,
    ChevronDown,
    Edit,
    GripVertical,
    MailCheck,
    MoreHorizontal,
    MoreVertical,
    Plus,
    Settings2,
    TextCursor,
    Trash,
  } from '@lucide/svelte';
  import * as DropdownMenu from '$shared/components/ui/dropdown-menu/index.js';

  let profileValue = $state(String(configState.activeProfileIndex));
  let layerValue = $state(String(configState.activeLayerIndex));
  let profileCount = $derived(() => configState.data?.profile_count ?? 0);
  let viewport = $state<HTMLElement | null>(null);

  // Sync STORE → LOCAL (lecture seule) : reflète les changements programmatiques
  // de profil — reset au premier profil lors d'un rechargement de config, undo/redo, etc.
  // N'écrit jamais dans le store, donc pas de boucle ni de reset de layer parasite.
  $effect(() => {
    profileValue = String(configState.activeProfileIndex);
  });

  // Centre le profil actif dans la zone scrollable (snap doux). scrollIntoView
  // clampe aux extrémités, donc premier/dernier ne sur-défilent pas, et on ne
  // fait rien si le contenu tient sans scroll.
  $effect(() => {
    const idx = configState.activeProfileIndex;
    if (!viewport) return;
    requestAnimationFrame(() => {
      if (!viewport || viewport.scrollWidth <= viewport.clientWidth) return;
      const card = viewport.querySelector(`label[for="p-${idx}"]`);
      card?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    });
  });

  // Écriture LOCAL → STORE à la sélection (jamais via $effect : un effet
  // se déclencherait au montage et réinitialiserait le layer à 0 par erreur).
  function onProfileChange(v: string) {
    configState.activeProfileIndex = +v;
    layerValue = '0';
    configState.activeLayerIndex = 0;
  }
</script>

<ScrollArea
  orientation="horizontal"
  bind:viewportRef={viewport}
  class="flex flex-row relative w-full gap-2  rounded-xl bg-background/50 items-start border shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)] [&_[data-slot=scroll-area-viewport]]:snap-x [&_[data-slot=scroll-area-viewport]]:scroll-px-2"
  {@attach scrollShadow}
>
  <RadioGroup.Root
    bind:value={profileValue}
    onValueChange={onProfileChange}
    class="flex w-full p-2 "
    {@attach scrollShadow}
  >
    <Sortable
      items={(configState.data?.profiles ?? []) as ProfileConfig[]}
      orientation="horizontal"
      rowHeight={76}
      gap={[8, 8]}
      cellWidth={256}
      getKey={(p) => `p-${p.name}`}
      onReorder={(from, to) => editProfile(from, { moveTo: to })}
    >
      {#snippet children({ item: prof, index: i, handlePointerDown })}
        {@const isActive = i === Number(profileValue)}
        <Label for="p-{i}" class="block cursor-pointer snap-center">
          <RadioGroup.Item hidden disabled={isActive} value={String(i)} title={prof.name} id="p-{i}" />
          <Item.Root
            variant="outline"
            class={cn(
              'h-full w-full py-3 group transition-colors duration-200 items-center',
              isActive ? 'bg-primary text-primary-foreground' : 'bg-card ',
            )}
          >
            <Item.Media class="self-center! mb-1.5 me-2 gap-1">
              <button
                type="button"
                class="flex items-center justify-center rounded text-muted-foreground hover:text-foreground cursor-grab touch-none"
                title="Réordonner"
                onpointerdown={handlePointerDown}
                onclick={(e) => e.preventDefault()}
              >
                <GripVertical class="size-3.5" />
              </button>
              <div
                class="flex items-center justify-center text-sm font-bold rounded-full size-8 shrink-0"
                class:bg-card={isActive}
                class:text-foreground={isActive}
                class:bg-muted={!isActive}
                class:text-muted-foreground={!isActive}
              >
                {i + 1}
              </div>
            </Item.Media>
            <Item.Content>
              <Item.Title>{prof.name}</Item.Title>
              <Item.Description class="text-xs">
                {prof.layers?.length ?? 0} layer(s) · {prof.combos?.length ?? 0} combo(s)
              </Item.Description>
            </Item.Content>
          </Item.Root>
        </Label>
      {/snippet}
    </Sortable>

    <!-- <p>{profileCount()}/{8}</p> -->
  </RadioGroup.Root>
</ScrollArea>

<Button
  variant="outline"
  class="sticky ml-auto h-auto! right-0 self-stretch bg-muted!  z-10
        [&>div]:bg-green! [&>div]:hover:bg-green-600!
      "
  size="icon"
  title="Ajouter un profil"
>
  <Plus />
</Button>

<style>
  :global(.svlt-grid-item) {
    &:not(.svlt-grid-active) {
      height: 100% !important;
    }
    & > label {
      height: inherit;
    }
  }
</style>
