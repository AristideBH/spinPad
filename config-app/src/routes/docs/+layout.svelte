<script>
  import { page } from "$app/state";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { APP_CONFIG } from "$lib/app.config.js";

  let { data, children } = $props();

  // Grouper les docs par sous-dossier
  const grouped = $derived.by(() => {
    const groups = {};
    for (const doc of data.manifest) {
      const key = doc.group ?? "_root";
      if (!groups[key]) groups[key] = [];
      groups[key].push(doc);
    }
    return groups;
  });

  const groupLabel = (key) =>
    key === "_root"
      ? APP_CONFIG.name
      : key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, " ");
</script>

<div class="flex min-h-[calc(100vh-3.5rem)]">
  <!-- Sidebar -->
  <aside class="w-56 shrink-0 border-r bg-[hsl(var(--sidebar))] py-6 px-3">
    <nav class="flex flex-col gap-1">
      <a
        href="/docs"
        class="px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-accent mb-2"
        class:bg-accent={page.url.pathname === "/docs"}
      >
        Documentation
      </a>

      {#each Object.entries(grouped) as [group, docs]}
        {#if group !== "_root"}
          <p
            class="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            {groupLabel(group)}
          </p>
        {/if}
        {#each docs as doc}
          <a
            href="/docs/{doc.slug}"
            class="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:hover:bg-accent transition-colors"
            class:bg-accent={page.url.pathname === `/docs/${doc.slug}`}
            class:test={page.url.pathname === `/docs/${doc.slug}`}
          >
            {doc.title}
          </a>
        {/each}
      {/each}
    </nav>
  </aside>

  <!-- Contenu -->
  <div class="flex-1 min-w-0 py-8 px-8">
    {@render children()}
  </div>
</div>
