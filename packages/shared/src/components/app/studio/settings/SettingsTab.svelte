<script lang="ts">
  import { configState, updateConfig, exportConfig, importConfig } from '$shared/store/config.svelte.js';
  import { Download, Upload } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';
  import { serial, setTime } from '$shared/store/serial.svelte.js';
  import { Card, CardContent, CardHeader, CardTitle } from '$shared/components/ui/card/index.js';
  import { Input } from '$shared/components/ui/input/index.js';
  import { Switch } from '$shared/components/ui/switch/index.js';
  import { Label } from '$shared/components/ui/label/index.js';
  import { Badge } from '$shared/components/ui/badge/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import * as Select from '$shared/components/ui/select/index.js';
  import { Kbd } from '$shared/components/ui/kbd/index.js';
  import { Field, FieldLabel } from '$shared/components/ui/field/index.js';
  import SettingsField from '$shared/components/app/SettingsField.svelte';
  import NotConnected from '$shared/components/app/NotConnected.svelte';
  import OptionGrid from '$shared/components/app/OptionGrid.svelte';
  import SliderField from '$shared/components/app/SliderField.svelte';
  import AddButton from '$shared/components/app/AddButton.svelte';
  import { WIDGET_TYPE, WIDGET_LABELS, DISPLAY_MAX_WIDGETS, defaultWidgets } from '$shared/constants/config-schema.js';
  import type { WidgetConfig, WidgetType } from '$shared/constants/config-schema.js';

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

  // ── Conditions dérivées ───────────────────────────────────────
  // $derived garantit la réactivité sans boucle d'effet.
  const ledExtEnabled = $derived(configState.data?.led_extension?.enabled ?? false);
  const ledExtMode = $derived(configState.data?.led_extension?.mode ?? 0);

  // ── LED extension modes ───────────────────────────────────────
  const EXT_MODES = [
    { value: 0, label: 'Off', desc: 'LEDs éteintes' },
    { value: 1, label: 'Mirror', desc: 'Copie les couleurs des touches' },
    { value: 2, label: 'Ambient', desc: 'Respiration douce' },
    { value: 3, label: 'Static', desc: 'Couleur fixe' },
    { value: 4, label: 'Reactive', desc: 'Flash sur chaque touche pressée' },
    { value: 5, label: 'Hyperion', desc: 'Frame RGB via bridge Hyperion' },
  ];

  // ── Helpers couleur ───────────────────────────────────────────
  function hexToRgb(hex: string) {
    const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
  }

  function rgbToHex(r: number, g: number, b: number) {
    return '#' + [r, g, b].map((v) => v?.toString(16).padStart(2, '0') ?? '00').join('');
  }

  // ── Widget system ─────────────────────────────────────────────
  const WIDGET_TYPE_OPTIONS = Object.entries(WIDGET_LABELS)
    .filter(([k]) => Number(k) !== WIDGET_TYPE.NONE)
    .map(([k, label]) => ({ value: Number(k) as WidgetType, label }));

  // Reactive alias so widgets array is always fresh from the store
  const widgets = $derived<WidgetConfig[]>((configState.data?.display?.widgets ?? defaultWidgets()) as WidgetConfig[]);

  function updateWidget(idx: number, patch: Partial<WidgetConfig>) {
    const updated = widgets.map((w, i) => (i === idx ? { ...w, ...patch } : w));
    updateConfig('display.widgets', updated);
  }

  function addWidget() {
    if (widgets.length >= DISPLAY_MAX_WIDGETS) return;
    const updated = [
      ...widgets,
      {
        type: WIDGET_TYPE.CUSTOM_TEXT as WidgetType,
        enabled: true,
        row: widgets.length,
        col: 0,
        custom_text: 'Hello',
      },
    ];
    updateConfig('display.widgets', updated);
  }

  function removeWidget(idx: number) {
    const updated = widgets.filter((_, i) => i !== idx);
    updateConfig('display.widgets', updated);
  }

  // SVG preview helpers — 72×40 logical px, displayed at 3× scale
  const SVG_SCALE = 3;
  const SVG_W = 72 * SVG_SCALE;
  const SVG_H = 40 * SVG_SCALE;

  function widgetLabel(w: WidgetConfig): string {
    if (w.type === WIDGET_TYPE.CUSTOM_TEXT) return w.custom_text?.slice(0, 12) || '…';
    return WIDGET_LABELS[w.type] ?? '?';
  }

  // Approximate pixel width of label in the font (5px/char + 1px space = 6px)
  function widgetPreviewWidth(w: WidgetConfig): number {
    const chars = Math.min(widgetLabel(w).length, 12);
    const iconPx = w.type === WIDGET_TYPE.BLE_STATUS || w.type === WIDGET_TYPE.BATTERY ? 10 : 0;
    return (iconPx + chars * 6) * SVG_SCALE;
  }

  function syncClock() {
    setTime(Math.floor(Date.now() / 1000));
  }
