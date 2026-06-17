<script lang="ts">
  import { Label } from '$shared/components/ui/label/index.js';
  import * as RadioGroup from '$shared/components/ui/radio-group/index.js';
  import { configState, editProfile, setActiveProfileLocal } from '$shared/store/config.svelte.js';
  import Sortable from '../../Sortable.svelte';
  import { CONFIG_MAX_PROFILES, type ProfileConfig } from '$shared/constants/config-schema.js';
  import { Button, buttonVariants } from '$shared/components/ui/button/index.js';
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import { Plus, Share } from '@lucide/svelte';
  import { bindTouchDragScroll, cn, scrollLabelIntoView, scrollShadow } from '$shared/utils.js';
  import { ScrollArea } from '$shared/components/ui/scroll-area/index.js';
  import AddProfileSheet from './AddProfileSheet.svelte';
  import ProfileCard from './ProfileCard.svelte';
  import ProfileImportExportDialog from './ProfileImportExportDialog.svelte';
  import { getKeypadContext } from '../keypad-context.svelte';
  import { simulateTyping } from '$shared/lib/simulate-typing';

  const ctx = getKeypadContext();

  let profileValue = $state(String(configState.activeProfileIndex));
  let layerValue = $state(String(configState.activeLayerIndex));
  let viewport = $state<HTMLElement | null>(null);
  let rootEl = $state<HTMLElement | null>(null);
  let addOpen = $state(false);
  let importExportOpen = $state(false);

  const profileList = $derived(configState.data?.profiles ?? []);

  $effect(() => {
    profileValue = String(configState.activeProfileIndex);
  });

  $effect(() => {
    if (!viewport) return;
    return bindTouchDragScroll(viewport);
  });

  $effect(() => {
    if (!viewport || !rootEl) return;
    return scrollShadow(viewport, rootEl);
  });

  $effect(() => {
    const idx = configState.activeProfileIndex;
    const _count = profileList.length;
    if (!viewport) return;
    void scrollLabelIntoView(viewport, `p-${idx}`);
  });

  function onProfileChange(v: string) {
    layerValue = '0';
    setActiveProfileLocal(+v);
    simulateTyping(ctx, { duration: 1000, easing: 'ease-out' });
  }
</script>

<ScrollArea
  orientation="horizontal"
  bind:ref={rootEl}
  bind:viewportRef={viewport}
  class="profiles flex flex-row relative w-full gap-2 rounded-xl bg-background/50 overflow-clip items-start border shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)]"
>
  <RadioGroup.Root bind:value={profileValue} onValueChange={onProfileChange} class="flex items-stretch w-full p-2">
    <Sortable
      items={(configState.data?.profiles ?? []) as ProfileConfig[]}
      orientation="horizontal"
      rowHeight={76}
      gap={[8, 8]}
      colWidth={256}
      getKey={(p) => `p-${p.name}`}
      onReorder={(from, to) => editProfile(from, { moveTo: to })}
    >
      {#snippet children({ item: prof, index: i, handlePointerDown })}
        {@const isActive = i === Number(profileValue)}
        <Label for="p-{i}" class="block h-full cursor-pointer snap-center">
          <RadioGroup.Item hidden disabled={isActive} value={String(i)} title={prof.name} id="p-{i}" />
          <ProfileCard {prof} index={i} {isActive} {handlePointerDown} />
        </Label>
      {/snippet}
    </Sortable>

    <div
      data-add-btn
      class="sticky z-10 flex flex-col items-center border rounded-lg ms-auto shrink-0 right-2 bg-card border-muted shadow-[0_0_18px_9px_var(--tw-shadow-color)] shadow-background/70"
    >
      <ButtonGroup.Root orientation="vertical">
        <Button
          variant="secondary"
          size="icon"
          disabled={profileList.length >= CONFIG_MAX_PROFILES}
          title="Add a profile"
          onclick={() => (addOpen = true)}
        >
          <Plus />
        </Button>
        <button
          class={cn('', buttonVariants({ variant: 'secondary', size: 'icon' }))}
          title="Import / Export profiles"
          onclick={() => (importExportOpen = true)}
        >
          <Share />
        </button>
      </ButtonGroup.Root>
      <p class="text-[0.5rem]! py-1 leading-none text-muted-foreground/50">
        {profileList.length}/{CONFIG_MAX_PROFILES}
      </p>
    </div>
  </RadioGroup.Root>
</ScrollArea>

<AddProfileSheet bind:open={addOpen} />
<ProfileImportExportDialog bind:open={importExportOpen} />

<style>
  :global(.profiles .svlt-grid-item) {
    &:not(.svlt-grid-active) {
      height: 100% !important;
    }
    & > label {
      height: inherit;
    }
  }

  :global(.profiles .svlt-grid-container) {
    height: 100% !important;
  }
</style>
