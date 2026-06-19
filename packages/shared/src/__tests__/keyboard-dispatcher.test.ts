import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  keyboardDispatcher,
  KEYBOARD_PRIORITY,
  __resetKeyboardDispatcherForTests,
} from '$shared/lib/keyboard-dispatcher.js';
import { pushModal, __resetModalStackForTests } from '$shared/lib/modal-stack.js';

type Listener = (e: unknown) => void;

function fireKeydown(listeners: Listener[], code: string) {
  const e = { code, preventDefault: vi.fn() };
  for (const l of listeners) l(e);
  return e;
}

describe('keyboardDispatcher', () => {
  let listeners: Listener[];
  let activeElement: { tagName: string; isContentEditable?: boolean } | null;

  beforeEach(() => {
    listeners = [];
    activeElement = null;
    vi.stubGlobal('window', {
      addEventListener: (_type: string, fn: Listener) => listeners.push(fn),
      removeEventListener: (_type: string, fn: Listener) => {
        listeners = listeners.filter((l) => l !== fn);
      },
    });
    vi.stubGlobal('document', {
      get activeElement() {
        return activeElement;
      },
    });
    vi.stubGlobal('HTMLElement', class {});
    __resetKeyboardDispatcherForTests();
    __resetModalStackForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('installs exactly one window listener no matter how many scopes are pushed', () => {
    keyboardDispatcher.push({ priority: KEYBOARD_PRIORITY.DEV_SIM, onKey: () => false });
    keyboardDispatcher.push({ priority: KEYBOARD_PRIORITY.UNDO_REDO, onKey: () => false });
    expect(listeners.length).toBe(1);
  });

  it('removes the window listener once the last scope is popped', () => {
    const a = keyboardDispatcher.push({ priority: KEYBOARD_PRIORITY.DEV_SIM, onKey: () => false });
    const b = keyboardDispatcher.push({ priority: KEYBOARD_PRIORITY.UNDO_REDO, onKey: () => false });
    a.pop();
    expect(listeners.length).toBe(1);
    b.pop();
    expect(listeners.length).toBe(0);
  });

  it('runs the highest-priority scope first', () => {
    const order: string[] = [];
    keyboardDispatcher.push({
      priority: KEYBOARD_PRIORITY.UNDO_REDO,
      onKey: () => {
        order.push('low');
        return true;
      },
    });
    keyboardDispatcher.push({
      priority: KEYBOARD_PRIORITY.DEV_SIM,
      onKey: () => {
        order.push('high');
        return true;
      },
    });
    fireKeydown(listeners, 'KeyZ');
    expect(order).toEqual(['high']);
  });

  it('falls through to the next lower-priority scope when unclaimed', () => {
    const undoSpy = vi.fn(() => true);
    keyboardDispatcher.push({ priority: KEYBOARD_PRIORITY.UNDO_REDO, onKey: undoSpy });
    keyboardDispatcher.push({
      priority: KEYBOARD_PRIORITY.DEV_SIM,
      onKey: (e) => (e as { code: string }).code === 'ArrowRight',
    });
    // Dev-sim scope doesn't recognize KeyZ -> returns false -> undo/redo gets a turn.
    fireKeydown(listeners, 'KeyZ');
    expect(undoSpy).toHaveBeenCalledTimes(1);
  });

  it('does not fall through once a scope claims the key', () => {
    const lowerSpy = vi.fn(() => true);
    keyboardDispatcher.push({ priority: KEYBOARD_PRIORITY.UNDO_REDO, onKey: lowerSpy });
    keyboardDispatcher.push({ priority: KEYBOARD_PRIORITY.DEV_SIM, onKey: () => true });
    fireKeydown(listeners, 'ArrowRight');
    expect(lowerSpy).not.toHaveBeenCalled();
  });

  it('skips a scope while a form input is focused unless allowInInputs is set', () => {
    activeElement = { tagName: 'INPUT' };
    const guarded = vi.fn(() => true);
    const allowed = vi.fn(() => true);
    keyboardDispatcher.push({ priority: KEYBOARD_PRIORITY.MACRO_RECORDING, onKey: guarded });
    keyboardDispatcher.push({ priority: KEYBOARD_PRIORITY.UNDO_REDO, allowInInputs: true, onKey: allowed });
    fireKeydown(listeners, 'KeyA');
    expect(guarded).not.toHaveBeenCalled();
    expect(allowed).toHaveBeenCalledTimes(1);
  });

  it('runs scopes normally when no input is focused', () => {
    activeElement = { tagName: 'BUTTON' };
    const handler = vi.fn(() => true);
    keyboardDispatcher.push({ priority: KEYBOARD_PRIORITY.DEV_SIM, onKey: handler });
    fireKeydown(listeners, 'Space');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('skips a scope while a modal is open unless allowInModals is set', () => {
    // e.g. a custom widget (Scrubber) inside the Settings sheet isn't a
    // literal form element, so the input-guard alone wouldn't catch this.
    const popModal = pushModal();
    const guarded = vi.fn(() => true);
    const allowed = vi.fn(() => true);
    keyboardDispatcher.push({ priority: KEYBOARD_PRIORITY.DEV_SIM, onKey: guarded });
    keyboardDispatcher.push({ priority: KEYBOARD_PRIORITY.MACRO_RECORDING, allowInModals: true, onKey: allowed });
    fireKeydown(listeners, 'ArrowRight');
    expect(guarded).not.toHaveBeenCalled();
    expect(allowed).toHaveBeenCalledTimes(1);
    popModal();
  });

  it('runs scopes normally again once the modal closes', () => {
    const popModal = pushModal();
    const handler = vi.fn(() => true);
    keyboardDispatcher.push({ priority: KEYBOARD_PRIORITY.DEV_SIM, onKey: handler });
    fireKeydown(listeners, 'ArrowRight');
    expect(handler).not.toHaveBeenCalled();
    popModal();
    fireKeydown(listeners, 'ArrowRight');
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
