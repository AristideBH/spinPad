<script lang="ts">
  import {
    configState,
    addProfile,
    deleteProfile,
    clearProfile,
    editProfile,
    setProfileIcon,
    undo,
  } from '$shared/store/config.svelte.js';
  import {
    CONFIG_MAX_PROFILES,
    MIN_PROFILES,
    GRADIENT_PRESETS,
    type ProfileConfig,
  } from '$shared/constants/config-schema.js';
  import { Button, buttonVariants } from '$shared/components/ui/button/index.js';
  import * as Item from '$shared/components/ui/item/index.js';
  import * as DropdownMenu from '$shared/components/ui/dropdown-menu/index.js';
  import * as Dialog from '$shared/components/ui/dialog/index.js';
  import * as InputGroup from '$shared/components/ui/input-group/index.js';
  import * as Kbd from '$shared/components/ui/kbd/index.js';
  import IconPreview from '../../IconPreview.svelte';
  import IconEditor from '../../IconEditor.svelte';
  import ProfileLedDialog from './ProfileLedDialog.svelte';
  import { cn } from '$shared/utils.js';
  import { BrushCleaning, CopyPlus, GripVertical, Lightbulb, Palette, Settings2, Trash2 } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';
  import { fade } from 'svelte/transition';

  let {
    prof,
    index,
    isActive,
    handlePointerDown,
  }: {
    prof: ProfileConfig;
    index: number;
    isActive: boolean;
    handlePointerDown: (e: PointerEvent) => void;
  } = $props();

  let ledOpen = $state(false);
  let iconOpen = $state(false);

  const profileCount = $derived(configState.data?.profiles.length ?? 0);

  function profileFill(p: ProfileConfig): { mapped: number; total: number } {
    let mapped = 0;
    let total = 0;
    for (const layer of p.layers ?? []) {
      const keys = layer.keys ?? [];
      total += keys.length;
      for (const k of keys) if (k) mapped++;
    }
    return { mapped, total };
  }

  function hex(r: number, g: number, b: number): string {
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  }

  // Spectre complet pour l'effet global `rainbow` (pas de couleur unique représentative).
  const RAINBOW_GRADIENT =
    'linear-gradient(90deg,#ff0000,#ff8000,#ffe000,#00c853,#00b0ff,#3d5afe,#aa00ff)';

  type LedDot =
    | { kind: 'solid'; color: string; inherited: boolean }
    | { kind: 'gradient'; css: string };

  /**
   * Pastille LED résolue du profil.
   * - LED propre allumée → couleur unie ; éteinte explicitement → null (pastille noire).
   * - Absente → hérite du global (`led_key`). Effets animés (rainbow/flow/sweep) → dégradé,
   *   car aucune couleur unique ne les représente ; sinon couleur unie héritée. Global éteint → null.
   */
  function ledDot(p: ProfileConfig): LedDot | null {
    if (p.led) {
      if (p.led.effect === 'off') return null;
      return { kind: 'solid', color: hex(p.led.r, p.led.g, p.led.b), inherited: false };
    }
    const g = configState.data?.led_key;
    if (!g || g.effect === 'off') return null;
    if (g.effect === 'rainbow') return { kind: 'gradient', css: RAINBOW_GRADIENT };
    if (g.effect === 'flow' || g.effect === 'sweep') {
      const cols = GRADIENT_PRESETS[g.gradient_preset ?? 0]?.colors ?? GRADIENT_PRESETS[0].colors;
      return { kind: 'gradient', css: `linear-gradient(90deg,${cols.join(',')})` };
    }
    return { kind: 'solid', color: hex(g.r, g.g, g.b), inherited: true };
  }

  const fill = $derived(profileFill(prof));
  const dot = $derived(ledDot(prof));

  function renameProfile(name: string) {
    editProfile(index, { name });
  }

  function duplicateProfile() {
    if (profileCount >= CONFIG_MAX_PROFILES) return;
    addProfile(prof);
  }

  function onDelete() {
    const name = prof.name ?? `Profil ${index + 1}`;
    deleteProfile(index);
    toast(`Profil « ${name} » supprimé`, { action: { label: 'Annuler', onClick: () => undo() } });
  }

  function onClear() {
    const name = prof.name ?? `Profil ${index + 1}`;
    clearProfile(index);
    toast(`Profil « ${name} » réinitialisé`, { action: { label: 'Annuler', onClick: () => undo() } });
  }
</script>

