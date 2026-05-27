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

<div class="flex max-w-5xl gap-10 px-4 py-10 mx-auto">
  <nav class="hidden md:block w-52 shrink-0">
    <p class="mb-4 text-xs font-semibold tracking-widest uppercase text-muted-foreground">Docs</p>
    {#each Object.entries(groups) as [group, items]}
      {#if group !== '__root__'}
        <p class="mt-5 mb-2 text-xs font-semibold tracking-widest uppercase text-muted-foreground">{group}</p>
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

  <article class="flex-1 min-w-0 prose prose-invert max-w-none">
    {@render children()}
  </article>
</div>
