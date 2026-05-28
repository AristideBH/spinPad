<script lang="ts">
  import * as Card from '../../../ui/card/index.js';
  import { Button } from '../../../ui/button/index.js';
  import { SlidersHorizontal } from '@lucide/svelte';

  async function handleScreenOption() {
   //TODO
    alert('TODO');
    
  }
</script>

<Card.Root class="@container/card row-span-2 pb-0">
  <Card.Header class="h-fit ">
    <Card.Description>Ecran</Card.Description>
    <Card.Action>
      <Button
        variant="ghost"
        class="gap-1.5"
        size="xs"
        on:click={() => handleScreenOption() }
      >
        <SlidersHorizontal class="size-3" />
      </Button>
      </Card.Action>
  </Card.Header>
  
  <div
    class="flex flex-col items-baseline justify-center w-full h-full gap-4 bg-muted/50 text-balance"
  >
    <span class="w-full p-2 text-sm leading-relaxed text-center text-muted-foreground">
      Aperçu de l'écran du clavier <br />TODO
    </span>
  </div>
</Card.Root>
