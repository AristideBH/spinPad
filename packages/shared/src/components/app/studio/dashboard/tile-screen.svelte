<script lang="ts">
  import * as Card from '$shared/components/ui/card/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import { SlidersHorizontal } from '@lucide/svelte';

  async function handleScreenOption() {
    //TODO
  }
</script>

<Card.Root class="@container/card pb-0 row-span-2 min-h-[180px]">
  <Card.Header class=" h-fit">
    <Card.Description>Ecran</Card.Description>
    <Card.Action>
      <Button variant="ghost" size="icon-xs" onclick={() => handleScreenOption()}>
        <SlidersHorizontal class="size-3" />
      </Button>
    </Card.Action>
  </Card.Header>

  <div class="flex flex-col items-baseline justify-center w-full h-full gap-4 bg-muted/50 text-balance">
    <span class="w-full p-2 text-sm leading-relaxed text-center text-muted-foreground">
      TODO <br />Aperçu de l'écran du clavier
    </span>
  </div>
</Card.Root>
