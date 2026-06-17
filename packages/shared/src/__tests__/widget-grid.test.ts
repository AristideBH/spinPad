import { describe, it, expect } from "vitest";
import { buildOccupancyGrid, findFreeSpace } from "$shared/lib/widget-grid.js";

describe("buildOccupancyGrid", () => {
  it("returns an all-free grid when there are no widgets", () => {
    const grid = buildOccupancyGrid([], 4, 4);
    expect(grid.every((row) => row.every((cell) => cell === false))).toBe(true);
  });

  it("marks every cell covered by a widget", () => {
    const grid = buildOccupancyGrid([{ x: 1, y: 1, w: 2, h: 2 }], 4, 4);
    expect(grid[1][1]).toBe(true);
    expect(grid[1][2]).toBe(true);
    expect(grid[2][1]).toBe(true);
    expect(grid[2][2]).toBe(true);
    expect(grid[0][0]).toBe(false);
    expect(grid[3][3]).toBe(false);
  });

  it("handles multiple non-overlapping widgets", () => {
    const grid = buildOccupancyGrid(
      [
        { x: 0, y: 0, w: 1, h: 1 },
        { x: 3, y: 3, w: 1, h: 1 },
      ],
      4,
      4,
    );
    expect(grid[0][0]).toBe(true);
    expect(grid[3][3]).toBe(true);
    expect(grid[1][1]).toBe(false);
  });

  it("ignores widget cells that fall outside the grid bounds", () => {
    expect(() => buildOccupancyGrid([{ x: 3, y: 3, w: 3, h: 3 }], 4, 4)).not.toThrow();
  });
});

describe("findFreeSpace", () => {
  it("finds the top-left corner on an empty grid", () => {
    const grid = buildOccupancyGrid([], 4, 4);
    expect(findFreeSpace(grid, 1, 1, 4, 4)).toEqual({ x: 0, y: 0 });
  });

  it("skips occupied cells and returns the first free slot", () => {
    const grid = buildOccupancyGrid([{ x: 0, y: 0, w: 1, h: 1 }], 4, 4);
    expect(findFreeSpace(grid, 1, 1, 4, 4)).toEqual({ x: 1, y: 0 });
  });

  it("returns null when no space fits", () => {
    const grid = buildOccupancyGrid([{ x: 0, y: 0, w: 4, h: 4 }], 4, 4);
    expect(findFreeSpace(grid, 1, 1, 4, 4)).toBeNull();
  });

  it("finds space for a multi-cell widget", () => {
    const grid = buildOccupancyGrid([{ x: 0, y: 0, w: 2, h: 4 }], 4, 4);
    expect(findFreeSpace(grid, 2, 2, 4, 4)).toEqual({ x: 2, y: 0 });
  });

  it("does not place a widget that would overflow the grid", () => {
    const grid = buildOccupancyGrid([], 4, 4);
    expect(findFreeSpace(grid, 5, 1, 4, 4)).toBeNull();
  });
});
