<script lang="ts">
  import * as Card from '$shared/components/ui/card/index.js';
  import { Activity, RotateCw, Moon, Zap } from '@lucide/svelte';
  import { deviceStatus } from '$shared/store/deviceStatus.svelte.js';
  import { configState } from '$shared/store/config.svelte.js';

  const stats = $derived(deviceStatus.data?.stats ?? null);

  const nf = new Intl.NumberFormat('fr-FR');
  const fmt = (n: number | undefined) => (n == null ? '—' : nf.format(n));

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

  // Répartition par profil (avec noms si dispo).
  const perProfile = $derived.by(() => {
    if (!stats) return [];
    const names = configState.data?.profiles ?? [];
    const max = Math.max(1, ...stats.per_profile_keypresses);
    return stats.per_profile_keypresses.map((count, i) => ({
      name: names[i]?.name ?? `Profil ${i + 1}`,
      count,
      pct: Math.round((count / max) * 100),
    }));
  });
</script>

<Card.Root class="@container/card @lg/main:col-span-3 @5xl/main:col-span-5">
  <Card.Header>
    <Card.Description>Statistiques</Card.Description>
  </Card.Header>
  <Card.Content class="flex flex-col gap-3">
    {#if !stats}
      <p class="text-sm text-muted-foreground">Statistiques indisponibles sur ce firmware.</p>
    {:else}
      <div class="grid grid-cols-2 gap-3 @md/card:grid-cols-4">
        <div class="flex flex-col gap-0.5">
          <div class="flex items-center gap-1 text-xs text-muted-foreground">
            <Activity class="size-3" /> Touches
          </div>
          <span class="text-base font-semibold tabular-nums">{fmt(stats.total_keypresses)}</span>
        </div>
        <div class="flex flex-col gap-0.5">
          <div class="flex items-center gap-1 text-xs text-muted-foreground">
            <RotateCw class="size-3" /> Encodeur
          </div>
          <span class="text-base font-semibold tabular-nums">{fmt(stats.encoder_steps_total)}</span>
          <span class="text-[10px] text-muted-foreground tabular-nums"
            >↻ {fmt(stats.encoder_steps_cw)} · ↺ {fmt(stats.encoder_steps_ccw)}</span
          >
        </div>
        <div class="flex flex-col gap-0.5">
          <div class="flex items-center gap-1 text-xs text-muted-foreground">
            <Moon class="size-3" /> Veille
          </div>
          <span class="text-base font-semibold tabular-nums">{sleepPct}%</span>
          <span class="text-[10px] text-muted-foreground">Éveil {formatDuration(stats.awake_s)}</span>
        </div>
        <div class="flex flex-col gap-0.5">
          <div class="flex items-center gap-1 text-xs text-muted-foreground">
            <Zap class="size-3" /> Macros
          </div>
          <span class="text-base font-semibold tabular-nums">{fmt(stats.macros_played)}</span>
        </div>
      </div>

      {#if perProfile.length > 1}
        <div class="flex flex-col gap-1.5 pt-1">
          {#each perProfile as p (p.name)}
            <div class="flex items-center gap-2 text-xs">
              <span class="w-20 truncate text-muted-foreground">{p.name}</span>
              <div class="relative flex-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div class="absolute inset-y-0 left-0 rounded-full bg-primary" style="width: {p.pct}%"></div>
              </div>
              <span class="tabular-nums text-muted-foreground">{fmt(p.count)}</span>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </Card.Content>
</Card.Root>
