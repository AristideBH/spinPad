<script lang="ts">
  import { Label } from '$shared/components/ui/label/index.js';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$shared/components/ui/select/index.js';
  import * as RadioGroup from '$shared/components/ui/radio-group/index.js';
  import { configState } from '$shared/store/config.svelte.js';
  import { getKeypadContext } from './keypad-context.svelte.js';
  import * as Tabs from '$shared/components/ui/tabs/index.js';
  import * as Card from '$shared/components/ui/card/index.js';
  import { Button, buttonVariants } from '$shared/components/ui/button/index.js';
  import * as Item from '$shared/components/ui/item/index.js';

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
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import * as DropdownMenu from '$shared/components/ui/dropdown-menu/index.js';

  let profileValue = $state(String(configState.activeProfileIndex));
  let layerValue = $state(String(configState.activeLayerIndex));
  let profileCount = $derived(() => configState.data?.profile_count ?? 0);

  // Écriture LOCAL → STORE à la sélection (jamais via $effect : un effet
  // se déclencherait au montage et réinitialiserait le layer à 0 par erreur).
  function onProfileChange(v: string) {
    configState.activeProfileIndex = +v;
    layerValue = '0';
    configState.activeLayerIndex = 0;
  }
</script>

<RadioGroup.Root
  bind:value={profileValue}
  onValueChange={onProfileChange}
  class="flex w-full gap-2 p-2 rounded-xl overflow-auto bg-background/50 items-start border shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)]"
  {@attach scrollShadow}
>
  {#each configState.data?.profiles ?? [] as prof, i}
    {@const isActive = i === Number(profileValue)}
    <Label for="p-{i}" class="cursor-pointer">
      <RadioGroup.Item hidden disabled={isActive} value={String(i)} title={prof.name} id="p-{i}" />
      <Item.Root
        variant="outline"
        class={cn(
          'py-3 max-w-3xs min-w-3xs group transition-colors duration-200',
          isActive ? 'bg-primary text-primary-foreground' : 'bg-card ',
        )}
      >
        <Item.Media>
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
        <Item.Actions
          class="invisible transition-opacity duration-300 delay-300 opacity-0 group-hover:visible group-hover:opacity-100"
        >
          <Button
            size="icon-sm"
            variant="ghost"
            class={cn(
              'transition-colors duration-0 disabled:',
              isActive ? 'hover:bg-muted/10! hover:text-primary-foreground ' : 'bg-card ',
            )}
          >
            <MoreVertical />
          </Button>
        </Item.Actions>
      </Item.Root>
    </Label>
  {/each}
  {#each configState.data?.profiles ?? [] as prof, i}
    {@const isActive = i + 2 === Number(profileValue)}
    <Label for="p-{i}" class="cursor-pointer">
      <RadioGroup.Item hidden disabled={isActive} value={String(i)} title={prof.name} id="p-{i}" />
      <Item.Root
        variant="outline"
        class={cn(
          'py-3 max-w-3xs min-w-3xs group transition-colors duration-200',
          isActive ? 'bg-primary text-primary-foreground' : 'bg-card ',
        )}
      >
        <Item.Media>
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
        <Item.Actions
          class="invisible transition-opacity duration-300 delay-300 opacity-0 group-hover:visible group-hover:opacity-100"
        >
          <Button
            size="icon-sm"
            variant="ghost"
            class={cn(
              'transition-colors duration-0 disabled:',
              isActive ? 'hover:bg-muted/10! hover:text-primary-foreground ' : 'bg-card ',
            )}
          >
            <MoreVertical />
          </Button>
        </Item.Actions>
      </Item.Root>
    </Label>
  {/each}

  <Button
    variant="outline"
    class="sticky ml-auto h-auto! right-0 self-stretch bg-muted! hover:bg-red-600 z-10"
    size="icon"
    title="Ajouter un profil"
  >
    <Plus />
  </Button>
</RadioGroup.Root>

<style>
  :global(.scroller) {
    display: flex;
    gap: 15px;
    width: 300px;
    padding: 10px;
    border: 1px solid #d0d0d0;
    border-radius: 4px;
    white-space: nowrap;
  }

  :global(.item) {
    flex: 0 0 100px;
    height: 100px;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
