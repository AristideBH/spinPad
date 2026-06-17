<script lang="ts">
  import { ResponsiveSheet } from '$shared/components/ui/responsive-sheet/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import { Input } from '$shared/components/ui/input/index.js';
  import { Label } from '$shared/components/ui/label/index.js';
  import { cn } from '$shared/utils.js';
  import {
    Zap,
    Plus,
    Trash2,
    X,
    Clock,
    ArrowDownToLine,
    ArrowUpFromLine,
    GripVertical,
    ChevronDown,
  } from '@lucide/svelte';
  import Sortable from '../Sortable.svelte';
  import SaveBadge from '../SaveBadge.svelte';
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
  import {
    KEYCODES,
    getKeycodeLabel,
    keyEventToKeycode,
    isModifierCode,
    type Keycode,
  } from '$shared/constants/keycodes.js';
  import { configState, setMacroName, setMacroSteps, clearMacro } from '$shared/store/config.svelte.js';
  import { macroManager } from '$shared/store/macroManager.svelte.js';
  import { HasFinePointer } from '$shared/lib/hooks/pointer.svelte.js';
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import * as DropdownMenu from '$shared/components/ui/dropdown-menu/index.js';
  import * as Item from '$shared/components/ui/item/index.js';
  import { Activity, ArrowLeft, List, Keyboard } from '@lucide/svelte';
  import { fly } from 'svelte/transition';

  const finePointer = new HasFinePointer();

  // ── Local state ────────────────────────────────────────────────
  let selected = $state(0);
  let draftName = $state('');
  let draftSteps = $state<MacroStep[]>([]);
  let showAdvanced = $state(false);
  let pickerOpen = $state(false);
  let pickerSearch = $state('');
  let pickerStage = $state<'menu' | 'record' | 'list'>('menu');
  let pickerMode: 'tap' | 'hold' | 'release' = $state('tap');
  const pickerTitle = $derived(
    pickerMode === 'tap' ? 'Key to tap' : pickerMode === 'hold' ? 'Key to hold' : 'Key to release',
  );

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

  // ── Step editing ────────────────────────────────────────
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

  // Reorders steps at the level of displayed blocks (a "Tap" = 2 steps
  // down+up). We split draftSteps into blocks per displayItems, move
  // the block dFrom→dTo, then flatten.
  function reorderSteps(dFrom: number, dTo: number) {
    const blocks = displayItems.map((di) => draftSteps.slice(di.from, di.from + di.count));
    const [moved] = blocks.splice(dFrom, 1);
    blocks.splice(dTo, 0, moved);
    draftSteps = blocks.flat();
  }

  // ── Condensed display (Tap = consecutive down+up on same key) ─
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

  // ── Key picker (KC only: no nested macros) ─
  const pickerGroups: [string, Keycode[]][] = [
    ['Letters', KEYCODES.letters],
    ['Numbers', KEYCODES.number],
    ['Special', KEYCODES.special],
    ['Modifiers', KEYCODES.modifiers],
  ];
  const pickerFlat = $derived(pickerGroups.flatMap(([, ks]) => ks));
  const pickerFiltered = $derived(
    pickerSearch ? pickerFlat.filter((k) => k.label.toLowerCase().includes(pickerSearch.toLowerCase())) : null,
  );

  function openPicker(mode: 'tap' | 'hold' | 'release') {
    pickerMode = mode;
    pickerSearch = '';
    pickerStage = 'menu';
    pickerOpen = true;
  }
  function pick(kc: Keycode) {
    const keycode = kc.value & 0x0fff;
    if (pickerMode === 'tap') addTap(keycode);
    else if (pickerMode === 'hold') addStep({ type: MACRO_STEP_TYPE.KEY_DOWN, keycode });
    else addStep({ type: MACRO_STEP_TYPE.KEY_UP, keycode });
    pickerOpen = false;
  }

  // ── Live record capture (stage === 'record') ──────────────────
  function onRecordKeydown(e: KeyboardEvent) {
    if (e.code === 'Escape') return;
    e.preventDefault();
    e.stopPropagation();
    if (isModifierCode(e.code)) return; // ignore modifiers in macro step capture
    const kc = keyEventToKeycode(e);
    if (kc) pick(kc);
  }

  $effect(() => {
    if (!pickerOpen || pickerStage !== 'record') return;
    window.addEventListener('keydown', onRecordKeydown, true);
    return () => window.removeEventListener('keydown', onRecordKeydown, true);
  });

  // Sync the draft from the config when the drawer is open and
  // the selected slot or its content changes (load, save, undo/redo).
  // Does not depend on the draft → no loop, and does not overwrite during editing
  // (draft mutations don't change `macros`).
  $effect(() => {
    if (!macroManager.open) return;
    // Slot requested by an external caller (toast, link…) otherwise current selection.
    const idx = macroManager.requestedIndex ?? selected;
    if (macroManager.requestedIndex !== null) macroManager.requestedIndex = null;
    load(idx);
  });
