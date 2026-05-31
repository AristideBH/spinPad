<script lang="ts">
  import BatteryTile from './tile-battery.svelte';
  import FirmwareTile from './tile-firmware.svelte';
  import MainTile from './tile-main.svelte';
  import ScreenTile from './tile-screen.svelte';
</script>

<section class="grid grid-cols-2 gap-4 @lg/main:grid-cols-3 @4xl/main:grid-cols-5">
  <MainTile />
  <ScreenTile />
  <BatteryTile />
  <FirmwareTile />
</section>
