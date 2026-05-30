import adapter from '@sveltejs/adapter-static';
import path from 'path';

// Build output directory — overridable via env var for embedded build
const BUILD_DIR = process.env.VITE_BUILD_DIR || 'build';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // `await` dans les composants + <svelte:boundary pending> (expérimental,
    // requiert Svelte ≥5.36 ; le flag disparaît en Svelte 6).
    compilerOptions: {
        experimental: { async: true },
    },

    kit: {
        // adapter-static : génère des fichiers HTML/JS/CSS statiques
        adapter: adapter({
            pages: BUILD_DIR,
            assets: BUILD_DIR,
            fallback: 'index.html',
            precompress: false,
        }),

        // Studio n'a pas de src/lib propre — tout vit dans @spinpad/shared.
        alias: {
            $shared: path.resolve('../shared/src'),
        },
    },
};

export default config;
