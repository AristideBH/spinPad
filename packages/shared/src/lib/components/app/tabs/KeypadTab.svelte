<script lang="ts">
    import {
        configState,
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
    } from '../../../keycodes/index.js';
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
    <div class="flex flex-wrap items-end gap-4 mb-6">
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
                            'rounded-md border text-[10px] font-semibold transition-all flex flex-col items-center justify-center gap-0.5 p-1 cursor-pointer hover:border-primary/50',
                            editingKey === key.idx && editingField === 'key'
                                ? 'border-primary bg-primary/20'
                                : 'bg-card'
                        )}
                        onclick={() => openKeyPicker(key.idx)}
                    >
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
    {/if}

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
                            <p class="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{cat}</p>
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
