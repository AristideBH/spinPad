<script lang="ts">
  import { cn } from '$shared/utils.js';
  import { spring } from 'svelte/motion';
  import type { Snippet } from 'svelte';

  export type ScrubberProps = {
    class?: string;
    decimals?: number;
    disabled?: boolean;
    label?: string | Snippet;
    max?: number;
    min?: number;
    onChange?: (v: number) => void;
    onCommit?: (v: number) => void;
    /** Display value as percentage of min–max range */
    percentage?: boolean;
    prefix?: string;
    step?: number;
    suffix?: string;
    /** Tick every N steps (e.g. tickStep=10 with step=0.01 → tick every 0.1) */
    tickStep?: number;
    /** Manual tick count; ignored when tickStep is set */
    ticks?: number;
    value?: number;
  };

  let {
    class: className,
    decimals = 2,
    disabled = false,
    label = undefined,
    max = 1,
    min = 0,
    onChange,
    onCommit,
    percentage = false,
    prefix = '',
    step = 0.01,
    suffix = '',
    tickStep,
    ticks = 9,
    value = $bindable(0),
  }: ScrubberProps = $props();

  let trackEl: HTMLDivElement | undefined = $state();
  let isDragging = $state(false);
  let isHovering = $state(false);
  let isHoverDevice = $state(false);

  const range = $derived(max - min);
  const fillPct = $derived(range > 0 ? ((value - min) / range) * 100 : 0);
  const isActive = $derived(isDragging || (isHoverDevice && isHovering));

  const tickPositions = $derived.by(() => {
    if (tickStep !== undefined) {
      const count = Math.max(0, Math.round(range / (step * tickStep)) - 1);
      return Array.from({ length: count }, (_, i) => (((i + 1) * tickStep * step) / range) * 100);
    }
    return Array.from({ length: ticks }, (_, i) => ((i + 1) / (ticks + 1)) * 100);
  });

  const displayValue = $derived.by(() => {
    const raw = percentage ? ((value - min) / range) * 100 : value;
    const formatted = raw.toFixed(decimals);
    return `${prefix}${formatted}${percentage ? '%' : ''}${suffix}`;
  });

  const thumbScale = spring(0.7, { stiffness: 300, damping: 25 });
  const thumbOpacity = spring(0.15, { stiffness: 300, damping: 25 });

  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
  const roundToStep = (v: number, s: number, m: number) => Math.round((v - m) / s) * s + m;
  const snap = (raw: number) => clamp(roundToStep(raw, step, min), min, max);

  function setValue(raw: number) {
    const next = snap(raw);
    value = next;
    onChange?.(next);
  }

  function getValueFromPointer(clientX: number): number {
    if (!trackEl) return value;
    const rect = trackEl.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    return min + ratio * range;
  }

  function handlePointerDown(e: PointerEvent) {
    if (disabled) return;
    if ((e.target as Element).closest('button, a, input, [role="button"]')) return;
    e.preventDefault();
    trackEl?.setPointerCapture(e.pointerId);
    isDragging = true;
    setValue(getValueFromPointer(e.clientX));
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging) return;
    setValue(getValueFromPointer(e.clientX));
  }

  function handlePointerUp() {
    if (!isDragging) return;
    isDragging = false;
    onCommit?.(value);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (disabled) return;
    let next: number | undefined;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = value + step;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = value - step;
        break;
      case 'Home':
        next = min;
        break;
      case 'End':
        next = max;
        break;
      default:
        return;
    }
    e.preventDefault();
    setValue(next);
  }

  $effect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    isHoverDevice = mq.matches;
    const onChange = (e: MediaQueryListEvent) => (isHoverDevice = e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  });

  $effect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const springOpts = prefersReduced ? { stiffness: 1, damping: 1 } : { stiffness: 300, damping: 25 };
    thumbScale.stiffness = springOpts.stiffness;
    thumbScale.damping = springOpts.damping;
    thumbOpacity.stiffness = springOpts.stiffness;
    thumbOpacity.damping = springOpts.damping;
  });

  $effect(() => {
    thumbScale.set(isActive ? 1 : 0.7);
    thumbOpacity.set(isActive ? 0.8 : 0.15);
  });

  const fillTransition = $derived(isDragging ? 'none' : 'width 150ms cubic-bezier(0.23, 1, 0.32, 1)');
  const thumbTransition = $derived(isDragging ? 'none' : 'left 150ms cubic-bezier(0.23, 1, 0.32, 1)');
</script>

<div class={cn('relative w-full select-none', disabled && 'opacity-50', className)}>
  <div
    bind:this={trackEl}
    role="slider"
    aria-label={typeof label === 'string' ? label : undefined}
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuenow={Number(value.toFixed(decimals))}
    aria-disabled={disabled || undefined}
    class={cn(
      'relative overflow-hidden bg-muted outline-offset-2 rounded-lg touch-none h-11',
      disabled ? 'cursor-default pointer-events-none' : 'cursor-pointer',
    )}
    tabindex={disabled ? -1 : 0}
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onmouseenter={() => (isHovering = true)}
    onmouseleave={() => (isHovering = false)}
    onkeydown={handleKeyDown}
  >
    <!-- Fill -->
    <div
      class="absolute inset-y-0 left-0 pointer-events-none rounded-xl bg-foreground/15"
      style="width: calc({fillPct}% + 0.75rem); transition: {fillTransition};"
    ></div>

    <!-- Ticks -->
    {#if tickPositions.length > 0}
      <div class="absolute inset-0 pointer-events-none">
        {#each tickPositions as pos (pos)}
          <div
            class="absolute top-1/2 bg-foreground/25"
            style="left: {pos}%; width: 1px; height: 8px; border-radius: 999px; transform: translateX(-50%) translateY(-50%);"
          ></div>
        {/each}
      </div>
    {/if}

    <!-- Thumb capsule -->
    <div
      class="absolute pointer-events-none"
      style="top: 50%; left: {fillPct}%; transform: translateX(-50%) translateY(-50%); z-index: 3; transition: {thumbTransition};"
    >
      <div
        class="bg-foreground/90"
        style="width: 5px; height: 34px; border-radius: 999px; opacity: {$thumbOpacity}; transform: scaleX({$thumbScale}) scaleY({$thumbScale});"
      ></div>
    </div>

    <!-- Label -->
    {#if label !== undefined}
      <div
        class="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 whitespace-nowrap text-foreground [&_button]:pointer-events-auto"
        style="z-index: 4;"
      >
        {#if typeof label === 'function'}
          {@render label()}
        {:else}
          {label}
        {/if}
      </div>
    {/if}

    <!-- Value display -->
    <div
      class="absolute -translate-y-1/2 pointer-events-none top-1/2 right-3 text-foreground"
      style="z-index: 4; font-family: ui-monospace, monospace; font-variant-numeric: tabular-nums;"
    >
      {displayValue}
    </div>
  </div>
</div>
