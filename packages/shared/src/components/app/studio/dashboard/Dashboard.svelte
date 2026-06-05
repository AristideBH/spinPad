<script lang="ts">
  import { untrack } from 'svelte';
  import { cn } from '$shared/utils.js';
  import BatteryTile from './tile-battery.svelte';
  import FirmwareTile from './tile-firmware.svelte';
  import MainTile from './tile-main.svelte';
  import ScreenTile from './screen/tile-screen.svelte';
  import { IsMobile } from '$shared/store/is-mobile.svelte';

  const isMobile = new IsMobile(896);

  let sectionEl = $state<HTMLElement | null>(null);
  let annexEl = $state<HTMLElement | null>(null);
  let showAnnex = $state(!isMobile.current);

  // Sync zero-dimension to layout axis: fires on mount + breakpoint change.
  // Uses untrack for showAnnex so toggle animations are never interrupted.
  $effect(() => {
    const mobile = isMobile.current; // tracked — re-runs on resize
    if (!annexEl || untrack(() => showAnnex)) return;
    annexEl.getAnimations().forEach((a) => a.cancel());
    annexEl.style.width = '';
    annexEl.style.height = '';
    annexEl.style[mobile ? 'height' : 'width'] = '0px';
    annexEl.style.overflow = 'hidden';
  });

  function animateDimension(el: HTMLElement, prop: 'width' | 'height', from: number, to: number) {
    el.getAnimations().forEach((a) => a.cancel());

    if (Math.abs(to - from) < 2) {
      el.style[prop] = to === 0 ? '0px' : '';
      el.style.overflow = to === 0 ? 'hidden' : '';
      return;
    }

    // Pin to `from` before first render so no 1-frame flash
    el.style[prop] = `${from}px`;
    el.style.overflow = 'hidden';

    const anim = el.animate([{ [prop]: `${from}px` }, { [prop]: `${to}px` }], {
      duration: 280,
      easing: 'cubic-bezier(0.4,0,0.2,1)',
      fill: 'forwards',
    });

    anim.finished
      .then(() => {
        anim.commitStyles();
        anim.cancel();
        if (to === 0) {
          el.style[prop] = '0px';
        } else {
          el.style[prop] = '';
          el.style.overflow = '';
        }
      })
      .catch(() => {
        el.style[prop] = to === 0 ? '0px' : '';
        el.style.overflow = to === 0 ? 'hidden' : '';
      });
  }

  function toggleAnnex() {
    if (!sectionEl || !annexEl) return;
    const prop = isMobile.current ? 'height' : 'width';

    if (showAnnex) {
      // ── HIDE ───────────────────────────────────────────
      const prevSection = sectionEl.offsetHeight;
      const prevAnnex = prop === 'width' ? annexEl.offsetWidth : annexEl.offsetHeight;

      // display:none removes annex from layout cleanly — safe for measuring any prop
      annexEl.style.display = 'none';
      const toSection = sectionEl.offsetHeight;
      annexEl.style.display = '';
      void annexEl.offsetHeight;

      showAnnex = false;
      animateDimension(annexEl, prop, prevAnnex, 0);
      animateDimension(sectionEl, 'height', prevSection, toSection);
    } else {
      // ── SHOW ───────────────────────────────────────────
      const prevSection = sectionEl.offsetHeight;

      // Release 0 constraint → measure natural size → re-pin at 0 for animation start
      annexEl.style[prop] = '';
      void annexEl.offsetHeight;
      const toAnnex = prop === 'width' ? annexEl.offsetWidth : annexEl.offsetHeight;
      const toSection = sectionEl.offsetHeight;
      annexEl.style[prop] = '0px';
      void annexEl.offsetHeight;

      showAnnex = true;
      animateDimension(annexEl, prop, 0, toAnnex);
      animateDimension(sectionEl, 'height', prevSection, toSection);
    }
  }
</script>

<section
  bind:this={sectionEl}
  class={cn(
    'flex flex-col @4xl/main:flex-row gap-4 lg:max-h-[240px] transition-all',
    !showAnnex ? 'max-h-[240px]' : 'max-h-none',
  )}
>
  <div class={cn('min-w-0', showAnnex ? 'flex-1' : 'w-full')}>
    <MainTile {showAnnex} onToggle={toggleAnnex} />
  </div>

  <!-- Always in DOM; width (desktop) or height (mobile) animated to 0 on hide -->
  <div bind:this={annexEl} class="overflow-hidden flex-shrink-0 @4xl/main:w-2/5">
    <div class="grid h-full min-w-0 grid-cols-2 gap-4">
      <div class="h-full min-w-0 row-span-2"><ScreenTile /></div>
      <div class="h-full min-w-0"><BatteryTile /></div>
      <div class="h-full min-w-0"><FirmwareTile /></div>
    </div>
  </div>
</section>
