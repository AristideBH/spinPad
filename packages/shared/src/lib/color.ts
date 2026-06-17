// ═══════════════════════════════════════════════════════════════
//  lib/color.ts — RGB ↔ hex conversions for LED color pickers
// ═══════════════════════════════════════════════════════════════

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v?.toString(16).padStart(2, '0') ?? '00').join('')}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}
