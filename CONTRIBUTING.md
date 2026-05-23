# Contributing to SpinPad

## Structure du monorepo

```
spinpad/
├── packages/
│   ├── firmware/   — Firmware ESP-IDF (C)
│   ├── studio/     — Config app SvelteKit
│   └── shared/     — Constantes partagées (JS → C via codegen)
├── hardware/
│   └── boards/spinpad-v1/  — Pinmap, partitions, PCB
└── tools/          — Scripts de build et utilitaires
```

**Ouvrir le projet dans VSCode :** Double-cliquer `spinpad.code-workspace` (pas le dossier root).  
Cela active l'extension ESP-IDF sur `packages/firmware/` correctement.

---

## Workflow de développement

### Studio (SvelteKit)

```bash
pnpm dev              # Démarre le serveur de dev sur http://localhost:5173
pnpm build:studio     # Build standard (pour hébergement web)
pnpm build:embedded   # Build pour l'ESP32 (VITE_TRANSPORT=http)
```

### Firmware (ESP-IDF)

```bash
# Depuis packages/firmware/ ou avec idf.py depuis le root
idf.py set-target esp32s3
idf.py build
idf.py -p COM3 flash monitor     # Windows
idf.py -p /dev/ttyUSB0 flash monitor  # Linux/Mac

# Avec variante de board spécifique
idf.py -DBOARD_VARIANT=spinpad-v1 build
```

### Codegen (shared → firmware)

Après toute modification de `packages/shared/src/action-types.js` :

```bash
pnpm codegen
# → Régénère packages/firmware/components/keymap/include/action_types.gen.h
# → Committer le .gen.h avec les autres changements
```

---

## Gestion des versions avec Changeset

Ce projet utilise [Changeset](https://github.com/changesets/changesets) pour gérer les versions des packages et les CHANGELOG.

### 1. Quand faire un changeset ?

À chaque modification significative — **avant** de créer un commit ou une PR.

### 2. Créer un changeset

```bash
pnpm changeset
```

Le CLI interactif demande :
- **Quel(s) package(s) sont affectés ?**  
  Sélectionne avec Espace, valide avec Entrée.  
  Packages disponibles : `@spinpad/studio`, `@spinpad/shared`, `firmware`, `website`

- **Quel type de changement ?**
  - `patch` — Fix de bug, correction mineure
  - `minor` — Nouvelle fonctionnalité, amélioration rétrocompatible
  - `major` — Changement cassant (ex : rupture du schéma config)

- **Description** — Résumé en une ligne (sera dans le CHANGELOG)

Un fichier `.changeset/xxxxx-xxxxx.md` est créé. **Committe-le** avec tes modifications.

### 3. Publier une release

Quand tu es prêt à bumper les versions :

```bash
pnpm version          # Bumpe les package.json + génère les CHANGELOG.md
git add -A
git commit -m "chore: release"
git tag firmware/v$(cat packages/firmware/package.json | grep '"version"' | cut -d'"' -f4)
git push && git push --tags
```

GitHub Actions détecte le tag `firmware/v*` → build les `.bin` et crée une GitHub Release automatiquement.

### 4. Conventions de commit

Format recommandé : `type(scope): description`

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Refactoring sans changement de comportement |
| `chore` | Maintenance, infra, dépendances |
| `docs` | Documentation uniquement |
| `build` | Système de build, CMake, CI/CD |

Exemples :
```
feat(studio): add import/export config as .spinpad file
fix(firmware): correct debounce timing in keymap scan
chore: run codegen after adding SPECIAL_ORIENT_CW
build: add SPIFFS partition to firmware partitions.csv
```

---

## Ajouter une nouvelle action firmware

1. **Ajouter la constante dans `packages/shared/src/action-types.js`**
   ```js
   export const SPECIAL_CODES = {
     // ...
     SPECIAL_MON_NEW_ACTION: 0x07,  // ← ajouter ici
   };
   ```

2. **Régénérer le header C**
   ```bash
   pnpm codegen
   ```

3. **Implémenter dans `keymap.c`** — ajouter un case dans `send_action()` :
   ```c
   case ACTION_TYPE_SPECIAL:
       if (value == SPECIAL_MY_NEW_ACTION && pressed) {
           // ... implémentation
       }
       break;
   ```

4. **Ajouter le keycode dans `packages/shared/src/keycodes.js`** pour qu'il apparaisse dans Studio :
   ```js
   firmware: [
     // ...
     { label: 'Mon action', value: action(ACTION_TYPE_SPECIAL, SPECIAL_MY_NEW_ACTION), category: 'firmware' },
   ],
   ```

5. **Créer un changeset** (`pnpm changeset`) pour tracker la modification.
