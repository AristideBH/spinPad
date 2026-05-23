// ═══════════════════════════════════════════════════════════════
//  config-migrations.js — Migrations du format .spinpad
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

export const SPINPAD_FILE_TYPE = 'spinpad-config';
export const CURRENT_FORMAT_VERSION = 1;

/**
 * Migrations v → v+1.
 * Chaque clé est la version SOURCE (avant migration).
 * @type {Record<number, (cfg: object) => object>}
 */
export const migrations = {
  // Version 1 → identité (version courante, pas de migration nécessaire)
  1: (cfg) => cfg,
};

/**
 * Valider et migrer un fichier .spinpad chargé depuis le disque.
 * @param {unknown} raw - Objet JSON parsé
 * @returns {{ config: object, fromVersion: number }}
 * @throws {Error} Si le fichier n'est pas reconnu
 */
export function parseSpinpadFile(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Fichier invalide : pas un objet JSON.');
  }
  if (raw._type !== SPINPAD_FILE_TYPE) {
    throw new Error(
      `Fichier non reconnu (type: "${raw._type}"). Attendu : "${SPINPAD_FILE_TYPE}".`
    );
  }
  const fileVersion = Number(raw._format_version) || 1;
  if (fileVersion > CURRENT_FORMAT_VERSION) {
    throw new Error(
      `Format v${fileVersion} trop récent — mettre à jour Studio pour ouvrir ce fichier.`
    );
  }

  let cfg = raw.config;
  for (let v = fileVersion; v < CURRENT_FORMAT_VERSION; v++) {
    if (!migrations[v]) throw new Error(`Migration manquante : v${v} → v${v + 1}`);
    cfg = migrations[v](cfg);
  }

  return { config: cfg, fromVersion: fileVersion };
}

/**
 * Créer l'enveloppe d'un fichier .spinpad pour l'export.
 * @param {object} config
 * @param {{ firmwareVersion?: string, studioVersion?: string }} meta
 * @returns {object}
 */
export function createSpinpadFile(config, meta = {}) {
  return {
    _type: SPINPAD_FILE_TYPE,
    _format_version: CURRENT_FORMAT_VERSION,
    _created_at: new Date().toISOString(),
    _firmware_version: meta.firmwareVersion ?? 'unknown',
    _studio_version: meta.studioVersion ?? 'unknown',
    config,
  };
}
