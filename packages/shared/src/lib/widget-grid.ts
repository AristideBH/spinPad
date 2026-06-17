// ═══════════════════════════════════════════════════════════════
//  lib/widget-grid.ts — OLED widget grid placement helpers
//
//  Used by ScreenAddMenu to find the first free space for a new
//  widget on the 4×4 display grid.
// ═══════════════════════════════════════════════════════════════

interface PlacedWidget {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Marks every cell occupied by an already-placed widget. */
export function buildOccupancyGrid(widgets: PlacedWidget[], rows: number, cols: number): boolean[][] {
  const grid = Array.from({ length: rows }, () => Array<boolean>(cols).fill(false));
  for (const wd of widgets)
    for (let yy = wd.y; yy < wd.y + wd.h; yy++)
      for (let xx = wd.x; xx < wd.x + wd.w; xx++) if (grid[yy]?.[xx] !== undefined) grid[yy][xx] = true;
  return grid;
}

/** First free top-left position for a w×h box on the grid, or null if none fits. */
export function findFreeSpace(grid: boolean[][], w: number, h: number, rows: number, cols: number): { x: number; y: number } | null {
  for (let y = 0; y <= rows - h; y++)
    for (let x = 0; x <= cols - w; x++) {
      let ok = true;
      for (let yy = y; yy < y + h && ok; yy++) for (let xx = x; xx < x + w && ok; xx++) if (grid[yy][xx]) ok = false;
      if (ok) return { x, y };
    }
  return null;
}
