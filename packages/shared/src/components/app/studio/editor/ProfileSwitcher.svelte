<script lang="ts">
  import { Label } from '$shared/components/ui/label/index.js';
  import * as RadioGroup from '$shared/components/ui/radio-group/index.js';
  import {
    configState,
    addProfile,
    deleteProfile,
    clearProfile,
    editProfile,
    setProfileIcon,
    exportProfiles,
    importProfiles,
    setActiveProfileLocal,
    undo,
  } from '$shared/store/config.svelte.js';
  import Sortable from '../sortable/Sortable.svelte';
  import { CONFIG_MAX_PROFILES, MIN_PROFILES, type ProfileConfig } from '$shared/constants/config-schema.js';
  import { Button, buttonVariants } from '$shared/components/ui/button/index.js';
  import * as Item from '$shared/components/ui/item/index.js';
  import IconPreview from '../../profiles/IconPreview.svelte';
  import IconEditor from '../../profiles/IconEditor.svelte';
  import AddProfileSheet from './AddProfileSheet.svelte';
  import { deviceStatus } from '$shared/store/deviceStatus.svelte.js';
  import { ScrollArea } from '$shared/components/ui/scroll-area/index.js';
  import { cn, scrollShadow } from '$shared/utils.js';
  import {
    BrushCleaning,
    CopyPlus,
    Download,
    GripVertical,
    MoreVertical,
    Palette,
    Plus,
    Share,
    Trash2,
    Upload,
  } from '@lucide/svelte';
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import * as DropdownMenu from '$shared/components/ui/dropdown-menu/index.js';
  import * as Dialog from '$shared/components/ui/dialog/index.js';
  import * as InputGroup from '$shared/components/ui/input-group/index.js';
  import * as Kbd from '$shared/components/ui/kbd/index.js';
  import { toast } from 'svelte-sonner';

  function profileFill(prof: ProfileConfig): { mapped: number; total: number } {
    let mapped = 0;
    let total = 0;
    for (const layer of prof.layers ?? []) {
      const keys = layer.keys ?? [];
      total += keys.length;
      for (const k of keys) if (k) mapped++;
    }
    return { mapped, total };
  }

  let profileValue = $state(String(configState.activeProfileIndex));
  let layerValue = $state(String(configState.activeLayerIndex));
  let viewport = $state<HTMLElement | null>(null);
  let rootEl = $state<HTMLElement | null>(null);

  // Sync STORE → LOCAL (lecture seule) : reflète les changements programmatiques
  // de profil — reset au premier profil lors d'un rechargement de config, undo/redo, etc.
  // N'écrit jamais dans le store, donc pas de boucle ni de reset de layer parasite.
  $effect(() => {
    profileValue = String(configState.activeProfileIndex);
  });

  // Radix/bits-ui ScrollArea hides native scrollbars and the touch-action chain
  // through mosaic's grid items doesn't reliably engage native finger-scroll.
  // Drive horizontal scroll explicitly from touch drags on the viewport. A drag
  // that starts on the reorder grip (data-grip) is left to mosaic.
  $effect(() => {
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

  // Ombres de bord : ancrées au Root (non défilant, donc fixes aux bords), mais
  // la position de défilement est lue sur le viewport bits-ui (le vrai scroller).
  // On n'attache PAS au RadioGroup : son overflow casserait le sticky du panneau.
  $effect(() => {
    if (!viewport || !rootEl) return;
    return scrollShadow(viewport, rootEl);
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
  // Couplage edit ↔ active : sélectionner un profil le rend aussi actif sur
  // le device (bascule légère + persistance), via setActiveProfileLocal.
  function onProfileChange(v: string) {
    layerValue = '0';
    setActiveProfileLocal(+v);
  }

  let fileInput = $state<HTMLInputElement | null>(null);
  let selectedExport = $state<Set<number>>(new Set());
  let dialogOpen = $state(false);

  // Profil actif rapporté par le device (null si pas de device live). Sert au
  // badge « Live » : reflète ce que le device exécute vraiment, ce qui peut
  // brièvement différer de la sélection studio le temps d'une réconciliation.
  const deviceActiveProfile = $derived(deviceStatus.data?.active_profile ?? null);

  const profileList = $derived(configState.data?.profiles ?? []);
  const allSelected = $derived(profileList.length > 0 && selectedExport.size === profileList.length);

  function toggleSelect(i: number) {
    const next = new Set(selectedExport);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    selectedExport = next;
  }

  function toggleAll() {
    selectedExport = allSelected ? new Set() : new Set(profileList.map((_, i) => i));
  }

  function onImportClick() {
    fileInput?.click();
  }

  async function onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      await importProfiles(file);
      dialogOpen = false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[import-profiles]', msg);
      toast.error('Import échoué', { description: msg });
    }
    if (fileInput) {
      fileInput.value = '';
    }
  }

  function onExportClick() {
    if (selectedExport.size === 0) return;
    exportProfiles([...selectedExport].sort((a, b) => a - b));
  }

  // ── CRUD par profil (menu ⋮ épinglé sur la carte active) ──────────
  let pendingIcon = $state<number | null>(null);
  let addOpen = $state(false);

  function renameProfile(i: number, name: string) {
    editProfile(i, { name });
  }

  function duplicateProfile(i: number) {
    if (profileList.length >= CONFIG_MAX_PROFILES) return;
    addProfile(profileList[i]); // op clone + nom unique + auto-sélection
  }

  // Suppression / réinitialisation immédiates : pas de dialogue de confirmation.
  // L'op est poussée dans l'historique (Ctrl+Z), et le toast offre un « Annuler »
  // direct qui rejoue exactement le même undo. Le nom est capturé avant l'op.
  function onDelete(i: number) {
    const name = profileList[i]?.name ?? `Profil ${i + 1}`;
    deleteProfile(i);
    toast(`Profil « ${name} » supprimé`, {
      action: { label: 'Annuler', onClick: () => undo() },
    });
  }

  function onClear(i: number) {
    const name = profileList[i]?.name ?? `Profil ${i + 1}`;
    clearProfile(i);
    toast(`Profil « ${name} » réinitialisé`, {
      action: { label: 'Annuler', onClick: () => undo() },
    });
  }
</script>

<ScrollArea
  orientation="horizontal"
  bind:ref={rootEl}
  bind:viewportRef={viewport}
  class="profiles flex flex-row relative w-full gap-2 rounded-xl bg-background/50 overflow-clip items-start border shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)] "
>
  <RadioGroup.Root bind:value={profileValue} onValueChange={onProfileChange} class="flex items-stretch w-full p-2 ">
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
          <Item.Root
            variant="outline"
            class={cn(
              'relative h-full w-full py-3 group transition-all duration-200 items-center border-muted ',
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
                  {i + 1}
                </div>
              {/if}
            </Item.Media>
            <Item.Content>
              <Item.Title class="flex items-center gap-1.5">
                {prof.name}
                {#if i === deviceActiveProfile}
                  <span
                    class="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium leading-none text-emerald-600 dark:text-emerald-400"
                    title="Profil actuellement actif sur le device"
                  >
                    <span class="size-1.5 rounded-full bg-emerald-500"></span>
                    Live
                  </span>
                {/if}
              </Item.Title>
              <Item.Description class="text-xs line-clamp-2">
                {@const fill = profileFill(prof)}
                {prof.layers?.length ?? 0} layer(s) · {fill.mapped}/{fill.total} touches
              </Item.Description>
            </Item.Content>

            {#if isActive}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger
                  title="Options du profil"
                  class={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                    'absolute top-1 right-1 z-10 size-7 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground data-[state=open]:bg-primary-foreground/20',
                  )}
                  onclick={(e) => e.preventDefault()}
                >
                  <MoreVertical />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end" class="w-52">
                  <div class="px-1.5 py-1">
                    <InputGroup.Root class="h-7">
                      <InputGroup.Input
                        placeholder="Nom du profil"
                        value={prof.name ?? ''}
                        onkeydown={(e: KeyboardEvent) => {
                          e.stopPropagation();
                          if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                        }}
                        onchange={(e: Event) => renameProfile(i, (e.currentTarget as HTMLInputElement).value)}
                      />
                      <InputGroup.Addon align="inline-end">
                        <Kbd.Root>⏎</Kbd.Root>
                      </InputGroup.Addon>
                    </InputGroup.Root>
                  </div>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item onSelect={() => (pendingIcon = i)}>
                    <Palette />
                    Modifier l'icône
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    disabled={profileList.length >= CONFIG_MAX_PROFILES}
                    onSelect={() => duplicateProfile(i)}
                  >
                    <CopyPlus />
                    Dupliquer
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => onClear(i)}>
                    <BrushCleaning />
                    Réinitialiser
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    variant="destructive"
                    disabled={profileList.length <= MIN_PROFILES}
                    onSelect={() => onDelete(i)}
                  >
                    <Trash2 />
                    Supprimer
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            {/if}
          </Item.Root>
        </Label>
      {/snippet}
    </Sortable>

    <div
      class="sticky z-20 flex flex-col items-center border rounded-lg ms-auto shrink-0 right-2 bg-card border-muted shadow-[0_0_18px_9px_var(--tw-shadow-color)] shadow-background/70"
    >
      <ButtonGroup.Root orientation="vertical">
        <Button
          variant="secondary"
          size="icon"
          disabled={profileList.length >= CONFIG_MAX_PROFILES}
          title="Ajouter un profil"
          onclick={() => (addOpen = true)}
        >
          <Plus />
        </Button>
        <Dialog.Root bind:open={dialogOpen}>
          <Dialog.Trigger
            class={cn('', buttonVariants({ variant: 'secondary', size: 'icon' }))}
            title="Importer / Exporter profils"
          >
            <Share />
          </Dialog.Trigger>
          <Dialog.Content class="sm:max-w-md">
            <Dialog.Header>
              <Dialog.Title>Profils — importer / exporter</Dialog.Title>
              <Dialog.Description class="text-balance">
                Sauvegarde ou charge des profils (.spinpad-profiles). L'import écrase les profils actuels.
              </Dialog.Description>
            </Dialog.Header>

            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-muted-foreground">À exporter</span>
                <Button variant="ghost" size="sm" onclick={toggleAll} disabled={profileList.length === 0}>
                  {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                </Button>
              </div>
              <div class="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
                {#each profileList as p, i (i)}
                  {@const checked = selectedExport.has(i)}
                  <button
                    type="button"
                    onclick={() => toggleSelect(i)}
                    class={[
                      'flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                      checked ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50',
                    ].join(' ')}
                  >
                    <span
                      class={[
                        'flex size-4 shrink-0 items-center justify-center rounded-sm border',
                        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground',
                      ].join(' ')}
                      aria-hidden="true"
                    >
                      {#if checked}✓{/if}
                    </span>
                    <span class="flex-1 truncate">{p.name?.trim() || `Profil ${i + 1}`}</span>
                    <span class="text-xs text-muted-foreground">{p.layers?.length ?? 0} layer(s)</span>
                  </button>
                {/each}
              </div>

              <div class="flex gap-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  onclick={onImportClick}
                  title="Importer des profils (.spinpad-profiles)"
                  disabled={!configState.data}
                  class="gap-1.5"
                >
                  <Upload class="size-4" /> Importer
                </Button>
                <Button
                  onclick={onExportClick}
                  title="Exporter les profils sélectionnés"
                  disabled={selectedExport.size === 0}
                  class="gap-1.5 "
                >
                  <Download class="size-4" /> Exporter ({selectedExport.size})
                </Button>
              </div>

              <input
                bind:this={fileInput}
                type="file"
                accept=".spinpad-profiles,.json"
                class="hidden"
                onchange={onFileSelected}
              />
            </div>
          </Dialog.Content>
        </Dialog.Root>
      </ButtonGroup.Root>
      <p class="text-[0.5rem]! py-1 leading-none text-muted-foreground/50">
        {profileList.length}/{CONFIG_MAX_PROFILES}
      </p>
    </div>
  </RadioGroup.Root>
</ScrollArea>

<AddProfileSheet bind:open={addOpen} />

<Dialog.Root open={pendingIcon !== null} onOpenChange={(o) => (o ? null : (pendingIcon = null))}>
  <Dialog.Content class="sm:max-w-fit">
    <Dialog.Header>
      <Dialog.Title>
        Icône — {pendingIcon !== null ? (profileList[pendingIcon]?.name ?? `Profil ${pendingIcon + 1}`) : ''}
      </Dialog.Title>
      <Dialog.Description class="sr-only">Dessine ou choisis une icône pour ce profil.</Dialog.Description>
    </Dialog.Header>
    {#if pendingIcon !== null}
      {@const pi = pendingIcon}
      <IconEditor value={profileList[pi]?.icon ?? ''} onchange={(b64) => setProfileIcon(pi, b64)} />
    {/if}
  </Dialog.Content>
</Dialog.Root>

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
