<script lang="ts">
  import { page } from '$app/stores';
  import { Button } from '$shared/components/ui/button/index.js';
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
  import ServerCrashIcon from '@lucide/svelte/icons/server-crash';
  import FileQuestionIcon from '@lucide/svelte/icons/file-question';

  const STATUS_MAP: Record<number, { title: string; description: string }> = {
    404: {
      title: 'Page introuvable',
      description: "Cette page n'existe pas ou a été déplacée.",
    },
    403: {
      title: 'Accès refusé',
      description: "Vous n'avez pas l'autorisation d'accéder à cette ressource.",
    },
    500: {
      title: 'Erreur serveur',
      description: "Une erreur interne s'est produite. Réessayez dans quelques instants.",
    },
  };

  const info = $derived(
    STATUS_MAP[$page.status] ?? {
      title: 'Une erreur est survenue',
      description: $page.error?.message ?? "Quelque chose s'est mal passé.",
    },
  );

  const Icon = $derived(
    $page.status === 404 ? FileQuestionIcon : $page.status >= 500 ? ServerCrashIcon : AlertCircleIcon,
  );
</script>

<svelte:head>
  <title>Erreur {$page.status} — SpinPad</title>
</svelte:head>

<div class="flex flex-col items-center justify-center min-h-[65vh] px-4 py-16 text-center">
  <!-- Decorative status code -->
  <div class="relative mb-8 select-none" aria-hidden="true">
    <span class="text-[8rem] font-black leading-none tracking-tighter text-border/60 sm:text-[10rem]">
      {$page.status}
    </span>
    <div class="absolute inset-0 flex items-center justify-center text-muted-foreground">
      <Icon class="size-10 opacity-60" />
    </div>
  </div>

  <!-- Message -->
  <h1 class="mb-2 text-2xl font-bold">{info.title}</h1>
  <p class="max-w-sm mb-8 text-sm leading-relaxed text-muted-foreground">
    {#if $page.status !== 404 && $page.error?.message && $page.error.message !== info.description}
      {$page.error.message}
    {:else}
      {info.description}
    {/if}
  </p>

  <!-- Actions -->
  <div class="flex flex-wrap justify-center gap-3">
    <Button href="/">Retour à l'accueil</Button>
    <Button variant="outline" onclick={() => history.back()}>Page précédente</Button>
  </div>
</div>
