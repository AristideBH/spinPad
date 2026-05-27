import { describe, it, expect } from 'vitest';
import {
  parseSpinpadFile,
  createSpinpadFile,
  SPINPAD_FILE_TYPE,
  CURRENT_FORMAT_VERSION,
} from '../constants/config-migrations.js';
import { defaultConfig } from '../constants/config-schema.js';

describe('parseSpinpadFile', () => {
  it('parses a valid v1 wrapper', () => {
    const cfg = defaultConfig();
    const wrapper = createSpinpadFile(cfg);
    const result = parseSpinpadFile(wrapper);
    expect(result.fromVersion).toBe(1);
    expect(result.config).toEqual(cfg);
  });

  it('throws on non-object input', () => {
    expect(() => parseSpinpadFile(null)).toThrow();
    expect(() => parseSpinpadFile('bad')).toThrow();
  });

  it('throws on wrong _type', () => {
    expect(() =>
      parseSpinpadFile({ _type: 'wrong-type', _format_version: 1, config: defaultConfig() })
    ).toThrow(/non reconnu/);
  });

  it('throws on future format version', () => {
    const future = {
      _type: SPINPAD_FILE_TYPE,
      _format_version: CURRENT_FORMAT_VERSION + 1,
      config: defaultConfig(),
    };
    expect(() => parseSpinpadFile(future)).toThrow(/trop récent/);
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
