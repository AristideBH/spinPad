import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

export default {
    extensions: ['.svelte', '.md'],
    preprocess: [
        vitePreprocess(),
        mdsvex({ extensions: ['.md'] }),
    ],
    // `await` dans les composants + <svelte:boundary pending> (expérimental,
    // requiert Svelte ≥5.36 ; le flag disparaît en Svelte 6).
    compilerOptions: {
        experimental: { async: true },
    },
    kit: {
        adapter: adapter({
            pages: 'build',
            assets: 'build',
            fallback: '404.html',
            precompress: true,
        }),
        prerender: {
            handleHttpError: 'warn',
        },
        alias: {
            $shared: '../shared/src',
            $lib: 'src/lib',
        },
    },
};
