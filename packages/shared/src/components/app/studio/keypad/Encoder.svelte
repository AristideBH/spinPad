<script lang="ts">
  import * as ButtonGroup from '$shared/components/ui/button-group/index.js';
  import { Button } from '$shared/components/ui/button/index.js';
  import { action, ACTION_TYPES, MEDIA_CODES } from '$shared/constants/action-types.js';
  import { getKeycodeLabel } from '$shared/constants/keycodes.js';
  import { configState, setEncoderAction } from '$shared/store/config.svelte.js';
  import { ListVideo, SeparatorHorizontal, SeparatorVertical, Volume2, ZoomIn } from '@lucide/svelte';
  import { cn } from '$shared/utils.js';
  import { getKeypadContext } from './keypad-context.svelte.js';

  const ctx = getKeypadContext();

  const ENCODER_PRESETS = [
    {
      label: 'Volume',
      icon: Volume2,
      cw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_VOL_UP),
      ccw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_VOL_DN),
    },
    {
      label: 'Scroll Y',
      icon: SeparatorHorizontal,
      cw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_SCRL_UP),
      ccw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_SCRL_DN),
    },
    {
      label: 'Scroll X',
      icon: SeparatorVertical,
      cw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_SCRL_RIGHT),
      ccw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_SCRL_LEFT),
    },
    {
      label: 'Piste',
      icon: ListVideo,
      cw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_NEXT),
      ccw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_PREV),
    },
    {
      label: 'Zoom',
      icon: ZoomIn,
      cw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_ZOOM_IN),
      ccw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_ZOOM_OUT),
    },
  ];

  function applyEncoderPreset(preset: { cw: number; ccw: number }): void {
    const pi = configState.activeProfileIndex;
    const li = configState.activeLayerIndex;
    setEncoderAction(pi, li, 'cw', preset.cw);
    setEncoderAction(pi, li, 'ccw', preset.ccw);
  }
</script>

{#if ctx.layer}
  <div class="mb-6">
    <p class="mb-2 text-sm font-medium text-muted-foreground">Encodeur</p>
    <ButtonGroup.Root>
      {#each ENCODER_PRESETS as preset}
        <Button
          size="sm"
          variant="outline"
          onclick={() => applyEncoderPreset(preset)}
          title="Appliquer le set {preset.label} (CW + CCW)"
        >
          <preset.icon class="size-3" />
          <span>{preset.label}</span>
        </Button>
      {/each}
    </ButtonGroup.Root>

    <div class="flex gap-2 mt-2">
      {#each [{ field: 'encoder_cw', label: '↻ CW', value: ctx.layer.encoder?.cw ?? 0 }, { field: 'encoder_ccw', label: '↺ CCW', value: ctx.layer.encoder?.ccw ?? 0 }] as enc}
        <button
          class={cn(
            'flex flex-col items-center gap-0.5 px-3 py-2 rounded-md border text-sm transition-all cursor-pointer hover:border-violet-500/50',
            ctx.editingField === enc.field ? 'border-violet-500 bg-violet-950/40' : 'bg-card',
          )}
          onclick={() => ctx.openEncoderPicker(enc.field)}
        >
          <span class="text-[10px] text-muted-foreground">{enc.label}</span>
          <span class="font-semibold">{getKeycodeLabel(enc.value)}</span>
        </button>
      {/each}
    </div>
  </div>
{/if}
