<script lang="ts">
  import { configState, updateConfig, exportConfig, importConfig } from '$shared/store/config.svelte.js';
  import { Download, Upload } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';
  import { setTime } from '$shared/store/serial.svelte.js';
  import { Card, CardContent, CardHeader, CardTitle } from '$shared/components/ui/card/index.js';
  import { Input } from '$shared/components/ui/input/index.js';
  import * as NumberField from '$shared/components/ui/number-field/index.js';
  import { Label } from '$shared/components/ui/label/index.js';
  import { Badge } from '$shared/components/ui/badge/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import { Kbd } from '$shared/components/ui/kbd/index.js';
  import { Field, FieldLabel } from '$shared/components/ui/field/index.js';
  import SettingsField from '$shared/components/app/SettingsField.svelte';
  import NotConnected from '$shared/components/app/NotConnected.svelte';
  import OptionGrid from '$shared/components/app/OptionGrid.svelte';
  import SliderField from '$shared/components/app/SliderField.svelte';
  import * as UnderlineTabs from '$shared/components/ui/underline-tabs';
  import { scrollShadow } from '$shared/utils.js';
  import StatsTile from '$shared/components/app/studio/dashboard/tile-stats.svelte';
  import { Scrubber } from '$shared/components/ui/scrubber';

  // ── Tabs ──────────────────────────────────────────────────────
  const TABS = [
    { value: 'stats', label: 'Stats' },
    { value: 'bluetooth', label: 'Bluetooth' },
    { value: 'ecran', label: 'Écran & Power' },
    { value: 'sauvegarde', label: 'Sauvegarde' },
  ];

  let tabValue = $state('stats');
  let listEl = $state<HTMLDivElement | null>(null);
  let tabListEl = $state<HTMLElement | null>(null);
  let tabWrapperEl = $state<HTMLElement | null>(null);
  let sectionEls = $state<Record<string, HTMLElement | null>>({});
  let isSyncingFromTab = false;

  function scrollToSection(val: string) {
    isSyncingFromTab = true;
    if (val === TABS[0].value) {
      listEl?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      sectionEls[val]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTimeout(() => (isSyncingFromTab = false), 700);
  }

  $effect(() => {
    if (!listEl) return;
    const keys = Object.keys(sectionEls);
    if (keys.length === 0) return;

    const visibleSections = new Set<string>();

    const observer = new IntersectionObserver(
      (ioEntries) => {
        if (isSyncingFromTab) return;
        for (const entry of ioEntries) {
          const cat = entry.target.getAttribute('data-cat')!;
          if (entry.isIntersecting) visibleSections.add(cat);
          else visibleSections.delete(cat);
        }
        if (visibleSections.size === 0) {
          tabValue = TABS[0].value;
          return;
        }
        const first = TABS.find(({ value }) => visibleSections.has(value));
        if (first) tabValue = first.value;
      },
      { root: listEl, threshold: 0.1, rootMargin: '-5% 0px -50% 0px' },
    );

    for (const cat of keys) {
      const el = sectionEls[cat];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  });

  $effect(() => {
    tabValue;
    const active = tabListEl?.querySelector<HTMLElement>('[data-state="active"]');
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  });

  $effect(() => {
    if (!tabListEl || !tabWrapperEl) return;
    return scrollShadow(tabListEl, tabWrapperEl);
  });

  // ── Orientation ───────────────────────────────────────────────
  const ORIENTATIONS = [
    { value: 0, label: '0°', icon: '↑' },
    { value: 1, label: '90°', icon: '→' },
    { value: 2, label: '180°', icon: '↓' },
    { value: 3, label: '270°', icon: '←' },
  ];

  // ── Sliders locaux (bits-ui Slider nécessite bind:value) ──────
  // La sync STORE → LOCAL se fait via $effect (ex: undo/redo, rechargement).
  // La sync LOCAL → STORE se fait via onValueChange sur le Slider (jamais via $effect,
  // pour éviter une boucle qui écraserait le résultat d'un undo/redo).
  let brightness = $state(0);
  let encoderSens = $state(1);
  let ledExtBright = $state(200);

  // Sync store → local (déclenché par undo/redo, chargement config, etc.)
  $effect(() => {
    brightness = configState.data?.display?.brightness ?? 180;
  });
  $effect(() => {
    encoderSens = configState.data?.encoder?.sensitivity ?? 1;
  });
  $effect(() => {
    ledExtBright = configState.data?.led_extension?.brightness ?? 200;
  });

  const SENS_LABELS = ['', '1× (standard)', '2× (réactif)', '3×', '4× (max)'] as const;

  // ── NumberField state ─────────────────────────────────────────
  let displayTimeout = $state(configState.data?.display?.timeout_s ?? 60);
  $effect(() => {
    displayTimeout = configState.data?.display?.timeout_s ?? 60;
  });
  $effect(() => {
    if (displayTimeout !== (configState.data?.display?.timeout_s ?? 60))
      updateConfig('display.timeout_s', displayTimeout);
  });

  let sleepTimeout = $state(configState.data?.power?.sleep_timeout_s ?? 300);
  $effect(() => {
    sleepTimeout = configState.data?.power?.sleep_timeout_s ?? 300;
  });
  $effect(() => {
    if (sleepTimeout !== (configState.data?.power?.sleep_timeout_s ?? 300))
      updateConfig('power.sleep_timeout_s', sleepTimeout);
  });

  let batteryCritical = $state(configState.data?.power?.battery_critical_pct ?? 10);
  $effect(() => {
    batteryCritical = configState.data?.power?.battery_critical_pct ?? 10;
  });
  $effect(() => {
    if (batteryCritical !== (configState.data?.power?.battery_critical_pct ?? 10))
      updateConfig('power.battery_critical_pct', batteryCritical);
  });

  let extLedCount = $state(configState.data?.led_extension?.count ?? 1);
  $effect(() => {
    extLedCount = configState.data?.led_extension?.count ?? 1;
  });
  $effect(() => {
    if (extLedCount !== (configState.data?.led_extension?.count ?? 1)) updateConfig('led_extension.count', extLedCount);
  });

  // ── ColorPicker state (extension LED) ────────────────────────
  let extLedPickerColor = $state(
    rgbToHex(
      configState.data?.led_extension?.r ?? 255,
      configState.data?.led_extension?.g ?? 255,
      configState.data?.led_extension?.b ?? 255,
    ).toUpperCase(),
  );
  $effect(() => {
    const normalized = rgbToHex(
      configState.data?.led_extension?.r ?? 255,
      configState.data?.led_extension?.g ?? 255,
      configState.data?.led_extension?.b ?? 255,
    ).toUpperCase();
    if (extLedPickerColor !== normalized) extLedPickerColor = normalized;
  });

  // ── Backup global ─────────────────────────────────────────────
  let backupFileInput = $state<HTMLInputElement | null>(null);

  function onBackupImportClick() {
    backupFileInput?.click();
  }

  async function onBackupFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      await importConfig(file);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[backup-import]', msg);
      toast.error('Import échoué', { description: msg });
    }
    if (backupFileInput) backupFileInput.value = '';
  }

  function rgbToHex(r: number, g: number, b: number) {
    return '#' + [r, g, b].map((v) => v?.toString(16).padStart(2, '0') ?? '00').join('');
  }

  // ── Widget system ─────────────────────────────────────────────
  // L'édition des widgets OLED (grille mosaïque 4×4) vit dans ScreenEditor.
  function syncClock() {
    setTime(Math.floor(Date.now() / 1000));
  }
