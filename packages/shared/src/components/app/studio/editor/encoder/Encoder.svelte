<script lang="ts">
  import { Label } from '$shared/components/ui/label/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import { Scrubber } from '$shared/components/ui/scrubber/index.js';
  import { getKeypadContext } from '../keypad-context.svelte.js';
  import { EncoderKnob, setActiveEncoderKnob } from './encoder.svelte.js';
  import Knob from './Knob.svelte';
  import EncoderButtons from './EncoderButtons.svelte';
  import PresetSelect from './PresetSelect.svelte';
  import { trainingMode } from '$shared/store/trainingMode.svelte.js';
  import { configState, updateConfig } from '$shared/store/config.svelte.js';
  import { RotateCcw } from '@lucide/svelte';

  const ctx = getKeypadContext();

  const knob = new EncoderKnob({
    isTrainingActive: () => trainingMode.active,
    onTrigger: (field) => ctx.openEncoderPicker(field),
  });

  $effect(() => {
    setActiveEncoderKnob(knob);
    return () => setActiveEncoderKnob(null);
  });

  const layerSensitivity = $derived(ctx.layer?.encoder_sensitivity ?? null);
  const globalSensitivity = $derived(configState.data?.encoder.sensitivity ?? 1);
  const effectiveSensitivity = $derived(layerSensitivity ?? globalSensitivity);

  function setLayerSensitivity(v: number) {
    const pi = configState.activeProfileIndex;
    const li = configState.activeLayerIndex;
    updateConfig(`profiles.${pi}.layers.${li}.encoder_sensitivity`, v);
  }

  function resetLayerSensitivity() {
    const pi = configState.activeProfileIndex;
    const li = configState.activeLayerIndex;
    updateConfig(`profiles.${pi}.layers.${li}.encoder_sensitivity`, null);
  }
</script>

{#if ctx.layer}
  <div class="flex flex-col self-stretch gap-2 keycap-grid">
    <Label>Encodeur</Label>
    <PresetSelect />
    <EncoderButtons {knob} />
    <Knob {knob} />
    <div class="flex flex-col gap-1.5">
      <p class="text-xs text-muted-foreground">
        Sensitivity{layerSensitivity === null ? ' (global)' : ''}
      </p>
      <Scrubber
        min={1}
        max={4}
        step={1}
        ticks={2}
        decimals={0}
        value={effectiveSensitivity}
        class={layerSensitivity === null ? 'opacity-50' : ''}
        onChange={(v: number) => setLayerSensitivity(v)}
      >
        {#snippet label()}
          {#if layerSensitivity !== null}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Reset (inherits from global)"
              title="Reset (inherits from global)"
              onclick={resetLayerSensitivity}
            >
              <RotateCcw class="size-4" />
            </Button>
          {/if}
        {/snippet}
      </Scrubber>
    </div>
  </div>
{/if}
