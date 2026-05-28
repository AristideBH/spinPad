<script lang="ts">
  import { deviceStatus } from '$shared/store/deviceStatus.svelte.js';
  import * as Card from '$shared/components/ui/card/index.js';

  import {
    BatteryFull,
    BatteryMedium,
    BatteryLow,
    BatteryWarning,
    Battery,
  } from '@lucide/svelte';

  type DS = NonNullable<typeof deviceStatus.data>;
  const data = $derived(deviceStatus.data as DS | null);

  // ── Batterie ─────────────────────────────────────────────────
  const batteryPresent = $derived(data?.battery?.present === true);
  const batteryPct = $derived(
    batteryPresent && data?.battery && data.battery.present
      ? data.battery.percent
      : 0,
  );
  const batteryMv = $derived(
    batteryPresent && data?.battery && data.battery.present
      ? data.battery.voltage_mv
      : 0,
  );
  const batterySource = $derived(
    batteryPresent && data?.battery && data.battery.present
      ? data.battery.source
      : 'auto',
  );

  const batteryColorClass = $derived.by(() => {
    if (!batteryPresent) return 'bg-muted';
    if (batteryPct >= 60) return 'bg-emerald-500';
    if (batteryPct >= 25) return 'bg-amber-500';
    return 'bg-red-500';
  });

  const BatteryIcon = $derived.by(() => {
    if (!batteryPresent) return Battery;
    if (batteryPct >= 75) return BatteryFull;
    if (batteryPct >= 40) return BatteryMedium;
    if (batteryPct >= 15) return BatteryLow;
    return BatteryWarning;
  });

  const batterySourceLabel = $derived(
    batterySource === 'forced_yes'
      ? 'forcée présente'
      : batterySource === 'forced_no'
        ? 'forcée absente'
        : 'auto-détectée',
  );
</script>

<Card.Root class="@container/card flex flex-col">
  <Card.Header>
    <Card.Description>Batterie</Card.Description>
    <Card.Action>
      <BatteryIcon class="size-4 text-muted-foreground" />
    </Card.Action>

    <div class="flex flex-col gap-1">
      {#if !batteryPresent}
        <p class="text-base font-medium text-muted-foreground">
          Pas de batterie
        </p>
        <p class="text-xs text-muted-foreground">
          {batterySource === 'forced_no'
            ? 'Désactivée par configuration'
            : 'Mode USB-only'}
        </p>
      {:else}
        <div class="flex items-baseline gap-2 mb-2">
          <span class="text-2xl font-bold tabular-nums"
            >{batteryPct}<span class="text-sm text-muted-foreground">%</span
            ></span
          >
          <span class="text-xs text-muted-foreground tabular-nums"
            >{(batteryMv / 1000).toFixed(2)}V</span
          >
        </div>
        <div class="w-full h-2 overflow-hidden rounded-full bg-muted">
          <div
            class="h-full rounded-full transition-all duration-500 {batteryColorClass}"
            style="width: {batteryPct}%"
          ></div>
        </div>
        <!-- <p
          class="text-[10px] text-muted-foreground uppercase tracking-wider mt-1.5"
        >
          Source : {batterySourceLabel}
        </p> -->
      {/if}
    </div>
  </Card.Header>
</Card.Root>
