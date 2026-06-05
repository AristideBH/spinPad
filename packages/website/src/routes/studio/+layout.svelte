<script lang="ts">
  let { children } = $props();
</script>

<div class="w-full max-w-5xl mx-auto select-none">
  {@render children()}
</div>
