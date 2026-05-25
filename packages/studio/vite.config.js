import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    plugins: [
        tailwindcss(),   // tailwindcss avant sveltekit
        sveltekit(),
    ],
    server: {
        fs: {
            // searchForWorkspaceRoot remonte jusqu'à la racine du monorepo
            // (là où se trouve pnpm-workspace.yaml / package.json racine)
            // afin que les fichiers dans node_modules/.pnpm/ soient servis
            // correctement par Vite avec le bon MIME type.
            allow: [path.resolve('../..')],
        },
    },
});
