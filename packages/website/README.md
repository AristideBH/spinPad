# @spinpad/website

Public site of the SpinPad project — landing page, documentation and embedded Studio.

## Stack

- **SvelteKit** with `adapter-static` (100% static site)
- **mdsvex** — support for `.md` files as routes/components
- **Tailwind CSS**
- Depends on `@spinpad/shared` (workspace)

## Dev

```bash
# From the monorepo root
pnpm --filter @spinpad/website dev      # → http://localhost:5174

# Or from this folder
pnpm dev
```

## Build

```bash
pnpm --filter @spinpad/website build
# Output : packages/website/build/
```

## Structure

```
src/
├── routes/
│   ├── +layout.svelte        # Global layout (nav, footer)
│   ├── +page.svelte          # Landing page
│   ├── docs/                 # Documentation (.md files via mdsvex)
│   └── studio/               # Embedded Studio (link to packages/studio)
└── lib/
    └── components/           # Shared components
```

## Deploy

The site is deployed automatically via GitHub Actions (`studio-deploy.yml`) on push to `main` with changes in `packages/website/` or `packages/shared/`.

Target platform: Vercel (or equivalent — adapt the CI workflow if needed).

## Studio integration

The embedded Studio (WiFi configurator served directly from the SpinPad) is built separately via `@spinpad/studio build:embedded`. The public site can host a link to the Studio in WebSerial mode (for users connected over USB).
