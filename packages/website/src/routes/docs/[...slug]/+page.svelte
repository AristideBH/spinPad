<script lang="ts">
  import { page } from '$app/state';
  import { components } from '$lib/docs/index.js';

  let slug = $derived((page.params.slug ?? '').replace(/\/$/, ''));
  let component = $derived((components[`/content/docs/${slug}.md`] as any)?.default ?? null);
  let slug = $derived((page.params.slug ?? '').replace(/\/$/, ''));
  let component = $derived((components[`/content/docs/${slug}.md`] as any)?.default ?? null);
</script>

{#if component}
  {@const SvelteComponent = component}
  <SvelteComponent />
  {@const SvelteComponent = component}
  <SvelteComponent />
{:else}
  <p class="text-muted-foreground">Page introuvable : <code>{slug}</code></p>
{/if}
