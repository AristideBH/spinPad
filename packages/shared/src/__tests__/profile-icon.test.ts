import { describe, it, expect } from "vitest";
import { PROFILE_ICON_BYTES } from "$shared/constants/config-schema.js";
import {
  emptyGrid,
  setPixel,
  getPixel,
  gridToBytes,
  bytesToGrid,
  gridToBase64,
  base64ToGrid,
  isEmptyIcon,
} from "$shared/constants/profile-icon.js";
import { PROFILE_ICON_LIBRARY } from "$shared/constants/profile-icon-library.js";
import { validateConfig } from "$shared/constants/config-schema.js";
import { BUILTIN_PROFILE_PRESETS, listProfilePresets } from "$shared/constants/profile-presets.js";

describe("profile-icon — codec", () => {
  it("produit exactement PROFILE_ICON_BYTES octets", () => {
    expect(gridToBytes(emptyGrid()).length).toBe(PROFILE_ICON_BYTES);
  });

  it("round-trip grid → bytes → grid (identité)", () => {
    const g = emptyGrid();
    setPixel(g, 0, 0, true);
    setPixel(g, 23, 23, true);
    setPixel(g, 5, 17, true);
    setPixel(g, 12, 8, true);
    const back = bytesToGrid(gridToBytes(g));
    expect(back).toEqual(g);
  });

  it("round-trip grid → base64 → grid (identité)", () => {
    const g = emptyGrid();
    for (let i = 0; i < g.length; i += 7) g[i] = true;
    const back = base64ToGrid(gridToBase64(g));
    expect(back).toEqual(g);
  });

  it("getPixel respecte les bornes", () => {
    const g = emptyGrid();
    setPixel(g, -1, 0, true); // ignoré
    setPixel(g, 0, 99, true); // ignoré
    expect(getPixel(g, -1, 0)).toBe(false);
    expect(getPixel(g, 100, 100)).toBe(false);
  });

  it("base64 vide / invalide → grille vide", () => {
    expect(base64ToGrid("").every((p) => !p)).toBe(true);
    expect(base64ToGrid(undefined).every((p) => !p)).toBe(true);
    expect(isEmptyIcon("")).toBe(true);
  });
});

describe("bibliothèque d'icônes", () => {
  it("chaque preset décode sans erreur et a du contenu", () => {
    for (const entry of PROFILE_ICON_LIBRARY) {
      expect(entry.grid.length).toBe(24 * 24);
      expect(isEmptyIcon(entry.data)).toBe(false);
      // base64 décodable et de la bonne taille
      expect(base64ToGrid(entry.data)).toEqual(entry.grid);
    }
  });
});

describe("profile-presets", () => {
  it("chaque builtin preset est un ProfileConfig valide", () => {
    for (const preset of BUILTIN_PROFILE_PRESETS) {
      const r = validateConfig({ active_profile: 0, profiles: [preset.profile] });
      expect(r.ok).toBe(true);
    }
  });

  it("listProfilePresets renvoie au moins les builtins", async () => {
    const list = await listProfilePresets();
    expect(list.length).toBeGreaterThanOrEqual(BUILTIN_PROFILE_PRESETS.length);
  });
});
