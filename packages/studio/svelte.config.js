import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        // adapter-static : génère des fichiers HTML/JS/CSS statiques
        // (pas besoin de serveur Node — peut être servi depuis n'importe où)
        adapter: adapter({
            pages: 'build',
            assets: 'build',
            fallback: 'index.html',
            precompress: false,
        }),
    },
};

export default config;
