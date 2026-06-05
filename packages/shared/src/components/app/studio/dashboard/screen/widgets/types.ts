// ───────────────────────────────────────────────────────────────
//  types.ts — Forme d'une définition de widget OLED (registre Studio)
//
//  Chaque fichier de widget exporte un `WidgetDef`. Voir README.md pour
//  ajouter un widget de bout en bout.
// ───────────────────────────────────────────────────────────────
import type { Component } from 'svelte';
import type { WidgetConfig } from '$shared/constants/config-schema.js';

/** Contrainte de taille min/max (en cellules) → le sélecteur génère les tailles. */
export interface WidgetSizeRange {
  minW: number;
  maxW: number;
  minH: number;
  maxH: number;
  /** Taille à l'ajout ; par défaut { minW, minH }. */
  default?: { w: number; h: number };
  /** Tailles carrées uniquement (w === h). */
  square?: boolean;
}

export type WidgetOptionKind = 'bool' | 'text' | 'icon';

/**
 * Option éditable d'un widget. La valeur `default` sert à la fois de seed à la
 * création et de valeur initiale dans l'éditeur. Rendu générique par
 * screen/bits/OptionControls.svelte (bool → Switch, text → Input).
 */
export interface WidgetOption {
  key: string; // champ correspondant sur WidgetConfig (ex. 'clock_24h')
  kind: WidgetOptionKind;
  label: string;
  default: boolean | string;
  max?: number; // maxlength (text)
  /** Grise le contrôle selon l'état courant du widget (ex. date seulement en 2×2). */
  disabled?: (w: WidgetConfig) => boolean;
}

export interface WidgetDef {
  label: string;
  icon: Component;
  size: WidgetSizeRange;
  /** false → duplications autorisées dans la palette. */
  singleton: boolean;
  /** Aperçu live dans la carte d'édition. `now` permet le tick de l'horloge. */
  preview: (w: WidgetConfig, now: Date) => string;
  options?: WidgetOption[];
}
