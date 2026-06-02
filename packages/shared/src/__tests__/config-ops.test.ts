import { describe, it, expect } from "vitest";
import { defaultConfig, CONFIG_MAX_PROFILES, CONFIG_MAX_LAYERS } from "$shared/constants/config-schema.js";
import * as ops from "$shared/constants/config-ops.js";
import { BUILTIN_PROFILE_PRESETS } from "$shared/constants/profile-presets.js";
import { action, ACTION_TYPES } from "$shared/constants/action-types.js";

const sel = (profile = 0, layer = 0) => ({ profile, layer });
const MO = (n: number) => action(ACTION_TYPES.ACTION_TYPE_LAYER_MO, n);
const TG = (n: number) => action(ACTION_TYPES.ACTION_TYPE_LAYER_TG, n);
const TO = (n: number) => action(ACTION_TYPES.ACTION_TYPE_LAYER_TO, n);
const KC = (n: number) => action(ACTION_TYPES.ACTION_TYPE_KC, n);

describe("config-ops — profils", () => {
  it("ajoute un profil et le sélectionne", () => {
    const cfg = defaultConfig();
    cfg.profiles = cfg.profiles.slice(0, 2); // 2 profils
    const r = ops.addProfile(cfg, sel(0, 0));
    expect(r.config.profiles.length).toBe(3);
    expect(r.selection.profile).toBe(2);
    // l'entrée d'origine n'est pas mutée
    expect(cfg.profiles.length).toBe(2);
  });

  it("respecte le plafond CONFIG_MAX_PROFILES", () => {
    const cfg = defaultConfig(); // déjà 4
    expect(cfg.profiles.length).toBe(CONFIG_MAX_PROFILES);
    const r = ops.addProfile(cfg, sel(0, 0));
    expect(r.config.profiles.length).toBe(CONFIG_MAX_PROFILES);
  });

  it("instancie depuis un preset sans muter le preset", () => {
    const cfg = defaultConfig();
    cfg.profiles = cfg.profiles.slice(0, 1);
    const preset = BUILTIN_PROFILE_PRESETS.find((p) => p.id === "base")!;
    const before = JSON.stringify(preset.profile);
    const r = ops.addProfile(cfg, sel(0, 0), preset.profile);
    const added = r.config.profiles[r.selection.profile];
    expect(added.layers.length).toBe(2);
    expect(JSON.stringify(preset.profile)).toBe(before); // preset intact
  });

  it("supprime un profil et garde au moins 1", () => {
    const cfg = defaultConfig();
    const r = ops.deleteProfile(cfg, sel(0, 0), 1);
    expect(r.config.profiles.length).toBe(3);
    // jusqu'au minimum
    let acc = ops.deleteProfile(cfg, sel(0, 0), 0);
    acc = ops.deleteProfile(acc.config, acc.selection, 0);
    acc = ops.deleteProfile(acc.config, acc.selection, 0);
    const atMin = ops.deleteProfile(acc.config, acc.selection, 0);
    expect(atMin.config.profiles.length).toBe(1);
  });

  it("recale active_profile après suppression", () => {
    const cfg = defaultConfig();
    cfg.active_profile = 3;
    const r = ops.deleteProfile(cfg, sel(3, 0), 1);
    expect(r.config.active_profile).toBe(2);
    expect(r.selection.profile).toBe(2);
  });

  it("active_profile reste valide quand on supprime le profil actif", () => {
    const cfg = defaultConfig();
    cfg.active_profile = 2;
    const r = ops.deleteProfile(cfg, sel(2, 0), 2);
    expect(r.config.active_profile).toBeLessThan(r.config.profiles.length);
    expect(r.config.active_profile).toBeGreaterThanOrEqual(0);
  });

  it("editProfile : rename + icon", () => {
    const cfg = defaultConfig();
    const r = ops.editProfile(cfg, sel(0, 0), 0, { name: "Gaming", icon: "AAAA" });
    expect(r.config.profiles[0].name).toBe("Gaming");
    expect(r.config.profiles[0].icon).toBe("AAAA");
  });

  it("editProfile : noms uniques", () => {
    const cfg = defaultConfig();
    cfg.profiles[1].name = "Dup";
    const r = ops.editProfile(cfg, sel(0, 0), 0, { name: "Dup" });
    expect(r.config.profiles[0].name).not.toBe("Dup");
    expect(r.config.profiles[0].name).toContain("Dup");
  });

  it("editProfile : moveTo réordonne et suit la sélection + active", () => {
    const cfg = defaultConfig();
    cfg.profiles[0].name = "A";
    cfg.profiles[3].name = "D";
    cfg.active_profile = 0;
    const r = ops.editProfile(cfg, sel(0, 0), 0, { moveTo: 3 });
    expect(r.config.profiles[3].name).toBe("A");
    expect(r.config.active_profile).toBe(3);
    expect(r.selection.profile).toBe(3);
  });

  it("clearProfile : remet à zéro les touches de tous les layers, conserve le reste", () => {
    const cfg = defaultConfig();
    // 2 layers, quelques touches + encodeurs + nom/icône
    cfg.profiles[0].name = "Mix";
    cfg.profiles[0].icon = "ICON64";
    cfg.profiles[0].layers = [
      { name: "Base", keys: [KC(4), 0, KC(5)], encoder_cw: MO(1), encoder_ccw: TG(1) },
      { name: "Fn", keys: [KC(6), KC(7), 0], encoder_cw: TO(0), encoder_ccw: 0 },
    ];
    const r = ops.clearProfile(cfg, sel(0, 0), 0);
    const p = r.config.profiles[0];
    // toutes les touches à 0
    expect(p.layers.every((l) => l.keys.every((k) => k === 0))).toBe(true);
    // structure / encodeurs / nom / icône conservés
    expect(p.layers.map((l) => l.name)).toEqual(["Base", "Fn"]);
    expect(p.layers[0].encoder_cw).toBe(MO(1));
    expect(p.layers[0].encoder_ccw).toBe(TG(1));
    expect(p.name).toBe("Mix");
    expect(p.icon).toBe("ICON64");
    // sélection inchangée + source non mutée
    expect(r.selection).toEqual(sel(0, 0));
    expect(cfg.profiles[0].layers[0].keys[0]).toBe(KC(4));
  });
});

