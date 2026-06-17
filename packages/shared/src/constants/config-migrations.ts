// ═══════════════════════════════════════════════════════════════
//  config-migrations.ts — .spinpad format migrations
//
//  Each format version has a migration function that
//  transforms the config to the next version.
//
//  .spinpad file format:
//  {
//    "_type": "spinpad-config",
//    "_format_version": 1,
//    "_created_at": "...",
//    "_firmware_version": "...",
//    "_studio_version": "...",
//    "config": { ...complete config... }
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
// Each key is the SOURCE version (before migration).

export const migrations: Record<number, MigrationFn> = {
  // v1 → v2: macros moved from the profile level to the global level (clean slate).
  // We drop the old per-profile macros and initialize 16 empty slots.
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
 * Validate and migrate a .spinpad file loaded from disk.
 * @throws {Error} If the file is not recognized
 */
export function parseSpinpadFile(raw: unknown): ParseResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid file: not a JSON object.');
  }
  const r = raw as Record<string, unknown>;
  if (r._type !== SPINPAD_FILE_TYPE) {
    throw new Error(
      `Unrecognized file (type: "${r._type}"). Expected: "${SPINPAD_FILE_TYPE}".`
    );
  }
  const fileVersion = Number(r._format_version) || 1;
  if (fileVersion > CURRENT_FORMAT_VERSION) {
    throw new Error(
      `Format v${fileVersion} too recent — update Studio to open this file.`
    );
  }

  let cfg = r.config as FullConfig;
  for (let v = fileVersion; v < CURRENT_FORMAT_VERSION; v++) {
    if (!migrations[v]) throw new Error(`Missing migration: v${v} → v${v + 1}`);
    cfg = migrations[v](cfg);
  }

  return { config: cfg, fromVersion: fileVersion };
}

/**
 * Create the wrapper of a .spinpad file for export.
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
    throw new Error('Invalid file: not a JSON object.');
  }
  const r = raw as Record<string, unknown>;
  if (r._type !== SPINPAD_PROFILES_FILE_TYPE) {
    throw new Error(
      `Unrecognized file (type: "${r._type}"). Expected: "${SPINPAD_PROFILES_FILE_TYPE}".`,
    );
  }
  const fileVersion = Number(r._format_version) || 1;
  if (fileVersion > CURRENT_PROFILES_FORMAT_VERSION) {
    throw new Error(
      `Profiles format v${fileVersion} too recent — update Studio to open this file.`,
    );
  }
  if (!Array.isArray(r.profiles) || r.profiles.length === 0) {
    throw new Error('Empty or invalid profiles file.');
  }
  return { profiles: r.profiles as ProfileConfig[], fromVersion: fileVersion };
}
