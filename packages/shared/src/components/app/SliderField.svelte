<script lang="ts">
  import { Slider } from "$shared/components/ui/slider/index.js";

  let {
    label,
    value = $bindable(),
    min,
    max,
    step = 1,
    onCommit,
    valueText,
    valueClass = "text-muted-foreground",
    minLabel,
    maxLabel,
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onCommit: () => void;
    valueText?: string;
    valueClass?: string;
    minLabel?: string;
    maxLabel?: string;
  } = $props();
</script>

<div>
  <div class="flex justify-between mb-1 text-sm">
    <span>{label}</span>
    <span class={valueClass}>{valueText ?? value}</span>
  </div>
  <Slider type="single" {min} {max} {step} bind:value onValueChange={onCommit} />
  {#if minLabel || maxLabel}
    <div class="flex justify-between mt-1 text-xs text-muted-foreground">
      <span>{minLabel}</span>
      <span>{maxLabel}</span>
    </div>
  {/if}
</div>
