import { describe, it, expect } from "vitest";
import { deriveSingleMove } from "$shared/constants/reorder.js";

describe("deriveSingleMove", () => {
  it("returns null if the order is identical", () => {
    expect(deriveSingleMove(["a", "b", "c"], ["a", "b", "c"])).toBeNull();
  });

  it("forward move", () => {
    // a moved to the end : a,b,c,d -> b,c,d,a
    expect(deriveSingleMove(["a", "b", "c", "d"], ["b", "c", "d", "a"])).toEqual({ from: 0, to: 3 });
  });

  it("backward move", () => {
    // d moved to the start : a,b,c,d -> d,a,b,c
    expect(deriveSingleMove(["a", "b", "c", "d"], ["d", "a", "b", "c"])).toEqual({ from: 3, to: 0 });
  });

  it("move in the middle", () => {
    // b moved after c : a,b,c,d -> a,c,b,d
    expect(deriveSingleMove(["a", "b", "c", "d"], ["a", "c", "b", "d"])).toEqual({ from: 1, to: 2 });
  });

  it("different lengths -> null", () => {
    expect(deriveSingleMove(["a", "b"], ["a"])).toBeNull();
  });
});
