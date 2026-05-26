<script lang="ts">
    import { configState, updateConfig } from '../../../store/config.svelte.js';
    import { Card, CardContent,
             CardHeader, CardTitle }     from '../../ui/card/index.js';
    import { Input }                     from '../../ui/input/index.js';
    import { Slider }                    from '../../ui/slider/index.js';
    import { Switch }                    from '../../ui/switch/index.js';
    import { Label }                     from '../../ui/label/index.js';
    import { Badge }                     from '../../ui/badge/index.js';
    import SettingsField                 from '../SettingsField.svelte';
    import NotConnected                  from '../NotConnected.svelte';

    // ── Orientation ───────────────────────────────────────────────
    const ORIENTATIONS = [
        { value: 0, label: '0°',   icon: '↑' },
        { value: 1, label: '90°',  icon: '→' },
        { value: 2, label: '180°', icon: '↓' },
        { value: 3, label: '270°', icon: '←' },
    ];

    // ── Sliders locaux (bits-ui Slider nécessite bind:value) ──────
    // La sync STORE → LOCAL se fait via $effect (ex: undo/redo, rechargement).
    // La sync LOCAL → STORE se fait via onValueChange sur le Slider (jamais via $effect,
    // pour éviter une boucle qui écraserait le résultat d'un undo/redo).
    let brightness   = $state(0);
    let encoderSens  = $state(1);
    let ledExtBright = $state(200);

    // Sync store → local (déclenché par undo/redo, chargement config, etc.)
    $effect(() => { brightness   = configState.data?.display?.brightness      ?? 180; });
    $effect(() => { encoderSens  = configState.data?.encoder?.sensitivity      ?? 1;   });
    $effect(() => { ledExtBright = configState.data?.led_extension?.brightness ?? 200; });

    // ── Conditions dérivées ───────────────────────────────────────
    // $derived garantit la réactivité sans boucle d'effet.
    const ledExtEnabled = $derived(configState.data?.led_extension?.enabled ?? false);
    const ledExtMode    = $derived(configState.data?.led_extension?.mode    ?? 0);

    // ── LED extension modes ───────────────────────────────────────
    const EXT_MODES = [
        { value: 0, label: 'Off',      desc: 'LEDs éteintes' },
        { value: 1, label: 'Mirror',   desc: 'Copie les couleurs des touches' },
        { value: 2, label: 'Ambient',  desc: 'Respiration douce' },
        { value: 3, label: 'Static',   desc: 'Couleur fixe' },
        { value: 4, label: 'Reactive', desc: 'Flash sur chaque touche pressée' },
        { value: 5, label: 'Hyperion', desc: 'Frame RGB via bridge Hyperion' },
    ];

    // ── Helpers couleur ───────────────────────────────────────────
    function hexToRgb(hex: string) {
        const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
        return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
    }

    function rgbToHex(r: number, g: number, b: number) {
        return '#' + [r, g, b].map(v => v?.toString(16).padStart(2, '0') ?? '00').join('');
    }
</script>

