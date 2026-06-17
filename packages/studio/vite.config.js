import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'path';

// $shared → packages/shared/src is defined in svelte.config.js (kit.alias),
// which SvelteKit injects into Vite. Vite natively resolves .js → .ts.

export default defineConfig({
    plugins: [
        tailwindcss(),
        sveltekit(),
    ],
    server: {
        host: '127.0.0.1',
        fs: {
            // Allows access to the shared sources (outside the app root)
            allow: [path.resolve('../..')],
        },
    },
});
