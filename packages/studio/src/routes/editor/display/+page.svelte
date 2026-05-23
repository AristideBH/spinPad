<script>
    import { configState }           from '$lib/store/config.svelte.js';
    import { APP_CONFIG }            from '$lib/app.config.js';
    import { Card, CardContent,
             CardHeader, CardTitle }  from '$lib/components/ui/card/index.js';
    import { Input }                  from '$lib/components/ui/input/index.js';
    import { Slider }                 from '$lib/components/ui/slider/index.js';
    import { Switch }                 from '$lib/components/ui/switch/index.js';
    import { Button }                 from '$lib/components/ui/button/index.js';
    import { Label }                  from '$lib/components/ui/label/index.js';
    import SettingsField              from '$lib/components/app/SettingsField.svelte';
    import NotConnected               from '$lib/components/app/NotConnected.svelte';

    // ── Orientation ──────────────────────────────────────────────
    const ORIENTATIONS = [
        { value: 0, label: '0°',   icon: '↑' },
        { value: 1, label: '90°',  icon: '→' },
        { value: 2, label: '180°', icon: '↓' },
        { value: 3, label: '270°', icon: '←' },
    ];

    // ── Luminosité (slider nécessite un state local) ──────────────
    let brightness    = $state(configState.data?.display.brightness    ?? 180);
    let ledExtBright  = $state(configState.data?.led_extension.brightness ?? 200);
    let ignoreEffect  = false;

    $effect(() => {
        const b = configState.data?.display.brightness ?? 180;
        if (b !== brightness) { ignoreEffect = true; brightness = b; }
    });
    $effect(() => {
        if (ignoreEffect) { ignoreEffect = false; return; }
        if (configState.data && brightness !== configState.data.display.brightness) {
            update('display.brightness', brightness);
        }
    });

    $effect(() => {
        const b = configState.data?.led_extension.brightness ?? 200;
        if (b !== ledExtBright) { ledExtBright = b; }
    });
    $effect(() => {
        if (configState.data && ledExtBright !== configState.data.led_extension.brightness) {
            update('led_extension.brightness', ledExtBright);
        }
    });

    // ── Helpers ───────────────────────────────────────────────────
    function update(path, value) {
        const cfg   = structuredClone(configState.data);
        const parts = path.split('.');
        let obj = cfg;
        for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
        obj[parts[parts.length - 1]] = value;
        configState.data    = cfg;
        configState.isDirty = true;
    }

    // Convertit #rrggbb → { r, g, b }
    function hexToRgb(hex) {
        const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
        return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
    }

    // Convertit { r, g, b } → #rrggbb
    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    }

    // ── LED extension : modes ─────────────────────────────────────
    const EXT_MODES = [
        { value: 0, label: 'Off',      desc: 'LEDs éteintes' },
        { value: 1, label: 'Mirror',   desc: 'Copie les couleurs des touches' },
        { value: 2, label: 'Ambient',  desc: 'Respiration douce avec la couleur choisie' },
        { value: 3, label: 'Static',   desc: 'Couleur fixe' },
        { value: 4, label: 'Reactive', desc: 'Flash sur chaque touche pressée' },
        { value: 5, label: 'Hyperion', desc: 'Frame RGB injectée via le bridge Hyperion' },
    ];
</script>

<svelte:head>
    <title>Écran & Power — {APP_CONFIG.name}</title>
</svelte:head>

<h2 class="text-xl font-bold mb-6">Écran & Power</h2>

