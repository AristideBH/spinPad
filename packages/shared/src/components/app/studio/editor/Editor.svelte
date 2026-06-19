<script lang="ts">
  import * as Card from '$shared/components/ui/card/index.js';
  import { trainingMode } from '$shared/store/trainingMode.svelte.js';
  import { createKeypadContext } from '../editor/keypad-context.svelte.js';
  import KeyGrid from '../editor/KeyGrid.svelte';
  import KeycodePicker from '../editor/keycode/KeycodePicker.svelte';
  import ProfileSwitcher from '../editor/profile/ProfileSwitcher.svelte';
  import Encoder from '../editor/encoder/Encoder.svelte';
  import LayerSwitcher from '../editor/LayerSwitcher.svelte';
  import { fly } from 'svelte/transition';

  const ctx = createKeypadContext();

  // Line-wrap detection: switch the LayerSwitcher to horizontal tabs when the
  // layer column + keyboard no longer fit side by side.
  //
  // We do NOT PREDICT the wrap via intrinsic sizes (min/max-content):
  // min-content underestimates (collapsed keyboard), max-content overestimates
  // (the encoder stretches to widths never rendered) and the two diverge between
  // Chrome and Firefox. Instead: synchronous PROBE. We impose the "side by side"
  // geometry (column at its vertical width, keyboard at natural size) then ask the
  // browser whether the keyboard stays on the same row -> we read the REAL wrap of
  // the rendering engine, identical across all browsers.
  const LAYER_COL = 180; // fixed width of the layer column (vertical)
  // Hysteresis, expressed as a widening of the probed column when already
  // wrapped: to un-wrap, the side-by-side layout must fit WITH this margin.
  // Absorbs the scrollbar back-and-forth (~17px Chrome/Windows: wrap -> taller
  // -> scrollbar -> width drops). Firefox (overlay) does not have this issue.
  const HYST = 32;

  let contentEl = $state<HTMLElement | null>(null);
  let layerEl = $state<HTMLElement | null>(null);
  let keypadEl = $state<HTMLElement | null>(null);
  let wrapped = $state(false);

  // Observe the container, coalesce resize bursts onto one rAF. The `measure`
  // closure is not reactive: reading `wrapped` inside does not re-trigger the effect.
  $effect(() => {
    const content = contentEl;
    const layer = layerEl;
    const keypad = keypadEl;
    if (!content || !layer || !keypad) return;

    let raf = 0;
    const measure = () => {
      raf = 0;
      // Probed column width: +HYST when already wrapped (anti-bounce margin).
      const probeW = `${wrapped ? LAYER_COL + HYST : LAYER_COL}px`;
      // Force the column to its vertical form (the Tailwind w-full / max-w
      // classes are overridden by the inline style during the measure), then
      // read whether the keyboard dropped below the column. Synchronous
      // write/read/restore -> no frame painted in between -> no flash.
      const lw = layer.style.width;
      const lmw = layer.style.maxWidth;
      const lf = layer.style.flex;
      layer.style.width = probeW;
      layer.style.maxWidth = probeW;
      layer.style.flex = '0 0 auto';
      const stacked = keypad.getBoundingClientRect().top - layer.getBoundingClientRect().top > 1;
      layer.style.width = lw;
      layer.style.maxWidth = lmw;
      layer.style.flex = lf;
      if (stacked !== wrapped) wrapped = stacked; // only writes on real change
    };
    const schedule = () => {
      raf ||= requestAnimationFrame(measure);
    };

    const obs = new ResizeObserver(schedule);
    obs.observe(content);
    schedule();
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  });

  // Training bridge: SWn pressed on device → opens the matching picker.
  $effect(() => {
    const target = trainingMode.requestedTarget;
    if (!target) return;
    trainingMode.requestedTarget = null;
    if (target.kind === 'key') ctx.openKeyPicker(target.idx);
    else ctx.openEncoderPicker(`encoder_${target.field}`);
  });
</script>

<Card.Root size="sm" class="gap-y-5!">
  <div in:fly={{ y: 50, duration: 350, delay: 220 }} class="relative">
    <Card.Header class="flex items-start gap-1.5">
      <ProfileSwitcher />
    </Card.Header>
  </div>

  <!-- Editor -->
  <div in:fly={{ y: 20, duration: 600, delay: 350 }} class="relative">
    <Card.Content bind:ref={contentEl} class="flex flex-wrap items-start justify-start gap-x-4 gap-y-1">
      {#if ctx.layer}
        <div bind:this={layerEl} class={wrapped ? 'w-full' : 'grow min-w-[180px] max-w-[180px]'}>
          <LayerSwitcher orientation={wrapped ? 'horizontal' : 'vertical'} />
        </div>

        <div bind:this={keypadEl} class="flex flex-wrap gap-12 p-6 border justify-evenly grow rounded-2xl">
          <KeyGrid />
          <Encoder />
        </div>
      {/if}
    </Card.Content>
  </div>
</Card.Root>

<!-- Keycode Picker (two-stage : menu → live-record / liste) -->
<KeycodePicker />
