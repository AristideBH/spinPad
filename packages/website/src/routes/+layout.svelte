<script>
    import '../app.css';
    import { page } from '$app/stores';
    let { children } = $props();

    const NAV = [
        { href: '/',       label: 'Accueil' },
        { href: '/docs/',  label: 'Docs' },
        { href: '/studio/', label: 'Studio' },
        { href: '/flash/', label: 'Flash' },
    ];
</script>

<header class="sticky top-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
    <div class="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <a href="/" class="font-bold text-white text-lg tracking-tight">
            <span class="text-spinpad">Spin</span>Pad
        </a>
        <nav class="flex gap-5 text-sm text-gray-400">
            {#each NAV as { href, label }}
                <a
                    {href}
                    class="hover:text-white transition-colors {$page.url.pathname === href || ($page.url.pathname.startsWith(href) && href !== '/') ? 'text-white' : ''}"
                >
                    {label}
                </a>
            {/each}
            <a
                href="https://github.com/YOUR_ORG/spinpad"
                target="_blank"
                rel="noopener"
                class="hover:text-white transition-colors"
            >GitHub</a>
        </nav>
    </div>
</header>

<main>
    {@render children()}
</main>

<footer class="border-t border-gray-800 mt-24 py-8 text-center text-sm text-gray-600">
    SpinPad — Open source macropad · MIT License
</footer>
