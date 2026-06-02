<script lang="ts">
  import { Label } from '$shared/components/ui/label/index.js';
  import { getKeypadContext } from './keypad-context.svelte.js';
  import { EncoderKnob, setActiveEncoderKnob } from './encoder.svelte.js';
  import Knob from './Knob.svelte';
  import EncoderButtons from './EncoderButtons.svelte';
  import PresetSelect from './PresetSelect.svelte';
  import { trainingMode } from '$shared/store/trainingMode.svelte.js';

  const ctx = getKeypadContext();

  const knob = new EncoderKnob({
    isTrainingActive: () => trainingMode.active,
    onTrigger: (field) => ctx.openEncoderPicker(field),
  });

  $effect(() => {
    setActiveEncoderKnob(knob);
    return () => setActiveEncoderKnob(null);
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
