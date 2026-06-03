<script lang="ts">
  import { Button } from '$shared/components/ui/button/index.js';
  import { Input } from '$shared/components/ui/input/index.js';
  import { keycodeGroups, keycodesFlat, type Keycode } from '$shared/constants/keycodes.js';
  import { configState } from '$shared/store/config.svelte.js';
  import { cn, scrollShadow } from '$shared/utils.js';
  import { getKeypadContext } from './keypad-context.svelte.js';
  import * as UnderlineTabs from '$shared/components/ui/underline-tabs';

  const ctx = getKeypadContext();

  const CATEGORY_COLORS: Record<string, string> = {
    letter: 'blue',
    number: 'lime',
    function: 'cyan',
    symbol: 'teal',
    nav: 'sky',
    keypad: 'emerald',
    special: 'slate',
    modifier: 'violet',
    layer: 'green',
    media: 'orange',
    app: 'amber',
    firmware: 'purple',
    macro: 'rose',
  };

  function categoryClass(category: string): string {
    const color = CATEGORY_COLORS[category];
    return color ? `bg-${color}-950/80 hover:bg-${color}-900/80` : 'bg-card';
  }

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
  let tabListEl = $state<HTMLElement | null>(null);
  let tabWrapperEl = $state<HTMLElement | null>(null);
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

  // Scroll active trigger into view in the tab list when tabValue changes
  $effect(() => {
    tabValue;
    const active = tabListEl?.querySelector<HTMLElement>('[data-state="active"]');
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  });

  $effect(() => {
    if (!tabListEl || !tabWrapperEl) return;
    return scrollShadow(tabListEl, tabWrapperEl);
  });
</script>

{#snippet keyButton(kc: Keycode)}
  <Button
    class={cn('text-foreground text-xs cursor-pointer', categoryClass(kc.category))}
    onclick={() => ctx.selectKeycode(kc)}>{kc.label}</Button
  >
{/snippet}

<div class="flex flex-col min-h-0 gap-2">
  <Input type="text" placeholder="Rechercher un keycode…" bind:value={ctx.searchQuery} autofocus class="shrink-0" />

  {#if !filteredKeycodes}
    <div bind:this={tabWrapperEl} class="shrink-0">
      <UnderlineTabs.Root bind:value={tabValue} onValueChange={scrollToSection} class="gap-0">
        <UnderlineTabs.List bind:ref={tabListEl}>
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
      <div aria-hidden="true" class="h-[50dvh] shrink-0"></div>
    {/if}
  </div>
</div>
