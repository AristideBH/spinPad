import { describe, it, expect } from "vitest";
import { cn, safeCapitalize } from "$shared/utils.js";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("merges conflicting tailwind classes, keeping the last", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("safeCapitalize", () => {
  it("capitalizes the first letter", () => {
    expect(safeCapitalize("hello")).toBe("Hello");
  });

  it("returns an empty string for an empty input", () => {
    expect(safeCapitalize("")).toBe("");
  });

  it("returns an empty string for non-string input", () => {
    // @ts-expect-error testing runtime guard against bad input
    expect(safeCapitalize(null)).toBe("");
    // @ts-expect-error testing runtime guard against bad input
    expect(safeCapitalize(undefined)).toBe("");
  });

  it("leaves an already-capitalized string unchanged", () => {
    expect(safeCapitalize("Hello")).toBe("Hello");
  });

  it("only touches the first character", () => {
    expect(safeCapitalize("hELLO")).toBe("HELLO");
  });
});
