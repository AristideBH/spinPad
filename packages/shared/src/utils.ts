import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { tick } from 'svelte';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function safeCapitalize(str: string) {
  if (typeof str !== 'string' || str.length === 0) {
    return '';
  }
  return str[0].toUpperCase() + str.slice(1);
}

/**
 * Edge shadows (left/right) for a horizontally scrolling area.
 *
 * The shadows are anchored to the `container` (NON-scrolling element, relative
 * position) and stay fixed at its edges — only their opacity varies. The scroll
 * position is read from `scroller` (the real scrollable container, which may
 * differ from the container, e.g. nested bits-ui viewport). No scroll-linked
 * `transform` → no jank.
 */
export function scrollShadow(scroller: HTMLElement, container: HTMLElement = scroller) {
  container.style.position ||= 'relative';

  const shadowLeft = document.createElement('div');
  const shadowRight = document.createElement('div');
  container.style.overflow = 'clip'; // hides the shadows when they overflow the container (e.g. on resize)

  const color = `var(--scroll-shadow-color, rgba(0,0,0,0.5))`;
  const baseShadowStyle =
    'position:absolute;top:0;bottom:0;width:12px;z-index:10;pointer-events:none;transition:opacity 0.15s ease;';

  shadowLeft.style.cssText = `${baseShadowStyle}left:0;background:linear-gradient(90deg, ${color}, transparent);opacity:0;`;
  shadowRight.style.cssText = `${baseShadowStyle}right:0;background:linear-gradient(270deg, ${color}, transparent);opacity:0;`;

  container.appendChild(shadowLeft);
  container.appendChild(shadowRight);

  function handleScroll() {
    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    if (maxScroll <= 1) {
      shadowLeft.style.opacity = '0';
      shadowRight.style.opacity = '0';
      return;
    }
    const left = scroller.scrollLeft;
    // Full opacity as soon as we are >8px from an edge, soft fade right at the edge.
    shadowLeft.style.opacity = `${Math.min(1, left / 8)}`;
    shadowRight.style.opacity = `${Math.min(1, (maxScroll - left) / 8)}`;
  }

  scroller.addEventListener('scroll', handleScroll, { passive: true });
  const resizeObserver = new ResizeObserver(handleScroll);
  resizeObserver.observe(scroller);
  requestAnimationFrame(handleScroll);

  return () => {
    scroller.removeEventListener('scroll', handleScroll);
    resizeObserver.disconnect();
    shadowLeft.remove();
    shadowRight.remove();
  };
}

/**
 * Drives horizontal scroll from touch drags on `viewport` (bits-ui hides the native
 * scrollbar and the touch-action chain doesn't engage native finger-scroll otherwise).
 * A drag started on a `[data-grip]` handle is left alone for reordering. Returns the cleanup function.
 */
export function bindTouchDragScroll(viewport: HTMLElement): () => void {
  viewport.style.touchAction = 'pan-x';

  let startX = 0;
  let startScroll = 0;
  let dragging = false;

  function onStart(e: TouchEvent) {
    if ((e.target as HTMLElement)?.closest('[data-grip]')) return;
    dragging = true;
    startX = e.touches[0].clientX;
    startScroll = viewport.scrollLeft;
  }
  function onMove(e: TouchEvent) {
    if (!dragging) return;
    viewport.scrollLeft = startScroll - (e.touches[0].clientX - startX);
  }
  function onEnd() {
    dragging = false;
  }

  viewport.addEventListener('touchstart', onStart, { passive: true });
  viewport.addEventListener('touchmove', onMove, { passive: true });
  viewport.addEventListener('touchend', onEnd, { passive: true });
  return () => {
    viewport.removeEventListener('touchstart', onStart);
    viewport.removeEventListener('touchmove', onMove);
    viewport.removeEventListener('touchend', onEnd);
  };
}

/**
 * Scrolls the `label[for="targetId"]` tab into view inside `viewport`, respecting a sticky
 * `[data-add-btn]` on the right edge. tick() flushes Svelte's DOM, rAF waits for layout so
 * scrollWidth/getBoundingClientRect are accurate.
 */
export async function scrollLabelIntoView(viewport: HTMLElement, targetId: string): Promise<void> {
  await tick();
  requestAnimationFrame(() => {
    if (viewport.scrollWidth <= viewport.clientWidth) return;
    const el = viewport.querySelector(`label[for="${targetId}"]`) as HTMLElement | null;
    if (!el) return;
    const addBtn = viewport.querySelector('[data-add-btn]') as HTMLElement | null;
    const stickyW = addBtn ? addBtn.offsetWidth : 0;
    const vpRect = viewport.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const elL = elRect.left - vpRect.left;
    const elR = elRect.right - vpRect.left;
    const available = viewport.clientWidth - stickyW;
    if (elL < 0) {
      viewport.scrollBy({ left: elL - 8, behavior: 'smooth' });
    } else if (elR > available) {
      viewport.scrollBy({ left: elR - available + 8, behavior: 'smooth' });
    }
  });
}
