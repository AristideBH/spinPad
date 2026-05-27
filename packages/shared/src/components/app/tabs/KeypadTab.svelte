<script lang="ts">
    import {
        configState,
        updateConfig,
        setKeyAction,
        setEncoderAction,
    } from '../../../store/config.svelte.js';
    import {
        KEYCODES,
        KEYCODES_FLAT,
        getKeycodeLabel,
        action,
        ACTION_TYPES,
        MEDIA_CODES,
        MACRO_STEP_TYPE,
        MACRO_MAX_STEPS,
        MACRO_MAX_PER_PROFILE,
    } from '../../../constants/keycodes/index.js';
    import type { MacroStep } from '../../../constants/keycodes/index.js';
    import { Button }   from '../../ui/button/index.js';
    import { cn }       from '../../../utils.js';
    import { Input }    from '../../ui/input/index.js';
    import {
        Dialog, DialogContent,
        DialogHeader, DialogTitle,
    } from '../../ui/dialog/index.js';
    import {
        Select, SelectContent,
        SelectItem, SelectTrigger,
    } from '../../ui/select/index.js';
    import { Label }        from '../../ui/label/index.js';
    import NotConnected     from '../NotConnected.svelte';
    import { serial, keyMonitor, onKeyEvent } from '../../../serial/index.svelte.js';
    import { Activity } from '@lucide/svelte';

    let editingKey   = $state<number | null>(null);
    let editingField = $state<string | null>(null);
    let searchQuery  = $state('');
    let pickerOpen   = $state(false);

    // Local string state bound to the Select components (bits-ui requires strings)
    let profileValue = $state(String(configState.activeProfileIndex));
    let layerValue   = $state(String(configState.activeLayerIndex));

    // Sync profile selector → store; reset layer whenever profile changes
    $effect(() => {
        configState.activeProfileIndex = +profileValue;
        layerValue = '0';
        configState.activeLayerIndex = 0;
    });

    // Sync layer selector → store
    $effect(() => {
        configState.activeLayerIndex = +layerValue;
    });

    const profile      = $derived(configState.data?.profiles?.[configState.activeProfileIndex]);
    const layer        = $derived(profile?.layers?.[configState.activeLayerIndex]);
    const profileLabel = $derived(profile?.name ?? 'Profil');
    const layerLabel   = $derived(layer?.name ?? 'Layer');

    const filteredKeycodes = $derived(
        searchQuery
            ? KEYCODES_FLAT.filter(k =>
                k.label.toLowerCase().includes(searchQuery.toLowerCase()))
            : null
    );

    function openKeyPicker(keyIndex: number): void {
        editingKey = keyIndex;
        editingField = 'key';
        searchQuery = '';
        pickerOpen = true;
    }

    function openEncoderPicker(field: string): void {
        editingKey = null;
        editingField = field;
        searchQuery = '';
        pickerOpen = true;
    }

    function selectKeycode(kc: { value: number; label: string; category: string }): void {
        if (editingField === 'key' && editingKey !== null) {
            setKeyAction(configState.activeProfileIndex, configState.activeLayerIndex, editingKey, kc.value);
        } else if (editingField === 'encoder_cw') {
            setEncoderAction(configState.activeProfileIndex, configState.activeLayerIndex, 'cw', kc.value);
        } else if (editingField === 'encoder_ccw') {
            setEncoderAction(configState.activeProfileIndex, configState.activeLayerIndex, 'ccw', kc.value);
        } else if (editingField === 'encoder_press') {
            setEncoderAction(configState.activeProfileIndex, configState.activeLayerIndex, 'press', kc.value);
        }
        pickerOpen = false;
    }

    const CATEGORY_COLORS = {
        letter:   'bg-blue-950/80 hover:bg-blue-900/80',
        special:  'bg-slate-800/80 hover:bg-slate-700/80',
        modifier: 'bg-violet-950/80 hover:bg-violet-900/80',
        layer:    'bg-green-950/80 hover:bg-green-900/80',
        media:    'bg-orange-950/80 hover:bg-orange-900/80',
        firmware: 'bg-purple-950/80 hover:bg-purple-900/80',
        macro:    'bg-rose-950/80 hover:bg-rose-900/80',
    };

    // ── Encoder presets ───────────────────────────────────────────
    const ENCODER_PRESETS = [
        {
            label: 'Volume', icon: '🔊',
            cw:  action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_VOL_UP),
            ccw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_VOL_DN),
        },
        {
            label: 'Scroll ↕', icon: '↕',
            cw:  action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_SCRL_UP),
            ccw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_SCRL_DN),
        },
        {
            label: 'Scroll ↔', icon: '↔',
            cw:  action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_SCRL_RIGHT),
            ccw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_SCRL_LEFT),
        },
        {
            label: 'Piste', icon: '⏭',
            cw:  action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_NEXT),
            ccw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_PREV),
        },
        {
            label: 'Zoom', icon: '🔍',
            cw:  action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_ZOOM_IN),
            ccw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_ZOOM_OUT),
        },
    ];

    function applyEncoderPreset(preset: { cw: number; ccw: number }): void {
        const pi = configState.activeProfileIndex;
        const li = configState.activeLayerIndex;
        setEncoderAction(pi, li, 'cw',  preset.cw);
        setEncoderAction(pi, li, 'ccw', preset.ccw);
    }

    // ── Orientation visuelle ───────────────────────────────────────
    const ORIENT_DEG  = [0, 90, 180, 270];
    const orientDeg   = $derived(ORIENT_DEG[configState.data?.orientation ?? 0] ?? 0);
    const isTransposed = $derived(orientDeg === 90 || orientDeg === 270);
    const CELL = 44;
    const GAP  = 6;
    const gridW = $derived(isTransposed ? 4*CELL + 3*GAP : 3*CELL + 2*GAP);
    const gridH = $derived(isTransposed ? 3*CELL + 2*GAP : 4*CELL + 3*GAP);

    // ── Live training mode ────────────────────────────────────────
    let trainingActive  = $state(false);
    let keyPressCounts  = $state<number[]>(Array(10).fill(0));
    let keyFlash        = $state<number[]>(Array(10).fill(0)); // timestamp of last press (for CSS fade)
    let trainingCleanup: (() => void) | null = null;

    async function toggleTraining() {
        if (!serial.connected) return;
        trainingActive = !trainingActive;
        await keyMonitor(trainingActive);
        if (trainingActive) {
            trainingCleanup = onKeyEvent((evt: { idx: number; state: string }) => {
                const idx: number = evt.idx;
                if (idx >= 0 && idx < 10) {
                    if (evt.state === 'down') {
                        keyPressCounts[idx]++;
                        keyFlash[idx] = Date.now();
                    }
                }
            });
        } else {
            trainingCleanup?.();
            trainingCleanup = null;
        }
    }

    // Stop training when disconnected
    $effect(() => {
        if (!serial.connected && trainingActive) {
            trainingActive = false;
            trainingCleanup?.();
            trainingCleanup = null;
        }
    });

    function resetTrainingCounts() {
        keyPressCounts = Array(10).fill(0);
        keyFlash = Array(10).fill(0);
    }

    function keyFlashOpacity(idx: number): number {
        const age = Date.now() - keyFlash[idx];
        if (age > 600) return 0;
        return Math.max(0, 1 - age / 600);
    }

    // ── Macro editor ──────────────────────────────────────────────
    let macroEditorOpen = $state(false);
    let editingMacroIdx = $state(0);
    let macroSteps      = $state<MacroStep[]>([]);

    const macros = $derived<MacroStep[][]>(
        (configState.data?.profiles?.[configState.activeProfileIndex]?.macros ?? []) as MacroStep[][]
    );

    function openMacroEditor(idx: number) {
        editingMacroIdx = idx;
        macroSteps = structuredClone(macros[idx] ?? []);
        macroEditorOpen = true;
    }

    function saveMacro() {
        const pi = configState.activeProfileIndex;
        const updated = [...(macros ?? [])];
        while (updated.length <= editingMacroIdx) updated.push([]);
        updated[editingMacroIdx] = macroSteps.slice(0, MACRO_MAX_STEPS);
        // Remove trailing empty macros to keep JSON lean
        while (updated.length > 0 && updated[updated.length - 1].length === 0) updated.pop();
        updateConfig(`profiles.${pi}.macros`, updated);
        macroEditorOpen = false;
    }

    function addMacroStep(type: number) {
        if (macroSteps.length >= MACRO_MAX_STEPS) return;
        if (type === MACRO_STEP_TYPE.DELAY_MS) {
            macroSteps = [...macroSteps, { type, delay: 50 }];
        } else {
            macroSteps = [...macroSteps, { type, keycode: 0x04 }];  // default KC_A
        }
    }

    function removeMacroStep(idx: number) {
        macroSteps = macroSteps.filter((_, i) => i !== idx);
    }

    function updateMacroStep(idx: number, patch: Partial<MacroStep>) {
        macroSteps = macroSteps.map((s, i) => i === idx ? { ...s, ...patch } : s);
    }

    function macroStepLabel(s: MacroStep): string {
        if (s.type === MACRO_STEP_TYPE.KEY_DOWN) return `↓ ${getKeycodeLabel(s.keycode ?? 0)}`;
        if (s.type === MACRO_STEP_TYPE.KEY_UP)   return `↑ ${getKeycodeLabel(s.keycode ?? 0)}`;
        return `⏱ ${s.delay ?? 0}ms`;
    }

    // Physical key layout — 4 rows × 3 cols, 10 switches
    const KEY_LAYOUT = [
        { sw: 'SW8',  idx: 1, row: 1, col: 1, rowSpan: 1, colSpan: 1 },
        { sw: 'SW1',  idx: 0, row: 1, col: 2, rowSpan: 1, colSpan: 2 },
        { sw: 'SW9',  idx: 4, row: 2, col: 1, rowSpan: 1, colSpan: 1 },
        { sw: 'SW7',  idx: 3, row: 2, col: 2, rowSpan: 1, colSpan: 1 },
        { sw: 'SW2',  idx: 2, row: 2, col: 3, rowSpan: 1, colSpan: 1 },
        { sw: 'SW10', idx: 7, row: 3, col: 1, rowSpan: 2, colSpan: 1 },
        { sw: 'SW6',  idx: 6, row: 3, col: 2, rowSpan: 1, colSpan: 1 },
        { sw: 'SW3',  idx: 5, row: 3, col: 3, rowSpan: 1, colSpan: 1 },
        { sw: 'SW5',  idx: 9, row: 4, col: 2, rowSpan: 1, colSpan: 1 },
        { sw: 'SW4',  idx: 8, row: 4, col: 3, rowSpan: 1, colSpan: 1 },
    ];
