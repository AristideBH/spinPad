// ═══════════════════════════════════════════════════════════════
//  lib/hooks/synced-hex-color.svelte.ts — store-backed hex color
//
//  Keeps a $state hex string in sync with a derived color from the
//  store, while still allowing a bound ColorPicker to drive it
//  locally during a drag (hence $state + sync effect, not $derived).
// ═══════════════════════════════════════════════════════════════

export class SyncedHexColor {
  value = $state<string>('#ffffff');

  #get: () => string;

  constructor(get: () => string) {
    this.#get = get;
    this.value = get().toUpperCase();
  }

  /** Wires the store → local sync effect. Call once from the component's top level. */
  bind(): void {
    $effect(() => {
      const normalized = this.#get().toUpperCase();
      if (this.value !== normalized) this.value = normalized;
    });
  }
}
