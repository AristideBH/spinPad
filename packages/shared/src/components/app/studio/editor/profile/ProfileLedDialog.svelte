<script lang="ts">
  import { configState, setProfileLed } from '$shared/store/config.svelte.js';
  import * as Dialog from '$shared/components/ui/dialog/index.js';
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import * as ColorPicker from '$shared/components/ui/color-picker/index.js';
  import * as Popover from '$shared/components/ui/popover/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import type { LedModeProfile } from '$shared/constants/config-schema.js';

  let { open = $bindable(false), profileIndex }: { open: boolean; profileIndex: number } = $props();

  const profileList = $derived(configState.data?.profiles ?? []);
  const prof = $derived(profileList[profileIndex]);
  const currentLed = $derived(prof?.led);

  const LED_PROFILE_EFFECTS: { value: LedModeProfile; label: string }[] = [
    { value: 'off', label: 'Éteint' },
    { value: 'static', label: 'Statique' },
    { value: 'breathe', label: 'Respiration' },
    { value: 'pulse', label: 'Pulsation' },
  ];

  function rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  }
  function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const m = hex.match(/^#?([0-9a-f]{6})$/i);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
  }

  const pendingLedColor = $derived(
    currentLed ? rgbToHex(currentLed.r, currentLed.g, currentLed.b) : '#ffffff',
  );
  let profilePickerColor = $state('#ffffff');
  $effect(() => {
    const normalized = pendingLedColor.toUpperCase();
    if (profilePickerColor !== normalized) profilePickerColor = normalized;
  });
</script>

<Dialog.Root {open} onOpenChange={(o) => { if (!o) open = false; }}>
  <Dialog.Content class="sm:max-w-sm">
    <Dialog.Header>
      <Dialog.Title>LED — {prof?.name ?? `Profil ${profileIndex + 1}`}</Dialog.Title>
      <Dialog.Description>Couleur et effet LED pour ce profil. Hérite du global si absent.</Dialog.Description>
    </Dialog.Header>
    {#if prof}
      <div class="flex flex-col gap-4 px-1 pb-2">
        <ButtonGroup.Root>
          {#each LED_PROFILE_EFFECTS as opt (opt.value)}
            {@const active = (currentLed?.effect ?? (currentLed ? 'static' : null)) === opt.value}
            <Button
              variant={active ? 'outline' : 'secondary'}
              onclick={() => {
                if (opt.value === 'off') {
                  setProfileLed(profileIndex, { r: 0, g: 0, b: 0, effect: 'off' });
                } else {
                  setProfileLed(profileIndex, {
                    r: currentLed?.r ?? 255,
                    g: currentLed?.g ?? 255,
                    b: currentLed?.b ?? 255,
                    effect: opt.value,
                  });
                }
              }}
            >
              {opt.label}
            </Button>
          {/each}
          <Button variant="secondary" onclick={() => setProfileLed(profileIndex, undefined)}>
            Hérite global
          </Button>
        </ButtonGroup.Root>

        {#if currentLed && currentLed.effect !== 'off'}
          <div class="flex items-center gap-3">
            <span class="text-sm">Couleur</span>
            <Popover.Root>
              <Popover.Trigger>
                {#snippet child({ props })}
                  <button
                    {...props}
                    class="w-8 h-8 border rounded-full shadow-sm cursor-pointer border-border"
                    style="background-color: {profilePickerColor}"
                  ></button>
                {/snippet}
              </Popover.Trigger>
              <Popover.Content class="w-auto p-0!">
                <ColorPicker.Root
                  formats={['hsl', 'hex']}
                  bind:value={profilePickerColor}
                  onchange={(color) => {
                    const rgb = hexToRgb(color);
                    if (rgb) setProfileLed(profileIndex, { ...currentLed, ...rgb });
                  }}
                />
              </Popover.Content>
            </Popover.Root>
          </div>
        {/if}
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
