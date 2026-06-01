<script lang="ts">
  import { Button } from '$shared/components/ui/button/index.js';
  import { Input } from '$shared/components/ui/input/index.js';
  import { keycodeGroups, keycodesFlat, type Keycode } from '$shared/constants/keycodes.js';
  import { configState } from '$shared/store/config.svelte.js';
  import { cn } from '$shared/utils.js';
  import { getKeypadContext } from './keypad-context.svelte.js';

  const ctx = getKeypadContext();

  // Couleur de fond par catégorie (déplacé depuis Editor.svelte).
  const CATEGORY_COLORS: Record<string, string> = {
    letter: 'bg-blue-950/80 hover:bg-blue-900/80',
    number: 'bg-lime-950/80 hover:bg-lime-900/80',
    function: 'bg-cyan-950/80 hover:bg-cyan-900/80',
    symbol: 'bg-teal-950/80 hover:bg-teal-900/80',
    nav: 'bg-sky-950/80 hover:bg-sky-900/80',
    keypad: 'bg-emerald-950/80 hover:bg-emerald-900/80',
    special: 'bg-slate-800/80 hover:bg-slate-700/80',
    modifier: 'bg-violet-950/80 hover:bg-violet-900/80',
    layer: 'bg-green-950/80 hover:bg-green-900/80',
    media: 'bg-orange-950/80 hover:bg-orange-900/80',
    app: 'bg-amber-950/80 hover:bg-amber-900/80',
    firmware: 'bg-purple-950/80 hover:bg-purple-900/80',
    macro: 'bg-rose-950/80 hover:bg-rose-900/80',
  };

  // Libellés lisibles par clé de groupe.
  const GROUP_LABELS: Record<string, string> = {
    letters: 'Lettres',
    number: 'Chiffres',
    function: 'Fonction',
    special: 'Spéciales',
    navigation: 'Navigation',
    symbols: 'Symboles',
    keypad: 'Pavé num.',
    modifiers: 'Modificateurs',
    layers: 'Layers',
    media: 'Média',
    apps: 'Applications',
    firmware: 'Firmware',
    macros: 'Macros',
  };

  let activeCat = $state<string | null>(null);

  const entries = $derived(Object.entries(keycodeGroups(configState.data?.macros)) as [string, Keycode[]][]);
  const visibleEntries = $derived(activeCat ? entries.filter(([cat]) => cat === activeCat) : entries);

  const filteredKeycodes = $derived(
    ctx.searchQuery
      ? keycodesFlat(configState.data?.macros).filter((k: Keycode) =>
          k.label.toLowerCase().includes(ctx.searchQuery.toLowerCase()),
        )
      : null,
  );
</script>

<div class="flex flex-col min-h-0 gap-2">
  <Input
    type="text"
    placeholder="Rechercher un keycode…"
    bind:value={ctx.searchQuery}
    autofocus
    class="shrink-0"
  />

  <!-- Filtres de catégorie -->
  {#if !filteredKeycodes}
    <div class="flex flex-wrap gap-1 shrink-0">
      <Button
        variant={activeCat === null ? 'default' : 'outline'}
        size="sm"
        class="h-6 px-2 text-xs"
        onclick={() => (activeCat = null)}>Tout</Button
      >
      {#each entries as [cat] (cat)}
        <Button
          variant={activeCat === cat ? 'default' : 'outline'}
          size="sm"
          class="h-6 px-2 text-xs"
          onclick={() => (activeCat = activeCat === cat ? null : cat)}>{GROUP_LABELS[cat] ?? cat}</Button
        >
      {/each}
    </div>
  {/if}

  <!-- Liste défilante (overflow natif → sticky fiable) -->
  <div class="flex-1 min-h-0 pr-1 overflow-y-auto">
    {#if filteredKeycodes}
      {#if filteredKeycodes.length === 0}
        <p class="py-6 text-sm text-center text-muted-foreground">Aucun résultat</p>
      {:else}
        <div class="flex flex-wrap gap-1.5">
          {#each filteredKeycodes as kc (kc.value)}
            <Button
              class={cn('text-foreground text-xs cursor-pointer', CATEGORY_COLORS[kc.category] ?? 'bg-card')}
              onclick={() => ctx.selectKeycode(kc)}>{kc.label}</Button
            >
          {/each}
        </div>
      {/if}
    {:else}
      {#each visibleEntries as [cat, keys] (cat)}
        <div class="mb-4">
          <h3
            class="sticky top-0 z-10 py-1 mb-2 text-xs font-semibold uppercase bg-popover text-muted-foreground"
          >
            {GROUP_LABELS[cat] ?? cat}
          </h3>
          <div class="flex flex-wrap gap-1.5">
            {#each keys as kc (kc.value)}
              <Button
                class={cn('text-foreground text-xs cursor-pointer', CATEGORY_COLORS[kc.category] ?? 'bg-card')}
                onclick={() => ctx.selectKeycode(kc)}>{kc.label}</Button
              >
            {/each}
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
