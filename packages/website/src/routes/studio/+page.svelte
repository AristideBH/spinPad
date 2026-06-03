<script lang="ts">
  import Studio from "$shared/components/app/studio/Studio.svelte";
  import StudioToolbar from "$shared/components/app/studio/StudioToolbar.svelte";
  import SetHeaderRight from '$lib/SetHeaderRight.svelte';
</script>

{#snippet toolbar()}
  <StudioToolbar />
{/snippet}

<SetHeaderRight content={toolbar} />
<Studio />
