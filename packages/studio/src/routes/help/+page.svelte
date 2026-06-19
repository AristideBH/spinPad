<script lang="ts">
  import { ArrowLeft } from '@lucide/svelte';
  import { Button } from '$shared/components/ui/button/index.js';

  const modules = import.meta.glob('./content.md', { eager: true });
  const Content = (modules['./content.md'] as any)?.default;
</script>

<div class="px-4 prose-docs">
  <Button variant="ghost" size="sm" href="/" class="sticky top-0 mb-4 -ms-2">
    <ArrowLeft class="size-4" />
    Back to Studio
  </Button>
  {#if Content}
    <Content />
  {/if}
</div>
