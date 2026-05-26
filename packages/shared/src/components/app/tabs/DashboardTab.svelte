<script lang="ts">
    import {
        connect,
        disconnect,
        serial,
    } from '../../../serial/index.svelte.js';
    import {
        loadConfig,
        saveConfig,
        configState,
        factoryReset,
    } from '../../../store/config.svelte.js';
    import { devMode } from '../../../store/devMode.svelte.js';
    import { refreshDeviceStatus } from '../../../store/deviceStatus.svelte.js';
    import { Button }   from '../../ui/button/index.js';
    import { Badge }    from '../../ui/badge/index.js';
    import { Card, CardContent } from '../../ui/card/index.js';
    import InfoCard     from '../InfoCard.svelte';
    import DeviceStatusCard from '../DeviceStatusCard.svelte';
    import { Spinner }  from '../../ui/spinner/index.js';
    import * as Item    from '../../ui/item/index.js';
    import { Plug, PlugZap, RefreshCw, LogOut, Trash2, FlaskConical } from '@lucide/svelte';

    type BatteryScenario = 'present' | 'absent' | 'low';
    type ConnScenario    = 'usb' | 'ble' | 'both';
    const BATT_SCENARIOS: { v: BatteryScenario; label: string }[] = [
        { v: 'present', label: '78 %' },
        { v: 'low',     label: '12 %' },
        { v: 'absent',  label: 'Absente' },
    ];
    const CONN_SCENARIOS: { v: ConnScenario; label: string }[] = [
        { v: 'usb',  label: 'USB' },
        { v: 'ble',  label: 'BLE' },
        { v: 'both', label: 'USB + BLE' },
    ];

    function setBatt(v: BatteryScenario) { devMode.battery    = v; refreshDeviceStatus(); }
    function setConn(v: ConnScenario)    { devMode.connection = v; refreshDeviceStatus(); }

    async function handleConnect() {
        const ok = await connect();
        if (ok) await loadConfig();
    }

    async function handleFactoryReset() {
        if (!confirm('Remettre la config à zéro ? Toutes les modifications seront perdues.')) return;
        await factoryReset();
        await loadConfig();
    }

    async function handleDevMode() {
        devMode.active = true;
        await loadConfig();
    }

    const isOnline = $derived(serial.connected || devMode.active);
</script>

<!-- Connection state -->
{#if !isOnline}
    <div class="flex flex-col items-center gap-4 py-12">
        <Button onclick={handleConnect} size="lg" class="gap-2">
            <PlugZap class="size-5" />
            Connecter le clavier
        </Button>

        {#if serial.error}
            <p class="text-destructive text-sm">{serial.error}</p>
        {/if}

        <div class="mt-2 text-center">
            <Button
                variant="ghost"
                size="sm"
                onclick={handleDevMode}
                class="text-amber-400 hover:text-amber-300 gap-1.5"
            >
                <FlaskConical class="size-4" />
                Lancer le mode démo
            </Button>
            <p class="text-xs text-muted-foreground mt-1">
                Prérequis : Chrome ou Edge, clavier USB. WebSerial non supporté sur Firefox.
            </p>
        </div>
    </div>
{:else if configState.isLoading}
    <div class="flex w-full max-w-xs mx-auto flex-col gap-4 py-12 [--radius:1rem]">
        <Item.Root variant="muted">
            <Item.Media><Spinner /></Item.Media>
            <Item.Content>
                <Item.Title class="line-clamp-1">Chargement de la configuration…</Item.Title>
            </Item.Content>
        </Item.Root>
    </div>
{:else if configState.data}
    <!-- Live device status (battery / connection / firmware) -->
    <div class="mb-6">
        <DeviceStatusCard />
    </div>

    {#if devMode.active}
        <Card class="mb-6 border-amber-500/40 bg-amber-500/5">
            <CardContent class="p-4">
                <div class="flex items-center gap-2 mb-3">
                    <FlaskConical class="size-4 text-amber-500" />
                    <span class="text-xs uppercase tracking-widest text-amber-500 font-semibold">
                        Scénarios démo
                    </span>
                </div>
                <div class="flex flex-col gap-3">
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="text-xs text-muted-foreground w-20">Batterie</span>
                        {#each BATT_SCENARIOS as s}
                            <Button
                                variant={devMode.battery === s.v ? 'default' : 'outline'}
                                size="sm"
                                onclick={() => setBatt(s.v)}
                            >
                                {s.label}
                            </Button>
                        {/each}
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="text-xs text-muted-foreground w-20">Connexion</span>
                        {#each CONN_SCENARIOS as s}
                            <Button
                                variant={devMode.connection === s.v ? 'default' : 'outline'}
                                size="sm"
                                onclick={() => setConn(s.v)}
                            >
                                {s.label}
                            </Button>
                        {/each}
                    </div>
                </div>
            </CardContent>
        </Card>
    {/if}

    <!-- Info grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <InfoCard
            label="Profils"
            value={configState.data.profile_count ?? configState.data.profiles?.length}
        />
        <InfoCard
            label="Profil actif"
            value={configState.data.profiles?.[configState.data.active_profile]?.name}
        />
        <InfoCard
            label="BLE Device"
            value={configState.data.ble?.slot_names?.[configState.data.ble?.active_slot]}
        />
        <InfoCard
            label="Sleep timeout"
            value="{configState.data.power?.sleep_timeout_s}s"
        />
        <InfoCard label="Version" value="v{configState.data.version}" />
    </div>

    {#if configState.loadError}
        <p class="text-destructive text-sm mb-4">{configState.loadError}</p>
    {/if}

    <!-- Actions -->
    <div class="flex flex-wrap gap-2 mb-8">
        {#if configState.isDirty}
            <Button onclick={saveConfig} class="gap-1.5">💾 Sauvegarder</Button>
        {/if}
        <Button variant="outline" onclick={loadConfig} class="gap-1.5">
            <RefreshCw class="size-4" /> Recharger
        </Button>
        {#if serial.connected}
            <Button variant="outline" onclick={disconnect} class="gap-1.5">
                <LogOut class="size-4" /> Déconnecter
            </Button>
            <Button variant="destructive" onclick={handleFactoryReset} class="gap-1.5">
                <Trash2 class="size-4" /> Reset usine
            </Button>
        {/if}
    </div>

    <!-- Profiles section -->
    <h3 class="text-base font-semibold mb-3">Profils</h3>
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
                        <p class="text-xs text-muted-foreground">
                            {prof.layers?.length ?? 0} layer(s) · {prof.combos?.length ?? 0} combo(s)
                        </p>
                    </div>
                </CardContent>
            </Card>
        {/each}
    </div>
{:else}
    <div class="text-center py-10">
        <p class="text-muted-foreground text-sm mb-3">Aucune config chargée.</p>
        <Button variant="outline" onclick={loadConfig}>Charger</Button>
    </div>
{/if}
