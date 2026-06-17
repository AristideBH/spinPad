import { Shapes } from '@lucide/svelte';
import { configState } from '$shared/store/config.svelte.js';
import type { WidgetDef } from './types.js';

export const profile: WidgetDef = {
  label: 'Active profile',
  icon: Shapes,
  // All grid variations (the firmware centers the name, whatever the box).
  size: { minW: 2, maxW: 4, minH: 1, maxH: 4 },
  singleton: true,
  preview: () => configState.activeProfile?.name ?? 'Profile',
};