{#if !configState.data}
    <NotConnected />
{:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">

        <!-- ── Écran SSD1315 ──────────────────────────────────────── -->
        <Card>
            <CardHeader>
                <CardTitle class="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Écran SSD1315</CardTitle>
            </CardHeader>
            <CardContent class="pt-0">

                <!-- Luminosité -->
                <div class="mb-5">
                    <div class="flex justify-between text-sm mb-3">
                        <span>Luminosité</span>
                        <span class="text-muted-foreground">{configState.data.display.brightness}</span>
                    </div>
                    <Slider min={10} max={255} bind:value={brightness} />
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

        <!-- ── Power Management ───────────────────────────────────── -->
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

        <!-- ── Orientation ───────────────────────────────────────── -->
        <Card>
            <CardHeader>
                <CardTitle class="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Orientation</CardTitle>
            </CardHeader>
            <CardContent class="pt-0">
                <p class="text-sm text-muted-foreground mb-4">
                    Orientation physique du SpinPad. L'écran OLED et l'éditeur keymap
                    se réajustent automatiquement.
                </p>
                <div class="grid grid-cols-4 gap-2">
                    {#each ORIENTATIONS as o}
                        <button
                            type="button"
                            class="flex flex-col items-center justify-center gap-1 rounded-lg border py-3 text-sm transition-colors
                                   {configState.data.orientation === o.value
                                       ? 'border-primary bg-primary/10 text-primary font-semibold'
                                       : 'border-border hover:border-primary/50 hover:bg-accent'}"
                            onclick={() => update('orientation', o.value)}
                        >
                            <span class="text-lg leading-none">{o.icon}</span>
                            <span>{o.label}</span>
                        </button>
                    {/each}
                </div>
                <p class="text-xs text-muted-foreground mt-3">
                    Astuce : la touche <kbd class="bg-muted px-1 rounded text-xs">Rotate CW/CCW</kbd>
                    dans le keymap change l'orientation directement depuis le SpinPad.
                </p>
            </CardContent>
        </Card>

        <!-- ── Encodeur ───────────────────────────────────────────── -->
        <Card>
            <CardHeader>
                <CardTitle class="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Encodeur rotatif</CardTitle>
            </CardHeader>
            <CardContent class="pt-0">

                <div class="mb-2">
                    <div class="flex justify-between text-sm mb-1">
                        <span>Sensibilité</span>
                        <span class="text-muted-foreground font-mono">
                            {['', '1× (standard)', '2× (réactif)', '3×', '4× (max)'][configState.data.encoder.sensitivity] ?? '—'}
                        </span>
                    </div>
                    <Slider
                        min={1} max={4} step={1}
                        value={configState.data.encoder.sensitivity}
                        onValueChange={v => update('encoder.sensitivity', v)}
                    />
                    <div class="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>1 clic / détent</span>
                        <span>4 clics / détent</span>
                    </div>
                </div>

            </CardContent>
        </Card>

    </div>

    <!-- ── Extension LED ─────────────────────────────────────────── -->
    <h2 class="text-xl font-bold mt-8 mb-4">Extension LED</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">

        <Card class="md:col-span-2">
            <CardHeader>
                <CardTitle class="text-sm uppercase tracking-widest text-muted-foreground font-semibold">LEDs supplémentaires</CardTitle>
            </CardHeader>
            <CardContent class="pt-0">

                <p class="text-sm text-muted-foreground mb-4">
                    Le connecteur d'extension sur le PCB permet de brancher jusqu'à 50 LEDs WS2812
                    supplémentaires (ruban, ambilight…).
                </p>

                <!-- Activer l'extension -->
                <SettingsField label="Activer l'extension" description="Active les LEDs branchées sur le connecteur d'extension">
                    {#snippet children()}
                        <Switch
                            checked={configState.data.led_extension.enabled}
                            onCheckedChange={v => update('led_extension.enabled', v)}
                        />
                    {/snippet}
                </SettingsField>

                {#if configState.data.led_extension.enabled}

                    <!-- Nombre de LEDs -->
                    <SettingsField label="Nombre de LEDs" description="1–50 LEDs WS2812 branchées sur le connecteur">
                        {#snippet children()}
                            <Input
                                type="number" min={1} max={50}
                                class="w-20 text-right"
                                value={configState.data.led_extension.count}
                                onchange={e => update('led_extension.count', Math.min(50, Math.max(1, +e.target.value)))}
                            />
                        {/snippet}
                    </SettingsField>

                    <!-- Mode -->
                    <div class="mt-4 mb-4">
                        <Label class="text-sm mb-3 block">Mode d'éclairage</Label>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {#each EXT_MODES as m}
                                <button
                                    type="button"
                                    class="flex flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-colors
                                           {configState.data.led_extension.mode === m.value
                                               ? 'border-primary bg-primary/10 text-primary'
                                               : 'border-border hover:border-primary/50 hover:bg-accent'}"
                                    onclick={() => update('led_extension.mode', m.value)}
                                >
                                    <span class="text-sm font-medium">{m.label}</span>
                                    <span class="text-xs text-muted-foreground leading-snug">{m.desc}</span>
                                </button>
                            {/each}
                        </div>
                    </div>

                    <!-- Couleur (visible si mode ≠ Mirror ≠ Hyperion) -->
                    {#if ![1, 5].includes(configState.data.led_extension.mode)}
                        <SettingsField
                            label="Couleur"
                            description={configState.data.led_extension.mode === 4
                                ? 'Couleur du flash réactif'
                                : 'Couleur de base'}
                        >
                            {#snippet children()}
                                <input
                                    type="color"
                                    class="w-10 h-8 cursor-pointer rounded border border-border bg-transparent p-0.5"
                                    value={rgbToHex(
                                        configState.data.led_extension.r,
                                        configState.data.led_extension.g,
                                        configState.data.led_extension.b
                                    )}
                                    oninput={e => {
                                        const rgb = hexToRgb(e.target.value);
                                        if (rgb) {
                                            const cfg = structuredClone(configState.data);
                                            cfg.led_extension.r = rgb.r;
                                            cfg.led_extension.g = rgb.g;
                                            cfg.led_extension.b = rgb.b;
                                            configState.data    = cfg;
                                            configState.isDirty = true;
                                        }
                                    }}
                                />
                            {/snippet}
                        </SettingsField>
                    {/if}

                    <!-- Luminosité extension -->
                    <div class="mt-4">
                        <div class="flex justify-between text-sm mb-3">
                            <span>Luminosité</span>
                            <span class="text-muted-foreground">{configState.data.led_extension.brightness}</span>
                        </div>
                        <Slider min={0} max={255} bind:value={ledExtBright} />
                    </div>

                {/if}

            </CardContent>
        </Card>

    </div>
{/if}
