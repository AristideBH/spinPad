// ───────────────────────────────────────────────────────────────
//  types.ts — Shape of an OLED widget definition (Studio registry)
//
//  Each widget file exports a `WidgetDef`. See README.md to add a widget
//  end to end.
// ───────────────────────────────────────────────────────────────
import type { Component } from 'svelte';
import type { WidgetConfig } from '$shared/constants/config-schema.js';

/** Min/max size constraint (in cells) → the picker generates the sizes. */
export interface WidgetSizeRange {
  minW: number;
  maxW: number;
  minH: number;
  maxH: number;
  /** Size on add; defaults to { minW, minH }. */
  default?: { w: number; h: number };
  /** Square sizes only (w === h). */
  square?: boolean;
}

export type WidgetOptionKind = 'bool' | 'text' | 'icon';

/**
 * Editable option of a widget. The `default` value serves both as a seed on
 * creation and as the initial value in the editor. Rendered generically by
 * screen/bits/OptionControls.svelte (bool → Switch, text → Input).
 */
export interface WidgetOption {
  key: string; // matching field on WidgetConfig (e.g. 'clock_24h')
  kind: WidgetOptionKind;
  label: string;
  default: boolean | string;
  max?: number; // maxlength (text)
  /** Greys out the control based on the widget's current state (e.g. date only in 2×2). */
  disabled?: (w: WidgetConfig) => boolean;
}

export interface WidgetDef {
  label: string;
  icon: Component;
  size: WidgetSizeRange;
  /** false → duplications allowed in the palette. */
  singleton: boolean;
  /** Live preview in the edit card. `now` enables the clock tick. */
  preview: (w: WidgetConfig, now: Date) => string;
  options?: WidgetOption[];
}
