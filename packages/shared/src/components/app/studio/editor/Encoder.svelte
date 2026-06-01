<script lang="ts">
  import { Label } from '$shared/components/ui/label/index.js';
  import { getKeypadContext } from './keypad-context.svelte.js';
  import { EncoderKnob } from './encoder.svelte.js';
  import Knob from './Knob.svelte';
  import EncoderButtons from './EncoderButtons.svelte';
  import PresetSelect from './PresetSelect.svelte';
  import { testMode } from '$shared/store/testMode.svelte.js';

  const ctx = getKeypadContext();

  const knob = new EncoderKnob({
    isTrainingActive: () => testMode.active,
    onTrigger: (field) => ctx.openEncoderPicker(field),
  });
</script>

{#if ctx.layer}
  <div class="flex flex-col self-stretch gap-3 keycap-grid">
    <Label>Encodeur</Label>
    <div class="flex flex-col items-center gap-4 w-fit">
      <EncoderButtons {knob} />
      <Knob {knob} />
    </div>
    <PresetSelect />
  </div>
{/if}
