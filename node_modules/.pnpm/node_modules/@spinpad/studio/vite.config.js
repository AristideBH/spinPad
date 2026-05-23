import { sveltekit }   from '@sveltejs/kit/vite';
import tailwindcss    from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path             from 'path';

export default defineConfig({
    plugins: [
        tailwindcss(),   // tailwindcss avant sveltekit
        sveltekit(),
    ],
    server: {
        fs: {
            // Permet d'accéder aux fichiers .md dans keyboard-firmware/docs/
            allow: [path.resolve('..')],
        },
    },
});
