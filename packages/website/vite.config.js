import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'path';

// $shared → packages/shared/src est défini dans svelte.config.js (kit.alias),
// que SvelteKit injecte dans Vite. Vite résout nativement .js → .ts.

export default defineConfig({
    plugins: [
        tailwindcss(),
        sveltekit(),
    ],
    // SharedArrayBuffer requis par esptool-js (flash tool)
    server: {
        host: '127.0.0.1',
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
        },
        fs: {
            // Autorise l'accès aux sources de shared (hors racine de l'app)
            allow: [path.resolve('../..')],
        },
    },
});
