const config = {
    // `await` dans les composants + <svelte:boundary pending> (expérimental,
    // requiert Svelte ≥5.36 ; le flag disparaît en Svelte 6). Doit rester
    // aligné avec les configs des apps consommatrices (studio, website).
    compilerOptions: {
        experimental: { async: true },
    },
};
export default config;
