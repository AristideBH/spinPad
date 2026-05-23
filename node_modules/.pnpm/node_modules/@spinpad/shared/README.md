# @spinpad/shared

Constantes et utilitaires partagés entre le firmware et Studio.

## Contenu

| Module | Description |
|--------|-------------|
| `action-types.js` | Types d'actions (`ACTION_TYPE_*`), codes media/special |
| `keycodes.js` | Table complète des keycodes avec labels |
| `config-migrations.js` | Format `.spinpad`, validation, migrations de version |

## Utilisation

```js
import { KEYCODES, getKeycodeLabel, action, ACTION_TYPES } from '@spinpad/shared';
import { createSpinpadFile, parseSpinpadFile } from '@spinpad/shared/config-migrations';
```

## Codegen → C header

Après modification de `src/action-types.js`, regénérer le header firmware :

```bash
pnpm codegen
# ou depuis la racine du monorepo :
pnpm --filter @spinpad/shared codegen
```

Sortie : `packages/firmware/components/keymap/include/action_types.gen.h`

Le fichier `.gen.h` est **versionné** — il doit être commité avec les changements.

## Règle : source de vérité

`action-types.js` est **la** source de vérité. Ne pas modifier `action_types.gen.h` manuellement.

Pour ajouter une action, voir [CONTRIBUTING.md](../../CONTRIBUTING.md#ajouter-une-nouvelle-action-firmware).
