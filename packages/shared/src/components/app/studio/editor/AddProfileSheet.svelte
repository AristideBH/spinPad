<script lang="ts">
  // ───────────────────────────────────────────────────────────────
  //  AddProfileSheet — création de profil (responsive sheet)
  //
  //  Sheet (desktop) / Drawer (mobile) à trois vues :
  //   - chooser : choisir « depuis la librairie » ou « créer de zéro »
  //   - library : liste des presets → Ajouter (tel quel) ou Personnaliser
  //   - form    : ProfileForm (brouillon) pour création / tweak
  //
  //  Tout ajout passe par addProfile(), qui auto-sélectionne le nouveau
  //  profil (layer 0) via _applyOp, puis ferme la sheet.
  // ───────────────────────────────────────────────────────────────
  import ResponsiveSheet from '$shared/components/ui/responsive-sheet/responsive-sheet.svelte';
  import { Button, buttonVariants } from '$shared/components/ui/button/index.js';
  import { cn } from '$shared/utils.js';
  import IconPreview from '../../profiles/IconPreview.svelte';
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

  // Repart du sélecteur à chaque fermeture.
  $effect(() => {
    if (!open) {
      view = 'chooser';
      formInitial = undefined;
    }
  });

  function commit(profile: ProfileConfig) {
    addProfile(profile); // auto-sélection du nouveau profil
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
    view === 'library' ? 'Depuis la librairie' : view === 'form' ? 'Configurer le profil' : 'Ajouter un profil',
  );
</script>

<ResponsiveSheet bind:open title="Ajouter un profil" side="right" desktopClass="w-full sm:max-w-md flex flex-col">
  {#snippet header()}
    <div class="flex items-center gap-2 px-4 py-3 border-b">
      {#if view !== 'chooser'}
        <Button variant="ghost" size="icon" class="size-7" title="Retour" onclick={() => (view = 'chooser')}>
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
          <div class="grid gap-3 p-4 sm:grid-cols-2">
            <button
              type="button"
              onclick={() => (view = 'library')}
              class="flex flex-col items-start gap-2 p-4 text-left transition-colors border rounded-xl hover:border-primary/50 hover:bg-muted/40"
            >
              <Library class="size-5 text-primary" />
              <span class="font-medium">Depuis la librairie</span>
              <span class="text-xs text-muted-foreground">Partir d'un preset, tel quel ou personnalisé.</span>
            </button>
            <button
              type="button"
              onclick={openCreate}
              class="flex flex-col items-start gap-2 p-4 text-left transition-colors border rounded-xl hover:border-primary/50 hover:bg-muted/40"
            >
              <PencilRuler class="size-5 text-primary" />
              <span class="font-medium">Créer de zéro</span>
              <span class="text-xs text-muted-foreground">Nom, icône et layers à partir d'un profil vierge.</span>
            </button>
          </div>
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
                  <Button variant="outline" size="sm" onclick={() => openTweak(preset)}>Personnaliser</Button>
                  <Button size="sm" onclick={() => commit(preset.profile)}>Ajouter</Button>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <ProfileForm initial={formInitial} submitLabel="Ajouter" onsubmit={commit} oncancel={() => (view = 'chooser')} />
        {/if}
      </div>
    {/key}
  </div>
</ResponsiveSheet>
