<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    onclick,
    disabled = false,
    class: klass = "",
    children,
  }: {
    onclick: () => void;
    disabled?: boolean;
    class?: string;
    children: Snippet;
  } = $props();
</script>

<button
  type="button"
  class={[
    "px-2 py-1 text-xs transition-colors border border-dashed rounded border-border hover:border-primary/60 hover:bg-accent",
    klass,
  ]}
  {onclick}
  {disabled}
>
  {@render children()}
</button>
