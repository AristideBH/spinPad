import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'path';

// $shared → packages/shared/src (source de vérité unique pour les composants éditeur)
// Les fichiers dans shared utilisent des imports relatifs → pas de problème de résolution $lib
const SHARED_LIB = path.resolve('../shared/src');

export default defineConfig({
    plugins: [
        tailwindcss(),
        sveltekit(),
    ],
    resolve: {
        alias: {
            '$shared': SHARED_LIB,
        },
    },
    // SharedArrayBuffer requis par esptool-js (flash tool)
    server: {
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
        },
        fs: {
            allow: [path.resolve('../shared/src')],
        },
    },
});
