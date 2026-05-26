import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'path';
import { existsSync } from 'fs';

// Tous les composants et stores sont dans shared — studio n'a pas de src/lib propre.
const SHARED_LIB = path.resolve('../shared/src');
const STUDIO_LIB = path.resolve('./src/lib');

const norm = s => s.replace(/\\/g, '/').toLowerCase();
const STUDIO_LIB_NORM = norm(STUDIO_LIB);

/**
 * Résout un chemin (potentiellement .js) vers le fichier réel dans shared.
 * Essaie les extensions dans l'ordre : exact → .ts → .svelte.js (déjà géré par Vite)
 */
function resolveInShared(rel) {
    const base = path.resolve(SHARED_LIB, rel);
    if (existsSync(base)) return base;
    // .js → .ts (pattern TypeScript / ESM)
    if (rel.endsWith('.js')) {
        const ts = base.slice(0, -3) + '.ts';
        if (existsSync(ts)) return ts;
    }
    return base; // Laisser Vite gérer l'erreur si introuvable
}

/**
 * SvelteKit pré-résout $lib/ en chemin absolu (packages/studio/src/lib/...)
 * avant que le pipeline resolveId ne s'exécute.
 * Ce plugin intercepte ces chemins absolus et les redirige vers shared/src.
 */
function sharedLibPlugin() {
    return {
        name: 'spinpad-shared-lib',
        enforce: 'pre',
        resolveId(id) {
            // Cas 1 : $lib/ pas encore expandé
            if (id.startsWith('$lib/')) {
                return resolveInShared(id.slice('$lib/'.length));
            }
            // Cas 2 : chemin absolu pointant vers studio/src/lib/
            const idNorm = norm(id);
            if (idNorm.startsWith(STUDIO_LIB_NORM + '/') || idNorm === STUDIO_LIB_NORM) {
                const rel = norm(id).slice(STUDIO_LIB_NORM.length).replace(/^\//, '');
                return resolveInShared(rel);
            }
        },
    };
}

export default defineConfig({
    plugins: [
        sharedLibPlugin(),
        tailwindcss(),
        sveltekit(),
    ],
    server: {
        host: '127.0.0.1',
        fs: {
            allow: [path.resolve('../..')],
        },
    },
});
