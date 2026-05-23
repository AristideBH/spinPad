import adapter from '@sveltejs/adapter-static';

// Build output directory — overridable via env var for embedded build
const BUILD_DIR = process.env.VITE_BUILD_DIR || 'build';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        // adapter-static : génère des fichiers HTML/JS/CSS statiques
        // (pas besoin de serveur Node — peut être servi depuis n'importe où)
        adapter: adapter({
            pages: BUILD_DIR,
            assets: BUILD_DIR,
            fallback: 'index.html',
            precompress: false,
        }),
    },
};

export default config;
