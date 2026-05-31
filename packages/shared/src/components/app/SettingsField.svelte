<script lang="ts">
  import { Label } from '$shared/components/ui/label/index.js';

  /** @type {{ label: string, description?: string, children: import('svelte').Snippet }} */
  let { label, description, children } = $props();
</script>

<div class="flex items-center justify-between py-3 border-b last:border-0">
  <div class="flex flex-col gap-0.5">
    <Label class="text-sm font-medium">{label}</Label>
    {#if description}
      <p class="text-xs text-muted-foreground">{description}</p>
    {/if}
  </div>
  <div class="shrink-0">
    {@render children()}
  </div>
</div>
