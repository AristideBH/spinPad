<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useHeaderRight } from './header-right.svelte.js';

  let { content }: { content: Snippet } = $props();

  const headerRight = useHeaderRight();

  $effect(() => {
    headerRight.set(content);
    return () => headerRight.set(null);
  });
</script>
