<script lang="ts">
  import { Button } from '$shared/components/ui/button/index.js';
  import { Input } from '$shared/components/ui/input/index.js';
  import { keycodeGroups, keycodesFlat, type Keycode } from '$shared/constants/keycodes.js';
  import { configState } from '$shared/store/config.svelte.js';
  import { cn } from '$shared/utils.js';
  import { getKeypadContext } from '../keypad-context.svelte.js';
  import * as UnderlineTabs from '$shared/components/ui/underline-tabs';
  import { ScrollSyncedTabs } from '$shared/lib/hooks/scroll-synced-tabs.svelte.js';

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
    letters: 'Letters',
    number: 'Digits',
    function: 'Function',
    special: 'Special',
    navigation: 'Navigation',
    symbols: 'Symbols',
    keypad: 'Keypad',
    modifiers: 'Modifiers',
    layers: 'Layers',
    media: 'Media',
    apps: 'Applications',
    firmware: 'Firmware',
    macros: 'Macros',
  };

  const tabs = new ScrollSyncedTabs('all');

  const layerCount = $derived(configState.activeProfile?.layers.length);

  const entries = $derived(
    Object.entries(keycodeGroups(configState.data?.macros, layerCount)) as [string, Keycode[]][],
  );

  const filteredKeycodes = $derived(
    ctx.searchQuery
      ? keycodesFlat(configState.data?.macros, layerCount).filter((k: Keycode) =>
          k.label.toLowerCase().includes(ctx.searchQuery.toLowerCase()),
        )
      : null,
  );

  tabs.bind(() => entries.map(([cat]) => cat));
</script>

{#snippet keyButton(kc: Keycode)}
  <Button
    class={cn('text-foreground text-xs cursor-pointer', categoryClass(kc.category))}
    onclick={() => ctx.selectKeycode(kc)}>{kc.label}</Button
  >
{/snippet}

<div class="flex flex-col min-h-0 gap-2">
  <Input type="text" placeholder="Rechercher un keycode…" bind:value={ctx.searchQuery} class="shrink-0" />

  {#if !filteredKeycodes}
    <div bind:this={tabs.tabWrapperEl} class="shrink-0 [--scroll-shadow-color:var(--popover)]">
      <UnderlineTabs.Root bind:value={tabs.value} onValueChange={tabs.scrollToSection} class="gap-0">
        <UnderlineTabs.List bind:ref={tabs.tabListEl}>
          {#each entries as [cat] (cat)}
            <UnderlineTabs.Trigger value={cat}>{GROUP_LABELS[cat] ?? cat}</UnderlineTabs.Trigger>
          {/each}
        </UnderlineTabs.List>
      </UnderlineTabs.Root>
    </div>
  {/if}

  <div bind:this={tabs.listEl} class="flex-1 min-h-0 pr-1 overflow-y-auto">
    {#if filteredKeycodes}
      {#if filteredKeycodes.length === 0}
        <p class="py-6 text-sm text-center text-muted-foreground">No results</p>
      {:else}
        <div class="flex flex-wrap gap-1.5">
          {#each filteredKeycodes as kc (kc.value)}
            {@render keyButton(kc)}
          {/each}
        </div>
      {/if}
    {:else}
      {#each entries as [cat, keys] (cat)}
        <div bind:this={tabs.sectionEls[cat]} data-cat={cat} class="mb-4">
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
