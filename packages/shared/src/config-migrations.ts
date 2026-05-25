// ═══════════════════════════════════════════════════════════════
//  config-migrations.ts — Migrations du format .spinpad
//
//  Chaque version de format a une fonction de migration qui
//  transforme la config vers la version suivante.
//
//  Format du fichier .spinpad :
//  {
//    "_type": "spinpad-config",
//    "_format_version": 1,
//    "_created_at": "...",
//    "_firmware_version": "...",
//    "_studio_version": "...",
//    "config": { ...config complète... }
//  }
// ═══════════════════════════════════════════════════════════════

import type { FullConfig } from './config-schema.js';

export const SPINPAD_FILE_TYPE = 'spinpad-config';
export const CURRENT_FORMAT_VERSION = 1;

// ── Types ───────────────────────────────────────────────────────

export interface SpinpadFileWrapper {
  _type:             string;
  _format_version:   number;
  _created_at:       string;
  _firmware_version: string;
  _studio_version:   string;
  config:            FullConfig;
}

export type MigrationFn = (cfg: FullConfig) => FullConfig;

export interface ParseResult {
  config:      FullConfig;
  fromVersion: number;
}

export interface FileMeta {
  firmwareVersion?: string;
  studioVersion?:   string;
}

// ── Migrations v → v+1 ──────────────────────────────────────────
// Chaque clé est la version SOURCE (avant migration).

export const migrations: Record<number, MigrationFn> = {
  // Version 1 → identité (version courante, pas de migration nécessaire)
  1: (cfg) => cfg,
};

// ── Helpers ────────────────────────────────────────────────────

/**
 * Valider et migrer un fichier .spinpad chargé depuis le disque.
 * @throws {Error} Si le fichier n'est pas reconnu
 */
export function parseSpinpadFile(raw: unknown): ParseResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Fichier invalide : pas un objet JSON.');
  }
  const r = raw as Record<string, unknown>;
  if (r._type !== SPINPAD_FILE_TYPE) {
    throw new Error(
      `Fichier non reconnu (type: "${r._type}"). Attendu : "${SPINPAD_FILE_TYPE}".`
    );
  }
  const fileVersion = Number(r._format_version) || 1;
  if (fileVersion > CURRENT_FORMAT_VERSION) {
    throw new Error(
      `Format v${fileVersion} trop récent — mettre à jour Studio pour ouvrir ce fichier.`
    );
  }

  let cfg = r.config as FullConfig;
  for (let v = fileVersion; v < CURRENT_FORMAT_VERSION; v++) {
    if (!migrations[v]) throw new Error(`Migration manquante : v${v} → v${v + 1}`);
    cfg = migrations[v](cfg);
  }

  return { config: cfg, fromVersion: fileVersion };
}

/**
 * Créer l'enveloppe d'un fichier .spinpad pour l'export.
 */
export function createSpinpadFile(config: FullConfig, meta: FileMeta = {}): SpinpadFileWrapper {
  return {
    _type:             SPINPAD_FILE_TYPE,
    _format_version:   CURRENT_FORMAT_VERSION,
    _created_at:       new Date().toISOString(),
    _firmware_version: meta.firmwareVersion ?? 'unknown',
    _studio_version:   meta.studioVersion   ?? 'unknown',
    config,
  };
}
