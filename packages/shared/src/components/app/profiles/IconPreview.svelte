<script lang="ts">
  import { PROFILE_ICON_W, PROFILE_ICON_H } from "$shared/constants/config-schema.js";
  import { base64ToGrid, getPixel } from "$shared/constants/profile-icon.js";

  interface Props {
    value?: string; // base64
    size?: number; // px côté rendu
    class?: string;
  }
  let { value = "", size = 48, class: klass = "" }: Props = $props();

  let canvas = $state<HTMLCanvasElement | null>(null);
  const grid = $derived(base64ToGrid(value));

  $effect(() => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scale = size / PROFILE_ICON_W;
    ctx.clearRect(0, 0, size, size);
    // fond
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, size, size);
    // pixels allumés
    ctx.fillStyle = "#e5e5e5";
    for (let y = 0; y < PROFILE_ICON_H; y++) {
      for (let x = 0; x < PROFILE_ICON_W; x++) {
        if (getPixel(grid, x, y)) {
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
  });
</script>

<canvas
  bind:this={canvas}
  width={size}
  height={size}
  class="rounded border border-border {klass}"
  style="width: {size}px; height: {size}px; image-rendering: pixelated;"
></canvas>
