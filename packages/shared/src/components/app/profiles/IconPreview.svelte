<script lang="ts">
  import { PROFILE_ICON_W } from "$shared/constants/config-schema.js";
  import { base64ToGrid, fillIconPixels } from "$shared/constants/profile-icon.js";

  interface Props {
    value?: string; // base64
    size?: number; // px côté rendu
    class?: string;
  }
  let { value = "", size = 48, class: klass = "" }: Props = $props();

  const grid = $derived(base64ToGrid(value));

  // Rendu canvas — re-run quand grid/size changent (lectures réactives dans le corps).
  const render = (el: HTMLCanvasElement) => {
    const ctx = el.getContext("2d");
    if (!ctx) return;
    fillIconPixels(ctx, grid, size / PROFILE_ICON_W, size, size);
  };
</script>

<canvas
  {@attach render}
  width={size}
  height={size}
  class="rounded border border-border {klass}"
  style="width: {size}px; height: {size}px; image-rendering: pixelated;"
></canvas>
