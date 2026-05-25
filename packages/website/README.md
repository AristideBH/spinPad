# @spinpad/website

Site public du projet SpinPad — landing page, documentation et Studio embarqué.

## Stack

- **SvelteKit** avec `adapter-static` (site 100% statique)
- **mdsvex** — support des fichiers `.md` comme routes/composants
- **Tailwind CSS**
- Dépend de `@spinpad/shared` (workspace)

## Dev

```bash
# Depuis la racine du monorepo
pnpm --filter @spinpad/website dev      # → http://localhost:5174

# Ou depuis ce dossier
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
│   ├── +layout.svelte        # Layout global (nav, footer)
│   ├── +page.svelte          # Landing page
│   ├── docs/                 # Documentation (fichiers .md via mdsvex)
│   └── studio/               # Studio embarqué (lien vers packages/studio)
└── lib/
    └── components/           # Composants partagés
```

## Deploy

Le site est déployé automatiquement via GitHub Actions (`studio-deploy.yml`) sur push vers `main` avec des changements dans `packages/website/` ou `packages/shared/`.

Plateforme cible : Vercel (ou équivalent — adapter le workflow CI si nécessaire).

## Intégration Studio

Le Studio embarqué (configurateur WiFi servi directement depuis le SpinPad) est buildé séparément via `@spinpad/studio build:embedded`. Le site public peut héberger un lien vers le Studio en mode WebSerial (pour les utilisateurs connectés en USB).
