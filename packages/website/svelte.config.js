import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import rehypeSlug from 'rehype-slug';

export default {
  extensions: ['.svelte', '.md'],
  preprocess: [
    vitePreprocess(),
    // rehype-slug adds `id` to every heading so the docs TOC can anchor to them.
    mdsvex({ extensions: ['.md'], rehypePlugins: [rehypeSlug] }),
  ],
  // `await` in components + <svelte:boundary pending> (experimental,
  // requires Svelte ≥5.36; the flag disappears in Svelte 6).
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
  vitePlugin: {
    inspector: true,
  },
};
