/**
 * Shared state of the "Global macros" drawer (MacroManager).
 *
 * Allows opening the macro manager on a specific slot from anywhere
 * (e.g. a toast action after creating a macro in live-record).
 */
class MacroManagerStore {
  /** Is the drawer open? Bound via `bind:open` in MacroManager.svelte. */
  open = $state(false);

  /** Slot to load on next opening (null = keep the current selection). */
  requestedIndex = $state<number | null>(null);

  /** Opens the drawer and requests loading of slot `idx`. */
  openAt(idx: number): void {
    this.requestedIndex = idx;
    this.open = true;
  }
}

export const macroManager = new MacroManagerStore();
