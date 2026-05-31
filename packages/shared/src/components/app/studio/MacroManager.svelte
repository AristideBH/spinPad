<script lang="ts">
  import * as Drawer from '$shared/components/ui/drawer/index.js';
  import * as Dialog from '$shared/components/ui/dialog/index.js';
  import { Button, buttonVariants } from '$shared/components/ui/button/index.js';
  import { Input } from '$shared/components/ui/input/index.js';
  import { Label } from '$shared/components/ui/label/index.js';
  import { cn } from '$shared/utils.js';
  import { Zap, Plus, Trash2, X, Clock, ArrowDownToLine, ArrowUpFromLine } from '@lucide/svelte';
  import { ACTION_TYPES, action } from '$shared/constants/action-types.js';
  import {
    MACRO_COUNT,
    MACRO_MAX_STEPS,
    MACRO_NAME_MAX_LEN,
    MACRO_STEP_TYPE,
    isMacroUsed,
    type MacroDef,
    type MacroStep,
  } from '$shared/constants/config-schema.js';
  import { KEYCODES, getKeycodeLabel, type Keycode } from '$shared/constants/keycodes.js';
  import { configState, setMacroName, setMacroSteps, clearMacro } from '$shared/store/config.svelte.js';

  // ── État local ────────────────────────────────────────────────
  let drawerOpen = $state(false);
  let selected = $state(0);
  let draftName = $state('');
  let draftSteps = $state<MacroStep[]>([]);
  let showAdvanced = $state(false);
  let pickerOpen = $state(false);
  let pickerSearch = $state('');

  const macros = $derived<MacroDef[]>(configState.data?.macros ?? []);
  const dirty = $derived(
    draftName !== (macros[selected]?.name ?? '') ||
      JSON.stringify(draftSteps) !== JSON.stringify(macros[selected]?.steps ?? []),
  );

  function load(idx: number) {
    selected = idx;
    draftName = macros[idx]?.name ?? '';
    draftSteps = structuredClone($state.snapshot(macros[idx]?.steps ?? []));
    showAdvanced = false;
  }

  function save() {
    setMacroName(selected, draftName);
    setMacroSteps(selected, draftSteps);
  }

  function clearSlot() {
    clearMacro(selected);
    draftName = '';
    draftSteps = [];
  }

  // ── Édition des étapes ────────────────────────────────────────
  function addTap(keycode: number) {
    if (draftSteps.length + 2 > MACRO_MAX_STEPS) return;
    draftSteps = [
      ...draftSteps,
      { type: MACRO_STEP_TYPE.KEY_DOWN, keycode },
      { type: MACRO_STEP_TYPE.KEY_UP, keycode },
    ];
  }
  function addStep(s: MacroStep) {
    if (draftSteps.length >= MACRO_MAX_STEPS) return;
    draftSteps = [...draftSteps, s];
  }
  function removeRange(from: number, count: number) {
    draftSteps = draftSteps.filter((_, i) => i < from || i >= from + count);
  }

  // ── Affichage condensé (Tap = down+up consécutifs même touche) ─
  interface DisplayItem {
    kind: 'tap' | 'hold' | 'release' | 'delay';
    label: string;
    from: number;
    count: number;
  }
  const displayItems = $derived.by<DisplayItem[]>(() => {
    const items: DisplayItem[] = [];
    const s = draftSteps;
    for (let i = 0; i < s.length; ) {
      const cur = s[i];
      const next = s[i + 1];
      if (cur.type === MACRO_STEP_TYPE.KEY_DOWN) {
        const label = getKeycodeLabel(action(ACTION_TYPES.ACTION_TYPE_KC, cur.keycode ?? 0));
        if (next && next.type === MACRO_STEP_TYPE.KEY_UP && next.keycode === cur.keycode) {
          items.push({ kind: 'tap', label, from: i, count: 2 });
          i += 2;
        } else {
          items.push({ kind: 'hold', label, from: i, count: 1 });
          i += 1;
        }
      } else if (cur.type === MACRO_STEP_TYPE.KEY_UP) {
        items.push({
          kind: 'release',
          label: getKeycodeLabel(action(ACTION_TYPES.ACTION_TYPE_KC, cur.keycode ?? 0)),
          from: i,
          count: 1,
        });
        i += 1;
      } else {
        items.push({ kind: 'delay', label: `${cur.delay ?? 0} ms`, from: i, count: 1 });
        i += 1;
      }
    }
    return items;
  });

  // ── Picker de touches (KC uniquement : pas de macros imbriquées) ─
  const pickerGroups: [string, Keycode[]][] = [
    ['Lettres', KEYCODES.letters],
    ['Chiffres', KEYCODES.number],
    ['Spéciales', KEYCODES.special],
    ['Modificateurs', KEYCODES.modifiers],
  ];
  const pickerFlat = $derived(pickerGroups.flatMap(([, ks]) => ks));
  const pickerFiltered = $derived(
    pickerSearch ? pickerFlat.filter((k) => k.label.toLowerCase().includes(pickerSearch.toLowerCase())) : null,
  );

  let pickerMode: 'tap' | 'hold' | 'release' = $state('tap');
  function openPicker(mode: 'tap' | 'hold' | 'release') {
    pickerMode = mode;
    pickerSearch = '';
    pickerOpen = true;
  }
  function pick(kc: Keycode) {
    const keycode = kc.value & 0x0fff;
    if (pickerMode === 'tap') addTap(keycode);
    else if (pickerMode === 'hold') addStep({ type: MACRO_STEP_TYPE.KEY_DOWN, keycode });
    else addStep({ type: MACRO_STEP_TYPE.KEY_UP, keycode });
    pickerOpen = false;
  }

  // Synchroniser le brouillon depuis la config quand le tiroir est ouvert et
  // que le slot sélectionné ou son contenu change (chargement, save, undo/redo).
  // Ne dépend pas du brouillon → pas de boucle, et n'écrase pas pendant l'édition
  // (les mutations du brouillon ne changent pas `macros`).
  $effect(() => {
    if (drawerOpen) load(selected);
  });
