<script lang="ts">
  import { Button } from '$shared/components/ui/button/index.js';
  import { Activity } from '@lucide/svelte';
  import { getKeypadContext } from './keypad-context.svelte.js';

  const ctx = getKeypadContext();
</script>

{#if ctx.trainingActive}
  <div class="p-3 mt-4 border rounded-lg border-emerald-500/30 bg-emerald-500/5">
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
        <Activity class="size-3" />
        Mode entraînement actif
      </span>
      <Button
        variant="ghost"
        size="sm"
        onclick={() => ctx.resetTrainingCounts()}
        class="h-6 text-xs text-muted-foreground"
      >
        Réinitialiser
      </Button>
    </div>
    <p class="text-xs text-muted-foreground">
      Total : {ctx.keyPressCounts.reduce((a, b) => a + b, 0)} appuis · Touche la plus utilisée : SW{ctx.keyPressCounts.indexOf(
        Math.max(...ctx.keyPressCounts),
      ) + 1 || '—'}
    </p>
  </div>
{/if}
