<script lang="ts">
  import {
    Field,
    FieldContent,
    FieldLabel,
    FieldDescription,
  } from '$shared/components/ui/field/index.js';

  /** @type {{ label: string, description?: string, children: import('svelte').Snippet }} */
  let { label, description, children } = $props();
</script>

<Field orientation="horizontal" class="py-3 border-b last:border-0">
  <FieldContent>
    <FieldLabel class="text-sm font-medium">{label}</FieldLabel>
    {#if description}
      <FieldDescription class="text-xs">{description}</FieldDescription>
    {/if}
  </FieldContent>
  <div class="shrink-0">
    {@render children()}
  </div>
</Field>
