// ═══════════════════════════════════════════════════════════════
//  profile-icon.ts — Codec d'icône de profil (24×24 monochrome 1bpp)
//
//  Module pur (pas de runtime Svelte) → testable au vitest.
//
//  Représentations :
//    BoolGrid    : boolean[576], indexé row-major  → grid[y * W + x]
//                  (pratique pour <canvas> et l'éditeur)
//    Uint8Array  : 72 octets, packing COLONNE-MAJEUR identique au firmware
//    base64      : transport JSON (champ profile.icon)
//
//  ── Packing (doit rester aligné avec le futur fb_draw_bitmap firmware) ──
//  Le SSD1306 et fb_draw_icon (8×8) utilisent un layout vertical par
//  "pages" de 8px. On généralise : pour le pixel (x, y),
//      byteIndex = x * (H / 8) + (y >> 3)      // (H/8) = 3 octets par colonne
//      bit       = y & 7
//  donc octet b de la colonne x couvre les lignes b*8 … b*8+7, LSB = ligne du haut.
// ═══════════════════════════════════════════════════════════════

import { PROFILE_ICON_W, PROFILE_ICON_H, PROFILE_ICON_BYTES } from './config-schema.js';

export type BoolGrid = boolean[];

const BYTES_PER_COL = PROFILE_ICON_H / 8; // 3

export function emptyGrid(): BoolGrid {
  return new Array(PROFILE_ICON_W * PROFILE_ICON_H).fill(false);
}

export function gridIndex(x: number, y: number): number {
  return y * PROFILE_ICON_W + x;
}

export function getPixel(grid: BoolGrid, x: number, y: number): boolean {
  if (x < 0 || x >= PROFILE_ICON_W || y < 0 || y >= PROFILE_ICON_H) return false;
  return grid[gridIndex(x, y)];
}

export function setPixel(grid: BoolGrid, x: number, y: number, on: boolean): void {
  if (x < 0 || x >= PROFILE_ICON_W || y < 0 || y >= PROFILE_ICON_H) return;
  grid[gridIndex(x, y)] = on;
}

// ── BoolGrid ↔ Uint8Array (72 o) ────────────────────────────────

export function gridToBytes(grid: BoolGrid): Uint8Array {
  const bytes = new Uint8Array(PROFILE_ICON_BYTES);
  for (let x = 0; x < PROFILE_ICON_W; x++) {
    for (let y = 0; y < PROFILE_ICON_H; y++) {
      if (grid[gridIndex(x, y)]) {
        bytes[x * BYTES_PER_COL + (y >> 3)] |= 1 << (y & 7);
      }
    }
  }
  return bytes;
}

export function bytesToGrid(bytes: Uint8Array): BoolGrid {
  const grid = emptyGrid();
  for (let x = 0; x < PROFILE_ICON_W; x++) {
    for (let y = 0; y < PROFILE_ICON_H; y++) {
      const bit = (bytes[x * BYTES_PER_COL + (y >> 3)] >> (y & 7)) & 1;
      grid[gridIndex(x, y)] = bit === 1;
    }
  }
  return grid;
}

// ── Uint8Array ↔ base64 ─────────────────────────────────────────

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ── BoolGrid ↔ base64 (helpers de haut niveau) ──────────────────

export function gridToBase64(grid: BoolGrid): string {
  return bytesToBase64(gridToBytes(grid));
}

/**
 * Décode une icône base64 en BoolGrid. Tolère une chaîne vide / invalide
 * en renvoyant une grille vide (jamais d'exception côté UI).
 */
export function base64ToGrid(b64: string | undefined | null): BoolGrid {
  if (!b64) return emptyGrid();
  try {
    const bytes = base64ToBytes(b64);
    if (bytes.length < PROFILE_ICON_BYTES) {
      const padded = new Uint8Array(PROFILE_ICON_BYTES);
      padded.set(bytes);
      return bytesToGrid(padded);
    }
    return bytesToGrid(bytes);
  } catch {
    return emptyGrid();
  }
}

export function isEmptyIcon(b64: string | undefined | null): boolean {
  if (!b64) return true;
  try {
    return base64ToBytes(b64).every((b) => b === 0);
  } catch {
    return true;
  }
}

// ── Primitives de dessin (mutent la grille passée) ──────────────
// Réutilisées par l'éditeur (outils interactifs) et la bibliothèque.

export function drawLine(g: BoolGrid, x0: number, y0: number, x1: number, y1: number, on = true): void {
  // Bresenham
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    setPixel(g, x0, y0, on);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

export function drawRect(g: BoolGrid, x0: number, y0: number, x1: number, y1: number, on = true): void {
  drawLine(g, x0, y0, x1, y0, on);
  drawLine(g, x0, y1, x1, y1, on);
  drawLine(g, x0, y0, x0, y1, on);
  drawLine(g, x1, y0, x1, y1, on);
}

export function drawRectFill(g: BoolGrid, x0: number, y0: number, x1: number, y1: number, on = true): void {
  const [a, b] = [Math.min(y0, y1), Math.max(y0, y1)];
  const [c, d] = [Math.min(x0, x1), Math.max(x0, x1)];
  for (let y = a; y <= b; y++) for (let x = c; x <= d; x++) setPixel(g, x, y, on);
}

export function drawCircle(g: BoolGrid, cx: number, cy: number, r: number, on = true): void {
  if (r < 0) return;
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (Math.abs(Math.sqrt(x * x + y * y) - r) < 0.6) setPixel(g, cx + x, cy + y, on);
    }
  }
}

