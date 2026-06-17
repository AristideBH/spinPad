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
  import SettingsField from './SettingsField.svelte';
  import NotConnected from './NotConnected.svelte';
  import OptionGrid from './OptionGrid.svelte';
  import SliderField from './SliderField.svelte';
  import * as UnderlineTabs from '$shared/components/ui/underline-tabs';
  import StatsTile from '$shared/components/app/studio/dashboard/tile-stats.svelte';
  import { Scrubber } from '$shared/components/ui/scrubber';
  import { rgbToHex } from '$shared/lib/color.js';
  import { SyncedHexColor } from '$shared/lib/hooks/synced-hex-color.svelte.js';
  import { ScrollSyncedTabs } from '$shared/lib/hooks/scroll-synced-tabs.svelte.js';

  // ── Tabs ──────────────────────────────────────────────────────
  const TABS = [
    { value: 'stats', label: 'Stats' },
    { value: 'bluetooth', label: 'Bluetooth' },
    { value: 'ecran', label: 'Screen & Power' },
    { value: 'sauvegarde', label: 'Backup' },
  ];

  const tabs = new ScrollSyncedTabs(TABS[0].value);
  tabs.bind(() => TABS.map((t) => t.value));

  // ── Orientation ───────────────────────────────────────────────
  const ORIENTATIONS = [
    { value: 0, label: '0°', icon: '↑' },
    { value: 1, label: '90°', icon: '→' },
    { value: 2, label: '180°', icon: '↓' },
    { value: 3, label: '270°', icon: '←' },
  ];

  // ── Local sliders (bits-ui Slider requires bind:value) ────────
  // STORE → LOCAL sync is done via $effect (e.g. undo/redo, reload).
  // LOCAL → STORE sync is done via onValueChange on the Slider (never via $effect,
  // to avoid a loop that would overwrite the result of an undo/redo).
  let brightness = $state(0);
  let encoderSens = $state(1);
  let ledExtBright = $state(200);

  // Sync store → local (triggered by undo/redo, config load, etc.)
  $effect(() => {
    brightness = configState.data?.display?.brightness ?? 180;
  });
  $effect(() => {
    encoderSens = configState.data?.encoder?.sensitivity ?? 1;
  });
  $effect(() => {
    ledExtBright = configState.data?.led_extension?.brightness ?? 200;
  });

  const SENS_LABELS = ['', '1× (standard)', '2× (reactive)', '3×', '4× (max)'] as const;

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
  const extLedPickerColor = new SyncedHexColor(() =>
    rgbToHex(
      configState.data?.led_extension?.r ?? 255,
      configState.data?.led_extension?.g ?? 255,
      configState.data?.led_extension?.b ?? 255,
    ),
  );
  extLedPickerColor.bind();

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
      toast.error('Import failed', { description: msg });
    }
    if (backupFileInput) backupFileInput.value = '';
  }

  // ── Widget system ─────────────────────────────────────────────
  // Editing the OLED widgets (4×4 mosaic grid) lives in ScreenEditor.
  function syncClock() {
    setTime(Math.floor(Date.now() / 1000));
  }
</script>

