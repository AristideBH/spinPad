<script lang="ts">
  import { page } from '$app/stores';
  import { components } from '$lib/docs/index.js';

  $: slug = $page.params.slug.replace(/\/$/, '');
  $: component = (components[`/content/docs/${slug}.md`] as any)?.default ?? null;
</script>

{#if component}
  <svelte:component this={component} />
{:else}
  <p class="text-muted-foreground">Page introuvable : <code>{slug}</code></p>
{/if}
