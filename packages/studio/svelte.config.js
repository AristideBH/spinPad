import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import rehypeSlug from 'rehype-slug';
import path from 'path';

// Build output directory — overridable via env var for embedded build
const BUILD_DIR = process.env.VITE_BUILD_DIR || 'build';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    extensions: ['.svelte', '.md'],
    preprocess: [
        vitePreprocess(),
        // rehype-slug adds `id` to every heading so help-page anchors work.
        mdsvex({ extensions: ['.md'], rehypePlugins: [rehypeSlug] }),
    ],

    // `await` in components + <svelte:boundary pending> (experimental,
    // requires Svelte >=5.36; the flag disappears in Svelte 6).
    compilerOptions: {
        experimental: { async: true },
    },

    kit: {
        // adapter-static: generates static HTML/JS/CSS files
        adapter: adapter({
            pages: BUILD_DIR,
            assets: BUILD_DIR,
            fallback: 'index.html',
            // Precompression for the embedded build only. adapter-static
            // generates .gz AND .br; the firmware only serves the .gz, so the
            // post-build script (package.json build:embedded) removes the
            // uncompressed originals and the .br to flash only the .gz.
            precompress: process.env.VITE_TRANSPORT === 'http',
        }),

        // Studio has no src/lib of its own — everything lives in @spinpad/shared.
        alias: {
            $shared: path.resolve('../shared/src'),
        },
    },
};

export default config;
