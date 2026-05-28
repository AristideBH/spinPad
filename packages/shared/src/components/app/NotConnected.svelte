<script lang="ts">
  let { message = 'Connecte le clavier pour accéder à cette section.' }: { message?: string } = $props();
</script>

<div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
  <div class="text-4xl opacity-30">⌨️</div>
  <p class="max-w-xs text-sm text-muted-foreground">{message}</p>
</div>