<Item.Root
  variant="outline"
  class={cn(
    'relative h-full w-full py-3 group transition-all duration-200 items-center border-muted',
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'bg-card hover:border-muted-foreground/15 hover:bg-muted/50',
  )}
>
  <Item.Media class="self-center! mb-1.5 me-2 gap-1">
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
    {#if prof.icon}
      <IconPreview value={prof.icon} size={32} class="shrink-0 bg-background/40" />
    {:else}
      <div
        class="flex items-center justify-center text-sm font-bold rounded-full size-8 shrink-0 bg-muted"
        class:text-foreground={isActive}
        class:text-muted-foreground={!isActive}
      >
        {index + 1}
      </div>
    {/if}
  </Item.Media>

  {#if dot === null}
    <span class="keycap-led-dot" style="background:rgb(0,0,0)" title="LED éteinte"></span>
  {:else if dot.kind === 'gradient'}
    <span class="keycap-led-dot" style="background:{dot.css}" title="Effet LED animé hérité du global"></span>
  {:else}
    <span
      class="keycap-led-dot"
      style="background:{dot.color};box-shadow:0 0 5px 0px {dot.color}"
      title={dot.inherited ? 'Couleur LED héritée du global' : 'Couleur LED du profil'}
    ></span>
  {/if}

  <Item.Content>
    <Item.Title class="flex items-center gap-1.5 line-clamp-1">{prof.name}</Item.Title>
    <Item.Description class="text-xs line-clamp-2 flex items-center gap-1.5">
      {prof.layers?.length ?? 0} layer(s) · {fill.mapped}/{fill.total} touches
    </Item.Description>
  </Item.Content>

  {#if isActive}
    <DropdownMenu.Root>
      <div in:fade={{ duration: 150, delay: 200 }} out:fade={{ duration: 150 }}>
        <DropdownMenu.Trigger
          title="Options du profil"
          class={cn(
            buttonVariants({ variant: 'ghost', size: 'icon-xs' }),
            'absolute top-0.5 right-0.5 size-6 z-10 text-muted-foreground hover:bg-muted-foreground/20! hover:text-muted-foreground data-[state=open]:bg-muted-foreground/50 data-[state=open]:text-muted/50',
          )}
          onclick={(e) => e.preventDefault()}
        >
          <Settings2 />
        </DropdownMenu.Trigger>
      </div>
      <DropdownMenu.Content align="end" sideOffset={54} class="w-64 translate-x-1">
        <div class="px-1.5 py-1">
          <InputGroup.Root class="h-7">
            <InputGroup.Input
              placeholder="Nom du profil"
              value={prof.name ?? ''}
              onkeydown={(e: KeyboardEvent) => {
                e.stopPropagation();
                if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
              }}
              onchange={(e: Event) => renameProfile((e.currentTarget as HTMLInputElement).value)}
            />
            <InputGroup.Addon align="inline-end">
              <Kbd.Root>⏎</Kbd.Root>
            </InputGroup.Addon>
          </InputGroup.Root>
        </div>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onSelect={() => (iconOpen = true)}>
          <Palette />
          Modifier l'icône
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => (ledOpen = true)}>
          <Lightbulb />
          Couleur LED du profil
        </DropdownMenu.Item>
        <DropdownMenu.Item disabled={profileCount >= CONFIG_MAX_PROFILES} onSelect={duplicateProfile}>
          <CopyPlus />
          Dupliquer
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={onClear}>
          <BrushCleaning />
          Réinitialiser
        </DropdownMenu.Item>
        <DropdownMenu.Item
          variant="destructive"
          disabled={profileCount <= MIN_PROFILES}
          onSelect={onDelete}
        >
          <Trash2 />
          Supprimer
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {/if}
</Item.Root>

<Dialog.Root open={iconOpen} onOpenChange={(o) => { if (!o) iconOpen = false; }}>
  <Dialog.Content class="sm:max-w-fit">
    <Dialog.Header>
      <Dialog.Title>Icône — {prof.name ?? `Profil ${index + 1}`}</Dialog.Title>
      <Dialog.Description class="sr-only">Dessine ou choisis une icône pour ce profil.</Dialog.Description>
    </Dialog.Header>
    <IconEditor value={prof.icon ?? ''} onchange={(b64) => setProfileIcon(index, b64)} />
  </Dialog.Content>
</Dialog.Root>

<ProfileLedDialog bind:open={ledOpen} profileIndex={index} />
