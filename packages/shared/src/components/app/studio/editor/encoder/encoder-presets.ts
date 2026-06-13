import { action, ACTION_TYPES, MEDIA_CODES } from '$shared/constants/action-types.js';
import { configState, setEncoderAction } from '$shared/store/config.svelte.js';
import { ListVideo, SeparatorHorizontal, SeparatorVertical, Volume2, ZoomIn } from '@lucide/svelte';
import type { LucideIcon } from '@lucide/svelte';

export interface EncoderPreset {
  label: string;
  icon: LucideIcon;
  cw: number;
  ccw: number;
}

export const ENCODER_PRESETS: EncoderPreset[] = [
  {
    label: 'Volume',
    icon: Volume2,
    cw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_VOL_UP),
    ccw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_VOL_DN),
  },
  {
    label: 'Scroll X',
    icon: SeparatorVertical,
    cw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_SCRL_RIGHT),
    ccw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_SCRL_LEFT),
  },
  {
    label: 'Scroll Y',
    icon: SeparatorHorizontal,
    cw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_SCRL_UP),
    ccw: action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_SCRL_DN),
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

export function applyEncoderPreset(preset: EncoderPreset): void {
  const pi = configState.activeProfileIndex;
  const li = configState.activeLayerIndex;
  setEncoderAction(pi, li, 'cw', preset.cw);
  setEncoderAction(pi, li, 'ccw', preset.ccw);
}

export function matchPreset(enc?: { cw: number; ccw: number } | null): string | null {
  if (!enc) return null;
  return ENCODER_PRESETS.find((p) => p.cw === enc.cw && p.ccw === enc.ccw)?.label ?? null;
}