</script>

{#if !configState.data}
  <NotConnected />
{:else}
  {@const data = configState.data!}
  <div class="flex flex-col flex-1 w-full max-w-md min-h-0 gap-0 mx-auto">
    <div bind:this={tabWrapperEl} class="shrink-0 [--scroll-shadow-color:var(--card)]">
      <UnderlineTabs.Root bind:value={tabValue} onValueChange={scrollToSection} class="gap-0">
        <UnderlineTabs.List bind:ref={tabListEl}>
          {#each TABS as tab (tab.value)}
            <UnderlineTabs.Trigger value={tab.value}>
              {tab.label}
            </UnderlineTabs.Trigger>
          {/each}
        </UnderlineTabs.List>
      </UnderlineTabs.Root>
    </div>

    <div bind:this={listEl} class="flex-1 min-h-0 pr-1 overflow-y-auto">
      <div class="flex flex-col gap-8 m-[1px] pt-4">
        <!-- ══ Stats ════════════════════════════════════════════════ -->
        <section bind:this={sectionEls['stats']} data-cat="stats">
          <StatsTile />
        </section>

        <!-- ══ BLE ══════════════════════════════════════════════════ -->
        <section bind:this={sectionEls['bluetooth']} data-cat="bluetooth">
          <h3 class="mb-4 text-base font-semibold">Bluetooth</h3>
          <div class="flex flex-col max-w-md gap-4">
            <Card>
              <CardHeader>
                <CardTitle class="text-sm font-semibold tracking-widest uppercase text-muted-foreground">
                  Appareil
                </CardTitle>
              </CardHeader>
              <CardContent class="pt-0">
                <Field>
                  <FieldLabel>Nom diffusé en Bluetooth</FieldLabel>
                  <Input
                    value={data.ble?.device_name}
                    oninput={(e: Event) => updateConfig('ble.device_name', (e.target as HTMLInputElement).value)}
                    maxlength={31}
                  />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle class="text-sm font-semibold tracking-widest uppercase text-muted-foreground"
                  >Slots de connexion</CardTitle
                >
              </CardHeader>
              <CardContent class="flex flex-col gap-4 pt-0">
                {#each [0, 1] as slotIdx}
                  <Field>
                    <FieldLabel class="flex items-center gap-2">
                      <Badge variant={slotIdx === 0 ? 'default' : 'secondary'}>Slot {slotIdx}</Badge>
                      <span class="text-xs font-normal text-muted-foreground">
                        {slotIdx === 0 ? 'Premier appareil' : 'Second appareil'}
                      </span>
                    </FieldLabel>
                    <Input
                      value={data.ble?.slot_names?.[slotIdx]}
                      oninput={(e: Event) =>
                        updateConfig(`ble.slot_names.${slotIdx}`, (e.target as HTMLInputElement).value)}
                    />
                  </Field>
                {/each}

                <p class="p-3 text-xs leading-relaxed rounded-md text-muted-foreground bg-muted/50">
                  <strong>Comment switcher ?</strong><br />
                  • <strong>SW11</strong> (court appui) = changer d'appareil actif<br />
                  • <strong>SW16 + SW17 maintenus 2s</strong> = mode pairing pour le slot actif
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <!-- ══ Écran & Power ════════════════════════════════════════ -->
        <section bind:this={sectionEls['ecran']} data-cat="ecran" class="">
          <h3 class="mb-4 text-base font-semibold">Écran & Power</h3>
          <div class="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-1">
            <!-- Écran SSD1315 -->
            <Card class="">
              <CardHeader>
                <CardTitle class="text-sm font-semibold tracking-widest uppercase text-muted-foreground">
                  Écran SSD1315
                </CardTitle>
              </CardHeader>
              <CardContent class="pt-0">
                <div class="flex flex-col gap-1.5">
                  <Label class="block mb-1.5 text-sm">Luminosité</Label>
                  <Scrubber
                    bind:value={brightness}
                    min={10}
                    max={255}
                    step={24.5}
                    tickStep={1}
                    percentage
                    decimals={0}
                    onCommit={() => updateConfig('led_key.brightness', brightness)}
                  />
                </div>

                <SettingsField
                  label="Extinction après (s)"
                  description="Durée d'inactivité avant extinction de l'écran"
                >
                  {#snippet children()}
                    <NumberField.Root min={5} max={600} bind:value={displayTimeout}>
                      <NumberField.Group>
                        <NumberField.Decrement />
                        <NumberField.Input class="w-20" />
                        <NumberField.Increment />
                      </NumberField.Group>
                    </NumberField.Root>
                  {/snippet}
                </SettingsField>
              </CardContent>
            </Card>

            <!-- Power Management -->
            <Card>
              <CardHeader>
                <CardTitle class="text-sm font-semibold tracking-widest uppercase text-muted-foreground"
                  >Power Management</CardTitle
                >
              </CardHeader>
              <CardContent class="pt-0">
                <SettingsField label="Deep sleep après" description="Secondes d'inactivité avant veille profonde">
                  {#snippet children()}
                    <NumberField.Root min={30} max={3600} bind:value={sleepTimeout}>
                      <NumberField.Group>
                        <NumberField.Decrement />
                        <NumberField.Input class="w-20" />
                        <NumberField.Increment />
                      </NumberField.Group>
                    </NumberField.Root>
                  {/snippet}
                </SettingsField>

                <SettingsField label="Batterie critique" description="Pourcentage déclenchant l'alerte">
                  {#snippet children()}
                    <NumberField.Root min={3} max={30} bind:value={batteryCritical}>
                      <NumberField.Group>
                        <NumberField.Decrement />
                        <NumberField.Input class="w-20" />
                        <NumberField.Increment />
                      </NumberField.Group>
                    </NumberField.Root>
                  {/snippet}
                </SettingsField>

                <div class="mt-4">
                  <Label class="block mb-2 text-sm">Présence de la batterie</Label>
                  <p class="mb-2 text-xs leading-relaxed text-muted-foreground">
                    Le SpinPad existe en variantes avec et sans batterie. <strong>Auto</strong>
                    laisse le firmware détecter via l'ADC.
                    <strong>Forcer présente / absente</strong>
                    désactive la détection.
                  </p>
                  <OptionGrid
                    options={[
                      { value: 'auto', label: 'Auto' },
                      { value: 'yes', label: 'Forcer présente' },
                      { value: 'no', label: 'Forcer absente' },
                    ]}
                    value={data.power?.battery_present ?? 'auto'}
                    onSelect={(v) => updateConfig('power.battery_present', v)}
                    emphasizeSelected
                  >
                    {#snippet item(o)}{o.label}{/snippet}
                  </OptionGrid>
                </div>
              </CardContent>
            </Card>

            <!-- Orientation -->
            <Card>
              <CardHeader>
                <CardTitle class="text-sm font-semibold tracking-widest uppercase text-muted-foreground"
                  >Orientation</CardTitle
                >
              </CardHeader>
              <CardContent class="pt-0">
                <p class="mb-4 text-sm text-muted-foreground">
                  Orientation physique du SpinPad. L'écran OLED et l'éditeur keymap se réajustent automatiquement.
                </p>
                <OptionGrid
                  options={ORIENTATIONS}
                  value={data.orientation}
                  onSelect={(v) => updateConfig('orientation', v)}
                  gridClass="grid grid-cols-4 gap-2"
                  buttonClass="flex flex-col items-center justify-center gap-1 py-3 text-sm"
                  emphasizeSelected
                >
                  {#snippet item(o)}
                    <span class="text-lg leading-none">{o.icon}</span>
                    <span>{o.label}</span>
                  {/snippet}
                </OptionGrid>
                <p class="mt-3 text-xs text-muted-foreground">
                  Astuce : la touche <Kbd>Rotate CW/CCW</Kbd>
                  dans le keymap change l'orientation directement depuis le SpinPad.
                </p>
              </CardContent>
            </Card>

            <!-- Encodeur -->
            <Card>
              <CardHeader>
                <CardTitle class="text-sm font-semibold tracking-widest uppercase text-muted-foreground"
                  >Encodeur rotatif</CardTitle
                >
              </CardHeader>
              <CardContent class="pt-0">
                <div class="mb-2">
                  <SliderField
                    label="Sensibilité"
                    min={1}
                    max={4}
                    step={1}
                    bind:value={encoderSens}
                    valueText={SENS_LABELS[encoderSens] ?? '—'}
                    valueClass="font-mono text-muted-foreground"
                    minLabel="1 clic / détent"
                    maxLabel="4 clics / détent"
                    onCommit={() => updateConfig('encoder.sensitivity', encoderSens)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        <!-- ══ Extension LED ════════════════════════════════════════ -->

        <!-- ══ Sauvegarde globale ════════════════════════════════ -->
        <section bind:this={sectionEls['sauvegarde']} data-cat="sauvegarde" class="flex flex-col gap-3">
          <h2 class="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Sauvegarde</h2>
          <Card>
            <CardHeader>
              <CardTitle>Config complète</CardTitle>
            </CardHeader>
            <CardContent class="flex flex-col gap-3">
              <p class="text-xs text-muted-foreground">
                Exporte ou importe la configuration entière (.spinpad). L'import écrase la config actuelle.
              </p>
              <div class="flex gap-2">
                <Button variant="outline" onclick={onBackupImportClick} disabled={!configState.data} class="gap-1.5">
                  <Upload class="size-4" /> Importer
                </Button>
                <Button variant="outline" onclick={exportConfig} disabled={!configState.data} class="gap-1.5">
                  <Download class="size-4" /> Exporter
                </Button>
                <input
                  bind:this={backupFileInput}
                  type="file"
                  accept=".spinpad,.json"
                  class="hidden"
                  onchange={onBackupFileSelected}
                />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  </div>
{/if}