</script>

<Button variant="outline" class="gap-1.5" title="Manage macros" onclick={() => (macroManager.open = true)}>
  <Zap class="size-4" /> Macros
</Button>

<ResponsiveSheet
  bind:open={macroManager.open}
  title="Global macros"
  description="16 macros shared by all profiles. Assign them to a key via Macro in the key selector."
  srOnlyTitle={false}
>
  <div class="flex flex-col w-full h-full max-w-md gap-4 px-4 py-4 mx-auto overflow-y-auto">
    <!-- Slot selector -->
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
            {isMacroUsed(macros[i]) ? `${macros[i].steps.length} steps` : 'empty'}
          </span>
        </button>
      {/each}
    </div>

    <!-- Editor for the selected slot -->
    <div class="flex flex-col gap-3 p-3 border rounded-xl border-border">
      <div class="flex flex-col gap-1.5">
        <Label for="macro-name" class="text-xs">Name</Label>
        <Input
          id="macro-name"
          bind:value={draftName}
          maxlength={MACRO_NAME_MAX_LEN - 1}
          placeholder={`Macro ${selected}`}
        />
      </div>

      <!-- Sequence -->
      <div class="flex flex-col gap-1">
        <Label class="text-xs">Sequence ({draftSteps.length}/{MACRO_MAX_STEPS})</Label>
        {#if displayItems.length === 0}
          <p class="py-3 text-xs text-center text-muted-foreground">No steps — add a key below.</p>
        {/if}
        {#if displayItems.length > 0}
          <Sortable
            items={displayItems}
            orientation="vertical"
            rowHeight="auto"
            gap={[0, 4]}
            getKey={(_, i) => `step-${i}`}
            onReorder={reorderSteps}
          >
            {#snippet children({ item, handlePointerDown })}
              <div class="flex items-center h-8 gap-2 px-2 text-xs border rounded-md border-border bg-background">
                <button
                  type="button"
                  class="flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab touch-none"
                  title="Reorder"
                  onpointerdown={handlePointerDown}
                >
                  <GripVertical class="size-3.5" />
                </button>
                <span class="font-medium capitalize text-muted-foreground w-14">
                  {item.kind === 'tap'
                    ? 'Tap'
                    : item.kind === 'hold'
                      ? 'Hold'
                      : item.kind === 'release'
                        ? 'Release'
                        : 'Delay'}
                </span>
                <span class="flex-1 font-semibold">{item.label}</span>
                <button
                  type="button"
                  class="text-muted-foreground hover:text-destructive"
                  title="Delete"
                  onclick={() => removeRange(item.from, item.count)}
                >
                  <X class="size-3.5" />
                </button>
              </div>
            {/snippet}
          </Sortable>
        {/if}
      </div>

      <ButtonGroup.Root>
        <Button
          variant="outline"
          size="sm"
          class="gap-1.5"
          onclick={() => openPicker('tap')}
          disabled={draftSteps.length + 2 > MACRO_MAX_STEPS}
        >
          <Plus class="size-3.5" /> Key
        </Button>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button {...props} variant="outline" size="icon-sm">
                <ChevronDown />
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end" class="[--radius:1rem]">
            <DropdownMenu.Group>
              <DropdownMenu.Item onclick={() => openPicker('hold')} disabled={draftSteps.length >= MACRO_MAX_STEPS}>
                <ArrowDownToLine class="size-3.5" /> Hold
              </DropdownMenu.Item>
              <DropdownMenu.Item onclick={() => openPicker('release')} disabled={draftSteps.length >= MACRO_MAX_STEPS}>
                <ArrowUpFromLine class="size-3.5" /> Release
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onclick={() => addStep({ type: MACRO_STEP_TYPE.DELAY_MS, delay: 50 })}
                disabled={draftSteps.length >= MACRO_MAX_STEPS}
              >
                <Clock class="size-3.5" /> Delay
              </DropdownMenu.Item>
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </ButtonGroup.Root>

      <!-- Fine-tuning of the delays -->
      {#each draftSteps as step, si (si)}
        {#if step.type === MACRO_STEP_TYPE.DELAY_MS}
          <div class="flex items-center gap-2 text-xs">
            <Clock class="size-3.5 text-muted-foreground" />
            <span class="text-muted-foreground">Delay #{si + 1}</span>
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
          <Button size="sm" variant="outline" onclick={() => load(selected)} disabled={!dirty}>Cancel</Button>
          <Button size="sm" onclick={save} disabled={!dirty}>Save</Button>
        </div>
      </div>
    </div>
  </div>

  {#snippet badge()}
    <SaveBadge />
  {/snippet}
  <!-- Key picker for the steps (menu → record / list, nested drawer on mobile) -->
  <ResponsiveSheet
    bind:open={pickerOpen}
    title={pickerTitle}
    srOnlyTitle={true}
    nested={true}
    desktopClass="max-w-md flex flex-col"
  >
    {#snippet header()}
      <div class="flex items-center max-w-md gap-2 pt-4 pr-12 shrink-0">
        {#if pickerStage !== 'menu'}
          <Button variant="ghost" size="icon-sm" onclick={() => (pickerStage = 'menu')} title="Back">
            <ArrowLeft class="size-4" />
          </Button>
        {/if}
        <p class="text-sm font-semibold text-left">{pickerTitle}</p>
      </div>
    {/snippet}

    <div class="relative flex flex-col flex-1 min-h-0 p-4 mt-4">
      {#key pickerStage}
        <div class="flex flex-col flex-1 min-h-0" in:fly={{ x: pickerStage === 'menu' ? -16 : 16, duration: 150 }}>
          {#if pickerStage === 'menu'}
            <Item.Group class="gap-2">
              <Item.Root variant="outline">
                {#snippet child({ props })}
                  <button
                    {...props}
                    class={[
                      props.class as string,
                      'cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                    ].join(' ')}
                    disabled={!finePointer.current}
                    onclick={() => (pickerStage = 'record')}
                  >
                    <Item.Media variant="icon"><Activity class="size-5" /></Item.Media>
                    <Item.Content>
                      <Item.Title>Live recording</Item.Title>
                      <Item.Description>
                        {finePointer.current
                          ? 'Press a key on your physical keyboard.'
                          : 'Requires a physical keyboard.'}
                      </Item.Description>
                    </Item.Content>
                  </button>
                {/snippet}
              </Item.Root>
              <Item.Root variant="outline">
                {#snippet child({ props })}
                  <button
                    {...props}
                    class={[props.class as string, 'cursor-pointer'].join(' ')}
                    onclick={() => (pickerStage = 'list')}
                  >
                    <Item.Media variant="icon"><List class="size-5" /></Item.Media>
                    <Item.Content>
                      <Item.Title>Browse the list</Item.Title>
                      <Item.Description>Search and keycode categories.</Item.Description>
                    </Item.Content>
                  </button>
                {/snippet}
              </Item.Root>
            </Item.Group>
          {:else if pickerStage === 'record'}
            <div class="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <div class="grid place-items-center size-16 rounded-xl bg-card ring-2 ring-ring/40">
                <Keyboard class="size-7 text-muted-foreground" />
              </div>
              <p class="text-sm text-muted-foreground">
                Press a key to add it. Modifiers are ignored.
              </p>
            </div>
          {:else}
            <Input type="text" placeholder="Search…" bind:value={pickerSearch} class="shrink-0" />
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
          {/if}
        </div>
      {/key}
    </div>
  </ResponsiveSheet>
</ResponsiveSheet>
