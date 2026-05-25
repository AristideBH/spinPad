import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    plugins: [
        tailwindcss(),
        sveltekit(),
    ],
    // SharedArrayBuffer requis par esptool-js (flash tool)
    server: {
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
        },
        fs: {
            allow: [path.resolve('../..')],
        },
    },
});
