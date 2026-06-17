// ───────────────────────────────────────────────────────────────
//  index.ts — OLED widget registry (assembles the definitions)
//
//  To ADD a widget, see README.md. In short: create a file
//  `mywidget.ts` exporting a WidgetDef, then register it below.
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

/** Types that are actually placeable (NONE excluded). */
export type PlaceableWidgetType = Exclude<WidgetType, typeof WIDGET_TYPE.NONE>;

/** Registry key→definition. One entry per placeable widget. */
export const WIDGET_DEFS: Record<PlaceableWidgetType, WidgetDef> = {
  [WIDGET_TYPE.BLE_STATUS]: ble,
  [WIDGET_TYPE.BATTERY]: battery,
  [WIDGET_TYPE.LAYER]: layer,
  [WIDGET_TYPE.PROFILE]: profile,
  [WIDGET_TYPE.CLOCK]: clock,
  [WIDGET_TYPE.CUSTOM_TEXT]: customText,
  [WIDGET_TYPE.ICON]: icon,
};

/** Display order in the "Add" palette. */
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

/** All allowed sizes (generated from the min/max constraint). */
export function widgetSizes(type: PlaceableWidgetType): WidgetSize[] {
  const s = WIDGET_DEFS[type].size;
  const out: WidgetSize[] = [];
  for (let h = s.minH; h <= s.maxH; h++)
    for (let w = s.minW; w <= s.maxW; w++) if (!s.square || w === h) out.push({ w, h });
  return out;
}

/** Size on add: `size.default` otherwise the smallest ({minW, minH}). */
export function widgetDefaultSize(type: PlaceableWidgetType): WidgetSize {
  const s = WIDGET_DEFS[type].size;
  return s.default ?? { w: s.minW, h: s.minH };
}

/** Builds a new widget, seeding the default option values. */
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
