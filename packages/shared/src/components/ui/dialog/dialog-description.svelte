<script lang="ts">
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import { cn } from '$shared/utils.js';

  let { ref = $bindable(null), class: className, ...restProps }: DialogPrimitive.DescriptionProps = $props();
</script>

<DialogPrimitive.Description
  bind:ref
  data-slot="dialog-description"
  class={cn(
    'text-muted-foreground max-w-sm! pr-4 pt-2 *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3 ',
    className,
  )}
  {...restProps}
/>
