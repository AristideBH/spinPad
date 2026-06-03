import type { Component } from 'svelte';

/**
 * Single source of truth for the docs.
 *
 * Every `.md` under `/content/docs` is compiled by mdsvex into a module that
 * exposes its rendered `default` component and its YAML frontmatter as
 * `metadata`. The sidebar, the landing grid, the breadcrumbs (via `nav.ts`) and
 * the recursive `[...slug]` route all derive from the manifest below — add a
 * markdown file (with frontmatter) and it shows up everywhere, no code change.
 */

type DocModule = {
  default: Component;
  metadata?: {
    title?: string;
    description?: string;
    order?: number;
    /** Section label. Defaults to the parent folder name; `null`/absent = root. */
    group?: string | null;
  };
};

const modules = import.meta.glob<DocModule>('/content/docs/**/*.md', { eager: true });

/** Compiled components keyed by glob path — consumed by the `[...slug]` route. */
export const components = modules;

export type DocEntry = {
  /** e.g. "keymap/layers" */
  slug: string;
  /** e.g. "/docs/keymap/layers/" */
  url: string;
  title: string;
  description: string | null;
  group: string | null;
  order: number;
};

/** A leaf doc page in the docs tree. */
export type DocTreeLeaf = { type: 'doc'; entry: DocEntry; order: number };

/** A folder node grouping nested docs/folders to arbitrary depth. */
export type DocTreeFolder = {
  type: 'folder';
  /** Raw folder segment, e.g. "keymap". */
  name: string;
  /** Humanized label, e.g. "Keymap". */
  label: string;
  /** Folder path relative to /docs, e.g. "keymap/advanced". */
  path: string;
  order: number;
  children: DocTreeNode[];
};

export type DocTreeNode = DocTreeLeaf | DocTreeFolder;

/** Turn a slug segment into a readable fallback title ("getting-started" → "Getting Started"). */
function humanize(segment: string): string {
  return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function toEntry(filePath: string, mod: DocModule): DocEntry {
  const slug = filePath.replace('/content/docs/', '').replace(/\.md$/, '');
  const parts = slug.split('/');
  const folder = parts.length > 1 ? parts[0] : null;
  const meta = mod.metadata ?? {};

  return {
    slug,
    url: `/docs/${slug}/`,
    title: meta.title ?? humanize(parts[parts.length - 1]),
    description: meta.description ?? null,
    group: meta.group === undefined ? folder : meta.group,
    order: meta.order ?? Number.POSITIVE_INFINITY,
  };
}

/** Flat list of all docs, sorted by `order` then slug. */
export function getDocsManifest(): DocEntry[] {
  return Object.entries(modules)
    .map(([filePath, mod]) => toEntry(filePath, mod))
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

/**
 * Recursive docs tree built from the folder structure — supports arbitrary
 * nesting depth. Folders are derived from the slug path; the leaf segment is the
 * doc page. Consumed by the sidebar and landing grid (rendered recursively).
 */
export function getDocsTree(): DocTreeNode[] {
  const roots: DocTreeNode[] = [];
  const folders = new Map<string, DocTreeFolder>();

  for (const entry of getDocsManifest()) {
    const parts = entry.slug.split('/');

    // Walk/create folder nodes for every segment except the doc itself.
    let siblings = roots;
    let path = '';
    for (let i = 0; i < parts.length - 1; i++) {
      path = path ? `${path}/${parts[i]}` : parts[i];
      let folder = folders.get(path);
      if (!folder) {
        folder = {
          type: 'folder',
          name: parts[i],
          label: humanize(parts[i]),
          path,
          order: entry.order,
          children: [],
        };
        folders.set(path, folder);
        siblings.push(folder);
      } else {
        folder.order = Math.min(folder.order, entry.order);
      }
      siblings = folder.children;
    }

    siblings.push({ type: 'doc', entry, order: entry.order });
  }

  const label = (n: DocTreeNode) => (n.type === 'doc' ? n.entry.title : n.label);
  const sort = (nodes: DocTreeNode[]) => {
    nodes.sort((a, b) => a.order - b.order || label(a).localeCompare(label(b)));
    for (const n of nodes) if (n.type === 'folder') sort(n.children);
  };
  sort(roots);

  return roots;
}

/** Resolve a doc title from its slug (used to label breadcrumbs). */
export function getDocTitle(slug: string): string | undefined {
  return getDocsManifest().find((d) => d.slug === slug)?.title;
}
