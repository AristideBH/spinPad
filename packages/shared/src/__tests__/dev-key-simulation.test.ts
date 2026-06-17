import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { bindDevKeySimulation } from "$shared/lib/dev-key-simulation.js";

type Listener = (e: { code: string; repeat?: boolean; preventDefault(): void }) => void;

function fireKey(listeners: Listener[], code: string, repeat = false) {
  const e = { code, repeat, preventDefault: vi.fn() };
  for (const l of listeners) l(e);
  return e;
}

describe("bindDevKeySimulation", () => {
  let listeners: Listener[];

  beforeEach(() => {
    listeners = [];
    vi.stubGlobal("window", {
      addEventListener: (_type: string, fn: Listener) => listeners.push(fn),
      removeEventListener: (_type: string, fn: Listener) => {
        listeners = listeners.filter((l) => l !== fn);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps digit keys to onKey with the matching index", () => {
    const onKey = vi.fn();
    bindDevKeySimulation({ onKey });
    fireKey(listeners, "Digit3");
    expect(onKey).toHaveBeenCalledWith(2);
  });

  it("maps numpad keys to the same index as the equivalent digit", () => {
    const onKey = vi.fn();
    bindDevKeySimulation({ onKey });
    fireKey(listeners, "Numpad0");
    expect(onKey).toHaveBeenCalledWith(9);
  });

  it("ignores repeated keydown events", () => {
    const onKey = vi.fn();
    bindDevKeySimulation({ onKey });
    fireKey(listeners, "Digit1", true);
    expect(onKey).not.toHaveBeenCalled();
  });

  it("calls onEncoderCW on ArrowRight and prevents default", () => {
    const onEncoderCW = vi.fn();
    bindDevKeySimulation({ onKey: vi.fn(), onEncoderCW });
    const e = fireKey(listeners, "ArrowRight");
    expect(onEncoderCW).toHaveBeenCalled();
    expect(e.preventDefault).toHaveBeenCalled();
  });

  it("calls onEncoderCCW on ArrowLeft", () => {
    const onEncoderCCW = vi.fn();
    bindDevKeySimulation({ onKey: vi.fn(), onEncoderCCW });
    fireKey(listeners, "ArrowLeft");
    expect(onEncoderCCW).toHaveBeenCalled();
  });

  it("calls onEncoderPress on Space", () => {
    const onEncoderPress = vi.fn();
    bindDevKeySimulation({ onKey: vi.fn(), onEncoderPress });
    fireKey(listeners, "Space");
    expect(onEncoderPress).toHaveBeenCalled();
  });

  it("does nothing for an unrelated key", () => {
    const onKey = vi.fn();
    const onEncoderCW = vi.fn();
    bindDevKeySimulation({ onKey, onEncoderCW });
    fireKey(listeners, "KeyZ");
    expect(onKey).not.toHaveBeenCalled();
    expect(onEncoderCW).not.toHaveBeenCalled();
  });

  it("the returned cleanup function removes the listener", () => {
    const onKey = vi.fn();
    const cleanup = bindDevKeySimulation({ onKey });
    expect(listeners.length).toBe(1);
    cleanup();
    expect(listeners.length).toBe(0);
  });
});
