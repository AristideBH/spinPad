<script lang="ts">
  import { deviceStatus } from '$shared/store/deviceStatus.svelte.js';
  import * as Card from '$shared/components/ui/card/index.js';

  import {
    BatteryFull,
    BatteryMedium,
    BatteryLow,
    BatteryWarning,
    Battery,
    BatteryCharging,
    Moon,
  } from '@lucide/svelte';

  type DS = NonNullable<typeof deviceStatus.data>;
  const data = $derived(deviceStatus.data as DS | null);

  // ── Veille (issue #14) ───────────────────────────────────────
  const stats = $derived(data?.stats ?? null);
  const sleepPct = $derived.by(() => {
    if (!stats) return null;
    const total = stats.deep_sleep_s + stats.awake_s;
    return total > 0 ? Math.round((stats.deep_sleep_s / total) * 100) : 0;
  });
  function formatDuration(s: number): string {
    const h = Math.floor(s / 3600);
    if (h >= 24) return `${Math.floor(h / 24)}j ${h % 24}h`;
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  // ── Batterie ─────────────────────────────────────────────────
  const batteryPresent = $derived(data?.battery?.present === true);
  const batteryPct = $derived(batteryPresent && data?.battery && data.battery.present ? data.battery.percent : 0);
  const batteryMv = $derived(batteryPresent && data?.battery && data.battery.present ? data.battery.voltage_mv : 0);
  const batterySource = $derived(
    batteryPresent && data?.battery && data.battery.present ? data.battery.source : 'auto',
  );
  const batteryCharging = $derived(
    batteryPresent && data?.battery && data.battery.present ? (data.battery.charging ?? false) : false,
  );

  const batteryColorClass = $derived.by(() => {
    if (!batteryPresent) return 'bg-muted';
    if (batteryCharging) return 'bg-cyan-500';
    if (batteryPct >= 60) return 'bg-emerald-500';
    if (batteryPct >= 25) return 'bg-amber-500';
    return 'bg-red-500';
  });

  const BatteryIcon = $derived.by(() => {
    if (!batteryPresent) return Battery;
    if (batteryCharging) return BatteryCharging;
    if (batteryPct >= 75) return BatteryFull;
    if (batteryPct >= 40) return BatteryMedium;
    if (batteryPct >= 15) return BatteryLow;
    return BatteryWarning;
  });
</script>

<Card.Root class="@container/card flex flex-col h-full">
  <Card.Header class="h-full">
    <Card.Description>Batterie</Card.Description>
    <Card.Action>
      <BatteryIcon class="size-4 text-muted-foreground" />
    </Card.Action>

    <div class="flex flex-col col-span-2 mt-auto">
      {#if !batteryPresent}
        <p class="text-base font-medium text-muted-foreground">Pas de batterie</p>
        <p class="text-xs text-muted-foreground">
          {batterySource === 'forced_no' ? 'Désactivée par configuration' : 'Mode USB-only'}
        </p>
      {:else}
        <div class="flex items-baseline gap-2 my-1">
          <span class="text-2xl font-bold tabular-nums">
            {batteryPct}
            <span class="text-sm text-muted-foreground">%</span>
          </span>
          <span class="text-xs text-muted-foreground tabular-nums">{(batteryMv / 1000).toFixed(2)}V</span>
          <!-- {#if batteryCharging}
            <span class="text-xs font-medium text-cyan-500">Charge</span>
          {/if} -->
        </div>
        <div class="w-full h-1 overflow-hidden rounded-full bg-muted">
          <div
            class="relative h-full rounded-full transition-all duration-500 {batteryColorClass}"
            style="width: {batteryPct}%"
          >
            {#if batteryCharging}
              <span class="shine-sweep"></span>
            {/if}
          </div>
        </div>
        {#if stats && sleepPct !== null}
          <p class="flex items-baseline gap-1 mt-2 text-[11px] text-muted-foreground tabular-nums">
            <Moon class="size-3" /> Veille {sleepPct}% · {formatDuration(stats.deep_sleep_s)}
          </p>
        {/if}
      {/if}
    </div>
  </Card.Header>
</Card.Root>

<style>
  .shine-sweep {
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 30%, rgba(255, 255, 255, 0.35) 50%, transparent 70%);
    animation: shine-move 4s ease-out infinite;
  }

  @keyframes shine-move {
    0%,
    55% {
      transform: translateX(150%);
      opacity: 0;
    }
    70% {
      opacity: 1;
    }
    90% {
      transform: translateX(-150%);
      opacity: 0;
    }
    100% {
      transform: translateX(-150%);
      opacity: 0;
    }
  }
</style>
