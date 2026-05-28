<script lang="ts">
  import { Card, CardContent } from '$shared/components/ui/card/index.js';

  /** @type {string} */
  let { label, value } = $props();
</script>

<Card>
  <CardContent class="p-4">
    <p class="text-xs text-muted-foreground uppercase tracking-widest mb-1.5">
      {label}
    </p>
    <p class="text-xl font-bold">{value ?? '—'}</p>
  </CardContent>
</Card>
