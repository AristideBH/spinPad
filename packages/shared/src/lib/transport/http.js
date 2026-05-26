// ═══════════════════════════════════════════════════════════════
//  transport/http.js — Transport HTTP pour Studio Mode embarqué
//
//  Utilisé quand l'app est servie directement depuis le SpinPad.
//  Les requêtes sont relatives (pas de base URL) car l'origine
//  est 192.168.4.1 et le serveur HTTP tourne sur le device.
//
//  Build embedded : VITE_TRANSPORT=http (voir build:embedded)
// ═══════════════════════════════════════════════════════════════

const BASE = '';   // Relatif à l'origine — pas de URL absolue nécessaire

/**
 * Récupérer la config complète depuis le device.
 * @returns {Promise<object>}
 */
export async function getConfig() {
  const r = await fetch(`${BASE}/api/config`);
  if (!r.ok) throw new Error(`Erreur HTTP ${r.status} lors du chargement de la config`);
  return r.json();
}

/**
 * Envoyer la config complète au device.
 * @param {object} data - Config complète (doit correspondre au schéma JSON firmware)
 * @returns {Promise<{ok: boolean}>}
 */
export async function setConfig(data) {
  const r = await fetch(`${BASE}/api/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`Erreur HTTP ${r.status} lors de la sauvegarde`);
  return r.json();
}

/**
 * Remettre le device à sa configuration d'usine.
 * @returns {Promise<{ok: boolean}>}
 */
export async function factoryReset() {
  const r = await fetch(`${BASE}/api/factory_reset`, { method: 'POST' });
  if (!r.ok) throw new Error(`Erreur HTTP ${r.status} lors du factory reset`);
  return r.json();
}

/**
 * Vérifier si le device est joignable via HTTP.
 * @returns {Promise<boolean>}
 */
export async function ping() {
  try {
    const r = await fetch(`${BASE}/api/config`, { method: 'HEAD' });
    return r.ok;
  } catch {
    return false;
  }
}
