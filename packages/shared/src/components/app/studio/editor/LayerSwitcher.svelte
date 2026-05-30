<script lang="ts">
  import { Label } from '$shared/components/ui/label/index.js';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$shared/components/ui/select/index.js';
  import { configState } from '$shared/store/config.svelte.js';
  import { getKeypadContext } from './keypad-context.svelte.js';
  import * as RadioGroup from '$shared/components/ui/radio-group/index.js';
  import { Button, buttonVariants } from '$shared/components/ui/button/index.js';
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import { cn } from '$shared/utils.js';
  import { MoreVertical, Plus } from '@lucide/svelte';

  const ctx = getKeypadContext();

  let layerValue = $state(String(configState.activeLayerIndex));

  function onLayerChange(v: string) {
    configState.activeLayerIndex = +v;
  }
</script>

{#if ctx.profile}
  <div class="flex flex-col gap-3 keycap-grid grow min-w-[180px] max-w-[200px]">
    <Label class="ml-2">Layers</Label>

    <RadioGroup.Root bind:value={layerValue} onValueChange={onLayerChange} class="flex flex-col gap-1 ">
      {#each ctx.profile.layers ?? [] as l, i}
        <ButtonGroup.Root class="w-full">
          <Label
            class={cn(
              'grow flex justify-start! gap-2! px-2! items-end',
              buttonVariants({ variant: 'outline', size: 'sm' }),
            )}
            for="l-{i}"
          >
            <RadioGroup.Item value={String(i)} title={l.name} id="l-{i}" />
            {l.name}
          </Label>
          <Button variant="outline" class="ml-auto" size="icon-sm" title="Éditer le layer">
            <MoreVertical />
          </Button>
        </ButtonGroup.Root>
      {/each}
    </RadioGroup.Root>
  </div>
{/if}
