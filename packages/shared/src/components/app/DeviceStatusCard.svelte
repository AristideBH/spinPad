<script lang="ts">
    import { deviceStatus } from '../../store/deviceStatus.svelte.js';
    import { Card, CardContent } from '../ui/card/index.js';
    import { Badge } from '../ui/badge/index.js';
    import {
        BatteryFull, BatteryMedium, BatteryLow, BatteryWarning, Battery,
        Usb, Bluetooth, Cpu, Clock,
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
        batterySource === 'forced_yes' ? 'forcée présente'
        : batterySource === 'forced_no' ? 'forcée absente'
        : 'auto-détectée',
    );

    // ── Uptime humain ────────────────────────────────────────────
    function formatUptime(s: number): string {
        if (!s || s < 0) return '—';
        const d = Math.floor(s / 86400);
        const h = Math.floor((s % 86400) / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        if (d > 0) return `${d}j ${h}h`;
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${sec}s`;
        return `${sec}s`;
    }
    const uptimeStr = $derived(data ? formatUptime(data.uptime_s) : '—');

    // ── Connexion ────────────────────────────────────────────────
    const usbOn = $derived(data?.connection?.usb === true);
    const bleOn = $derived(data?.connection?.ble === true);
    const bleSlot = $derived(data?.connection?.ble_slot ?? 0);

    // ── Firmware ─────────────────────────────────────────────────
    const fwVersion = $derived(data?.fw?.version ?? '—');
    const fwBuild = $derived(data?.fw?.build ?? '');
    const fwDirty = $derived(data?.fw?.dirty === true);
</script>

<Card>
    <CardContent class="p-5">
        {#if !data}
            <p class="text-sm text-muted-foreground">Statut device indisponible.</p>
            {#if deviceStatus.error}
                <p class="text-xs text-destructive mt-1">{deviceStatus.error}</p>
            {/if}
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">

                <!-- ══ Batterie ══════════════════════════════════ -->
                <section>
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs text-muted-foreground uppercase tracking-widest">Batterie</span>
                        <BatteryIcon class="size-4 text-muted-foreground" />
                    </div>

                    {#if !batteryPresent}
                        <div class="flex flex-col gap-1">
                            <p class="text-base font-medium text-muted-foreground">Pas de batterie</p>
                            <p class="text-xs text-muted-foreground">
                                {batterySource === 'forced_no' ? 'Désactivée par configuration' : 'Mode USB-only'}
                            </p>
                        </div>
                    {:else}
                        <div class="flex items-baseline gap-2 mb-2">
                            <span class="text-2xl font-bold tabular-nums">{batteryPct}<span class="text-sm text-muted-foreground">%</span></span>
                            <span class="text-xs text-muted-foreground tabular-nums">{(batteryMv / 1000).toFixed(2)}V</span>
                        </div>
                        <div class="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                                class="h-full rounded-full transition-all duration-500 {batteryColorClass}"
                                style="width: {batteryPct}%"
                            ></div>
                        </div>
                        <p class="text-[10px] text-muted-foreground uppercase tracking-wider mt-1.5">
                            Source : {batterySourceLabel}
                        </p>
                    {/if}
                </section>

                <!-- ══ Connexion ═════════════════════════════════ -->
                <section>
                    <p class="text-xs text-muted-foreground uppercase tracking-widest mb-2">Connexion</p>
                    <div class="flex flex-wrap gap-2">
                        <Badge variant={usbOn ? 'default' : 'outline'} class="gap-1">
                            <Usb class="size-3" />
                            USB {usbOn ? 'ON' : 'OFF'}
                        </Badge>
                        <Badge variant={bleOn ? 'default' : 'outline'} class="gap-1">
                            <Bluetooth class="size-3" />
                            BLE {bleOn ? `slot ${bleSlot}` : 'OFF'}
                        </Badge>
                    </div>
                    {#if data?.connection?.studio_mode}
                        <p class="text-[10px] text-amber-500 uppercase tracking-wider mt-2">
                            Studio Mode actif
                        </p>
                    {/if}
                </section>

                <!-- ══ Firmware ══════════════════════════════════ -->
                <section>
                    <p class="text-xs text-muted-foreground uppercase tracking-widest mb-2">Firmware</p>
                    <div class="flex items-center gap-1.5 mb-1">
                        <Cpu class="size-3.5 text-muted-foreground" />
                        <span class="text-base font-semibold tabular-nums">v{fwVersion}</span>
                        <span
                            class="font-mono text-xs text-muted-foreground"
                            title={fwDirty ? 'Build sur un working tree modifié' : 'Build propre'}
                        >
                            {fwBuild}{fwDirty ? '+' : ''}
                        </span>
                    </div>
                    <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock class="size-3" />
                        <span class="tabular-nums">Uptime {uptimeStr}</span>
                    </div>
                </section>

            </div>
        {/if}
    </CardContent>
</Card>
