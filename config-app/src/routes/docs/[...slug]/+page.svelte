<script>
    import { marked }        from 'marked';
    import { page }          from '$app/state';
    import {
        Breadcrumb,
        BreadcrumbItem,
        BreadcrumbLink,
        BreadcrumbList,
        BreadcrumbPage,
        BreadcrumbSeparator,
    } from '$lib/components/ui/breadcrumb/index.js';
    import { APP_CONFIG } from '$lib/app.config.js';

    let { data } = $props();

    const html = $derived(marked(data.doc.content));

    // Segments du breadcrumb depuis le slug ("keymap/layers" → ["keymap", "layers"])
    const segments = $derived(data.doc.slug.split('/'));
</script>

<svelte:head>
    <title>{data.doc.title} — {APP_CONFIG.name}</title>
</svelte:head>

<!-- Breadcrumb -->
<Breadcrumb class="mb-6">
    <BreadcrumbList>
        <BreadcrumbItem>
            <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
        </BreadcrumbItem>

        {#each segments.slice(0, -1) as seg}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbLink href="/docs/{seg}">
                    {seg.charAt(0).toUpperCase() + seg.slice(1)}
                </BreadcrumbLink>
            </BreadcrumbItem>
        {/each}

        <BreadcrumbSeparator />
        <BreadcrumbItem>
            <BreadcrumbPage>{data.doc.title}</BreadcrumbPage>
        </BreadcrumbItem>
    </BreadcrumbList>
</Breadcrumb>

<!-- Contenu markdown -->
<div class="prose">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html html}
</div>