{#if !configState.data}
    <NotConnected />
{:else}
    <div class="flex flex-col gap-8">

        <!-- ══ BLE ══════════════════════════════════════════════════ -->
        <section>
            <h3 class="text-base font-semibold mb-4">Bluetooth</h3>
            <div class="flex flex-col gap-4 max-w-md">

                <Card>
                    <CardHeader>
                        <CardTitle class="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Appareil</CardTitle>
                    </CardHeader>
                    <CardContent class="pt-0">
                        <div class="flex flex-col gap-1.5">
                            <Label>Nom diffusé en Bluetooth</Label>
                            <Input
                                value={configState.data.ble?.device_name}
                                oninput={(e: Event) => updateConfig('ble.device_name', (e.target as HTMLInputElement).value)}
                                maxlength={31}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle class="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Slots de connexion</CardTitle>
                    </CardHeader>
                    <CardContent class="pt-0 flex flex-col gap-4">
                        {#each [0, 1] as slotIdx}
                            <div class="flex flex-col gap-1.5">
                                <div class="flex items-center gap-2">
                                    <Badge variant={slotIdx === 0 ? 'default' : 'secondary'}>Slot {slotIdx}</Badge>
                                    <Label class="text-muted-foreground text-xs">
                                        {slotIdx === 0 ? 'Premier appareil' : 'Second appareil'}
                                    </Label>
                                </div>
                                <Input
                                    value={configState.data.ble?.slot_names?.[slotIdx]}
                                    oninput={(e: Event) => updateConfig(`ble.slot_names.${slotIdx}`, (e.target as HTMLInputElement).value)}
                                />
                            </div>
                        {/each}

                        <p class="text-xs text-muted-foreground bg-muted/50 rounded-md p-3 leading-relaxed">
                            <strong>Comment switcher ?</strong><br />
                            • <strong>SW11</strong> (court appui) = changer d'appareil actif<br />
                            • <strong>SW16 + SW17 maintenus 2s</strong> = mode pairing pour le slot actif
                        </p>
                    </CardContent>
                </Card>

            </div>
        </section>

        <!-- ══ Écran & Power ════════════════════════════════════════ -->
        <section>
            <h3 class="text-base font-semibold mb-4">Écran & Power</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">

                <!-- Écran SSD1315 -->
                <Card>
                    <CardHeader>
                        <CardTitle class="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Écran SSD1315</CardTitle>
                    </CardHeader>
                    <CardContent class="pt-0">

                        <div class="mb-5">
                            <div class="flex justify-between text-sm mb-3">
                                <span>Luminosité</span>
                                <span class="text-muted-foreground">{brightness}</span>
                            </div>
                            <Slider
                                type="single" min={10} max={255}
                                bind:value={brightness}
                                onValueChange={() => updateConfig('display.brightness', brightness)}
                            />
                        </div>

                        <SettingsField label="Extinction après (s)">
                            {#snippet children()}
                                <Input
                                    type="number" min={5} max={600}
                                    class="w-20 text-right"
                                    value={configState.data.display?.timeout_s}
                                    onchange={(e: Event) => updateConfig('display.timeout_s', +(e.target as HTMLInputElement).value)}
                                />
                            {/snippet}
                        </SettingsField>

                        <SettingsField label="Afficher batterie">
                            {#snippet children()}
                                <Switch
                                    checked={configState.data.display?.show_battery}
                                    onCheckedChange={(v: boolean) => updateConfig('display.show_battery', v)}
                                />
                            {/snippet}
                        </SettingsField>
                        <SettingsField label="Afficher layer actif">
                            {#snippet children()}
                                <Switch
                                    checked={configState.data.display?.show_layer}
                                    onCheckedChange={(v: boolean) => updateConfig('display.show_layer', v)}
                                />
                            {/snippet}
                        </SettingsField>
                        <SettingsField label="Afficher profil">
                            {#snippet children()}
                                <Switch
                                    checked={configState.data.display?.show_profile}
                                    onCheckedChange={(v: boolean) => updateConfig('display.show_profile', v)}
                                />
                            {/snippet}
                        </SettingsField>
                        <SettingsField label="Afficher statut BLE">
                            {#snippet children()}
                                <Switch
                                    checked={configState.data.display?.show_ble_status}
                                    onCheckedChange={(v: boolean) => updateConfig('display.show_ble_status', v)}
                                />
                            {/snippet}
                        </SettingsField>

                    </CardContent>
                </Card>

                <!-- Power Management -->
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
                                    value={configState.data.power?.sleep_timeout_s}
                                    onchange={(e: Event) => updateConfig('power.sleep_timeout_s', +(e.target as HTMLInputElement).value)}
                                />
                            {/snippet}
                        </SettingsField>

                        <SettingsField label="Batterie critique" description="Pourcentage déclenchant l'alerte">
                            {#snippet children()}
                                <Input
                                    type="number" min={3} max={30}
                                    class="w-20 text-right"
                                    value={configState.data.power?.battery_critical_pct}
                                    onchange={(e: Event) => updateConfig('power.battery_critical_pct', +(e.target as HTMLInputElement).value)}
                                />
                            {/snippet}
                        </SettingsField>

                        <div class="mt-4">
                            <Label class="text-sm mb-2 block">Présence de la batterie</Label>
                            <p class="text-xs text-muted-foreground mb-2 leading-relaxed">
                                Le SpinPad existe en variantes avec et sans batterie. <strong>Auto</strong>
                                laisse le firmware détecter via l'ADC. <strong>Forcer présente / absente</strong>
                                désactive la détection.
                            </p>
                            <div class="grid grid-cols-3 gap-2">
                                {#each [
                                    { v: 'auto', label: 'Auto' },
                                    { v: 'yes',  label: 'Forcer présente' },
                                    { v: 'no',   label: 'Forcer absente' },
                                ] as o}
                                    {@const current = configState.data.power?.battery_present ?? 'auto'}
                                    <button
                                        type="button"
                                        class="rounded-lg border py-2 text-xs transition-colors
                                               {current === o.v
                                                   ? 'border-primary bg-primary/10 text-primary font-semibold'
                                                   : 'border-border hover:border-primary/50 hover:bg-accent'}"
                                        onclick={() => updateConfig('power.battery_present', o.v)}
                                    >
                                        {o.label}
                                    </button>
                                {/each}
                            </div>
                        </div>

                    </CardContent>
                </Card>

                <!-- Orientation -->
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
                                    onclick={() => updateConfig('orientation', o.value)}
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

                <!-- Encodeur -->
                <Card>
                    <CardHeader>
                        <CardTitle class="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Encodeur rotatif</CardTitle>
                    </CardHeader>
                    <CardContent class="pt-0">

                        <div class="mb-2">
                            <div class="flex justify-between text-sm mb-1">
                                <span>Sensibilité</span>
                                <span class="text-muted-foreground font-mono">
                                    {(['', '1× (standard)', '2× (réactif)', '3×', '4× (max)'] as const)[encoderSens] ?? '—'}
                                </span>
                            </div>
                            <Slider
                                type="single" min={1} max={4} step={1}
                                bind:value={encoderSens}
                                onValueChange={() => updateConfig('encoder.sensitivity', encoderSens)}
                            />
                            <div class="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>1 clic / détent</span>
                                <span>4 clics / détent</span>
                            </div>
                        </div>

                    </CardContent>
                </Card>

            </div>
        </section>

        <!-- ══ Extension LED ════════════════════════════════════════ -->
        <section>
            <h3 class="text-base font-semibold mb-4">Extension LED</h3>
            <div class="max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle class="text-sm uppercase tracking-widest text-muted-foreground font-semibold">LEDs supplémentaires</CardTitle>
                    </CardHeader>
                    <CardContent class="pt-0">

                        <p class="text-sm text-muted-foreground mb-4">
                            Le connecteur d'extension sur le PCB permet de brancher jusqu'à 50 LEDs WS2812
                            supplémentaires (ruban, ambilight…).
                        </p>

                        <SettingsField label="Activer l'extension" description="Active les LEDs branchées sur le connecteur d'extension">
                            {#snippet children()}
                                <Switch
                                    checked={ledExtEnabled}
                                    onCheckedChange={(v: boolean) => updateConfig('led_extension.enabled', v)}
                                />
                            {/snippet}
                        </SettingsField>

                        {#if ledExtEnabled}

                            <SettingsField label="Nombre de LEDs" description="1–50 LEDs WS2812 branchées sur le connecteur">
                                {#snippet children()}
                                    <Input
                                        type="number" min={1} max={50}
                                        class="w-20 text-right"
                                        value={configState.data.led_extension?.count}
                                        onchange={(e: Event) => updateConfig('led_extension.count', Math.min(50, Math.max(1, +(e.target as HTMLInputElement).value)))}
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
                                                   {ledExtMode === m.value
                                                       ? 'border-primary bg-primary/10 text-primary'
                                                       : 'border-border hover:border-primary/50 hover:bg-accent'}"
                                            onclick={() => updateConfig('led_extension.mode', m.value)}
                                        >
                                            <span class="text-sm font-medium">{m.label}</span>
                                            <span class="text-xs text-muted-foreground leading-snug">{m.desc}</span>
                                        </button>
                                    {/each}
                                </div>
                            </div>

                            <!-- Couleur (masquée en modes Mirror et Hyperion) -->
                            {#if ledExtMode !== 1 && ledExtMode !== 5}
                                <SettingsField
                                    label="Couleur"
                                    description={ledExtMode === 4 ? 'Couleur du flash réactif' : 'Couleur de base'}
                                >
                                    {#snippet children()}
                                        <input
                                            type="color"
                                            class="w-10 h-8 cursor-pointer rounded border border-border bg-transparent p-0.5"
                                            value={rgbToHex(
                                                configState.data.led_extension?.r ?? 255,
                                                configState.data.led_extension?.g ?? 255,
                                                configState.data.led_extension?.b ?? 255
                                            )}
                                            oninput={(e: Event) => {
                                                const rgb = hexToRgb((e.target as HTMLInputElement).value);
                                                if (rgb) {
                                                    updateConfig('led_extension.r', rgb.r);
                                                    updateConfig('led_extension.g', rgb.g);
                                                    updateConfig('led_extension.b', rgb.b);
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
                                    <span class="text-muted-foreground">{ledExtBright}</span>
                                </div>
                                <Slider
                                    type="single" min={0} max={255}
                                    bind:value={ledExtBright}
                                    onValueChange={() => updateConfig('led_extension.brightness', ledExtBright)}
                                />
                            </div>

                        {/if}

                    </CardContent>
                </Card>
            </div>
        </section>

    </div>
{/if}
