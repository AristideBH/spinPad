import { getContext, setContext } from 'svelte';
import type { Component } from 'svelte';

const KEY = Symbol('header-right');

type Slot = { component: Component; props: Record<string, unknown> } | null;

type HeaderRightContext = {
	readonly current: Slot;
	set(component: Component | null, props?: Record<string, unknown>): void;
};

export function createHeaderRight(): HeaderRightContext {
	let slot: Slot = $state(null);

	const ctx: HeaderRightContext = {
		get current() {
			return slot;
		},
		set(component, props = {}) {
			slot = component ? { component, props } : null;
		}
	};

	setContext(KEY, ctx);
	return ctx;
}

export function useHeaderRight(): HeaderRightContext {
	return getContext<HeaderRightContext>(KEY);
}