describe("config-ops — layers", () => {
  it("ajoute un layer et le sélectionne", () => {
    const cfg = defaultConfig();
    const r = ops.addLayer(cfg, sel(0, 0), 0);
    expect(r.config.profiles[0].layers.length).toBe(2);
    expect(r.selection.layer).toBe(1);
  });

  it("respecte CONFIG_MAX_LAYERS", () => {
    const cfg = defaultConfig();
    let acc = ops.addLayer(cfg, sel(0, 0), 0);
    for (let i = 0; i < 20; i++) acc = ops.addLayer(acc.config, acc.selection, 0);
    expect(acc.config.profiles[0].layers.length).toBe(CONFIG_MAX_LAYERS);
  });

  it("supprime un layer et garde au moins 1", () => {
    const cfg = defaultConfig();
    const two = ops.addLayer(cfg, sel(0, 0), 0);
    const r = ops.deleteLayer(two.config, two.selection, 0, 1);
    expect(r.config.profiles[0].layers.length).toBe(1);
    const atMin = ops.deleteLayer(r.config, r.selection, 0, 0);
    expect(atMin.config.profiles[0].layers.length).toBe(1);
  });

  it("editLayer : rename + move", () => {
    const cfg = defaultConfig();
    const two = ops.addLayer(cfg, sel(0, 0), 0);
    const named = ops.editLayer(two.config, two.selection, 0, 1, { name: "Fn" });
    expect(named.config.profiles[0].layers[1].name).toBe("Fn");
    const moved = ops.editLayer(named.config, sel(0, 1), 0, 1, { moveTo: 0 });
    expect(moved.config.profiles[0].layers[0].name).toBe("Fn");
    expect(moved.selection.layer).toBe(0);
  });
});

describe("config-ops — remap des références de layer au déplacement", () => {
  // Profil à 3 layers avec des refs MO/TG/TO + une touche normale (témoin).
  function cfg3() {
    const cfg = defaultConfig();
    let acc = ops.addLayer(cfg, sel(0, 0), 0);
    acc = ops.addLayer(acc.config, acc.selection, 0); // 3 layers
    const p = acc.config.profiles[0];
    p.layers[0].keys[0] = MO(2);   // pointe layer 2
    p.layers[0].keys[1] = TO(1);   // pointe layer 1
    p.layers[0].keys[2] = KC(0x04); // témoin, ne doit pas bouger
    p.layers[0].encoder_cw = TG(2);
    p.layers[0].encoder = { cw: TG(2), ccw: 0, press: MO(1) };
    return acc.config;
  }

  it("réécrit MO/TG/TO vers le nouvel index après move", () => {
    const c = cfg3();
    // déplace layer 2 → 0 : ancien 2 devient 0, anciens 0,1 décalent à 1,2
    const r = ops.editLayer(c, sel(0, 0), 0, 2, { moveTo: 0 });
    const moved = r.config.profiles[0].layers[1]; // l'ex-layer 0 est maintenant en 1
    expect(moved.keys[0]).toBe(MO(0)); // pointait layer 2 → maintenant 0
    expect(moved.keys[1]).toBe(TO(2)); // pointait layer 1 → décalé à 2
    expect(moved.encoder_cw).toBe(TG(0));
    expect(moved.encoder?.press).toBe(MO(2)); // pointait layer 1 → 2
  });

  it("laisse les actions non-layer intactes", () => {
    const c = cfg3();
    const r = ops.editLayer(c, sel(0, 0), 0, 2, { moveTo: 0 });
    const moved = r.config.profiles[0].layers[1];
    expect(moved.keys[2]).toBe(KC(0x04));
  });

  it("ne mute pas la config source", () => {
    const c = cfg3();
    const before = JSON.stringify(c);
    ops.editLayer(c, sel(0, 0), 0, 2, { moveTo: 0 });
    expect(JSON.stringify(c)).toBe(before);
  });
});
