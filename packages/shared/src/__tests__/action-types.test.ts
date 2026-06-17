import { describe, it, expect } from 'vitest';
import {
  ACTION_TYPES,
  MEDIA_CODES,
  SPECIAL_CODES,
  action,
  getActionType,
  getActionValue,
} from '$shared/constants/action-types.js';

describe('action encoding round-trip', () => {
  it('encodes and decodes ACTION_TYPE_KC', () => {
    const kc = action(ACTION_TYPES.ACTION_TYPE_KC, 0x04); // 'A'
    expect(getActionType(kc)).toBe(ACTION_TYPES.ACTION_TYPE_KC);
    expect(getActionValue(kc)).toBe(0x04);
  });

  it('encodes and decodes ACTION_TYPE_SPECIAL', () => {
    const a = action(ACTION_TYPES.ACTION_TYPE_SPECIAL, SPECIAL_CODES.SPECIAL_BLE_SWITCH);
    expect(getActionType(a)).toBe(ACTION_TYPES.ACTION_TYPE_SPECIAL);
    expect(getActionValue(a)).toBe(SPECIAL_CODES.SPECIAL_BLE_SWITCH);
  });

  it('encodes and decodes profile-switch special subcodes', () => {
    for (const code of [SPECIAL_CODES.SPECIAL_PROFILE_NEXT, SPECIAL_CODES.SPECIAL_PROFILE_PREV]) {
      const a = action(ACTION_TYPES.ACTION_TYPE_SPECIAL, code);
      expect(getActionType(a)).toBe(ACTION_TYPES.ACTION_TYPE_SPECIAL);
      expect(getActionValue(a)).toBe(code);
    }
    // Distinct subcodes, within the 12-bit range.
    expect(SPECIAL_CODES.SPECIAL_PROFILE_NEXT).not.toBe(SPECIAL_CODES.SPECIAL_PROFILE_PREV);
  });

  it('encodes and decodes ACTION_TYPE_MEDIA', () => {
    const a = action(ACTION_TYPES.ACTION_TYPE_MEDIA, MEDIA_CODES.MEDIA_VOL_UP);
    expect(getActionType(a)).toBe(ACTION_TYPES.ACTION_TYPE_MEDIA);
    expect(getActionValue(a)).toBe(MEDIA_CODES.MEDIA_VOL_UP);
  });

  it('encodes and decodes all layer types', () => {
    const types = [
      ACTION_TYPES.ACTION_TYPE_LAYER_MO,
      ACTION_TYPES.ACTION_TYPE_LAYER_TG,
      ACTION_TYPES.ACTION_TYPE_LAYER_TO,
    ];
    for (const t of types) {
      for (const val of [0, 1, 7]) {
        const a = action(t, val);
        expect(getActionType(a)).toBe(t);
        expect(getActionValue(a)).toBe(val);
      }
    }
  });

  it('masks value to 12 bits', () => {
    const a = action(ACTION_TYPES.ACTION_TYPE_KC, 0x1FFF); // > 12 bits
    expect(getActionValue(a)).toBe(0x0FFF);
  });

  it('masks type to 4 bits', () => {
    const a = action(0xFF, 0x00); // > 4 bits
    expect(getActionType(a)).toBe(0xF);
  });

  it('KC_NONE (0x0000) has type 0 and value 0', () => {
    expect(getActionType(0)).toBe(0);
    expect(getActionValue(0)).toBe(0);
  });

  it('max valid action 0xFFFF decodes consistently', () => {
    expect(getActionType(0xFFFF)).toBe(0xF);
    expect(getActionValue(0xFFFF)).toBe(0x0FFF);
  });
});

describe('no value collisions within each code group', () => {
  it('ACTION_TYPES values are unique', () => {
    const vals = Object.values(ACTION_TYPES);
    expect(new Set(vals).size).toBe(vals.length);
  });

  it('MEDIA_CODES values are unique', () => {
    const vals = Object.values(MEDIA_CODES);
    expect(new Set(vals).size).toBe(vals.length);
  });

  it('SPECIAL_CODES values are unique', () => {
    const vals = Object.values(SPECIAL_CODES);
    expect(new Set(vals).size).toBe(vals.length);
  });
});
