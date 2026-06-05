<script lang="ts">
  import { flushSync } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { cn } from '$shared/utils.js';
  import BatteryTile from './tile-battery.svelte';
  import FirmwareTile from './tile-firmware.svelte';
  import MainTile from './tile-main.svelte';
  import ScreenTile from './screen/tile-screen.svelte';
  import { IsMobile } from '$shared/store/is-mobile.svelte';

  let isDesktop = $derived(new IsMobile(976));
  let sectionEl = $state<HTMLElement | null>(null);
  let mainTileEl = $state<HTMLElement | null>(null);
  let annexLaidOut = $derived(!isDesktop.current ? false : true);
  let showAnnex = $derived(!isDesktop.current && annexLaidOut ? true : false);

  function annexTransition(node: Element, { delay = 0 }: { delay?: number } = {}) {
    const desktop = !isDesktop.current;
    return {
      delay,
      duration: 300,
      easing: cubicOut,
      css: (t: number) => {
        const dx = desktop ? (1 - t) * 60 : 0;
        const dy = desktop ? 0 : (1 - t) * 40;
        return `transform: translate(${-dx}px, ${-dy}px); opacity: ${t};`;
      },
    };
  }

  function animateHeight(el: HTMLElement, fromH: number, toH: number) {
    // Cancel any in-progress animation before starting a new one
    el.getAnimations().forEach((a) => a.cancel());
    el.style.height = '';
    el.style.overflow = '';

    if (Math.abs(toH - fromH) < 2) return;

    el.style.overflow = 'visible';

    const anim = el.animate([{ height: `${fromH}px` }, { height: `${toH}px` }], {
      duration: 280,
      easing: 'cubic-bezier(0.4,0,0.2,1)',
      fill: 'forwards',
    });

    anim.finished
      .then(() => {
        anim.commitStyles(); // bake toH into inline style
        anim.cancel(); // remove fill
        el.style.height = ''; // release to natural height
        el.style.overflow = '';
      })
      .catch(() => {
        // cancelled mid-flight — just clear inline styles
        el.style.height = '';
        el.style.overflow = '';
      });
  }

  function measure() {
    sectionEl!.style.height = '';
    mainTileEl!.style.height = '';
    return {
      toMain: mainTileEl!.offsetHeight,
      toSection: sectionEl!.offsetHeight,
    };
  }

  function toggleAnnex() {
    if (showAnnex) {
      const prevSection = sectionEl!.offsetHeight;
      const prevMain = mainTileEl!.offsetHeight;
      sectionEl!.style.height = `${prevSection}px`;
      mainTileEl!.style.height = `${prevMain}px`;

      showAnnex = false;

      setTimeout(() => {
        // flushSync guarantees annexLaidOut DOM update is committed before we measure
        flushSync(() => {
          annexLaidOut = false;
        });
        const { toMain, toSection } = measure();
        animateHeight(sectionEl!, prevSection, toSection);
        animateHeight(mainTileEl!, prevMain, toMain);
      }, 470);
    } else {
      const prevSection = sectionEl!.offsetHeight;
      const prevMain = mainTileEl!.offsetHeight;
      sectionEl!.style.height = `${prevSection}px`;
      mainTileEl!.style.height = `${prevMain}px`;

      // flushSync batches both changes and commits to DOM synchronously
      flushSync(() => {
        annexLaidOut = true;
        showAnnex = true;
      });
      const { toMain, toSection } = measure();
      animateHeight(sectionEl!, prevSection, toSection);
      animateHeight(mainTileEl!, prevMain, toMain);
    }
  }
</script>

<section bind:this={sectionEl} class="grid grid-cols-2 gap-4 @lg/main:grid-cols-3 @4xl/main:grid-cols-5">
  <div
    bind:this={mainTileEl}
    class={cn(
      'h-full',
      annexLaidOut ? 'col-span-full @4xl/main:col-span-3 @4xl/main:row-span-2' : 'col-span-full max-h-[32rem]',
    )}
  >
    <MainTile {showAnnex} onToggle={toggleAnnex} />
  </div>
  {#if showAnnex}
    <div class="h-full row-span-2" in:annexTransition={{ delay: 0 }} out:annexTransition={{ delay: 150 }}>
      <ScreenTile />
    </div>
    <div
      class="@lg/main:row-span-2 @4xl/main:row-span-1 h-full"
      in:annexTransition={{ delay: 75 }}
      out:annexTransition={{ delay: 75 }}
    >
      <BatteryTile />
    </div>
    <div
      class="@lg/main:row-span-2 @4xl/main:row-span-1 h-full"
      in:annexTransition={{ delay: 150 }}
      out:annexTransition={{ delay: 0 }}
    >
      <FirmwareTile />
    </div>
  {/if}
</section>
