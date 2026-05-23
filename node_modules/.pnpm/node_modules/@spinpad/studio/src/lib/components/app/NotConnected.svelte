<script>
    /** @type {string} */
    let { message = 'Connecte le clavier pour accéder à cette section.' } = $props();
</script>

<div class="flex flex-col items-center justify-center py-16 text-center gap-3">
    <div class="text-4xl opacity-30">⌨️</div>
    <p class="text-muted-foreground text-sm max-w-xs">{message}</p>
</div>
