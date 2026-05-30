<script lang="ts">
  import * as Select from '$shared/components/ui/select/index.js';
  import { getKeypadContext } from './keypad-context.svelte.js';
  import { ENCODER_PRESETS, applyEncoderPreset, matchPreset } from './encoder-presets.js';

  const ctx = getKeypadContext();
  const CUSTOM = '__custom__';

  const selected = $derived(matchPreset(ctx.layer?.encoder) ?? CUSTOM);
  const selectedPreset = $derived(ENCODER_PRESETS.find((p) => p.label === selected) ?? null);

  function onPresetChange(value: string): void {
    const preset = ENCODER_PRESETS.find((p) => p.label === value);
    if (preset) applyEncoderPreset(preset);
  }
</script>

<Select.Root type="single" name="presets" value={selected} onValueChange={onPresetChange}>
  <Select.Trigger class="w-[180px]">
    {#if selectedPreset}
      {@const Icon = selectedPreset.icon}
      <Icon class="size-4 text-muted-foreground" />
      {selectedPreset.label}
    {:else}
      Personnalisé
    {/if}
  </Select.Trigger>
  <Select.Content>
    <Select.Group>
      <Select.Label>Presets</Select.Label>
      {#each ENCODER_PRESETS as preset (preset.label)}
        {@const Icon = preset.icon}
        <Select.Item value={preset.label} label={preset.label}>
          <Icon class="size-4 text-muted-foreground" />
          {preset.label}
        </Select.Item>
      {/each}
      {#if selected === CUSTOM}
        <Select.Item value={CUSTOM} label="Personnalisé" disabled>Personnalisé</Select.Item>
      {/if}
    </Select.Group>
  </Select.Content>
</Select.Root>
