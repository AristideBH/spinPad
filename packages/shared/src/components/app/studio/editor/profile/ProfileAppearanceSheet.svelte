<script lang="ts">
  // ───────────────────────────────────────────────────────────────
  //  ProfileAppearanceSheet — a profile's icon + LED (responsive sheet)
  //
  //  Brings together the icon editor and the LED settings (color/effect) of a
  //  profile in a single sheet (desktop) / drawer (mobile).
  // ───────────────────────────────────────────────────────────────
  import ResponsiveSheet from '$shared/components/ui/responsive-sheet/responsive-sheet.svelte';
  import { configState, setProfileIcon, setProfileLed } from '$shared/store/config.svelte.js';
  import * as ColorPicker from '$shared/components/ui/color-picker/index.js';
  import * as Popover from '$shared/components/ui/popover/index.js';
  import * as Select from '$shared/components/ui/select/index.js';
  import IconEditor from '../../IconEditor.svelte';
  import type { LedModeProfile } from '$shared/constants/config-schema.js';
  import { hexToRgb, rgbToHex } from '$shared/lib/color.js';
  import { SyncedHexColor } from '$shared/lib/hooks/synced-hex-color.svelte.js';

  let { open = $bindable(false), profileIndex }: { open?: boolean; profileIndex: number } = $props();

  const profileList = $derived(configState.data?.profiles ?? []);
  const prof = $derived(profileList[profileIndex]);
  const currentLed = $derived(prof?.led);

  const LED_PROFILE_EFFECTS: { value: LedModeProfile; label: string }[] = [
    { value: 'off', label: 'Off' },
    { value: 'static', label: 'Static' },
    { value: 'breathe', label: 'Breathe' },
    { value: 'pulse', label: 'Pulse' },
  ];

  const INHERIT = '__inherit__';
  const selectedLed = $derived(currentLed ? (currentLed.effect ?? 'static') : INHERIT);
  const selectedLedLabel = $derived(
    selectedLed === INHERIT
      ? 'Inherit global'
      : (LED_PROFILE_EFFECTS.find((o) => o.value === selectedLed)?.label ?? 'Inherit global'),
  );

  function onLedModeChange(value: string) {
    if (value === INHERIT) {
      setProfileLed(profileIndex, undefined);
    } else if (value === 'off') {
      setProfileLed(profileIndex, { r: 0, g: 0, b: 0, effect: 'off' });
    } else {
      setProfileLed(profileIndex, {
        r: currentLed?.r ?? 255,
        g: currentLed?.g ?? 255,
        b: currentLed?.b ?? 255,
        effect: value as LedModeProfile,
      });
    }
  }

  const profilePickerColor = new SyncedHexColor(() =>
    currentLed ? rgbToHex(currentLed.r, currentLed.g, currentLed.b) : '#ffffff',
  );
  profilePickerColor.bind();
</script>

<ResponsiveSheet
  bind:open
  title="Appearance — {prof?.name ?? `Profile ${profileIndex + 1}`}"
  description="Icon and LED color of this profile."
  desktop="dialog"
  desktopClass="sm:max-w-fit max-h-[90dvh] flex flex-col p-0 gap-0"
>
  {#snippet header()}
    <div class="px-4 py-3 border-b">
      <span class="text-sm font-medium">Appearance — {prof?.name ?? `Profile ${profileIndex + 1}`}</span>
    </div>
  {/snippet}

  {#if prof}
    <div class="flex flex-col gap-6 p-4 overflow-y-auto">
      <section class="flex flex-col gap-2">
        <h3 class="text-xs font-medium tracking-wide uppercase text-muted-foreground">Icon</h3>
        <IconEditor value={prof.icon ?? ''} onchange={(b64) => setProfileIcon(profileIndex, b64)} />
      </section>

      <section class="flex flex-col gap-3">
        <h3 class="text-xs font-medium tracking-wide uppercase text-muted-foreground">LED</h3>
        <p class="text-xs text-muted-foreground">LED color and effect for this profile. Inherits from global if absent.</p>
        <div class="flex items-center gap-3">
          <span class="text-sm">Mode</span>
          <Select.Root type="single" name="led-mode" value={selectedLed} onValueChange={onLedModeChange}>
            <Select.Trigger class="w-[180px]">
              {selectedLedLabel}
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                <Select.Label>Mode LED</Select.Label>
                {#each LED_PROFILE_EFFECTS as opt (opt.value)}
                  <Select.Item value={opt.value} label={opt.label}>{opt.label}</Select.Item>
                {/each}
                <Select.Item value={INHERIT} label="Inherit global">Inherit global</Select.Item>
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </div>

        {#if currentLed && currentLed.effect !== 'off'}
          <div class="flex items-center gap-3">
            <span class="text-sm">Color</span>
            <Popover.Root>
              <Popover.Trigger>
                {#snippet child({ props })}
                  <button
                    {...props}
                    class="w-8 h-8 border rounded-full shadow-sm cursor-pointer border-border"
                    style="background-color: {profilePickerColor.value}"
                    aria-label="Choose the LED color"
                  ></button>
                {/snippet}
              </Popover.Trigger>
              <Popover.Content class="w-auto p-0!">
                <ColorPicker.Root
                  formats={['hsl', 'hex']}
                  bind:value={profilePickerColor.value}
                  onchange={(color) => {
                    const rgb = hexToRgb(color);
                    if (rgb) setProfileLed(profileIndex, { ...currentLed, ...rgb });
                  }}
                />
              </Popover.Content>
            </Popover.Root>
          </div>
        {/if}
      </section>
    </div>
  {/if}
</ResponsiveSheet>
