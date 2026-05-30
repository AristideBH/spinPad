<script lang="ts">
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import { getKeycodeLabel } from '$shared/constants/keycodes.js';
  import { cn } from '$shared/utils.js';
  import { getKeypadContext } from './keypad-context.svelte.js';
  import type { EncoderKnob } from './encoder.svelte.js';

  let { knob }: { knob: EncoderKnob } = $props();

  const ctx = getKeypadContext();

  const buttons = $derived([
    { field: 'encoder_ccw', label: '↺', value: ctx.layer?.encoder?.ccw ?? 0 },
    { field: 'encoder_cw', label: '↻', value: ctx.layer?.encoder?.cw ?? 0 },
  ]);
</script>

<ButtonGroup.Root class="w-full">
  {#each buttons as enc (enc.field)}
    <Button
      variant="outline"
      class={cn(
        'h-auto flex-col py-2 grow transition-all duration-200 pb-3',
        ctx.editingField === enc.field ? 'border-violet-500 bg-violet-950/40' : '',
        knob.activeTriggeredButton === enc.field ? 'bg-muted!' : '',
      )}
      onclick={() => ctx.openEncoderPicker(enc.field)}
    >
      <span class="text-2xl leading-none text-muted-foreground">{enc.label}</span>
      <span class="knobkey-label">{getKeycodeLabel(enc.value)}</span>
    </Button>
  {/each}
</ButtonGroup.Root>

<style>
  .knobkey-label {
    font-size: var(--keycap-label-size);
    font-weight: 600;
    line-height: 1;
    color: var(--foreground);
  }
</style>
