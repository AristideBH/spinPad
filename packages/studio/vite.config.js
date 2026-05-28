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
    server: {
        host: '127.0.0.1',
        fs: {
            // Autorise l'accès aux sources de shared (hors racine de l'app)
            allow: [path.resolve('../..')],
        },
    },
});
