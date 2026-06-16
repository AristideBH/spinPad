<script lang="ts">
  import { navigating } from '$app/state';
  import { curtainIn, curtainOut, type CurtainDir } from '$lib/page-transitions';

  let { direction = 'bottom' as CurtainDir }: { direction?: CurtainDir } = $props();

  // Real loading state: only raise the curtain if the load outlasts ~100ms, so
  // instant/cached navigations get the content fly-in without a curtain flash.
  let show = $state(false);

  $effect(() => {
    if (navigating.to) {
      const id = setTimeout(() => (show = true), 100);
      return () => clearTimeout(id);
    }
    show = false;
  });
</script>

{#if show}
  <div
    class="bg-background absolute inset-0 z-20 md:rounded-xl"
    aria-hidden="true"
    in:curtainIn={{ direction }}
    out:curtainOut={{ direction }}
  ></div>
{/if}