export function drawDisc(g: BoolGrid, cx: number, cy: number, r: number, on = true): void {
  if (r < 0) return;
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (Math.sqrt(x * x + y * y) <= r + 0.3) setPixel(g, cx + x, cy + y, on);
    }
  }
}

/**
 * Draws an ellipse (outline) from a bounding box (x0,y0)→(x1,y1).
 * Handles any corner ordering.
 */
export function drawEllipse(g: BoolGrid, x0: number, y0: number, x1: number, y1: number, on = true): void {
  const [lx, rx] = x0 <= x1 ? [x0, x1] : [x1, x0];
  const [ty, by] = y0 <= y1 ? [y0, y1] : [y1, y0];
  const cx = (lx + rx) / 2;
  const cy = (ty + by) / 2;
  const a  = (rx - lx) / 2;   // semi-axis X
  const b  = (by - ty) / 2;   // semi-axis Y
  if (a < 0.5 && b < 0.5) { setPixel(g, Math.round(cx), Math.round(cy), on); return; }
  // Midpoint ellipse — iterate by longer axis for gap-free outline
  const steps = Math.ceil(Math.max(a, b) * Math.PI * 2) * 2;
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    setPixel(g, Math.round(cx + a * Math.cos(t)), Math.round(cy + b * Math.sin(t)), on);
  }
}

/**
 * Draws a filled ellipse from a bounding box (x0,y0)→(x1,y1).
 */
export function drawEllipseFill(g: BoolGrid, x0: number, y0: number, x1: number, y1: number, on = true): void {
  const [lx, rx] = x0 <= x1 ? [x0, x1] : [x1, x0];
  const [ty, by] = y0 <= y1 ? [y0, y1] : [y1, y0];
  const cx = (lx + rx) / 2;
  const cy = (ty + by) / 2;
  const a  = (rx - lx) / 2;
  const b  = (by - ty) / 2;
  for (let y = ty; y <= by; y++) {
    for (let x = lx; x <= rx; x++) {
      const dx = (x - cx) / (a + 0.5);
      const dy = (y - cy) / (b + 0.5);
      if (dx * dx + dy * dy <= 1) setPixel(g, x, y, on);
    }
  }
}

/**
 * Peint le fond plein puis les pixels allumés d'une grille sur un contexte 2D.
 * Partagé par l'éditeur d'icône et la preview (cell = taille d'un pixel en px).
 */
export function fillIconPixels(
  ctx: CanvasRenderingContext2D,
  grid: BoolGrid,
  cell: number,
  totalW: number,
  totalH: number,
  bg = '#0a0a0a',
  fg = '#e5e5e5',
): void {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, totalW, totalH);
  ctx.fillStyle = fg;
  for (let y = 0; y < PROFILE_ICON_H; y++)
    for (let x = 0; x < PROFILE_ICON_W; x++)
      if (getPixel(grid, x, y)) ctx.fillRect(x * cell, y * cell, cell, cell);
}

/** Bitmap PNG-agnostique : convertit une grille en ImageData (NxN, blanc sur transparent). */
export function gridToImageData(grid: BoolGrid, scale = 1): ImageData {
  const w = PROFILE_ICON_W * scale;
  const h = PROFILE_ICON_H * scale;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const on = getPixel(grid, Math.floor(x / scale), Math.floor(y / scale));
      const i = (y * w + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = on ? 255 : 0;
      data[i + 3] = 255;
    }
  }
  return new ImageData(data, w, h);
}

/**
 * Seuille des pixels RGBA (luminance) en grille booléenne 24×24.
 * @param threshold Luminance seuil (0–255), défaut 128.
 */
export function imageDataToGrid(img: ImageData, threshold = 128): BoolGrid {
  const g = emptyGrid();
  for (let y = 0; y < PROFILE_ICON_H; y++) {
    for (let x = 0; x < PROFILE_ICON_W; x++) {
      // échantillonne en mappant la source vers 24×24
      const sx = Math.floor((x / PROFILE_ICON_W) * img.width);
      const sy = Math.floor((y / PROFILE_ICON_H) * img.height);
      const i = (sy * img.width + sx) * 4;
      const a = img.data[i + 3];
      const lum = (img.data[i] * 0.299 + img.data[i + 1] * 0.587 + img.data[i + 2] * 0.114);
      setPixel(g, x, y, a > 32 && lum > threshold);
    }
  }
  return g;
}
