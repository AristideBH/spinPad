<script lang="ts">
  import * as Card from '$shared/components/ui/card/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import { Pencil, Check } from '@lucide/svelte';
  import ScreenEditor from './ScreenEditor.svelte';
  import ScreenAddMenu from './ScreenAddMenu.svelte';

  let editable = $state(false);
</script>

<Card.Root class="@container/card row-span-2 min-h-[180px] h-full gap-2 pb-0">
  <Card.Header class="h-fit">
    {#if editable}
      <ScreenAddMenu />
    {:else}
      <Card.Description class="row-span-2">Écran</Card.Description>
    {/if}
    <Card.Action>
      <Button
        variant={editable ? 'default' : 'ghost'}
        size="icon-xs"
        title={editable ? "Terminer l'édition" : 'Éditer les widgets'}
        onclick={() => (editable = !editable)}
      >
        {#if editable}
          <Check class="size-3" />
        {:else}
          <Pencil class="size-3" />
        {/if}
      </Button>
    </Card.Action>
  </Card.Header>

  <Card.Content class="flex-1 min-h-0 p-0">
    <ScreenEditor {editable} />
  </Card.Content>
</Card.Root>
