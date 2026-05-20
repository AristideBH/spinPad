<script>
    import { Sun, Moon } from '@lucide/svelte';
    import { Button }   from '$lib/components/ui/button/index.js';

    let isDark = $state(true);

    function toggle() {
        isDark = !isDark;
        if (isDark) {
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.add('light');
        }
        localStorage.setItem('spinpad-theme', isDark ? 'dark' : 'light');
    }

    $effect(() => {
        const saved = localStorage.getItem('spinpad-theme');
        isDark = saved ? saved === 'dark' : true;
        if (!isDark) document.documentElement.classList.add('light');
    });
</script>

<Button variant="ghost" size="icon-sm" onclick={toggle} aria-label="Basculer le thème">
    {#if isDark}
        <Sun class="size-4" />
    {:else}
        <Moon class="size-4" />
    {/if}
</Button>
