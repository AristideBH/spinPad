import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { keyVisuals } from "$shared/store/keyVisuals.svelte.js";

describe("keyVisuals.fire", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("marks the key pressed and bumps its nonce", () => {
    const before = keyVisuals.pressNonce[3];
    keyVisuals.fire(3);
    expect(keyVisuals.pressed[3]).toBe(true);
    expect(keyVisuals.pressNonce[3]).toBe(before + 1);
  });

  it("releases the key after 120ms", () => {
    keyVisuals.fire(2);
    expect(keyVisuals.pressed[2]).toBe(true);
    vi.advanceTimersByTime(120);
    expect(keyVisuals.pressed[2]).toBe(false);
  });

  it("ignores out-of-range indices", () => {
    expect(() => keyVisuals.fire(-1)).not.toThrow();
    expect(() => keyVisuals.fire(10)).not.toThrow();
  });

  it("re-firing before release resets the timer instead of stacking", () => {
    keyVisuals.fire(5);
    vi.advanceTimersByTime(60);
    keyVisuals.fire(5); // re-press mid-flight
    vi.advanceTimersByTime(60);
    expect(keyVisuals.pressed[5]).toBe(true); // original timer would have fired by now
    vi.advanceTimersByTime(60);
    expect(keyVisuals.pressed[5]).toBe(false);
  });
});
