<script lang="ts">
  import { Button } from '$shared/components/ui/button/index.js';
  import { Input } from '$shared/components/ui/input/index.js';
  import { keycodeGroups, keycodesFlat, type Keycode } from '$shared/constants/keycodes.js';
  import { configState } from '$shared/store/config.svelte.js';
  import { cn } from '$shared/utils.js';
  import { getKeypadContext } from './keypad-context.svelte.js';
  import * as UnderlineTabs from '$shared/components/ui/underline-tabs';

  const ctx = getKeypadContext();

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

  let tabValue = $state('all');
  let listEl = $state<HTMLDivElement | null>(null);
  let sectionEls = $state<Record<string, HTMLElement | null>>({});
  let isSyncingFromTab = false;

  const entries = $derived(Object.entries(keycodeGroups(configState.data?.macros)) as [string, Keycode[]][]);

  const filteredKeycodes = $derived(
    ctx.searchQuery
      ? keycodesFlat(configState.data?.macros).filter((k: Keycode) =>
          k.label.toLowerCase().includes(ctx.searchQuery.toLowerCase()),
        )
      : null,
  );

  function scrollToSection(val: string) {
    isSyncingFromTab = true;
    if (val === 'all') {
      listEl?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      sectionEls[val]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTimeout(() => (isSyncingFromTab = false), 700);
  }

  // Sync active tab from scroll position via IntersectionObserver
  $effect(() => {
    if (!listEl) return;
    const keys = Object.keys(sectionEls);
    if (keys.length === 0) return;

    const visibleCats = new Set<string>();

    const observer = new IntersectionObserver(
      (ioEntries) => {
        if (isSyncingFromTab) return;
        for (const entry of ioEntries) {
          const cat = entry.target.getAttribute('data-cat')!;
          if (entry.isIntersecting) visibleCats.add(cat);
          else visibleCats.delete(cat);
        }
        if (visibleCats.size === 0) {
          tabValue = 'all';
          return;
        }
        const first = entries.find(([cat]) => visibleCats.has(cat));
        if (first) tabValue = first[0];
      },
      { root: listEl, threshold: 0.1, rootMargin: '-5% 0px -50% 0px' },
    );

    for (const cat of keys) {
      const el = sectionEls[cat];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  });
</script>

{#snippet keyButton(kc: Keycode)}
  <Button
    class={cn('text-foreground text-xs cursor-pointer', CATEGORY_COLORS[kc.category] ?? 'bg-card')}
    onclick={() => ctx.selectKeycode(kc)}>{kc.label}</Button
  >
{/snippet}

<div class="flex flex-col min-h-0 gap-2">
  <Input type="text" placeholder="Rechercher un keycode…" bind:value={ctx.searchQuery} autofocus class="shrink-0" />

  {#if !filteredKeycodes}
    <div
      class="shrink-0"
      style="mask-image: linear-gradient(to right, black 85%, transparent 100%); -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%)"
    >
      <UnderlineTabs.Root bind:value={tabValue} onValueChange={scrollToSection} class="gap-0">
        <UnderlineTabs.List>
          <UnderlineTabs.Trigger value="all">Tout</UnderlineTabs.Trigger>
          {#each entries as [cat] (cat)}
            <UnderlineTabs.Trigger value={cat}>{GROUP_LABELS[cat] ?? cat}</UnderlineTabs.Trigger>
          {/each}
        </UnderlineTabs.List>
      </UnderlineTabs.Root>
    </div>
  {/if}

  <div bind:this={listEl} class="flex-1 min-h-0 pr-1 overflow-y-auto">
    {#if filteredKeycodes}
      {#if filteredKeycodes.length === 0}
        <p class="py-6 text-sm text-center text-muted-foreground">Aucun résultat</p>
      {:else}
        <div class="flex flex-wrap gap-1.5">
          {#each filteredKeycodes as kc (kc.value)}
            {@render keyButton(kc)}
          {/each}
        </div>
      {/if}
    {:else}
      {#each entries as [cat, keys] (cat)}
        <div bind:this={sectionEls[cat]} data-cat={cat} class="mb-4">
          <h3 class="sticky top-0 z-10 py-1 mb-2 text-xs font-semibold uppercase bg-popover text-muted-foreground">
            {GROUP_LABELS[cat] ?? cat}
          </h3>
          <div class="flex flex-wrap gap-1.5">
            {#each keys as kc (kc.value)}
              {@render keyButton(kc)}
            {/each}
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
