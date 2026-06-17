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

describe("config-ops — profiles", () => {
  it("adds a profile and selects it", () => {
    const cfg = defaultConfig();
    cfg.profiles = cfg.profiles.slice(0, 2); // 2 profiles
    const r = ops.addProfile(cfg, sel(0, 0));
    expect(r.config.profiles.length).toBe(3);
    expect(r.selection.profile).toBe(2);
    // the original entry is not mutated
    expect(cfg.profiles.length).toBe(2);
  });

  it("respects the CONFIG_MAX_PROFILES cap", () => {
    const cfg = defaultConfig(); // already 4
    expect(cfg.profiles.length).toBe(CONFIG_MAX_PROFILES);
    const r = ops.addProfile(cfg, sel(0, 0));
    expect(r.config.profiles.length).toBe(CONFIG_MAX_PROFILES);
  });

  it("instantiates from a preset without mutating the preset", () => {
    const cfg = defaultConfig();
    cfg.profiles = cfg.profiles.slice(0, 1);
    const preset = BUILTIN_PROFILE_PRESETS.find((p) => p.id === "base")!;
    const before = JSON.stringify(preset.profile);
    const r = ops.addProfile(cfg, sel(0, 0), preset.profile);
    const added = r.config.profiles[r.selection.profile];
    expect(added.layers.length).toBe(2);
    expect(JSON.stringify(preset.profile)).toBe(before); // preset intact
  });

  it("deletes a profile and keeps at least 1", () => {
    const cfg = defaultConfig();
    const r = ops.deleteProfile(cfg, sel(0, 0), 1);
    expect(r.config.profiles.length).toBe(3);
    // down to the minimum
    let acc = ops.deleteProfile(cfg, sel(0, 0), 0);
    acc = ops.deleteProfile(acc.config, acc.selection, 0);
    acc = ops.deleteProfile(acc.config, acc.selection, 0);
    const atMin = ops.deleteProfile(acc.config, acc.selection, 0);
    expect(atMin.config.profiles.length).toBe(1);
  });

  it("realigns active_profile after deletion", () => {
    const cfg = defaultConfig();
    cfg.active_profile = 3;
    const r = ops.deleteProfile(cfg, sel(3, 0), 1);
    expect(r.config.active_profile).toBe(2);
    expect(r.selection.profile).toBe(2);
  });

  it("active_profile stays valid when the active profile is deleted", () => {
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

  it("editProfile : unique names", () => {
    const cfg = defaultConfig();
    cfg.profiles[1].name = "Dup";
    const r = ops.editProfile(cfg, sel(0, 0), 0, { name: "Dup" });
    expect(r.config.profiles[0].name).not.toBe("Dup");
    expect(r.config.profiles[0].name).toContain("Dup");
  });

  it("editProfile : moveTo reorders and follows the selection + active", () => {
    const cfg = defaultConfig();
    cfg.profiles[0].name = "A";
    cfg.profiles[3].name = "D";
    cfg.active_profile = 0;
    const r = ops.editProfile(cfg, sel(0, 0), 0, { moveTo: 3 });
    expect(r.config.profiles[3].name).toBe("A");
    expect(r.config.active_profile).toBe(3);
    expect(r.selection.profile).toBe(3);
  });

  it("clearProfile : resets the keys of all layers, keeps the rest", () => {
    const cfg = defaultConfig();
    // 2 layers, a few keys + encoders + name/icon
    cfg.profiles[0].name = "Mix";
    cfg.profiles[0].icon = "ICON64";
    cfg.profiles[0].layers = [
      { name: "Base", keys: [KC(4), 0, KC(5)], encoder_cw: MO(1), encoder_ccw: TG(1) },
      { name: "Fn", keys: [KC(6), KC(7), 0], encoder_cw: TO(0), encoder_ccw: 0 },
    ];
    const r = ops.clearProfile(cfg, sel(0, 0), 0);
    const p = r.config.profiles[0];
    // all keys at 0
    expect(p.layers.every((l) => l.keys.every((k) => k === 0))).toBe(true);
    // structure / encoders / name / icon preserved
    expect(p.layers.map((l) => l.name)).toEqual(["Base", "Fn"]);
    expect(p.layers[0].encoder_cw).toBe(MO(1));
    expect(p.layers[0].encoder_ccw).toBe(TG(1));
    expect(p.name).toBe("Mix");
    expect(p.icon).toBe("ICON64");
    // selection unchanged + source not mutated
    expect(r.selection).toEqual(sel(0, 0));
    expect(cfg.profiles[0].layers[0].keys[0]).toBe(KC(4));
  });
});

describe("config-ops — layers", () => {
  it("adds a layer and selects it", () => {
    const cfg = defaultConfig();
    const r = ops.addLayer(cfg, sel(0, 0), 0);
    expect(r.config.profiles[0].layers.length).toBe(2);
    expect(r.selection.layer).toBe(1);
  });

  it("respects CONFIG_MAX_LAYERS", () => {
    const cfg = defaultConfig();
    let acc = ops.addLayer(cfg, sel(0, 0), 0);
    for (let i = 0; i < 20; i++) acc = ops.addLayer(acc.config, acc.selection, 0);
    expect(acc.config.profiles[0].layers.length).toBe(CONFIG_MAX_LAYERS);
  });

  it("deletes a layer and keeps at least 1", () => {
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

describe("config-ops — remap layer references on move", () => {
  // Profile with 3 layers with MO/TG/TO refs + a normal key (control).
  function cfg3() {
    const cfg = defaultConfig();
    let acc = ops.addLayer(cfg, sel(0, 0), 0);
    acc = ops.addLayer(acc.config, acc.selection, 0); // 3 layers
    const p = acc.config.profiles[0];
    p.layers[0].keys[0] = MO(2);   // points to layer 2
    p.layers[0].keys[1] = TO(1);   // points to layer 1
    p.layers[0].keys[2] = KC(0x04); // control, must not move
    p.layers[0].encoder_cw = TG(2);
    p.layers[0].encoder = { cw: TG(2), ccw: 0, press: MO(1) };
    return acc.config;
  }

  it("rewrites MO/TG/TO to the new index after move", () => {
    const c = cfg3();
    // moves layer 2 → 0 : old 2 becomes 0, old 0,1 shift to 1,2
    const r = ops.editLayer(c, sel(0, 0), 0, 2, { moveTo: 0 });
    const moved = r.config.profiles[0].layers[1]; // the ex-layer 0 is now at 1
    expect(moved.keys[0]).toBe(MO(0)); // pointed to layer 2 → now 0
    expect(moved.keys[1]).toBe(TO(2)); // pointed to layer 1 → shifted to 2
    expect(moved.encoder_cw).toBe(TG(0));
    expect(moved.encoder?.press).toBe(MO(2)); // pointed to layer 1 → 2
  });

  it("leaves non-layer actions intact", () => {
    const c = cfg3();
    const r = ops.editLayer(c, sel(0, 0), 0, 2, { moveTo: 0 });
    const moved = r.config.profiles[0].layers[1];
    expect(moved.keys[2]).toBe(KC(0x04));
  });

  it("does not mutate the source config", () => {
    const c = cfg3();
    const before = JSON.stringify(c);
    ops.editLayer(c, sel(0, 0), 0, 2, { moveTo: 0 });
    expect(JSON.stringify(c)).toBe(before);
  });
});