</script>

{#if !configState.data}
  <NotConnected />
{:else}
  {@const data = configState.data!}
  <div class="flex flex-col gap-8">
    <!-- ══ BLE ══════════════════════════════════════════════════ -->
    <section>
      <h3 class="mb-4 text-base font-semibold">Bluetooth</h3>
      <div class="flex flex-col max-w-md gap-4">
        <Card>
          <CardHeader>
            <CardTitle class="text-sm font-semibold tracking-widest uppercase text-muted-foreground">Appareil</CardTitle
            >
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
    <section class="">
      <h3 class="mb-4 text-base font-semibold">Écran & Power</h3>
      <div class="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-1">
        <!-- Écran SSD1315 -->
        <Card class="">
          <CardHeader>
            <CardTitle class="text-sm font-semibold tracking-widest uppercase text-muted-foreground"
              >Écran SSD1315</CardTitle
            >
          </CardHeader>
          <CardContent class="pt-0">
            <div class="mb-5">
              <SliderField
                label="Luminosité"
                min={10}
                max={255}
                bind:value={brightness}
                onCommit={() => updateConfig('display.brightness', brightness)}
              />
            </div>

            <SettingsField label="Extinction après (s)" description="Durée d'inactivité avant extinction de l'écran">
              {#snippet children()}
                <Input
                  type="number"
                  min={5}
                  max={600}
                  class="w-20 text-right"
                  value={data.display?.timeout_s}
                  onchange={(e: Event) => updateConfig('display.timeout_s', +(e.target as HTMLInputElement).value)}
                />
              {/snippet}
            </SettingsField>

            <!-- Widget editor -->
            <div class="mt-4">
              <div class="flex items-center justify-between mb-3">
                <Label class="text-sm font-medium">Widgets OLED</Label>
                <AddButton
                  onclick={addWidget}
                  disabled={widgets.length >= DISPLAY_MAX_WIDGETS}
                  class="text-muted-foreground hover:text-foreground"
                >
                  + Ajouter
                </AddButton>
              </div>

              <!-- SVG preview: 72×40 scaled 3× -->
              <div class="flex justify-center mb-3">
                <div class="inline-block p-1 bg-black border rounded border-border">
                  <svg
                    width={SVG_W}
                    height={SVG_H}
                    viewBox="0 0 {SVG_W} {SVG_H}"
                    class="block"
                    style="image-rendering:pixelated"
                  >
                    {#each widgets as w, i}
                      {#if w.enabled && w.type !== 0}
                        {@const wx = w.col * 6 * SVG_SCALE}
                        {@const wy = w.row * 8 * SVG_SCALE}
                        {@const ww = widgetPreviewWidth(w)}
                        {@const wh = 7 * SVG_SCALE}
                        <rect x={wx} y={wy + SVG_SCALE} width={ww} height={wh} fill="rgba(255,255,255,0.15)" rx="1" />
                        <text x={wx + 2} y={wy + wh - 1} fill="#fff" font-size="7" font-family="monospace"
                          >{widgetLabel(w)}</text
                        >
                      {/if}
                    {/each}
                  </svg>
                </div>
              </div>

              <!-- Widget list -->
              <div class="flex flex-col gap-2">
                {#each widgets as w, i}
                  <div class="flex flex-col gap-2 p-2 text-sm border rounded-lg border-border">
                    <div class="flex items-center gap-2">
                      <Switch checked={w.enabled} onCheckedChange={(v: boolean) => updateWidget(i, { enabled: v })} />
                      <Select.Root
                        type="single"
                        value={String(w.type)}
                        onValueChange={(v) => {
                          if (v !== undefined) updateWidget(i, { type: +v as WidgetType });
                        }}
                      >
                        <Select.Trigger class="flex-1 h-8 text-sm">
                          {WIDGET_LABELS[w.type] ?? 'Type'}
                        </Select.Trigger>
                        <Select.Content>
                          {#each WIDGET_TYPE_OPTIONS as opt}
                            <Select.Item value={String(opt.value)}>{opt.label}</Select.Item>
                          {/each}
                        </Select.Content>
                      </Select.Root>
                      <span class="text-xs text-muted-foreground">R{w.row} C{w.col}</span>
                      <button
                        type="button"
                        class="ml-auto text-xs transition-colors text-muted-foreground hover:text-destructive"
                        onclick={() => removeWidget(i)}>✕</button
                      >
                    </div>
                    <div class="flex items-center gap-2">
                      <Label class="w-8 text-xs text-muted-foreground">Ligne</Label>
                      <Input
                        type="number"
                        min={0}
                        max={4}
                        class="text-xs text-right w-14 h-7"
                        value={w.row}
                        onchange={(e: Event) =>
                          updateWidget(i, {
                            row: Math.min(4, Math.max(0, +(e.target as HTMLInputElement).value)),
                          })}
                      />
                      <Label class="w-8 text-xs text-muted-foreground">Col</Label>
                      <Input
                        type="number"
                        min={0}
                        max={11}
                        class="text-xs text-right w-14 h-7"
                        value={w.col}
                        onchange={(e: Event) =>
                          updateWidget(i, {
                            col: Math.min(11, Math.max(0, +(e.target as HTMLInputElement).value)),
                          })}
                      />
                      {#if w.type === WIDGET_TYPE.CUSTOM_TEXT}
                        <Input
                          type="text"
                          maxlength={12}
                          placeholder="Texte (12 max)"
                          class="flex-1 text-xs h-7"
                          value={w.custom_text ?? ''}
                          oninput={(e: Event) =>
                            updateWidget(i, {
                              custom_text: (e.target as HTMLInputElement).value.slice(0, 12),
                            })}
                        />
                      {/if}
                      {#if w.type === WIDGET_TYPE.CLOCK}
                        <button
                          type="button"
                          class="text-xs px-2 py-0.5 rounded border border-border hover:bg-accent transition-colors"
                          onclick={syncClock}
                          disabled={!serial.connected}>Sync heure</button
                        >
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
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
                <Input
                  type="number"
                  min={30}
                  max={3600}
                  class="w-20 text-right"
                  value={data.power?.sleep_timeout_s}
                  onchange={(e: Event) => updateConfig('power.sleep_timeout_s', +(e.target as HTMLInputElement).value)}
                />
              {/snippet}
            </SettingsField>

            <SettingsField label="Batterie critique" description="Pourcentage déclenchant l'alerte">
              {#snippet children()}
                <Input
                  type="number"
                  min={3}
                  max={30}
                  class="w-20 text-right"
                  value={data.power?.battery_critical_pct}
                  onchange={(e: Event) =>
                    updateConfig('power.battery_critical_pct', +(e.target as HTMLInputElement).value)}
                />
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
    <section>
      <h3 class="mb-4 text-base font-semibold">Extension LED</h3>
      <div class="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle class="text-sm font-semibold tracking-widest uppercase text-muted-foreground"
              >LEDs supplémentaires</CardTitle
            >
          </CardHeader>
          <CardContent class="pt-0">
            <p class="mb-4 text-sm text-muted-foreground">
              Le connecteur d'extension sur le PCB permet de brancher jusqu'à 50 LEDs WS2812 supplémentaires (ruban,
              ambilight…).
            </p>

            <SettingsField
              label="Activer l'extension"
              description="Active les LEDs branchées sur le connecteur d'extension"
            >
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
                    type="number"
                    min={1}
                    max={50}
                    class="w-20 text-right"
                    value={data.led_extension?.count}
                    onchange={(e: Event) =>
                      updateConfig(
                        'led_extension.count',
                        Math.min(50, Math.max(1, +(e.target as HTMLInputElement).value)),
                      )}
                  />
                {/snippet}
              </SettingsField>

              <!-- Mode -->
              <div class="mt-4 mb-4">
                <Label class="block mb-3 text-sm">Mode d'éclairage</Label>
                <OptionGrid
                  options={EXT_MODES}
                  value={ledExtMode}
                  onSelect={(v) => updateConfig('led_extension.mode', v)}
                  gridClass="grid grid-cols-2 gap-2 sm:grid-cols-3"
                  buttonClass="flex flex-col gap-0.5 px-3 py-2.5 text-left"
                >
                  {#snippet item(m)}
                    <span class="text-sm font-medium">{m.label}</span>
                    <span class="text-xs leading-snug text-muted-foreground">{m.desc}</span>
                  {/snippet}
                </OptionGrid>
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
                        data.led_extension?.r ?? 255,
                        data.led_extension?.g ?? 255,
                        data.led_extension?.b ?? 255,
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
                <SliderField
                  label="Luminosité"
                  min={0}
                  max={255}
                  bind:value={ledExtBright}
                  onCommit={() => updateConfig('led_extension.brightness', ledExtBright)}
                />
              </div>
            {/if}
          </CardContent>
        </Card>
      </div>
    </section>

    <!-- ══ Sauvegarde globale ════════════════════════════════ -->
    <section class="flex flex-col gap-3">
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
            <Button
              variant="outline"
              onclick={onBackupImportClick}
              disabled={!configState.data}
              class="gap-1.5"
            >
              <Upload class="size-4" /> Importer
            </Button>
            <Button
              variant="outline"
              onclick={exportConfig}
              disabled={!configState.data}
              class="gap-1.5"
            >
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
{/if}
