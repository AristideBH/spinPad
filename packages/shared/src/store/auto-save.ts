// ═══════════════════════════════════════════════════════════════
//  store/auto-save.ts — Deferred save policy
//
//  Pure class (without Svelte runes) to isolate the debounce logic
//  from the config store. Testable via vi.useFakeTimers() without the
//  Svelte runtime.
// ═══════════════════════════════════════════════════════════════

export class AutoSave {
  readonly #delay: number;
  readonly #onSave: () => Promise<void>;
  #timer: ReturnType<typeof setTimeout> | null = null;

  constructor(onSave: () => Promise<void>, delayMs = 800) {
    this.#onSave = onSave;
    this.#delay  = delayMs;
  }

  /** `true` if a deferred save is pending (timer armed). */
  get pending(): boolean {
    return this.#timer !== null;
  }

  /** Schedules a deferred save (debounce). */
  schedule(): void {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.#timer = null;
      void this.#onSave();
    }, this.#delay);
  }

  /** Cancels the pending deferred save. */
  cancel(): void {
    if (this.#timer) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
  }

  /**
   * Cancels the timer and saves immediately.
   * Use for manual save and beforeunload.
   */
  async flush(): Promise<void> {
    this.cancel();
    await this.#onSave();
  }
}
