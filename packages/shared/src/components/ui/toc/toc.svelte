<script lang="ts" module>
	export type TocProps = {
		toc: Heading[];
		class?: string;
		/** Indicates whether this is a child component or root component */
		isChild?: boolean;
	};
</script>

<script lang="ts">
	import type { Heading } from '$shared/hooks/use-toc.svelte';
	import { cn } from '$shared/utils.js';
	import { MediaQuery } from 'svelte/reactivity';
	import Self from './toc.svelte';

	let { toc, isChild = false, class: className }: TocProps = $props();

	const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');

	// Smooth-scroll to the heading instead of the browser's instant anchor
	// jump; `scroll-margin-top` on headings (see prose-docs) keeps it clear
	// of the sticky header.
	function onTocClick(e: MouseEvent, id: string) {
		e.preventDefault();
		document.getElementById(id)?.scrollIntoView({
			behavior: reducedMotion.current ? 'auto' : 'smooth',
			block: 'start'
		});
		history.pushState(null, '', `#${id}`);
	}
</script>

<ul class={cn('m-0 list-none text-sm font-medium', { 'pl-4': isChild })}>
	{#each toc as heading, i (i)}
		<li
			class={cn('text-muted-foreground mt-0 pt-2 transition-all', {
				'text-foreground': heading.active
			})}
		>
			{#if heading.id}
				<a
					href="#{heading.id}"
					class="hover:text-foreground block"
					onclick={(e) => onTocClick(e, heading.id!)}
				>
					{heading.label}
				</a>
			{:else}
				{heading.label}
			{/if}
		</li>
		{#if heading.children.length > 0}
			<Self class={className} toc={heading.children} isChild={true} />
		{/if}
	{/each}
</ul>
