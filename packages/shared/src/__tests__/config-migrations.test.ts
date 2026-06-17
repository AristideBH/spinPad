import { describe, it, expect } from 'vitest';
import {
  parseSpinpadFile,
  createSpinpadFile,
  SPINPAD_FILE_TYPE,
  CURRENT_FORMAT_VERSION,
} from '$shared/constants/config-migrations.js';
import { defaultConfig, MACRO_COUNT } from '$shared/constants/config-schema.js';

describe('parseSpinpadFile', () => {
  it('parses a current-version wrapper without migration', () => {
    const cfg = defaultConfig();
    const wrapper = createSpinpadFile(cfg);
    const result = parseSpinpadFile(wrapper);
    expect(result.fromVersion).toBe(CURRENT_FORMAT_VERSION);
    expect(result.config).toEqual(cfg);
  });

  it('migrates v1 → v2 : drops per-profile macros, inits global slots', () => {
    const cfg = defaultConfig() as Record<string, unknown> & { profiles: Record<string, unknown>[] };
    // Simulates an old v1 profile with local macros
    cfg.profiles[0].macros = [[{ type: 0, keycode: 0x04 }]];
    delete (cfg as Record<string, unknown>).macros;
    const wrapper = {
      _type: SPINPAD_FILE_TYPE,
      _format_version: 1,
      config: cfg,
    };
    const { config, fromVersion } = parseSpinpadFile(wrapper);
    expect(fromVersion).toBe(1);
    expect(config.profiles[0]).not.toHaveProperty('macros');
    expect(config.macros).toHaveLength(MACRO_COUNT);
    expect(config.macros.every((m) => m.steps.length === 0)).toBe(true);
  });

  it('throws on non-object input', () => {
    expect(() => parseSpinpadFile(null)).toThrow();
    expect(() => parseSpinpadFile('bad')).toThrow();
  });

  it('throws on wrong _type', () => {
    expect(() =>
      parseSpinpadFile({ _type: 'wrong-type', _format_version: 1, config: defaultConfig() })
    ).toThrow(/Unrecognized/);
  });

  it('throws on future format version', () => {
    const future = {
      _type: SPINPAD_FILE_TYPE,
      _format_version: CURRENT_FORMAT_VERSION + 1,
      config: defaultConfig(),
    };
    expect(() => parseSpinpadFile(future)).toThrow(/too recent/);
  });

  it('accepts current format version without migration', () => {
    const wrapper = createSpinpadFile(defaultConfig());
    expect(() => parseSpinpadFile(wrapper)).not.toThrow();
  });
});

describe('createSpinpadFile', () => {
  it('includes all required fields', () => {
    const wrapper = createSpinpadFile(defaultConfig());
    expect(wrapper._type).toBe(SPINPAD_FILE_TYPE);
    expect(wrapper._format_version).toBe(CURRENT_FORMAT_VERSION);
    expect(typeof wrapper._created_at).toBe('string');
    expect(wrapper.config).toBeDefined();
  });

  it('embeds metadata when provided', () => {
    const wrapper = createSpinpadFile(defaultConfig(), {
      firmwareVersion: '1.2.3',
      studioVersion: '0.5.0',
    });
    expect(wrapper._firmware_version).toBe('1.2.3');
    expect(wrapper._studio_version).toBe('0.5.0');
  });

  it('round-trips config through create→parse', () => {
    const cfg = defaultConfig();
    cfg.profiles[1].name = 'Test Profile';
    const wrapper = createSpinpadFile(cfg);
    const { config: parsed } = parseSpinpadFile(wrapper);
    expect(parsed.profiles[1].name).toBe('Test Profile');
  });
});
