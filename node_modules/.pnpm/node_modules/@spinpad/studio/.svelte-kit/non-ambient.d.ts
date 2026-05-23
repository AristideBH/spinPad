
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/docs" | "/docs/[...slug]" | "/editor" | "/editor/ble" | "/editor/display" | "/editor/keymap" | "/editor/profiles";
		RouteParams(): {
			"/docs/[...slug]": { slug: string }
		};
		LayoutParams(): {
			"/": { slug?: string | undefined };
			"/docs": { slug?: string | undefined };
			"/docs/[...slug]": { slug: string };
			"/editor": Record<string, never>;
			"/editor/ble": Record<string, never>;
			"/editor/display": Record<string, never>;
			"/editor/keymap": Record<string, never>;
			"/editor/profiles": Record<string, never>
		};
		Pathname(): "/" | "/docs" | `/docs/${string}` & {} | "/editor" | "/editor/ble" | "/editor/display" | "/editor/keymap" | "/editor/profiles";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}