// ═══════════════════════════════════════════════════════════════
//  lib/keyboard-dispatcher.ts — Centralized window-level keydown dispatcher
//
//  Owns the single capture-phase `keydown` listener on `window` for
//  app-level keyboard shortcuts (training-mode device simulation, macro
//  recording, undo/redo, ...). Callers register a priority-ordered "scope";
//  the dispatcher walks scopes from highest to lowest priority per keydown.
//
//  Convention:
//   - A scope's `onKey` returns `true` if it claimed the key: the walk
//     stops there. Return `false`/`undefined` to let the next lower-priority
//     scope try. Call `e.preventDefault()` yourself inside `onKey` if you
//     need to suppress native browser behavior — the dispatcher never does
//     this for you.
//   - Before calling a scope's `onKey`, if `document.activeElement` is an
//     <input>/<textarea>/<select>/[contenteditable], that scope is SKIPPED
//     (treated as if it returned false) unless it set `allowInInputs: true`.
//     This guarantees typing in a form field is never intercepted by a
//     shortcut that didn't explicitly opt in.
//   - Same idea for modals: while any ResponsiveSheet/Dialog/Drawer is open
//     (see lib/modal-stack.ts), a scope is skipped unless it set
//     `allowInModals: true`. Catches custom widgets (sliders, etc.) inside
//     a sheet that aren't literal form elements but still own their own
//     arrow/space handling.
// ═══════════════════════════════════════════════════════════════

import { isAnyModalOpen } from './modal-stack.js';

export interface KeyboardScopeOptions {
  /** Higher runs first. Ties broken by push order (last pushed wins). */
  priority: number;
  /** If true, this scope still runs even when an input/textarea/contenteditable/select is focused. */
  allowInInputs?: boolean;
  /** If true, this scope still runs even while a ResponsiveSheet/Dialog/Drawer is open. */
  allowInModals?: boolean;
  /**
   * Return `true` if this scope claimed/handled the key (stops the walk
   * down the stack). Return `false`/`undefined` to let the next
   * lower-priority scope try. Call `e.preventDefault()` yourself if you
   * need to suppress native behavior.
   */
  onKey: (e: KeyboardEvent) => boolean | void;
}

export interface KeyboardScopeHandle {
  /** Removes this scope from the stack. Safe to call multiple times. */
  pop: () => void;
}

export const KEYBOARD_PRIORITY = {
  MACRO_RECORDING: 300,
  DEV_SIM: 200,
  UNDO_REDO: 100,
} as const;

interface ScopeEntry extends KeyboardScopeOptions {
  id: number;
}

let _idCounter = 0;
const _scopes: ScopeEntry[] = [];
let _listenerInstalled = false;

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isEditableTarget(el: Element | null): boolean {
  if (!el) return false;
  if (EDITABLE_TAGS.has(el.tagName)) return true;
  return el instanceof HTMLElement && el.isContentEditable;
}

function insertSorted(entry: ScopeEntry): void {
  // Highest priority first. On equal priority, a newly-pushed entry is
  // inserted before older same-priority entries (last-pushed-wins-on-tie),
  // but never before a strictly higher-priority entry.
  let i = 0;
  while (i < _scopes.length && _scopes[i].priority >= entry.priority) i++;
  _scopes.splice(i, 0, entry);
}

function onWindowKeydown(e: KeyboardEvent): void {
  const editable = isEditableTarget(document.activeElement);
  const modalOpen = isAnyModalOpen();
  for (const scope of _scopes) {
    if (editable && !scope.allowInInputs) continue;
    if (modalOpen && !scope.allowInModals) continue;
    if (scope.onKey(e)) return;
  }
}

function ensureListener(): void {
  if (_listenerInstalled) return;
  window.addEventListener('keydown', onWindowKeydown, true);
  _listenerInstalled = true;
}

function teardownListenerIfEmpty(): void {
  if (_scopes.length === 0 && _listenerInstalled) {
    window.removeEventListener('keydown', onWindowKeydown, true);
    _listenerInstalled = false;
  }
}

export const keyboardDispatcher = {
  push(options: KeyboardScopeOptions): KeyboardScopeHandle {
    const entry: ScopeEntry = { ...options, id: ++_idCounter };
    insertSorted(entry);
    ensureListener();
    let popped = false;
    return {
      pop: () => {
        if (popped) return;
        popped = true;
        const idx = _scopes.findIndex((s) => s.id === entry.id);
        if (idx !== -1) _scopes.splice(idx, 1);
        teardownListenerIfEmpty();
      },
    };
  },
};

/** Test-only: clears all scopes and tears down the listener. Not for app code. */
export function __resetKeyboardDispatcherForTests(): void {
  _scopes.length = 0;
  teardownListenerIfEmpty();
}
