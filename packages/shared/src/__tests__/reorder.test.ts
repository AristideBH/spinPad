import { describe, it, expect } from "vitest";
import { deriveSingleMove } from "$shared/constants/reorder.js";

describe("deriveSingleMove", () => {
  it("retourne null si l'ordre est identique", () => {
    expect(deriveSingleMove(["a", "b", "c"], ["a", "b", "c"])).toBeNull();
  });

  it("déplacement vers l'avant", () => {
    // a déplacé en fin : a,b,c,d -> b,c,d,a
    expect(deriveSingleMove(["a", "b", "c", "d"], ["b", "c", "d", "a"])).toEqual({ from: 0, to: 3 });
  });

  it("déplacement vers l'arrière", () => {
    // d déplacé au début : a,b,c,d -> d,a,b,c
    expect(deriveSingleMove(["a", "b", "c", "d"], ["d", "a", "b", "c"])).toEqual({ from: 3, to: 0 });
  });

  it("déplacement au milieu", () => {
    // b déplacé après c : a,b,c,d -> a,c,b,d
    expect(deriveSingleMove(["a", "b", "c", "d"], ["a", "c", "b", "d"])).toEqual({ from: 1, to: 2 });
  });

  it("longueurs différentes -> null", () => {
    expect(deriveSingleMove(["a", "b"], ["a"])).toBeNull();
  });
});
