<script lang="ts">
  import Studio from "$shared/components/app/studio/Studio.svelte";
  import { useHeaderRight } from '$lib/header-right.svelte.js';
  import Test from '$lib/components/Test.svelte';
  const headerRight = useHeaderRight();
  $effect(() => {
    headerRight.set(Test);
    return () => headerRight.set(null); // nettoyage auto à la navigation
  });
</script>

<Studio />