</script>

{#if !configState.data}
    <NotConnected />
{:else}
    <!-- Toolbar -->
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div class="flex flex-col gap-1.5">
            <Label>Profil</Label>
            <Select type="single" bind:value={profileValue}>
                <SelectTrigger class="w-40">{profileLabel}</SelectTrigger>
                <SelectContent>
                    {#each configState.data.profiles as prof, i}
                        <SelectItem value={String(i)} label={prof.name} />
                    {/each}
                </SelectContent>
            </Select>
        </div>

        {#if serial.connected}
            <Button
                variant={trainingActive ? 'default' : 'outline'}
                size="sm"
                onclick={toggleTraining}
                class="gap-1.5 ml-auto"
                title="Mode entraînement : voir les touches pressées en temps réel"
            >
                <Activity class="size-3.5" />
                {trainingActive ? 'Arrêter' : 'Entraînement'}
            </Button>
        {/if}
        {#if profile}
            <div class="flex flex-col gap-1.5">
                <Label>Layer</Label>
                <Select type="single" bind:value={layerValue}>
                    <SelectTrigger class="w-36">{layerLabel}</SelectTrigger>
                    <SelectContent>
                        {#each profile.layers as l, i}
                            <SelectItem value={String(i)} label={l.name} />
                        {/each}
                    </SelectContent>
                </Select>
            </div>
        {/if}
    </div>

    {#if layer}
        <!-- Orientation badge -->
        {#if orientDeg !== 0}
            <p class="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                <span>Orientation</span>
                <span class="px-1 font-mono rounded bg-muted">{orientDeg}°</span>
                <span>— vue depuis la face avant du SpinPad</span>
            </p>
        {/if}

        <!-- Outer bounding box adapts to rotated dimensions -->
        <div class="relative mb-6" style="width: {gridW}px; height: {gridH}px;">
            <div
                class="inline-grid gap-1.5 transition-transform duration-300"
                style="
                    grid-template-rows: repeat(4, {CELL}px);
                    grid-template-columns: repeat(3, {CELL}px);
                    transform: rotate({orientDeg}deg);
                    transform-origin: center center;
                    position: absolute;
                    top: 50%; left: 50%;
                    translate: -50% -50%;
                "
            >
                {#each KEY_LAYOUT as key}
                    <button
                        style="grid-row: {key.row} / span {key.rowSpan}; grid-column: {key.col} / span {key.colSpan};"
                        class={cn(
                            'relative rounded-md border text-[10px] font-semibold transition-all flex flex-col items-center justify-center gap-0.5 p-1 cursor-pointer hover:border-primary/50 overflow-hidden',
                            editingKey === key.idx && editingField === 'key'
                                ? 'border-primary bg-primary/20'
                                : 'bg-card'
                        )}
                        onclick={() => openKeyPicker(key.idx)}
                    >
                        <!-- Training flash overlay -->
                        {#if trainingActive}
                            <div
                                class="absolute inset-0 transition-opacity duration-300 rounded-md pointer-events-none bg-emerald-400/60"
                                style="opacity: {keyFlashOpacity(key.idx)}"
                            ></div>
                            {#if keyPressCounts[key.idx] > 0}
                                <span class="absolute top-0.5 right-1 text-[7px] font-bold text-emerald-400">{keyPressCounts[key.idx]}</span>
                            {/if}
                        {/if}
                        <span class="text-[8px] text-muted-foreground">{key.sw}</span>
                        <span class="leading-none">{getKeycodeLabel(layer.keys[key.idx] ?? 0)}</span>
                        {#if key.rowSpan === 2 || key.colSpan === 2}
                            <span class="text-[7px] text-muted-foreground/50">2u</span>
                        {/if}
                    </button>
                {/each}
            </div>
        </div>

        <!-- Encodeur -->
        <div class="mb-6">
            <p class="mb-2 text-sm font-medium text-muted-foreground">Encodeur</p>

            <!-- Sets prédéfinis -->
            <div class="flex flex-wrap gap-1.5 mb-3">
                <span class="text-[10px] text-muted-foreground self-center ml-1">Sets rapides</span>
                {#each ENCODER_PRESETS as preset}
                    <button
                        class="flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-medium bg-card hover:border-violet-500/60 transition-all cursor-pointer"
                        onclick={() => applyEncoderPreset(preset)}
                        title="Appliquer le set {preset.label} (CW + CCW)"
                    >
                        <span>{preset.icon}</span>
                        <span>{preset.label}</span>
                    </button>
                {/each}
            </div>

            <!-- CW / CCW / Press individuels -->
            <div class="flex gap-2">
                {#each [
                    { field: 'encoder_cw',    label: '↻ CW',    value: layer.encoder?.cw    ?? 0 },
                    { field: 'encoder_ccw',   label: '↺ CCW',   value: layer.encoder?.ccw   ?? 0 },
                    { field: 'encoder_press', label: '● Press', value: layer.encoder?.press ?? 0 },
                ] as enc}
                    <button
                        class={cn(
                            'flex flex-col items-center gap-0.5 px-3 py-2 rounded-md border text-sm transition-all cursor-pointer hover:border-violet-500/50',
                            editingField === enc.field
                                ? 'border-violet-500 bg-violet-950/40'
                                : 'bg-card'
                        )}
                        onclick={() => openEncoderPicker(enc.field)}
                    >
                        <span class="text-[10px] text-muted-foreground">{enc.label}</span>
                        <span class="font-semibold">{getKeycodeLabel(enc.value)}</span>
                    </button>
                {/each}
            </div>
        </div>
        <!-- Training stats panel -->
        {#if trainingActive}
            <div class="p-3 mt-4 border rounded-lg border-emerald-500/30 bg-emerald-500/5">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Activity class="size-3" />
                        Mode entraînement actif
                    </span>
                    <Button variant="ghost" size="sm" onclick={resetTrainingCounts} class="h-6 text-xs text-muted-foreground">
                        Réinitialiser
                    </Button>
                </div>
                <p class="text-xs text-muted-foreground">
                    Total : {keyPressCounts.reduce((a, b) => a + b, 0)} appuis
                    · Touche la plus utilisée : SW{(keyPressCounts.indexOf(Math.max(...keyPressCounts)) + 1) || '—'}
                </p>
            </div>
        {/if}

        <!-- Macro panel -->
        <div class="mt-6">
            <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-semibold">Macros</h4>
                <span class="text-xs text-muted-foreground">{macros.length}/{MACRO_MAX_PER_PROFILE} utilisées</span>
            </div>
            <div class="grid grid-cols-4 gap-1.5">
                {#each Array.from({ length: Math.min(macros.length + 1, MACRO_MAX_PER_PROFILE) }, (_, i) => i) as i}
                    <button
                        type="button"
                        class="flex flex-col items-center gap-0.5 rounded-lg border border-border px-2 py-2 text-xs transition-colors hover:border-rose-500/60 hover:bg-rose-500/5"
                        onclick={() => openMacroEditor(i)}
                    >
                        <span class="text-muted-foreground text-[10px]">M{i}</span>
                        <span class="font-semibold">{macros[i]?.length ?? 0} étapes</span>
                    </button>
                {/each}
            </div>
            <p class="mt-2 text-xs text-muted-foreground">
                Assigner une macro à une touche : choisir <span class="px-1 font-mono rounded bg-muted">Macro N</span> dans le sélecteur.
            </p>
        </div>
    {/if}

    <!-- Macro Editor Dialog -->
    <Dialog bind:open={macroEditorOpen}>
        <DialogContent class="max-w-md max-h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Macro {editingMacroIdx} — éditeur de séquence</DialogTitle>
            </DialogHeader>

            <div class="flex-1 pr-1 overflow-y-auto">
                {#if macroSteps.length === 0}
                    <p class="py-4 text-xs text-center text-muted-foreground">Aucune étape. Ajoutez des actions ci-dessous.</p>
                {/if}
                <div class="flex flex-col gap-1 mb-3">
                    {#each macroSteps as step, si}
                        <div class="flex items-center gap-2 p-2 text-xs border rounded border-border">
                            <span class="w-4 text-center text-muted-foreground">{si + 1}</span>
                            <select
                                class="bg-transparent border border-border rounded px-1 py-0.5 text-xs"
                                value={step.type}
                                onchange={(e: Event) => updateMacroStep(si, { type: +(e.target as HTMLSelectElement).value as 0|1|2 })}
                            >
                                <option value={MACRO_STEP_TYPE.KEY_DOWN}>↓ Key Down</option>
                                <option value={MACRO_STEP_TYPE.KEY_UP}>↑ Key Up</option>
                                <option value={MACRO_STEP_TYPE.DELAY_MS}>⏱ Délai ms</option>
                            </select>
                            {#if step.type === MACRO_STEP_TYPE.DELAY_MS}
                                <input
                                    type="number" min="1" max="1000"
                                    class="w-16 rounded border border-border bg-transparent px-1 py-0.5 text-xs text-right"
                                    value={step.delay ?? 50}
                                    onchange={(e: Event) => updateMacroStep(si, { delay: Math.min(1000, Math.max(1, +(e.target as HTMLInputElement).value)) })}
                                />
                                <span class="text-muted-foreground">ms</span>
                            {:else}
                                <input
                                    type="number" min="0" max="255"
                                    class="w-16 rounded border border-border bg-transparent px-1 py-0.5 text-xs text-right"
                                    value={step.keycode ?? 0}
                                    onchange={(e: Event) => updateMacroStep(si, { keycode: +(e.target as HTMLInputElement).value })}
                                />
                                <span class="flex-1 text-muted-foreground">{getKeycodeLabel(action(0, step.keycode ?? 0))}</span>
                            {/if}
                            <button
                                type="button"
                                class="ml-auto text-muted-foreground hover:text-destructive"
                                onclick={() => removeMacroStep(si)}
                            >✕</button>
                        </div>
                    {/each}
                </div>

                <!-- Add step buttons -->
                <div class="flex gap-1.5 flex-wrap">
                    <button type="button"
                        class="px-2 py-1 text-xs transition-colors border border-dashed rounded border-border hover:border-primary/60 hover:bg-accent"
                        onclick={() => addMacroStep(MACRO_STEP_TYPE.KEY_DOWN)}
                        disabled={macroSteps.length >= MACRO_MAX_STEPS}
                    >+ Key Down</button>
                    <button type="button"
                        class="px-2 py-1 text-xs transition-colors border border-dashed rounded border-border hover:border-primary/60 hover:bg-accent"
                        onclick={() => addMacroStep(MACRO_STEP_TYPE.KEY_UP)}
                        disabled={macroSteps.length >= MACRO_MAX_STEPS}
                    >+ Key Up</button>
                    <button type="button"
                        class="px-2 py-1 text-xs transition-colors border border-dashed rounded border-border hover:border-primary/60 hover:bg-accent"
                        onclick={() => addMacroStep(MACRO_STEP_TYPE.DELAY_MS)}
                        disabled={macroSteps.length >= MACRO_MAX_STEPS}
                    >+ Délai</button>
                </div>
                <p class="mt-2 text-xs text-muted-foreground">{macroSteps.length}/{MACRO_MAX_STEPS} étapes</p>
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t border-border shrink-0">
                <Button variant="outline" size="sm" onclick={() => { macroEditorOpen = false; }}>Annuler</Button>
                <Button size="sm" onclick={saveMacro}>Enregistrer</Button>
            </div>
        </DialogContent>
    </Dialog>

    <!-- Keycode Picker Dialog -->
    <Dialog bind:open={pickerOpen}>
        <DialogContent class="max-w-lg max-h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Choisir une action</DialogTitle>
            </DialogHeader>

            <Input
                type="text"
                placeholder="Rechercher un keycode…"
                bind:value={searchQuery}
                autofocus
                class="shrink-0"
            />

            <div class="flex-1 pr-1 mt-2 overflow-y-auto">
                {#if filteredKeycodes}
                    <div class="flex flex-wrap gap-1.5">
                        {#each filteredKeycodes as kc}
                            <button
                                class="px-2.5 py-1 rounded text-xs font-semibold border cursor-pointer transition-all hover:border-primary {CATEGORY_COLORS[kc.category] ?? 'bg-card'}"
                                onclick={() => selectKeycode(kc)}
                            >{kc.label}</button>
                        {/each}
                    </div>
                {:else}
                    {#each Object.entries(KEYCODES) as [cat, keys]}
                        <div class="mb-4">
                            <p class="text-[10px] uppercase tracking-widest text-white mb-2">{cat}</p>
                            <div class="flex flex-wrap gap-1.5">
                                {#each keys as kc}
                                    <button
                                        class="px-2.5 py-1 rounded text-xs font-semibold border cursor-pointer transition-all hover:border-primary {CATEGORY_COLORS[kc.category] ?? 'bg-card'}"
                                        onclick={() => selectKeycode(kc)}
                                    >{kc.label}</button>
                                {/each}
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
        </DialogContent>
    </Dialog>
{/if}
