# @spinpad/flasher

Outil de flash WebSerial pour le SpinPad — flasher le firmware directement depuis le navigateur sans outil tiers.

## Prérequis

- **Chrome ou Edge** (WebSerial API requis — non supporté sur Firefox)
- SpinPad en mode bootloader USB (maintenir BOOT + RST)

## Dev

```bash
# Depuis la racine du monorepo
pnpm --filter @spinpad/flasher dev      # → http://localhost:5175

# Ou depuis ce dossier
pnpm dev
```

> **Note** : Ce package requiert les headers COOP/COEP pour `SharedArrayBuffer` (utilisé par esptool-js).  
> Ils sont configurés dans `vite.config.js` pour le mode dev. En production, configurer le serveur en conséquence.

## Build

```bash
pnpm --filter @spinpad/flasher build
# Output : tools/flasher/build/
```

## Utilisation

1. Ouvrir l'outil dans Chrome/Edge
2. Mettre le SpinPad en mode bootloader (maintenir **BOOT** pendant la connexion USB)
3. Cliquer "Sélectionner le port" → choisir le port série du SpinPad
4. Choisir un fichier `.bin` local ou sélectionner une release GitHub
5. Cliquer "Flasher" — la progression s'affiche en temps réel

## Stack

- **SvelteKit** avec `adapter-static`
- **esptool-js** — port JS d'esptool pour le flash WebSerial
- Standalone (pas de dépendance sur `@spinpad/shared` ou le Studio)

## Différence avec idf.py flash

| | `idf.py flash` | FlashTool WebSerial |
|--|---|---|
| OS requis | Windows/Linux/macOS + ESP-IDF | Navigateur uniquement |
| Technique | | Aucun outil à installer |
| Cible | Développeurs | Utilisateurs finaux |
| Bootloader séparé | Oui | Non (merged binary) |

## Build de la merged binary (firmware)

Pour flasher depuis cet outil, il faut une merged binary :

```bash
cd packages/firmware
python $IDF_PATH/components/esptool_py/esptool/esptool.py \
    --chip esp32s3 merge_bin \
    -o merged-firmware.bin \
    --flash_mode dio \
    @flash_args
```

La merged binary est également attachée aux [GitHub Releases](../../.github/workflows/firmware-release.yml).
