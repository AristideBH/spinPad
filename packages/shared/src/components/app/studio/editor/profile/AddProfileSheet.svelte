<script lang="ts">
  // ───────────────────────────────────────────────────────────────
  //  AddProfileSheet — profile creation (responsive sheet)
  //
  //  Sheet (desktop) / Drawer (mobile) with three views:
  //   - chooser : choose "from the library" or "create from scratch"
  //   - library : list of presets → Add (as is) or Customize
  //   - form    : ProfileForm (draft) for creation / tweak
  //
  //  Every add goes through addProfile(), which auto-selects the new
  //  profile (layer 0) via _applyOp, then closes the sheet.
  // ───────────────────────────────────────────────────────────────
  import ResponsiveSheet from '$shared/components/ui/responsive-sheet/responsive-sheet.svelte';
  import { Button } from '$shared/components/ui/button/index.js';
  import * as Item from '$shared/components/ui/item/index.js';
  import IconPreview from '../../IconPreview.svelte';
  import ProfileForm from './ProfileForm.svelte';
  import { addProfile } from '$shared/store/config.svelte.js';
  import { listProfilePresets, type ProfilePreset } from '$shared/constants/profile-presets.js';
  import { defaultProfile, type ProfileConfig } from '$shared/constants/config-schema.js';
  import { ArrowLeft, Library, PencilRuler } from '@lucide/svelte';
  import { fly } from 'svelte/transition';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  type View = 'chooser' | 'library' | 'form';
  let view = $state<View>('chooser');
  let formInitial = $state<ProfileConfig | undefined>(undefined);

  let presets = $state<ProfilePreset[]>([]);
  $effect(() => {
    listProfilePresets().then((p) => (presets = p));
  });

  // Returns to the chooser on every close.
  $effect(() => {
    if (!open) {
      view = 'chooser';
      formInitial = undefined;
    }
  });

  function commit(profile: ProfileConfig) {
    addProfile(profile); // auto-selects the new profile
    open = false;
  }
  function openCreate() {
    formInitial = defaultProfile();
    view = 'form';
  }
  function openTweak(preset: ProfilePreset) {
    formInitial = preset.profile;
    view = 'form';
  }

  const heading = $derived(
    view === 'library' ? 'From the library' : view === 'form' ? 'Configure the profile' : 'Add a profile',
  );
</script>

<ResponsiveSheet
  bind:open
  title="Add a profile"
  desktop="dialog"
  desktopClass="sm:max-w-lg max-h-[85dvh] flex flex-col p-0 gap-0"
>
  {#snippet header()}
    <div class="flex items-center gap-2 px-4 py-3 border-b">
      {#if view !== 'chooser'}
        <Button variant="ghost" size="icon" class="size-7" title="Back" onclick={() => (view = 'chooser')}>
          <ArrowLeft class="size-4" />
        </Button>
      {/if}
      <span class="text-sm font-medium">{heading}</span>
    </div>
  {/snippet}

  <div class="relative flex flex-col flex-1 min-h-0 overflow-hidden">
    {#key view}
      <div class="flex flex-col flex-1 min-h-0" in:fly={{ x: view === 'chooser' ? -16 : 16, duration: 150 }}>
        {#if view === 'chooser'}
          <Item.Group class="grid gap-2 p-4 sm:grid-cols-2">
            <Item.Root variant="outline">
              {#snippet child({ props })}
                <button
                  {...props}
                  class={[props.class as string, 'cursor-pointer flex-col items-start text-left'].join(' ')}
                  onclick={() => (view = 'library')}
                >
                  <Item.Media variant="icon"><Library class="size-5" /></Item.Media>
                  <Item.Content>
                    <Item.Title>From the library</Item.Title>
                    <Item.Description>Start from a preset, as is or customized.</Item.Description>
                  </Item.Content>
                </button>
              {/snippet}
            </Item.Root>

            <Item.Root variant="outline">
              {#snippet child({ props })}
                <button
                  {...props}
                  class={[props.class as string, 'cursor-pointer flex-col items-start text-left'].join(' ')}
                  onclick={openCreate}
                >
                  <Item.Media variant="icon"><PencilRuler class="size-5" /></Item.Media>
                  <Item.Content>
                    <Item.Title>Create from scratch</Item.Title>
                    <Item.Description>Name, icon and layers from a blank profile.</Item.Description>
                  </Item.Content>
                </button>
              {/snippet}
            </Item.Root>
          </Item.Group>
        {:else if view === 'library'}
          <div class="flex flex-col gap-2 p-4 overflow-y-auto">
            {#each presets as preset (preset.id)}
              <div class="flex items-center gap-3 p-2 border rounded-lg">
                <IconPreview value={preset.icon ?? ''} size={40} class="shrink-0" />
                <div class="flex flex-col min-w-0 grow">
                  <span class="text-sm font-medium truncate">{preset.label}</span>
                  {#if preset.description}
                    <span class="text-xs text-muted-foreground line-clamp-2">{preset.description}</span>
                  {/if}
                </div>
                <div class="flex gap-1.5 shrink-0">
                  <Button variant="outline" size="sm" onclick={() => openTweak(preset)}>Customize</Button>
                  <Button size="sm" onclick={() => commit(preset.profile)}>Add</Button>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <ProfileForm initial={formInitial} submitLabel="Add" onsubmit={commit} oncancel={() => (view = 'chooser')} />
        {/if}
      </div>
    {/key}
  </div>
</ResponsiveSheet>
