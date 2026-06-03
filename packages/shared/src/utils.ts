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
 * Ombres de bord (gauche/droite) pour une zone à défilement horizontal.
 *
 * Les ombres sont ancrées au `container` (élément NON défilant, position
 * relative) et restent fixes à ses bords — seule leur opacité varie. La
 * position de défilement est lue sur `scroller` (le vrai conteneur scrollable,
 * qui peut différer du container, ex. viewport bits-ui imbriqué). Aucun
 * `transform` lié au scroll → pas de saccade.
 */
export function scrollShadow(scroller: HTMLElement, container: HTMLElement = scroller) {
  container.style.position ||= 'relative';

  const shadowLeft = document.createElement('div');
  const shadowRight = document.createElement('div');
  container.style.overflow = 'clip'; // masque les ombres quand elles dépassent du container (ex. au redimensionnement)

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
    // Pleine opacité dès qu'on est à >8px d'un bord, fondu doux au ras du bord.
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
