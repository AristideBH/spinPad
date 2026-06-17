<script lang="ts">
  import { page } from '$app/stores';
  import { Button } from '$shared/components/ui/button/index.js';
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
  import ServerCrashIcon from '@lucide/svelte/icons/server-crash';
  import FileQuestionIcon from '@lucide/svelte/icons/file-question';

  const STATUS_MAP: Record<number, { title: string; description: string }> = {
    404: {
      title: 'Page not found',
      description: "This page doesn't exist or has been moved.",
    },
    403: {
      title: 'Access denied',
      description: "You don't have permission to access this resource.",
    },
    500: {
      title: 'Server error',
      description: 'An internal error occurred. Try again in a few moments.',
    },
  };

  const info = $derived(
    STATUS_MAP[$page.status] ?? {
      title: 'An error occurred',
      description: $page.error?.message ?? 'Something went wrong.',
    },
  );

  const Icon = $derived(
    $page.status === 404 ? FileQuestionIcon : $page.status >= 500 ? ServerCrashIcon : AlertCircleIcon,
  );
</script>

<svelte:head>
  <title>Error {$page.status} — SpinPad</title>
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
    <Button href="/">Back to home</Button>
    <Button variant="outline" onclick={() => history.back()}>Previous page</Button>
  </div>
</div>
