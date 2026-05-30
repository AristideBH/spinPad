<script lang="ts">
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import { action, ACTION_TYPES, MEDIA_CODES } from '$shared/constants/action-types.js';
  import { getKeycodeLabel } from '$shared/constants/keycodes.js';
  import { configState, setEncoderAction } from '$shared/store/config.svelte.js';
  import { ListVideo, SeparatorHorizontal, SeparatorVertical, Volume2, ZoomIn } from '@lucide/svelte';
  import { cn } from '$shared/utils.js';
  import { getKeypadContext } from './keypad-context.svelte.js';
  import { Label } from '$shared/components/ui/label/index.js';
  import { Spring } from 'svelte/motion';

  import * as Select from '$shared/components/ui/select/index.js';

  const fruits = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'blueberry', label: 'Blueberry' },
    { value: 'grapes', label: 'Grapes' },
    { value: 'pineapple', label: 'Pineapple' },
  ];

  const ctx = getKeypadContext();

  const ENCODER_PRESETS = [
    {
      label: 'Volume',
      icon: Volume2,
      cw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_VOL_UP),
      ccw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_VOL_DN),
    },
    {
      label: 'Scroll X',
      icon: SeparatorVertical,
      cw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_SCRL_RIGHT),
      ccw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_SCRL_LEFT),
    },
    {
      label: 'Scroll Y',
      icon: SeparatorHorizontal,
      cw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_SCRL_UP),
      ccw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_SCRL_DN),
    },
    {
      label: 'Piste',
      icon: ListVideo,
      cw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_NEXT),
      ccw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_PREV),
    },
    {
      label: 'Zoom',
      icon: ZoomIn,
      cw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_ZOOM_IN),
      ccw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_ZOOM_OUT),
    },
  ];

  function applyEncoderPreset(preset: { cw: number; ccw: number }): void {
    const pi = configState.activeProfileIndex;
    const li = configState.activeLayerIndex;
    setEncoderAction(pi, li, 'cw', preset.cw);
    setEncoderAction(pi, li, 'ccw', preset.ccw);
  }

  let selectedPreset = $state('');
  const triggerContent = $derived(ENCODER_PRESETS.find((f) => f.label === selectedPreset)?.label ?? 'Select a preset');

  //when a preset is selected, we want to update the encoder config immediately to reflect the preset values.
  $effect(() => {
    if (!selectedPreset) return;
    const preset = ENCODER_PRESETS.find((p) => p.label === selectedPreset);
    if (preset) {
      applyEncoderPreset(preset);
    }
  });

  // Create a Svelte 5 Spring instance for handling systemic snaps
  const rotationSpring = new Spring(-90, {
    stiffness: 0.08, // Controls speed of snap
    damping: 0.45, // Lower values create a subtle mechanical overshoot/elastic bounce
  });

  // 1. Svelte 5 Reactive States
  let rotation = $derived(rotationSpring.current);
  let isDragging = $state(false);
  let isAnimatingEntrance = $state(true);
  let isResetting = $state(false);

  // Track which field button should look active/highlighted during inertia phase
  let activeTriggeredButton = $state<string | null>(null);
  let knobRef: HTMLElement | null = $state(null);

  // Keep our physical tracking state bound to the spring's real-time current position
  $effect(() => {
    rotation = rotationSpring.current;
  });

  // Entrance hook
  $effect(() => {
    const startTimeout = setTimeout(() => {
      // Use the spring to glide smoothly to 0 on mount
      rotationSpring.target = 0;
    }, 50);

    const endTimeout = setTimeout(() => {
      isAnimatingEntrance = false;
    }, 900);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(endTimeout);
    };
  });

  // Tracking physics values
  let startAngle = 0;
  let startRotation = 0;
  let lastAngle = 0;
  let velocity = 0;
  let lastTime = 0;
  let animationFrameId = 0;
  let delayTimeoutId: any = null;
  let dragEndTime = 0;

  // Track total change during a drag session to determine intent on release
  let sessionDeltaAccumulator = 0;

  function getAngle(clientX: number, clientY: number) {
    if (!knobRef) return 0;
    const rect = knobRef.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radians = Math.atan2(clientY - centerY, clientX - centerX);
    return radians * (180 / Math.PI);
  }

  function handleStart(e: MouseEvent | TouchEvent) {
    isDragging = true;

    cancelAnimationFrame(animationFrameId);
    clearTimeout(delayTimeoutId);
    velocity = 0;
    sessionDeltaAccumulator = 0;
    activeTriggeredButton = null;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    startAngle = getAngle(clientX, clientY);
    lastAngle = startAngle;

    // FIX B: Read position safely directly from the running spring
    startRotation = rotationSpring.current;
    lastTime = performance.now();

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
  }

  function handleMove(e: MouseEvent | TouchEvent) {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const currentTime = performance.now();
    const currentAngle = getAngle(clientX, clientY);

    let deltaAngle = currentAngle - lastAngle;
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;

    sessionDeltaAccumulator += deltaAngle;

    const timeDelta = currentTime - lastTime;
    if (timeDelta > 0) {
      velocity = deltaAngle / timeDelta;
    }

    // FIX C: Force the spring to update instantly with your finger/mouse movements
    rotationSpring.set(rotationSpring.current + deltaAngle, { instant: true });

    lastAngle = currentAngle;
    lastTime = currentTime;
  }

  function updateInertia() {
    if (isDragging) return;

    const currentTime = performance.now();
    const timeDelta = currentTime - lastTime;
    lastTime = currentTime;

    const friction = 0.8;
    velocity *= Math.pow(friction, timeDelta / 16);

    // FIX D: Update the spring value instantly during inertia slide phase
    rotationSpring.set(rotationSpring.current + velocity * timeDelta, { instant: true });

    if (Math.abs(velocity) > 0.005) {
      animationFrameId = requestAnimationFrame(updateInertia);
    } else {
      velocity = 0;
    }
  }

  function handleClick(e: MouseEvent) {
    // Blocks ghost clicks on drag-release
    rotationSpring.target = 0;

    if (performance.now() - dragEndTime < 100) return;

    // Blocks click when already home at zero
    if (Math.abs(rotationSpring.current) < 0.5) return;

    const resetDirectionField = rotationSpring.current > 0 ? 'encoder_ccw' : 'encoder_cw';
    isResetting = true;
    activeTriggeredButton = resetDirectionField;

    // FIX E: Set target directly. The spring handles the math from here!
    rotationSpring.target = 0;

    setTimeout(() => {
      isResetting = false;
      activeTriggeredButton = null;
    }, 500);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick(e as any);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      rotationSpring.set(rotationSpring.current + 15, { instant: false });
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      rotationSpring.set(rotationSpring.current - 15, { instant: false });
    }
  }

  function handleScroll(e: WheelEvent) {
    e.preventDefault();
    console.log('Wheel event deltaY:', e.deltaY);
    rotationSpring.set(rotationSpring.current - e.deltaY, { instant: false });
  }

  function handleEnd() {
    isDragging = false;
    dragEndTime = performance.now(); // Record exactly when the drag stopped

    window.removeEventListener('mousemove', handleMove);
    window.removeEventListener('touchmove', handleMove);
    window.removeEventListener('mouseup', handleEnd);
    window.removeEventListener('touchend', handleEnd);

    if (Math.abs(sessionDeltaAccumulator) > 1) {
      const targetField = sessionDeltaAccumulator > 0 ? 'encoder_cw' : 'encoder_ccw';
      activeTriggeredButton = targetField;

      clearTimeout(delayTimeoutId);
      delayTimeoutId = setTimeout(() => {
        if (ctx.trainingActive) {
          ctx.openEncoderPicker(targetField);
        }
        activeTriggeredButton = null;
      }, 450);
    }

    if (Math.abs(velocity) > 0.05) {
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(updateInertia);
    }
  }
