<script lang="ts">
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";

  if (browser) {
    goto("/studio/app/", { replaceState: true });
  }
</script>

<svelte:head>
  <title>Studio — SpinPad</title>
  <meta http-equiv="refresh" content="0; url=/studio/app/" />
</svelte:head>

<noscript>
  <a href="/studio/app/">→ Ouvrir le Studio</a>
</noscript>
