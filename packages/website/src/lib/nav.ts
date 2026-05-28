export type NavItem = {
	title: string;
	url: string;
	children?: NavItem[];
};

export type BreadcrumbItem = {
	title: string;
	url: string;
	current: boolean;
};

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
		children: [
			{ title: 'Démarrage', url: '/docs/getting-started/' },
			{ title: 'Keymap', url: '/docs/keymap/' },
			{ title: 'Encodeur', url: '/docs/encoder/' },
			{ title: 'LEDs', url: '/docs/leds/' },
			{ title: 'Studio Mode', url: '/docs/studio-mode/' },
			{ title: 'Orientation', url: '/docs/orientation/' },
			{ title: 'Bluetooth', url: '/docs/ble/' },
			{ title: 'Compiler', url: '/docs/firmware-build/' }
		]
	}, {
		title: 'Store',
		url: '/store/'
	}
];

/** Derives breadcrumb trail from pathname. `pageTitle` overrides the last segment label. */
export function getBreadcrumbs(pathname: string, pageTitle?: string): BreadcrumbItem[] {
	if (pathname === '/') return [];

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
