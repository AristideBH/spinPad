import { describe, it, expect, vi, beforeEach } from 'vitest';

const pushMock = vi.fn();
const popMock = vi.fn();

vi.mock('$shared/lib/keyboard-dispatcher.js', () => ({
  KEYBOARD_PRIORITY: { MACRO_RECORDING: 300, DEV_SIM: 200, UNDO_REDO: 100 },
  keyboardDispatcher: {
    push: (options: { priority: number; onKey: (e: unknown) => boolean | void }) => {
      pushMock(options);
      return { pop: popMock };
    },
  },
}));

import { bindDevKeySimulation } from '$shared/lib/dev-key-simulation.js';

function fakeKey(code: string, repeat = false) {
  return { code, repeat, preventDefault: vi.fn() };
}

describe('bindDevKeySimulation', () => {
  beforeEach(() => {
    pushMock.mockClear();
    popMock.mockClear();
  });

  function getOnKey(): (e: ReturnType<typeof fakeKey>) => boolean | void {
    const call = pushMock.mock.calls.at(-1);
    return call![0].onKey;
  }

  it('registers a single dispatcher scope at DEV_SIM priority', () => {
    const cleanup = bindDevKeySimulation({ onKey: vi.fn() });
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock.mock.calls[0][0].priority).toBe(200);
    cleanup();
  });

  it('maps digit keys to onKey with the matching index', () => {
    const onKey = vi.fn();
    const cleanup = bindDevKeySimulation({ onKey });
    getOnKey()(fakeKey('Digit3'));
    expect(onKey).toHaveBeenCalledWith(2);
    cleanup();
  });

  it('maps numpad keys to the same index as the equivalent digit', () => {
    const onKey = vi.fn();
    const cleanup = bindDevKeySimulation({ onKey });
    getOnKey()(fakeKey('Numpad0'));
    expect(onKey).toHaveBeenCalledWith(9);
    cleanup();
  });

  it('ignores repeated keydown events and does not claim them', () => {
    const onKey = vi.fn();
    const cleanup = bindDevKeySimulation({ onKey });
    const result = getOnKey()(fakeKey('Digit1', true));
    expect(onKey).not.toHaveBeenCalled();
    expect(result).toBe(false);
    cleanup();
  });

  it('calls onEncoderCW on ArrowRight, prevents default, and claims the key', () => {
    const onEncoderCW = vi.fn();
    const cleanup = bindDevKeySimulation({ onKey: vi.fn(), onEncoderCW });
    const e = fakeKey('ArrowRight');
    const result = getOnKey()(e);
    expect(onEncoderCW).toHaveBeenCalled();
    expect(e.preventDefault).toHaveBeenCalled();
    expect(result).toBe(true);
    cleanup();
  });

  it('calls onEncoderCCW on ArrowLeft', () => {
    const onEncoderCCW = vi.fn();
    const cleanup = bindDevKeySimulation({ onKey: vi.fn(), onEncoderCCW });
    getOnKey()(fakeKey('ArrowLeft'));
    expect(onEncoderCCW).toHaveBeenCalled();
    cleanup();
  });

  it('calls onEncoderPress on Space', () => {
    const onEncoderPress = vi.fn();
    const cleanup = bindDevKeySimulation({ onKey: vi.fn(), onEncoderPress });
    getOnKey()(fakeKey('Space'));
    expect(onEncoderPress).toHaveBeenCalled();
    cleanup();
  });

  it('does not claim an unrelated key, leaving it false for fallthrough', () => {
    const onKey = vi.fn();
    const onEncoderCW = vi.fn();
    const cleanup = bindDevKeySimulation({ onKey, onEncoderCW });
    const result = getOnKey()(fakeKey('KeyZ'));
    expect(onKey).not.toHaveBeenCalled();
    expect(onEncoderCW).not.toHaveBeenCalled();
    expect(result).toBe(false);
    cleanup();
  });

  it('fans a single scope out to multiple concurrently-bound handler sets', () => {
    const onKeyA = vi.fn();
    const onKeyB = vi.fn();
    const cleanupA = bindDevKeySimulation({ onKey: onKeyA });
    const cleanupB = bindDevKeySimulation({ onKey: onKeyB });
    // Only one scope is ever pushed, no matter how many bindDevKeySimulation
    // callers are active at once (e.g. keyVisuals + trainingMode together).
    expect(pushMock).toHaveBeenCalledTimes(1);
    getOnKey()(fakeKey('Digit1'));
    expect(onKeyA).toHaveBeenCalledWith(0);
    expect(onKeyB).toHaveBeenCalledWith(0);
    cleanupA();
    cleanupB();
  });

  it('only pops the dispatcher scope once the last handler unbinds', () => {
    const cleanupA = bindDevKeySimulation({ onKey: vi.fn() });
    const cleanupB = bindDevKeySimulation({ onKey: vi.fn() });
    cleanupA();
    expect(popMock).not.toHaveBeenCalled();
    cleanupB();
    expect(popMock).toHaveBeenCalledTimes(1);
  });
});
