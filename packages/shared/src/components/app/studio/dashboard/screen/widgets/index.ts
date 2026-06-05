// ───────────────────────────────────────────────────────────────
//  index.ts — Registre des widgets OLED (assemble les définitions)
//
//  Pour AJOUTER un widget, voir README.md. En bref : créer un fichier
//  `monwidget.ts` exportant un WidgetDef, puis l'enregistrer ci-dessous.
// ───────────────────────────────────────────────────────────────
import { WIDGET_TYPE, type WidgetType, type WidgetConfig } from '$shared/constants/config-schema.js';
import type { WidgetDef } from './types.js';
import { ble } from './ble.js';
import { battery } from './battery.js';
import { layer } from './layer.js';
import { profile } from './profile.js';
import { clock } from './clock.js';
import { customText } from './custom-text.js';
import { icon } from './icon.js';

export type { WidgetDef, WidgetOption, WidgetSizeRange } from './types.js';

/** Types réellement placeables (NONE exclu). */
export type PlaceableWidgetType = Exclude<WidgetType, typeof WIDGET_TYPE.NONE>;

/** Registre clé→définition. Une entrée par widget placeable. */
export const WIDGET_DEFS: Record<PlaceableWidgetType, WidgetDef> = {
  [WIDGET_TYPE.BLE_STATUS]: ble,
  [WIDGET_TYPE.BATTERY]: battery,
  [WIDGET_TYPE.LAYER]: layer,
  [WIDGET_TYPE.PROFILE]: profile,
  [WIDGET_TYPE.CLOCK]: clock,
  [WIDGET_TYPE.CUSTOM_TEXT]: customText,
  [WIDGET_TYPE.ICON]: icon,
};

/** Ordre d'affichage dans la palette « Ajouter ». */
export const PLACEABLE_WIDGET_TYPES: PlaceableWidgetType[] = [
  WIDGET_TYPE.BLE_STATUS,
  WIDGET_TYPE.BATTERY,
  WIDGET_TYPE.LAYER,
  WIDGET_TYPE.PROFILE,
  WIDGET_TYPE.CLOCK,
  WIDGET_TYPE.CUSTOM_TEXT,
  WIDGET_TYPE.ICON,
];

export interface WidgetSize {
  w: number;
  h: number;
}

/** Toutes les tailles autorisées (générées depuis la contrainte min/max). */
export function widgetSizes(type: PlaceableWidgetType): WidgetSize[] {
  const s = WIDGET_DEFS[type].size;
  const out: WidgetSize[] = [];
  for (let h = s.minH; h <= s.maxH; h++)
    for (let w = s.minW; w <= s.maxW; w++) if (!s.square || w === h) out.push({ w, h });
  return out;
}

/** Taille à l'ajout : `size.default` sinon la plus petite ({minW, minH}). */
export function widgetDefaultSize(type: PlaceableWidgetType): WidgetSize {
  const s = WIDGET_DEFS[type].size;
  return s.default ?? { w: s.minW, h: s.minH };
}

/** Construit un nouveau widget en seedant les valeurs d'options par défaut. */
export function createWidget(
  type: PlaceableWidgetType,
  x: number,
  y: number,
  w: number,
  h: number,
): WidgetConfig {
  const opts = Object.fromEntries((WIDGET_DEFS[type].options ?? []).map((o) => [o.key, o.default]));
  return { type, x, y, w, h, ...opts } as WidgetConfig;
}
