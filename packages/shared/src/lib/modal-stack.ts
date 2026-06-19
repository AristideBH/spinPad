// ═══════════════════════════════════════════════════════════════
//  lib/modal-stack.ts — Tracks how many sheets/dialogs/drawers are open
//
//  Backs the keyboard dispatcher's `allowInModals` guard: scopes that
//  shouldn't fire while the user's focus has moved into an unrelated
//  modal (e.g. training-mode device simulation reacting to arrow keys
//  meant for a slider inside the Settings sheet) are skipped by default
//  whenever this count is non-zero. Nested sheets each push their own
//  entry, so the guard stays correct regardless of nesting depth.
// ═══════════════════════════════════════════════════════════════

let _openCount = 0;

/** Call when a modal opens. Returns the cleanup to call when it closes. */
export function pushModal(): () => void {
  _openCount++;
  let popped = false;
  return () => {
    if (popped) return;
    popped = true;
    _openCount--;
  };
}

export function isAnyModalOpen(): boolean {
  return _openCount > 0;
}

/** Test-only: resets the count. Not for app code. */
export function __resetModalStackForTests(): void {
  _openCount = 0;
}
