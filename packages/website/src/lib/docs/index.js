const raw = import.meta.glob('/content/docs/**/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
});

export const components = import.meta.glob('/content/docs/**/*.md', { eager: true });

/**
 * @returns {{ slug: string, title: string, group: string | null }[]}
 */
export function getDocsManifest() {
    return Object.entries(raw).map(([filePath, content]) => {
        // "/content/docs/keymap/layers.md" → "keymap/layers"
        const slug  = filePath
            .replace('/content/docs/', '')
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
        p.replace('/content/docs/', '').replace(/\.md$/, '') === slug
    );
    if (!filePath) return null;
    const content = raw[filePath];
    const title   = content.match(/^#\s+(.+)/m)?.[1] ?? slug;
    return { slug, title, content };
}
