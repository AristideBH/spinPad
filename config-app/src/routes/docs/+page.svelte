<script>
  import { APP_CONFIG } from "$lib/app.config.js";

  let { data } = $props();
</script>

<svelte:head>
  <title>Documentation — {APP_CONFIG.name}</title>
</svelte:head>

<h1 class="text-3xl font-bold mb-2">{APP_CONFIG.name}</h1>
<p class="text-muted-foreground mb-8">{APP_CONFIG.tagline}</p>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
  {#each data.manifest as doc}
    <a
      href="/docs/{doc.slug}"
      class="group block p-4 rounded-lg border bg-card hover:border-primary/50 hover:bg-accent transition-colors"
    >
      {#if doc.group}
        <p class="text-xs text-muted-foreground uppercase tracking-widest mb-1">
          {doc.group}
        </p>
      {/if}
      <p class="font-semibold group-hover:text-primary transition-colors">
        {doc.title}
      </p>
    </a>
  {/each}
</div>