</script>

{#if ctx.layer}
  <div class="flex flex-col self-stretch gap-3 keycap-grid">
    <Label>Encodeur</Label>
    <div class="flex flex-col items-center gap-4 w-fit">
      <ButtonGroup.Root class="w-full">
        {#each [{ field: 'encoder_ccw', label: '↺', value: ctx.layer.encoder?.ccw ?? 0 }, { field: 'encoder_cw', label: '↻', value: ctx.layer.encoder?.cw ?? 0 }] as enc}
          <Button
            variant="outline"
            class={cn(
              'h-auto flex-col py-2 grow transition-all duration-200 pb-3',
              ctx.editingField === enc.field ? 'border-violet-500 bg-violet-950/40' : '',
              // NEW: Applies a glowing indicator class style during inertia phase execution
              activeTriggeredButton === enc.field ? 'bg-muted!' : '',
            )}
            onclick={() => ctx.openEncoderPicker(enc.field)}
          >
            <span class="text-2xl leading-none text-muted-foreground">{enc.label}</span>
            <span class="knobkey-label">{getKeycodeLabel(enc.value)}</span>
          </Button>
        {/each}
      </ButtonGroup.Root>

      <div class="knob-container w-fit" style="--rotation-deg: {rotation}deg;" class:dragging={isDragging}>
        <div
          bind:this={knobRef}
          class="knob"
          class:entrance-anim={isAnimatingEntrance}
          onclick={handleClick}
          onmousedown={handleStart}
          ontouchstart={handleStart}
          onkeydown={handleKeyDown}
          onwheel={handleScroll}
          role="slider"
          aria-valuenow={rotation}
          aria-valuemin="0"
          aria-valuemax="360"
          tabindex="0"
        >
          <div class="indicator"></div>
        </div>
      </div>
    </div>

    <Select.Root type="single" name="presets" bind:value={selectedPreset}>
      <Select.Trigger class="w-[180px]">
        {triggerContent}
      </Select.Trigger>
      <Select.Content>
        <Select.Group>
          <Select.Label>Presets</Select.Label>
          {#each ENCODER_PRESETS as preset}
            <Select.Item value={preset.label} label={preset.label}>
              {preset.label}
            </Select.Item>
          {/each}
        </Select.Group>
      </Select.Content>
    </Select.Root>

    <ButtonGroup.Root class="mt-auto">
      {#each ENCODER_PRESETS as preset}
        <Button
          size="sm"
          variant="outline"
          onclick={() => applyEncoderPreset(preset)}
          title="Appliquer le set {preset.label} (CW + CCW)"
        >
          <!-- <preset.icon class="size-3" /> -->
          <span>{preset.label}</span>
        </Button>
      {/each}
    </ButtonGroup.Root>
  </div>
{/if}

<style>
  .knobkey-label {
    font-size: var(--keycap-label-size);
    font-weight: 600;
    line-height: 1;
    color: var(--foreground);
  }

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
