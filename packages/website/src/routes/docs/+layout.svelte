<script lang="ts">
  import { page } from '$app/stores';
  import { getDocsManifest } from '$lib/docs/index.js';

  let { children } = $props();

  const docs = getDocsManifest();

  const groups = docs.reduce<Record<string, typeof docs>>((acc, doc) => {
    const key = doc.group ?? '__root__';
    (acc[key] ??= []).push(doc);
    return acc;
  }, {});
</script>

<div class="max-w-5xl mx-auto px-4 py-10 flex gap-10">
  <nav class="hidden md:block w-52 shrink-0">
    <p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Docs</p>
    {#each Object.entries(groups) as [group, items]}
      {#if group !== '__root__'}
        <p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-5 mb-2">{group}</p>
      {/if}
      <ul class="space-y-1">
        {#each items as doc}
          <li>
            <a
              href="/docs/{doc.slug}/"
              class="block text-sm px-2 py-1 rounded transition-colors
                     {$page.url.pathname.includes(doc.slug)
                       ? 'bg-primary/10 text-primary font-medium'
                       : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
            >
              {doc.title}
            </a>
          </li>
        {/each}
      </ul>
    {/each}
  </nav>

  <article class="prose prose-invert max-w-none flex-1 min-w-0">
    {@render children()}
  </article>
</div>
