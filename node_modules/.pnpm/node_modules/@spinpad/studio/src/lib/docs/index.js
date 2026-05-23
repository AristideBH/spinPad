// Glob depuis src/lib/docs/ → 4 niveaux → keyboard-firmware/docs/
// Vite résout ce glob à build-time ; server.fs.allow autorise le répertoire parent.
const raw = import.meta.glob('../../../../docs/**/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
});

/**
 * @returns {{ slug: string, title: string, group: string | null }[]}
 */
export function getDocsManifest() {
    return Object.entries(raw).map(([filePath, content]) => {
        // "../../../../docs/keymap/layers.md" → "keymap/layers"
        const slug  = filePath
            .replace('../../../../docs/', '')
            .replace(/\.md$/, '');

        const parts = slug.split('/');
        const group = parts.length > 1 ? parts[0] : null;

        // Titre = premier # du fichier, sinon le nom de fichier
        const title = content.match(/^#\s+(.+)/m)?.[1] ?? parts[parts.length - 1];

        return { slug, title, group };
    }).sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * @param {string} slug
 * @returns {{ slug: string, title: string, content: string } | null}
 */
export function getDocBySlug(slug) {
    const filePath = Object.keys(raw).find(p =>
        p.replace('../../../../docs/', '').replace(/\.md$/, '') === slug
    );
    if (!filePath) return null;
    const content = raw[filePath];
    const title   = content.match(/^#\s+(.+)/m)?.[1] ?? slug;
    return { slug, title, content };
}
