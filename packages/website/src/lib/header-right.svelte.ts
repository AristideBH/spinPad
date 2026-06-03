import { getContext, setContext, type Snippet } from 'svelte';

const KEY = Symbol('header-right');

type HeaderRightContext = {
	readonly current: Snippet | null;
	set(snippet: Snippet | null): void;
};

export function createHeaderRight(): HeaderRightContext {
	let slot: Snippet | null = $state(null);

	const ctx: HeaderRightContext = {
		get current() {
			return slot;
		},
		set(snippet) {
			slot = snippet;
		}
	};

	setContext(KEY, ctx);
	return ctx;
}

export function useHeaderRight(): HeaderRightContext {
	return getContext<HeaderRightContext>(KEY);
}
