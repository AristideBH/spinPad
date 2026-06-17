// ═══════════════════════════════════════════════════════════════
//  lib/hooks/scroll-synced-tabs.svelte.ts — Tabs synced to a scroll list
//
//  Drives an UnderlineTabs strip whose sections live in a single
//  scrollable list: clicking a tab scrolls its section into view,
//  scrolling the list updates the active tab via IntersectionObserver,
//  and the active trigger scrolls into view in the tab strip itself.
//  Used by KeycodeList and SettingsTab.
// ═══════════════════════════════════════════════════════════════

import { scrollShadow } from '$shared/utils.js';

export class ScrollSyncedTabs {
  value = $state<string>('');
  listEl = $state<HTMLElement | null>(null);
  tabListEl = $state<HTMLElement | null>(null);
  tabWrapperEl = $state<HTMLElement | null>(null);
  sectionEls = $state<Record<string, HTMLElement | null>>({});

  #defaultId: string;
  #syncingFromTab = false;

  constructor(defaultId: string) {
    this.value = defaultId;
    this.#defaultId = defaultId;
  }

  scrollToSection = (val: string): void => {
    this.#syncingFromTab = true;
    if (val === this.#defaultId) {
      this.listEl?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.sectionEls[val]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTimeout(() => (this.#syncingFromTab = false), 700);
  };

  /** Wires the observer + tab-into-view + edge-shadow effects. Call once from the component's top level. */
  bind(orderedIds: () => string[]): void {
    $effect(() => {
      if (!this.listEl) return;
      const keys = Object.keys(this.sectionEls);
      if (keys.length === 0) return;
      const ids = orderedIds();

      const visible = new Set<string>();
      const observer = new IntersectionObserver(
        (entries) => {
          if (this.#syncingFromTab) return;
          for (const entry of entries) {
            const cat = entry.target.getAttribute('data-cat')!;
            if (entry.isIntersecting) visible.add(cat);
            else visible.delete(cat);
          }
          if (visible.size === 0) {
            this.value = this.#defaultId;
            return;
          }
          const first = ids.find((id) => visible.has(id));
          if (first) this.value = first;
        },
        { root: this.listEl, threshold: 0.1, rootMargin: '-5% 0px -50% 0px' },
      );

      for (const key of keys) {
        const el = this.sectionEls[key];
        if (el) observer.observe(el);
      }

      return () => observer.disconnect();
    });

    $effect(() => {
      this.value;
      const active = this.tabListEl?.querySelector<HTMLElement>('[data-state="active"]');
      active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });

    $effect(() => {
      if (!this.tabListEl || !this.tabWrapperEl) return;
      return scrollShadow(this.tabListEl, this.tabWrapperEl);
    });
  }
}
