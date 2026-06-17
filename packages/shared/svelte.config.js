const config = {
    // `await` in components + <svelte:boundary pending> (experimental,
    // requires Svelte ≥5.36; the flag disappears in Svelte 6). Must stay
    // aligned with the consuming apps' configs (studio, website).
    compilerOptions: {
        experimental: { async: true },
    },
};
export default config;
