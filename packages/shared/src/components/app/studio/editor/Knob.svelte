<script lang="ts">
  import type { EncoderKnob } from './encoder.svelte.js';

  // `interactive` opt-in for keyboard nudging (Arrow/Space). Off by default so
  // DevMode live-modes can claim those keys for device-event simulation.
  let { knob, interactive = false }: { knob: EncoderKnob; interactive?: boolean } = $props();

  let knobEl = $state<HTMLElement | null>(null);

  $effect(() => {
    knob.setElement(knobEl);
  });
</script>

<div class="mt-2 knob-container w-fit" style="--rotation-deg: {knob.rotation}deg;" class:dragging={knob.isDragging}>
  <div
    bind:this={knobEl}
    class="knob"
    class:entrance-anim={knob.isAnimatingEntrance}
    onclick={knob.handleClick}
    onmousedown={knob.handleStart}
    ontouchstart={knob.handleStart}
    onkeydown={interactive ? knob.handleKeyDown : undefined}
    onwheel={knob.handleScroll}
    role="slider"
    aria-valuenow={knob.rotation}
    aria-valuemin="0"
    aria-valuemax="360"
    tabindex="0"
  >
    <div class="indicator"></div>
  </div>
  {#key knob.pressPulseNonce}
    {#if knob.pressPulseNonce > 0}
      <div class="press-pulse"></div>
    {/if}
  {/key}
</div>

<style>
  /* All your highly optimized performance layouts remain intact below */
  .knob-container {
    --knob-color: oklch(0.85 0.01 214.4 / 1);
    --knob-depth: 12px;
    --knob-side-color: color-mix(in oklch, var(--knob-color) 70%, hsl(0, 0%, 0%));
    --knob-size: 180px;
    --indicator-size: 32px;
    --conic-tone: 65%;
    margin-bottom: var(--knob-depth);
    padding: 0px;

    width: var(--knob-size);
    height: var(--knob-size);
    border-radius: 50%;
    position: relative;

    transition:
      box-shadow 0.1s ease-out,
      filter 0.1s ease-out;

    filter: drop-shadow(
      0px calc(var(--knob-depth) * 2) var(--knob-depth) color-mix(in oklch, var(--color-background) 30%, transparent)
    );

    box-shadow:
      0 var(--knob-depth) 0 var(--knob-side-color),
      inset 0 1px 0 rgba(255, 255, 255, 0.25),
      inset 0 -1px 0 rgba(255, 255, 255, 0.151),
      0 calc(var(--knob-depth) + 4px) 12px rgba(0, 0, 0, 0.349);

    &.dragging {
      filter: drop-shadow(
        0px calc(var(--knob-depth) * 2) var(--knob-depth) color-mix(in oklch, var(--color-background) 10%, transparent)
      );
    }
  }

  .knob {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid color-mix(in oklch, var(--knob-color) 80%, hsla(0, 0%, 100%, 0.301));

    background:
      radial-gradient(
        circle at center,
        color-mix(in oklch, var(--knob-color) 50%, hsl(0, 3%, 50%)) 0%,
        color-mix(in oklch, var(--knob-color) 50%, hsl(0, 0%, 60%)) 12%,
        transparent 50%
      ),
      linear-gradient(
        to bottom,
        color-mix(in oklch, var(--knob-color) var(--conic-tone, 0%), transparent) 40%,
        color-mix(in oklch, var(--knob-color) var(--conic-tone, 0%), transparent) 40%
      ),
      conic-gradient(
          from 115deg,
          color-mix(in oklch, var(--knob-color) 40%, hsl(0, 0%, 47%)) 0%,
          color-mix(in oklch, var(--knob-color) 40%, hsl(0, 0%, 60%)) 8%,
          color-mix(in oklch, var(--knob-color) 40%, hsl(0, 0%, 47%)) 15%,
          color-mix(in oklch, var(--knob-color) 40%, hsl(0, 0%, 40%)) 22%,
          color-mix(in oklch, var(--knob-color) 40%, hsl(0, 0%, 53%)) 30%,
          color-mix(in oklch, var(--knob-color) 40%, hsl(0, 0%, 73%)) 38%,
          color-mix(in oklch, var(--knob-color) 40%, hsl(0, 0%, 60%)) 45%,
          color-mix(in oklch, var(--knob-color) 40%, hsl(0, 0%, 43%)) 52%,
          color-mix(in oklch, var(--knob-color) 40%, hsl(0, 0%, 47%)) 60%,
          color-mix(in oklch, var(--knob-color) 40%, hsl(0, 0%, 67%)) 68%,
          color-mix(in oklch, var(--knob-color) 40%, hsl(0, 0%, 53%)) 75%,
          color-mix(in oklch, var(--knob-color) 40%, hsl(0, 0%, 40%)) 82%,
          color-mix(in oklch, var(--knob-color) 40%, hsl(0, 0%, 60%)) 90%,
          color-mix(in oklch, var(--knob-color) 40%, hsl(0, 0%, 73%)) 95%,
          color-mix(in oklch, var(--knob-color) 40%, hsl(0, 0%, 47%)) 100%
        )
        var(--knob-color);

    transform: rotate(var(--rotation-deg)) translateZ(0);
    will-change: transform;
  }
  /* Smooth hardware-accelerated cubic-bezier sweep for the entrance effect */
  .knob.entrance-anim {
    transition: transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
  }

  .knob::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    background: repeating-radial-gradient(
      circle at center,
      transparent 0px,
      transparent 2px,
      rgba(255, 255, 255, 0.03) 3px,
      rgba(0, 0, 0, 0.05) 4px
    );
    opacity: 0.7;
  }

  .knob-container::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    pointer-events: none;
    z-index: 5;
    background: radial-gradient(
      circle at 35% 35%,
      rgba(255, 255, 255, 0.15) 0%,
      transparent 60%,
      rgba(0, 0, 0, 0.3) 100%
    );
  }

  .press-pulse {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    pointer-events: none;
    z-index: 6;
    box-shadow: 0 0 0 0 color-mix(in oklch, var(--knob-color) 80%, white);
    animation: press-pulse 450ms ease-out;
  }

  @keyframes press-pulse {
    0% {
      box-shadow: 0 0 0 0 color-mix(in oklch, var(--knob-color) 80%, white);
      opacity: 1;
    }
    100% {
      box-shadow: 0 0 0 24px transparent;
      opacity: 0;
    }
  }

  .indicator {
    position: absolute;
    top: 20px;
    left: 50%;
    width: var(--indicator-size);
    height: var(--indicator-size);
    transform: translateX(-50%);
    background: linear-gradient(
      135deg,
      color-mix(in oklch, var(--knob-color) 80%, hsl(0, 0%, 78%)) 10%,
      color-mix(in oklch, var(--knob-color) 60%, hsl(0, 0%, 43%)) 110%
    );
    opacity: 1;
    border-radius: 50%;
    pointer-events: none;
    z-index: 10;
  }
</style>
