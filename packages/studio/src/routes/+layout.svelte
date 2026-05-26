<script lang="ts">
  import "../app.css";

  let { children } = $props();
</script>

<main class="items-stretch w-full max-w-5xl px-6 py-6 mx-auto">
  {@render children()}
</main>
