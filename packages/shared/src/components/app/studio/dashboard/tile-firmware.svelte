<script lang="ts">
  import * as Card from '$shared/components/ui/card/index.js';
  import { Cpu, Clock } from '@lucide/svelte';
  import { deviceStatus } from '$shared/store/deviceStatus.svelte.js';

  import { loadConfig, factoryReset } from '$shared/store/config.svelte.js';

  type DS = NonNullable<typeof deviceStatus.data>;
  const data = $derived(deviceStatus.data as DS | null);

  // ── Human-readable uptime ────────────────────────────────────
  function formatUptime(s: number): string {
    if (!s || s < 0) return '—';
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  }
  const uptimeStr = $derived(data ? formatUptime(data.uptime_s) : '—');

  // ── Firmware ─────────────────────────────────────────────────
  const fwVersion = $derived(data?.fw?.version ?? '—');
  const fwBuild = $derived(data?.fw?.build ?? '');
  const fwDirty = $derived(data?.fw?.dirty === true);

  async function handleFactoryReset() {
    if (!confirm('Reset the config to defaults? All changes will be lost.')) return;
    await factoryReset();
    await loadConfig();
  }
</script>

<Card.Root class="@container/card h-full">
  <Card.Header class="h-full">
    <Card.Description>Firmware</Card.Description>
  </Card.Header>
  <Card.Content>
    <!-- Actions -->
    <div class="flex items-baseline col-span-2 gap-1.5 mt-auto mb-1">
      <Cpu class="size-3 text-muted-foreground" />
      <span class="text-base font-semibold tabular-nums">v{fwVersion}</span>
      <span
        class="font-mono text-xs text-muted-foreground"
        title={fwDirty ? 'Build on a modified working tree' : 'Clean build'}
      >
        {fwBuild}{fwDirty ? '+' : ''}
      </span>
    </div>
    <div class="flex items-baseline gap-1.5 text-xs text-muted-foreground">
      <Clock class="size-3" />
      <span class="tabular-nums">Uptime {uptimeStr}</span>
    </div>
  </Card.Content>
</Card.Root>
