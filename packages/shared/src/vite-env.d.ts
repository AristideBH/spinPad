// Shared is always consumed within a Vite app (website / studio).
// Since Vite is not a direct dependency of the package, we declare here
// the shape of `import.meta.env` used so that the standalone typecheck
// (IDE / `tsc`) resolves `import.meta.env.VITE_*`.
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
