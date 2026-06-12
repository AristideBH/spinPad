export const KEY_LAYOUT = [
  { sw: 'SW7',  idx: 1, row: 1, col: 1, rowSpan: 1, colSpan: 1 },
  { sw: 'SW1',  idx: 0, row: 1, col: 2, rowSpan: 1, colSpan: 2 },
  { sw: 'SW8',  idx: 4, row: 2, col: 1, rowSpan: 1, colSpan: 1 },
  { sw: 'SW6',  idx: 3, row: 2, col: 2, rowSpan: 1, colSpan: 1 },
  { sw: 'SW2',  idx: 2, row: 2, col: 3, rowSpan: 1, colSpan: 1 },
  { sw: 'SW9',  idx: 7, row: 3, col: 1, rowSpan: 1, colSpan: 1 },
  { sw: 'SW5',  idx: 6, row: 3, col: 2, rowSpan: 1, colSpan: 1 },
  { sw: 'SW3',  idx: 5, row: 3, col: 3, rowSpan: 2, colSpan: 1 },
  { sw: 'SW10', idx: 9, row: 4, col: 1, rowSpan: 1, colSpan: 1 },
  { sw: 'SW4',  idx: 8, row: 4, col: 2, rowSpan: 1, colSpan: 1 },
] as const;

export const SW_BY_IDX: Record<number, string> = Object.fromEntries(
  KEY_LAYOUT.map((k) => [k.idx, k.sw]),
);
