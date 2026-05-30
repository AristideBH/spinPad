<script lang="ts">
  let { children } = $props();
</script>

<div class="w-full max-w-5xl px-6 py-6 mx-auto">
  {@render children()}
</div>
