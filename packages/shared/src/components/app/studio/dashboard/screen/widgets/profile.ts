import { Shapes } from '@lucide/svelte';
import { configState } from '$shared/store/config.svelte.js';
import type { WidgetDef } from './types.js';

export const profile: WidgetDef = {
  label: 'Profil actif',
  icon: Shapes,
  // Toutes les variations de la grille (le firmware centre le nom, peu importe la boîte).
  size: { minW: 2, maxW: 4, minH: 1, maxH: 4 },
  singleton: true,
  preview: () => configState.activeProfile?.name ?? 'Profil',
};