</script>

<Drawer.Root direction="right" bind:open={drawerOpen}>
  <Drawer.Trigger class={cn(buttonVariants({ variant: 'outline' }), 'gap-1.5')} title="Gérer les macros">
    <Zap class="size-4" /> Macros
  </Drawer.Trigger>
  <Drawer.Content>
    <Drawer.Header>
      <Drawer.Title>Macros globales</Drawer.Title>
      <Drawer.Description>
        16 macros partagées par tous les profils. Assigne-les à une touche via <span class="font-mono">Macro</span> dans le
        sélecteur de touche.
      </Drawer.Description>
    </Drawer.Header>

    <div class="flex flex-col w-full h-full max-w-md gap-4 px-4 pb-4 mx-auto overflow-y-auto">
      <!-- Sélecteur de slot -->
      <div class="grid grid-cols-4 gap-1.5">
        {#each Array.from({ length: MACRO_COUNT }, (_, i) => i) as i (i)}
          <button
            type="button"
            class={cn(
              'flex flex-col items-center gap-0.5 rounded-lg border px-1 py-2 text-xs transition-colors',
              selected === i ? 'border-rose-500 bg-rose-500/10' : 'border-border hover:border-rose-500/50',
            )}
            onclick={() => load(i)}
          >
            <span class="max-w-full font-semibold truncate">
              {isMacroUsed(macros[i]) ? macros[i].name?.trim() || `Macro ${i}` : `M${i}`}
            </span>
            <span class="text-[10px] text-muted-foreground">
              {isMacroUsed(macros[i]) ? `${macros[i].steps.length} ét.` : 'vide'}
            </span>
          </button>
        {/each}
      </div>

      <!-- Éditeur du slot sélectionné -->
      <div class="flex flex-col gap-3 p-3 border rounded-xl border-border">
        <div class="flex flex-col gap-1.5">
          <Label for="macro-name" class="text-xs">Nom</Label>
          <Input
            id="macro-name"
            bind:value={draftName}
            maxlength={MACRO_NAME_MAX_LEN - 1}
            placeholder={`Macro ${selected}`}
          />
        </div>

        <!-- Séquence -->
        <div class="flex flex-col gap-1">
          <Label class="text-xs">Séquence ({draftSteps.length}/{MACRO_MAX_STEPS})</Label>
          {#if displayItems.length === 0}
            <p class="py-3 text-xs text-center text-muted-foreground">Aucune étape — ajoute une touche ci-dessous.</p>
          {/if}
          {#each displayItems as item (item.from)}
            <div class="flex items-center gap-2 px-2 py-1.5 text-xs border rounded-md border-border">
              <span class="font-medium capitalize text-muted-foreground w-14">
                {item.kind === 'tap'
                  ? 'Appui'
                  : item.kind === 'hold'
                    ? 'Maintien'
                    : item.kind === 'release'
                      ? 'Relâche'
                      : 'Délai'}
              </span>
              <span class="flex-1 font-semibold">{item.label}</span>
              <button
                type="button"
                class="text-muted-foreground hover:text-destructive"
                title="Supprimer"
                onclick={() => removeRange(item.from, item.count)}
              >
                <X class="size-3.5" />
              </button>
            </div>
          {/each}
        </div>

        <!-- Ajout d'étapes -->
        <div class="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            class="gap-1.5"
            onclick={() => openPicker('tap')}
            disabled={draftSteps.length + 2 > MACRO_MAX_STEPS}
          >
            <Plus class="size-3.5" /> Touche
          </Button>
          <Button size="sm" variant="outline" onclick={() => (showAdvanced = !showAdvanced)}>Avancé</Button>
        </div>

        {#if showAdvanced}
          <div class="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant="outline"
              class="gap-1.5"
              onclick={() => openPicker('hold')}
              disabled={draftSteps.length >= MACRO_MAX_STEPS}
            >
              <ArrowDownToLine class="size-3.5" /> Maintien
            </Button>
            <Button
              size="sm"
              variant="outline"
              class="gap-1.5"
              onclick={() => openPicker('release')}
              disabled={draftSteps.length >= MACRO_MAX_STEPS}
            >
              <ArrowUpFromLine class="size-3.5" /> Relâche
            </Button>
            <Button
              size="sm"
              variant="outline"
              class="gap-1.5"
              onclick={() => addStep({ type: MACRO_STEP_TYPE.DELAY_MS, delay: 50 })}
              disabled={draftSteps.length >= MACRO_MAX_STEPS}
            >
              <Clock class="size-3.5" /> Délai
            </Button>
          </div>
        {/if}

        <!-- Édition fine des délais -->
        {#each draftSteps as step, si (si)}
          {#if step.type === MACRO_STEP_TYPE.DELAY_MS}
            <div class="flex items-center gap-2 text-xs">
              <Clock class="size-3.5 text-muted-foreground" />
              <span class="text-muted-foreground">Délai #{si + 1}</span>
              <Input
                type="number"
                min={1}
                max={1000}
                class="w-20 text-right h-7"
                value={step.delay ?? 50}
                onchange={(e: Event) => {
                  const v = Math.min(1000, Math.max(1, +(e.target as HTMLInputElement).value));
                  draftSteps = draftSteps.map((s, i) => (i === si ? { ...s, delay: v } : s));
                }}
              />
              <span class="text-muted-foreground">ms</span>
            </div>
          {/if}
        {/each}

        <!-- Actions -->
        <div class="flex justify-between gap-2 pt-2 border-t border-border">
          <Button size="sm" variant="ghost" class="gap-1.5 text-destructive" onclick={clearSlot}>
            <Trash2 class="size-3.5" /> Effacer
          </Button>
          <div class="flex gap-2">
            <Button size="sm" variant="outline" onclick={() => load(selected)} disabled={!dirty}>Annuler</Button>
            <Button size="sm" onclick={save} disabled={!dirty}>Enregistrer</Button>
          </div>
        </div>
      </div>
    </div>
  </Drawer.Content>
</Drawer.Root>

<!-- Picker de touche pour les étapes -->
<Dialog.Root bind:open={pickerOpen}>
  <Dialog.Content class="max-w-lg max-h-[80vh] flex flex-col">
    <Dialog.Header>
      <Dialog.Title>
        {pickerMode === 'tap' ? 'Touche à taper' : pickerMode === 'hold' ? 'Touche à maintenir' : 'Touche à relâcher'}
      </Dialog.Title>
    </Dialog.Header>
    <Input type="text" placeholder="Rechercher…" bind:value={pickerSearch} class="shrink-0" />
    <div class="flex-1 pr-1 mt-2 overflow-y-auto">
      {#if pickerFiltered}
        <div class="flex flex-wrap gap-1.5">
          {#each pickerFiltered as kc (kc.value)}
            <Button class="text-xs" variant="secondary" onclick={() => pick(kc)}>{kc.label}</Button>
          {/each}
        </div>
      {:else}
        {#each pickerGroups as [cat, keys] (cat)}
          <div class="mb-4">
            <Label class="mb-2 text-xs uppercase">{cat}</Label>
            <div class="flex flex-wrap gap-1.5">
              {#each keys as kc (kc.value)}
                <Button class="text-xs" variant="secondary" onclick={() => pick(kc)}>{kc.label}</Button>
              {/each}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
