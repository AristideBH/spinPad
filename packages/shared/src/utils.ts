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

export function scrollShadow(node: HTMLElement) {
  console.log('Attaching scroll shadow to', node);
  // 1. Configuration des styles structurels du conteneur
  node.style.position = 'relative';
  node.style.overflowX = 'auto';

  // 2. Création dynamique des ombres
  const shadowLeft = document.createElement('div');
  const shadowRight = document.createElement('div');

  const baseShadowStyle = `
    position: absolute;
    top: 0;
    bottom: 0;
    width: 12px;
    z-index: 10;
    pointer-events: none;
    transition: opacity 0.2s ease;
  `;

  shadowLeft.style.cssText = `${baseShadowStyle} left: 0; background: linear-gradient(90deg, rgba(0, 0, 0, 0.5), transparent); opacity: 0;`;
  shadowRight.style.cssText = `${baseShadowStyle} right: 0; background: linear-gradient(270deg, rgba(0, 0, 0, 0.5), transparent); opacity: 0;`;

  node.appendChild(shadowLeft);
  node.appendChild(shadowRight);

  // 3. Gestionnaire de scroll
  function handleScroll() {
    const maxScroll = node.scrollWidth - node.clientWidth;

    if (maxScroll <= 0) {
      shadowLeft.style.opacity = '0';
      shadowRight.style.opacity = '0';
      return;
    }

    console.log('Scroll position:', node.scrollLeft, 'Max scroll:', maxScroll);

    const currentScroll = node.scrollLeft / maxScroll;

    // Fixer la position des ombres par rapport au scroll horizontal
    shadowLeft.style.transform = `translateX(${node.scrollLeft}px)`;
    shadowRight.style.transform = `translateX(${node.scrollLeft}px)`;

    shadowLeft.style.opacity = `${currentScroll}`;
    shadowRight.style.opacity = `${1 - currentScroll}`;
  }

  // 4. Écouteurs d'événements
  node.addEventListener('scroll', handleScroll);

  const resizeObserver = new ResizeObserver(handleScroll);
  resizeObserver.observe(node);

  // Lancement initial
  setTimeout(handleScroll, 0);

  // 5. La fonction Teardown (appelée par Svelte lors du démontage)
  return () => {
    node.removeEventListener('scroll', handleScroll);
    resizeObserver.disconnect();
    shadowLeft.remove();
    shadowRight.remove();
  };
}
