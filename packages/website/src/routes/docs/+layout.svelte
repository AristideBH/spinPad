<script lang="ts">
  import * as Toc from '$shared/components/ui/toc/index.js';

  let { children } = $props();

  // Live table of contents built from the rendered article headings.
  const toc = new Toc.UseToc();
</script>

<div class="flex max-w-5xl gap-10 px-4 py-10 mx-auto">
  <!-- ── Content ── -->
  <article class="prose-docs flex-1 min-w-0">
    <div bind:this={toc.ref} style="display: contents;">
      {@render children()}
    </div>
  </article>

  <!-- ── On-this-page TOC ── -->
  <aside class="hidden lg:block w-52 shrink-0">
    {#if toc.current.length > 0}
      <div class="sticky top-24">
        <p class="mb-3 text-xs font-semibold tracking-widest uppercase text-muted-foreground">
          Sur cette page
        </p>
        <Toc.Root toc={toc.current} />
      </div>
    {/if}
  </aside>
</div>
