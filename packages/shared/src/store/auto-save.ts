// ═══════════════════════════════════════════════════════════════
//  store/auto-save.ts — Politique de sauvegarde différée
//
//  Classe pure (sans Svelte runes) pour isoler la logique debounce
//  du store de config. Testable via vi.useFakeTimers() sans runtime
//  Svelte.
// ═══════════════════════════════════════════════════════════════

export class AutoSave {
  readonly #delay: number;
  readonly #onSave: () => Promise<void>;
  #timer: ReturnType<typeof setTimeout> | null = null;

  constructor(onSave: () => Promise<void>, delayMs = 800) {
    this.#onSave = onSave;
    this.#delay  = delayMs;
  }

  /** `true` si une sauvegarde différée est en attente (timer armé). */
  get pending(): boolean {
    return this.#timer !== null;
  }

  /** Planifie une sauvegarde différée (debounce). */
  schedule(): void {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.#timer = null;
      void this.#onSave();
    }, this.#delay);
  }

  /** Annule la sauvegarde différée en attente. */
  cancel(): void {
    if (this.#timer) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
  }

  /**
   * Annule le timer et sauvegarde immédiatement.
   * À utiliser pour la sauvegarde manuelle et le beforeunload.
   */
  async flush(): Promise<void> {
    this.cancel();
    await this.#onSave();
  }
}
