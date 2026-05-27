<script lang="ts">
  import Studio from "$shared/components/app/studio/Studio.svelte";
  import { useHeaderRight } from '$lib/header-right.svelte.js';
  import StudioToolbar from "$shared/components/app/studio/StudioToolbar.svelte";

  const headerRight = useHeaderRight();

  $effect(() => {
    headerRight.set(StudioToolbar);
    return () => headerRight.set(null); // nettoyage auto à la navigation
  });
</script>

<Studio />
