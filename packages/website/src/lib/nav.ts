import { getDocsManifest, getDocTitle } from '$lib/docs';

export type NavItem = {
	title: string;
	url: string;
	children?: NavItem[];
};

export type BreadcrumbItem = {
	title: string;
	/** Omitted for folder/group segments with no backing page (rendered as muted text). */
	url?: string;
	current: boolean;
};

/** "getting-started" → "Getting Started" (breadcrumb fallback for unmapped segments). */
function humanize(segment: string): string {
	return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Documentation children are generated from the docs manifest — the markdown
// files are the single source of truth, so this never drifts out of sync.
const docsChildren: NavItem[] = getDocsManifest().map((d) => ({ title: d.title, url: d.url }));

export const navTree: NavItem[] = [
	{ title: 'Accueil', url: '/' },
	{
		title: 'Tools',
		url: '/studio/',
		children: [
			{ title: 'Studio', url: '/studio/' },
			{ title: 'Flasher', url: '/flash/' },
			{ title: 'Profiles Demo', url: '/demo/' }
		]
	},
	{
		title: 'Documentation',
		url: '/docs/',
		children: docsChildren
	}, {
		title: 'Store',
		url: '/store/'
	}
];

/** Derives breadcrumb trail from pathname. `pageTitle` overrides the last segment label. */
export function getBreadcrumbs(pathname: string, pageTitle?: string): BreadcrumbItem[] {
	if (pathname === '/') return [];

	// Docs get a dedicated, fully-nested trail so deep slugs like
	// /docs/keymap/layers/ read "Documentation › Keymap › Layers et Keymap",
	// with each segment titled from the manifest when a doc exists for it.
	if (pathname.startsWith('/docs/') && pathname !== '/docs/') {
		const segments = pathname
			.replace(/^\/docs\//, '')
			.replace(/\/$/, '')
			.split('/')
			.filter(Boolean);

		const crumbs: BreadcrumbItem[] = [{ title: 'Documentation', url: '/docs/', current: false }];
		segments.forEach((seg, i) => {
			const cumulativeSlug = segments.slice(0, i + 1).join('/');
			const isLast = i === segments.length - 1;
			const docTitle = getDocTitle(cumulativeSlug);
			crumbs.push({
				title: (isLast && pageTitle) || docTitle || humanize(seg),
				// Folder/group segments have no backing page → no link (rendered muted).
				url: isLast || docTitle !== undefined ? `/docs/${cumulativeSlug}/` : undefined,
				current: isLast
			});
		});
		return crumbs;
	}

	for (const item of navTree) {
		if (item.url === pathname) {
			return [{ title: pageTitle ?? item.title, url: item.url, current: true }];
		}
		if (item.children && pathname.startsWith(item.url)) {
			const parent: BreadcrumbItem = { title: item.title, url: item.url, current: false };
			const child = item.children.find((c) => pathname === c.url || pathname.startsWith(c.url));
			if (child) {
				return [parent, { title: pageTitle ?? child.title, url: child.url, current: true }];
			}
			return [{ ...parent, current: true }];
		}
	}

	// Fallback: segment-based derivation for routes not in navTree
	const segments = pathname.replace(/\/$/, '').split('/').filter(Boolean);
	return segments.map((seg, i) => ({
		title:
			i === segments.length - 1 && pageTitle
				? pageTitle
				: seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
		url: '/' + segments.slice(0, i + 1).join('/') + '/',
		current: i === segments.length - 1
	}));
}
