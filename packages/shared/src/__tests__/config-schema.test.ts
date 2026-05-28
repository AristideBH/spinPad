import { describe, it, expect } from 'vitest';
import {
  validateConfig,
  defaultConfig,
  CONFIG_NUM_KEYS,
  CONFIG_MAX_PROFILES,
} from '../constants/config-schema.js';

describe('validateConfig', () => {
  it('accepts a complete default config', () => {
    const result = validateConfig(defaultConfig());
    expect(result.ok).toBe(true);
  });

  it('rejects non-objects', () => {
    expect(validateConfig(null).ok).toBe(false);
    expect(validateConfig('string').ok).toBe(false);
    expect(validateConfig(42).ok).toBe(false);
  });

  it('fills missing fields with defaults', () => {
    const result = validateConfig({ active_profile: 0, profiles: [] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.display.brightness).toBe(200);
    expect(result.config.orientation).toBe(0);
    expect(result.config.encoder.sensitivity).toBe(1);
  });

  it('clamps active_profile to valid range', () => {
    const result = validateConfig({ ...defaultConfig(), active_profile: 999 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.active_profile).toBe(CONFIG_MAX_PROFILES - 1);
  });

  it('clamps orientation to 0–3', () => {
    const result = validateConfig({ ...defaultConfig(), orientation: 10 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.orientation).toBe(3);
  });

  it('clamps encoder sensitivity to 1–4', () => {
    const low = validateConfig({ ...defaultConfig(), encoder: { sensitivity: 0 } });
    const high = validateConfig({ ...defaultConfig(), encoder: { sensitivity: 99 } });
    expect(low.ok && low.config.encoder.sensitivity).toBe(1);
    expect(high.ok && high.config.encoder.sensitivity).toBe(4);
  });

  it('preserves profile names', () => {
    const cfg = defaultConfig();
    cfg.profiles[0].name = 'Gaming';
    const result = validateConfig(cfg);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.profiles[0].name).toBe('Gaming');
  });

  it('preserves key actions in layers', () => {
    const cfg = defaultConfig();
    cfg.profiles[0].layers[0].keys[2] = 0x0041; // 'A'
    const result = validateConfig(cfg);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.profiles[0].layers[0].keys[2]).toBe(0x0041);
  });

  it('truncates excess profiles', () => {
    const cfg = defaultConfig();
    (cfg.profiles as any[]).push({ name: 'Extra', layers: [] });
    const result = validateConfig(cfg);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.profiles.length).toBeLessThanOrEqual(CONFIG_MAX_PROFILES);
  });

  it('layer keys default to 0 when missing', () => {
    const result = validateConfig({ active_profile: 0, profiles: [{ name: 'P', layers: [{}] }] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.profiles[0].layers[0].keys.length).toBe(CONFIG_NUM_KEYS);
  });
});
