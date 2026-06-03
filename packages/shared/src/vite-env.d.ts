// Shared est toujours consommé dans une app Vite (website / studio).
// Vite n'étant pas une dépendance directe du package, on déclare ici
// la forme de `import.meta.env` utilisée afin que le typecheck standalone
// (IDE / `tsc`) résolve `import.meta.env.VITE_*`.
interface ImportMetaEnv {
  readonly VITE_TRANSPORT?: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
