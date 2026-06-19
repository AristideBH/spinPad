// ═══════════════════════════════════════════════════════════════
//  store/history.ts — Explicit-commit undo/redo log
//
//  Pure class (without Svelte runes) to isolate the undo/redo logic
//  from the config store. Unlike a reactive-getter-watching history,
//  entries are pushed only when the caller explicitly commits — used
//  by config.svelte.ts to commit exactly when the auto-save debounce
//  fires, so history lines up with what's sent to the device.
// ═══════════════════════════════════════════════════════════════

export class CommitHistory<T> {
  #log: T[] = [];
  #redoStack: T[] = [];
  readonly #capacity: number;

  constructor(capacity = 50) {
    this.#capacity = capacity;
  }

  /** Resets the log to a single starting snapshot (e.g. on config load). */
  seed(snapshot: T): void {
    this.#log = [snapshot];
    this.#redoStack = [];
  }

  /** Pushes a new snapshot, clearing the redo stack. */
  commit(snapshot: T): void {
    this.#log.push(snapshot);
    if (this.#log.length > this.#capacity) this.#log.shift();
    this.#redoStack = [];
  }

  /** Pops the current snapshot and returns the previous one, or `undefined` if there's nothing to undo. */
  undo(): T | undefined {
    if (this.#log.length < 2) return undefined;
    const curr = this.#log.pop() as T;
    this.#redoStack.push(curr);
    return this.#log[this.#log.length - 1];
  }

  /** Pops the most recently undone snapshot and returns it, or `undefined` if there's nothing to redo. */
  redo(): T | undefined {
    const next = this.#redoStack.pop();
    if (next === undefined) return undefined;
    this.#log.push(next);
    return next;
  }

  get canUndo(): boolean {
    return this.#log.length > 1;
  }

  get canRedo(): boolean {
    return this.#redoStack.length > 0;
  }
}
