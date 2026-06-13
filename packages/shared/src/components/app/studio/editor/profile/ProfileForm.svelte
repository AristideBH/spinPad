<script lang="ts">
  // ───────────────────────────────────────────────────────────────
  //  ProfileForm — édition d'un brouillon de profil (création / tweak)
  //
  //  Édite une copie LOCALE d'un ProfileConfig (nom, icône, liste de
  //  layers par leur nom) puis émet le profil complet via `onsubmit`.
  //  Aucune mutation du store tant que l'utilisateur ne confirme pas :
  //  l'appelant commit via addProfile(draft). Les touches restent à 0,
  //  assignées plus tard dans l'éditeur principal.
  // ───────────────────────────────────────────────────────────────
  import { Input } from '$shared/components/ui/input/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import { Label } from '$shared/components/ui/label/index.js';
  import * as InputGroup from '$shared/components/ui/input-group/index.js';
  import IconEditor from '../../IconEditor.svelte';
  import {
    defaultProfile,
    defaultLayer,
    CONFIG_MAX_LAYERS,
    MIN_LAYERS,
    type ProfileConfig,
  } from '$shared/constants/config-schema.js';
  import { ChevronDown, ChevronUp, Plus, Trash2 } from '@lucide/svelte';
  import { untrack } from 'svelte';

  interface Props {
    initial?: ProfileConfig;
    submitLabel?: string;
    onsubmit: (profile: ProfileConfig) => void;
    oncancel?: () => void;
  }
  let { initial, submitLabel = 'Ajouter', onsubmit, oncancel }: Props = $props();

  // Copie locale isolée (snapshot → structuredClone : ni proxy, ni ref partagée).
  let draft = $state<ProfileConfig>(
    structuredClone($state.snapshot(untrack(() => initial) ?? defaultProfile()) as ProfileConfig),
  );

  const canAddLayer = $derived(draft.layers.length < CONFIG_MAX_LAYERS);
  const canRemoveLayer = $derived(draft.layers.length > MIN_LAYERS);

  function addLayerRow() {
    if (!canAddLayer) return;
    draft.layers.push(defaultLayer(`Layer ${draft.layers.length + 1}`));
  }
  function removeLayerRow(i: number) {
    if (!canRemoveLayer) return;
    draft.layers.splice(i, 1);
  }
  function moveLayer(i: number, to: number) {
    if (to < 0 || to >= draft.layers.length) return;
    const [l] = draft.layers.splice(i, 1);
    draft.layers.splice(to, 0, l);
  }

  function submit() {
    if (!draft.name.trim()) draft.name = 'Profil';
    onsubmit($state.snapshot(draft) as ProfileConfig);
  }
</script>

<div class="flex flex-col gap-4 px-4 py-2 overflow-y-auto">
  <div class="flex flex-col gap-1.5">
    <Label for="pf-name">Nom</Label>
    <Input id="pf-name" bind:value={draft.name} placeholder="Nom du profil" maxlength={31} />
  </div>

  <div class="flex flex-col gap-1.5">
    <Label>Icône</Label>
    <IconEditor value={draft.icon ?? ''} onchange={(b64) => (draft.icon = b64)} />
  </div>

  <div class="flex flex-col gap-1.5">
    <div class="flex items-center justify-between">
      <Label>Layers ({draft.layers.length}/{CONFIG_MAX_LAYERS})</Label>
      <Button variant="outline" size="sm" disabled={!canAddLayer} onclick={addLayerRow} class="gap-1.5">
        <Plus class="size-4" /> Layer
      </Button>
    </div>
    <div class="flex flex-col gap-1.5">
      {#each draft.layers as layer, i (i)}
        <InputGroup.Root>
          <InputGroup.Input bind:value={layer.name} placeholder={`Layer ${i + 1}`} />
          <InputGroup.Addon align="inline-end">
            <Button
              variant="ghost"
              size="icon"
              class="size-6"
              title="Monter"
              disabled={i === 0}
              onclick={() => moveLayer(i, i - 1)}
            >
              <ChevronUp class="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="size-6"
              title="Descendre"
              disabled={i === draft.layers.length - 1}
              onclick={() => moveLayer(i, i + 1)}
            >
              <ChevronDown class="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="size-6 text-destructive"
              title="Supprimer le layer"
              disabled={!canRemoveLayer}
              onclick={() => removeLayerRow(i)}
            >
              <Trash2 class="size-3.5" />
            </Button>
          </InputGroup.Addon>
        </InputGroup.Root>
      {/each}
    </div>
    <p class="text-xs text-muted-foreground">Les touches sont assignées ensuite dans l'éditeur.</p>
  </div>

  <div class="flex justify-end gap-2 pt-2">
    {#if oncancel}
      <Button variant="secondary" onclick={oncancel}>Annuler</Button>
    {/if}
    <Button onclick={submit}>{submitLabel}</Button>
  </div>
</div>
