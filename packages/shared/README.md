# @spinpad/shared

Shared constants and utilities between the firmware and Studio.

## Contents

| Module | Description |
|--------|-------------|
| `action-types.js` | Action types (`ACTION_TYPE_*`), media/special codes |
| `keycodes.js` | Full keycode table with labels |
| `config-migrations.js` | `.spinpad` format, validation, version migrations |

## Usage

```js
import { KEYCODES, getKeycodeLabel, action, ACTION_TYPES } from '@spinpad/shared';
import { createSpinpadFile, parseSpinpadFile } from '@spinpad/shared/config-migrations';
```

## Codegen → C header

After modifying `src/action-types.js`, regenerate the firmware header:

```bash
pnpm codegen
# or from the monorepo root:
pnpm --filter @spinpad/shared codegen
```

Output: `packages/firmware/components/keymap/include/action_types.gen.h`

The `.gen.h` file is **versioned** — it must be committed with the changes.

## Rule: source of truth

`action-types.js` is **the** source of truth. Do not edit `action_types.gen.h` manually.

To add an action, see [CONTRIBUTING.md](../../CONTRIBUTING.md#ajouter-une-nouvelle-action-firmware).
