<script>
    import { configState }           from '$lib/store/config.svelte.js';
    import { APP_CONFIG }            from '$lib/app.config.js';
    import { Card, CardContent,
             CardHeader, CardTitle }  from '$lib/components/ui/card/index.js';
    import { Input }                  from '$lib/components/ui/input/index.js';
    import { Slider }                 from '$lib/components/ui/slider/index.js';
    import { Switch }                 from '$lib/components/ui/switch/index.js';
    import SettingsField              from '$lib/components/app/SettingsField.svelte';
    import NotConnected               from '$lib/components/app/NotConnected.svelte';

    // Le Slider bits-ui nécessite bind:value avec un nombre local
    let brightness = $state(configState.data?.display.brightness ?? 180);
    let ignoreEffect = false;
    $effect(() => {
        // Sync depuis config (loadConfig) sans déclencher la mise à jour inverse
        const b = configState.data?.display.brightness ?? 180;
        if (b !== brightness) { ignoreEffect = true; brightness = b; }
    });
    $effect(() => {
        if (ignoreEffect) { ignoreEffect = false; return; }
        if (configState.data && brightness !== configState.data.display.brightness) {
            update('display.brightness', brightness);
        }
    });

    function update(path, value) {
        const cfg   = structuredClone(configState.data);
        const parts = path.split('.');
        let obj = cfg;
        for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
        obj[parts[parts.length - 1]] = value;
        configState.data    = cfg;
        configState.isDirty = true;
    }
</script>

<svelte:head>
    <title>Écran & Power — {APP_CONFIG.name}</title>
</svelte:head>

<h2 class="text-xl font-bold mb-6">Écran & Power</h2>

{#if !configState.data}
    <NotConnected />
{:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">

        <Card>
            <CardHeader>
                <CardTitle class="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Écran SSD1315</CardTitle>
            </CardHeader>
            <CardContent class="pt-0">

                <!-- Luminosité (slider) -->
                <div class="mb-5">
                    <div class="flex justify-between text-sm mb-3">
                        <span>Luminosité</span>
                        <span class="text-muted-foreground">{configState.data.display.brightness}</span>
                    </div>
                    <Slider
                        min={10}
                        max={255}
                        bind:value={brightness}
                    />
                </div>

                <!-- Timeout -->
                <SettingsField label="Extinction après (s)">
                    {#snippet children()}
                        <Input
                            type="number" min={5} max={600}
                            class="w-20 text-right"
                            value={configState.data.display.timeout_s}
                            onchange={e => update('display.timeout_s', +e.target.value)}
                        />
                    {/snippet}
                </SettingsField>

                <!-- Toggles -->
                <SettingsField label="Afficher batterie">
                    {#snippet children()}
                        <Switch
                            checked={configState.data.display.show_battery}
                            onCheckedChange={v => update('display.show_battery', v)}
                        />
                    {/snippet}
                </SettingsField>
                <SettingsField label="Afficher layer actif">
                    {#snippet children()}
                        <Switch
                            checked={configState.data.display.show_layer}
                            onCheckedChange={v => update('display.show_layer', v)}
                        />
                    {/snippet}
                </SettingsField>
                <SettingsField label="Afficher profil">
                    {#snippet children()}
                        <Switch
                            checked={configState.data.display.show_profile}
                            onCheckedChange={v => update('display.show_profile', v)}
                        />
                    {/snippet}
                </SettingsField>
                <SettingsField label="Afficher statut BLE">
                    {#snippet children()}
                        <Switch
                            checked={configState.data.display.show_ble_status}
                            onCheckedChange={v => update('display.show_ble_status', v)}
                        />
                    {/snippet}
                </SettingsField>

            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle class="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Power Management</CardTitle>
            </CardHeader>
            <CardContent class="pt-0">

                <SettingsField label="Deep sleep après" description="Secondes d'inactivité avant veille profonde">
                    {#snippet children()}
                        <Input
                            type="number" min={30} max={3600}
                            class="w-20 text-right"
                            value={configState.data.power.sleep_timeout_s}
                            onchange={e => update('power.sleep_timeout_s', +e.target.value)}
                        />
                    {/snippet}
                </SettingsField>

                <SettingsField label="Batterie critique" description="Pourcentage déclenchant l'alerte">
                    {#snippet children()}
                        <Input
                            type="number" min={3} max={30}
                            class="w-20 text-right"
                            value={configState.data.power.battery_critical_pct}
                            onchange={e => update('power.battery_critical_pct', +e.target.value)}
                        />
                    {/snippet}
                </SettingsField>

            </CardContent>
        </Card>

    </div>
{/if}
