<script lang="ts" generics="T extends { value: string | number; label: string }">
  import type { Snippet } from 'svelte';

  let {
    options,
    value,
    onSelect,
    gridClass = 'grid grid-cols-3 gap-2',
    buttonClass = 'py-2 text-xs',
    emphasizeSelected = false,
    item,
  }: {
    options: T[];
    value: string | number;
    onSelect: (value: T['value']) => void;
    gridClass?: string;
    buttonClass?: string;
    emphasizeSelected?: boolean;
    item: Snippet<[T]>;
  } = $props();
</script>

<div class={gridClass}>
  {#each options as o (o.value)}
    <button
      type="button"
      class={[
        'border rounded-lg transition-colors',
        buttonClass,
        value === o.value
          ? 'border-primary bg-primary/15 text-primary'
          : 'border-border hover:border-primary/50 hover:bg-primary/10',
        value === o.value && emphasizeSelected && 'font-semibold',
      ]}
      onclick={() => onSelect(o.value)}
    >
      {@render item(o)}
    </button>
  {/each}
</div>
