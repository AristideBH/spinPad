import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