{#if !configState.data}
  <NotConnected />
{:else}
  {@const data = configState.data!}
  <div class="flex flex-col flex-1 w-full max-w-md min-h-0 gap-0 mx-auto">
    <div bind:this={tabs.tabWrapperEl} class="shrink-0 [--scroll-shadow-color:var(--card)]">
      <UnderlineTabs.Root bind:value={tabs.value} onValueChange={tabs.scrollToSection} class="gap-0">
        <UnderlineTabs.List bind:ref={tabs.tabListEl}>
          {#each TABS as tab (tab.value)}
            <UnderlineTabs.Trigger value={tab.value}>
              {tab.label}
            </UnderlineTabs.Trigger>
          {/each}
        </UnderlineTabs.List>
      </UnderlineTabs.Root>
    </div>

    <div bind:this={tabs.listEl} class="flex-1 min-h-0 pr-1 overflow-y-auto">
      <div class="flex flex-col gap-8 m-[1px] pt-4">
        <!-- ══ Stats ════════════════════════════════════════════════ -->
        <section bind:this={tabs.sectionEls['stats']} data-cat="stats">
          <StatsTile />
        </section>

        <!-- ══ BLE ══════════════════════════════════════════════════ -->
        <section bind:this={tabs.sectionEls['bluetooth']} data-cat="bluetooth">
          <h3 class="mb-4 text-base font-semibold">Bluetooth</h3>
          <div class="flex flex-col max-w-md gap-4">
            <Card>
              <CardHeader>
                <CardTitle class="text-sm font-semibold tracking-widest uppercase text-muted-foreground">
                  Device
                </CardTitle>
              </CardHeader>
              <CardContent class="pt-0">
                <Field>
                  <FieldLabel>Name broadcast over Bluetooth</FieldLabel>
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
                  >Connection slots</CardTitle
                >
              </CardHeader>
              <CardContent class="flex flex-col gap-4 pt-0">
                {#each [0, 1] as slotIdx}
                  <Field>
                    <FieldLabel class="flex items-center gap-2">
                      <Badge variant={slotIdx === 0 ? 'default' : 'secondary'}>Slot {slotIdx}</Badge>
                      <span class="text-xs font-normal text-muted-foreground">
                        {slotIdx === 0 ? 'First device' : 'Second device'}
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
                  <strong>How to switch?</strong><br />
                  • <strong>SW11</strong> (short press) = change active device<br />
                  • <strong>SW16 + SW17 held 2s</strong> = pairing mode for the active slot
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <!-- ══ Screen & Power ═══════════════════════════════════════ -->
        <section bind:this={tabs.sectionEls['ecran']} data-cat="ecran" class="">
          <h3 class="mb-4 text-base font-semibold">Screen & Power</h3>
          <div class="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-1">
            <!-- SSD1315 screen -->
            <Card class="">
              <CardHeader>
                <CardTitle class="text-sm font-semibold tracking-widest uppercase text-muted-foreground">
                  SSD1315 screen
                </CardTitle>
              </CardHeader>
              <CardContent class="pt-0">
                <div class="flex flex-col gap-1.5">
                  <Label class="block mb-1.5 text-sm">Brightness</Label>
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
                  label="Turn off after (s)"
                  description="Inactivity duration before the screen turns off"
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
                <SettingsField label="Deep sleep after" description="Seconds of inactivity before deep sleep">
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

                <SettingsField label="Critical battery" description="Percentage that triggers the alert">
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
                  <Label class="block mb-2 text-sm">Battery presence</Label>
                  <p class="mb-2 text-xs leading-relaxed text-muted-foreground">
                    The SpinPad comes in variants with and without a battery. <strong>Auto</strong>
                    lets the firmware detect via the ADC.
                    <strong>Force present / absent</strong>
                    disables detection.
                  </p>
                  <OptionGrid
                    options={[
                      { value: 'auto', label: 'Auto' },
                      { value: 'yes', label: 'Force present' },
                      { value: 'no', label: 'Force absent' },
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
                  Physical orientation of the SpinPad. The OLED screen and the keymap editor readjust automatically.
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
                  Tip: the <Kbd>Rotate CW/CCW</Kbd>
                  key in the keymap changes the orientation directly from the SpinPad.
                </p>
              </CardContent>
            </Card>

            <!-- Encodeur -->
            <Card>
              <CardHeader>
                <CardTitle class="text-sm font-semibold tracking-widest uppercase text-muted-foreground"
                  >Rotary encoder</CardTitle
                >
              </CardHeader>
              <CardContent class="pt-0">
                <div class="mb-2">
                  <SliderField
                    label="Sensitivity"
                    min={1}
                    max={4}
                    step={1}
                    bind:value={encoderSens}
                    valueText={SENS_LABELS[encoderSens] ?? '—'}
                    valueClass="font-mono text-muted-foreground"
                    minLabel="1 click / detent"
                    maxLabel="4 clicks / detent"
                    onCommit={() => updateConfig('encoder.sensitivity', encoderSens)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        <!-- ══ LED Extension ════════════════════════════════════════ -->

        <!-- ══ Global backup ═════════════════════════════════════ -->
        <section bind:this={tabs.sectionEls['sauvegarde']} data-cat="sauvegarde" class="flex flex-col gap-3">
          <h2 class="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Backup</h2>
          <Card>
            <CardHeader>
              <CardTitle>Full config</CardTitle>
            </CardHeader>
            <CardContent class="flex flex-col gap-3">
              <p class="text-xs text-muted-foreground">
                Export or import the entire configuration (.spinpad). Importing overwrites the current config.
              </p>
              <div class="flex gap-2">
                <Button variant="outline" onclick={onBackupImportClick} disabled={!configState.data} class="gap-1.5">
                  <Upload class="size-4" /> Import
                </Button>
                <Button variant="outline" onclick={exportConfig} disabled={!configState.data} class="gap-1.5">
                  <Download class="size-4" /> Export
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
