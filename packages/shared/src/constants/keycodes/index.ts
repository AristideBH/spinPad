// Aggregateur keycodes + action-types pour rétrocompatibilité des imports
// Usage: import { KEYCODES, action, ACTION_TYPES, ... } from './keycodes/index.js'
export { KEYCODES, KEYCODES_FLAT, getKeycodeLabel } from '../keycodes.js';
export { action, ACTION_TYPES, MEDIA_CODES, SPECIAL_CODES } from '../action-types.js';
export { MACRO_STEP_TYPE, MACRO_MAX_STEPS, MACRO_MAX_PER_PROFILE } from '../config-schema.js';
export type { MacroStep } from '../config-schema.js';
