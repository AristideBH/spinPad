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

import { defaultMacros, type FullConfig, type ProfileConfig } from './config-schema.js';

export const SPINPAD_FILE_TYPE = 'spinpad-config';
export const SPINPAD_PROFILES_FILE_TYPE = 'spinpad-profiles';
export const CURRENT_FORMAT_VERSION = 2;
export const CURRENT_PROFILES_FORMAT_VERSION = 1;

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
  // v1 → v2 : macros passées du niveau profil au niveau global (clean slate).
  // On supprime les anciennes macros par profil et on initialise 16 slots vides.
  1: (cfg) => {
    const profiles = Array.isArray(cfg.profiles)
      ? cfg.profiles.map((p) => {
          const { macros: _drop, ...rest } = p as FullConfig['profiles'][number] & { macros?: unknown };
          void _drop;
          return rest;
        })
      : cfg.profiles;
    return { ...cfg, profiles, macros: defaultMacros() };
  },
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

// ── Profile bundle (subset of profiles, no global settings) ────

export interface SpinpadProfilesWrapper {
  _type:             string;
  _format_version:   number;
  _created_at:       string;
  _firmware_version: string;
  _studio_version:   string;
  profiles:          ProfileConfig[];
}

export interface ProfilesParseResult {
  profiles:    ProfileConfig[];
  fromVersion: number;
}

export function createProfilesFile(
  profiles: ProfileConfig[],
  meta: FileMeta = {},
): SpinpadProfilesWrapper {
  return {
    _type:             SPINPAD_PROFILES_FILE_TYPE,
    _format_version:   CURRENT_PROFILES_FORMAT_VERSION,
    _created_at:       new Date().toISOString(),
    _firmware_version: meta.firmwareVersion ?? 'unknown',
    _studio_version:   meta.studioVersion   ?? 'unknown',
    profiles,
  };
}

export function parseProfilesFile(raw: unknown): ProfilesParseResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Fichier invalide : pas un objet JSON.');
  }
  const r = raw as Record<string, unknown>;
  if (r._type !== SPINPAD_PROFILES_FILE_TYPE) {
    throw new Error(
      `Fichier non reconnu (type: "${r._type}"). Attendu : "${SPINPAD_PROFILES_FILE_TYPE}".`,
    );
  }
  const fileVersion = Number(r._format_version) || 1;
  if (fileVersion > CURRENT_PROFILES_FORMAT_VERSION) {
    throw new Error(
      `Format profiles v${fileVersion} trop récent — mettre à jour Studio pour ouvrir ce fichier.`,
    );
  }
  if (!Array.isArray(r.profiles) || r.profiles.length === 0) {
    throw new Error('Fichier profiles vide ou invalide.');
  }
  return { profiles: r.profiles as ProfileConfig[], fromVersion: fileVersion };
}
