<script>
    import { configState }           from '$lib/store/config.svelte.js';
    import { APP_CONFIG }            from '$lib/app.config.js';
    import { Card, CardContent }     from '$lib/components/ui/card/index.js';
    import { Badge }                 from '$lib/components/ui/badge/index.js';
    import NotConnected              from '$lib/components/app/NotConnected.svelte';
</script>

<svelte:head>
    <title>Profils — {APP_CONFIG.name}</title>
</svelte:head>

<h2 class="text-xl font-bold mb-6">Profils</h2>

{#if !configState.data}
    <NotConnected />
{:else}
    <div class="flex flex-col gap-3 max-w-md">
        {#each configState.data.profiles as prof, i}
            {@const isActive = i === configState.data.active_profile}
            <Card class={isActive ? 'border-primary/60' : ''}>
                <CardContent class="p-4 flex items-center gap-3">
                    <div
                        class="size-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        class:bg-primary={isActive}
                        class:text-primary-foreground={isActive}
                        class:bg-muted={!isActive}
                        class:text-muted-foreground={!isActive}
                    >
                        {i}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <span class="font-semibold">{prof.name}</span>
                            {#if isActive}
                                <Badge variant="default" class="text-[10px] px-1.5 py-0">Actif</Badge>
                            {/if}
                        </div>
                        <p class="text-xs text-muted-foreground">{prof.layers?.length ?? 0} layer(s) · {prof.combos?.length ?? 0} combo(s)</p>
                    </div>
                </CardContent>
            </Card>
        {/each}
    </div>
{/if}
