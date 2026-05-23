# SpinPad

> Macropad custom 10 touches + encodeur rotatif — ESP32-S3  
> Firmware C (ESP-IDF) · Studio SvelteKit · WiFi Studio Mode · LEDs WS2812

---

## Structure du repo

```
spinpad/
├── packages/
│   ├── firmware/          # Firmware ESP-IDF (C) — USB HID, BLE, encoder, OLED, LEDs
│   ├── studio/            # Config app SvelteKit — éditeur keymap, profils, LEDs
│   └── shared/            # Constantes partagées JS → C (keycodes, action types)
├── hardware/
│   └── boards/
│       └── spinpad-v1/    # Pinmap (kb_config.h), PCB, BOM, 3D
├── tools/                 # Scripts utilitaires (build embedded, flash, Hyperion bridge)
├── docs/                  # Documentation projet
└── .github/workflows/     # CI/CD (firmware release, studio deploy)
```

## Démarrage rapide

### Prérequis

- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io) 9+
- [ESP-IDF](https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/get-started/) v5.x

### Studio (config app)

```bash
pnpm install
pnpm dev        # → http://localhost:5173
```

### Firmware

```bash
# Ouvrir spinpad.code-workspace dans VSCode pour l'extension ESP-IDF
# Ou en CLI depuis packages/firmware/ :
idf.py set-target esp32s3
idf.py build
idf.py -p <PORT> flash monitor
```

## Studio Mode (configuration WiFi)

Maintenir **SW8 + SW9 pendant 3 secondes** → le SpinPad crée un point d'accès WiFi.

| SSID | IP |
|------|----|
| `SpinPad-Config` | `192.168.4.1` |

Connecter son téléphone ou PC au réseau, ouvrir le navigateur → Studio se charge directement depuis le SpinPad. Même combo pour quitter (ou auto-exit après 5 min d'inactivité).

## Hardware

- **MCU** : ESP32-S3
- **Touches** : 10 switches dans une matrice 4×3 (2 cellules vides)
- **Encodeur** : rotatif quadrature + bouton
- **Écran** : SSD1306 72×40 I2C
- **LEDs** : WS2812C par touche (×10 chaîne) + 1 LED statut batterie
- **Batterie** : LiPo avec ADC de mesure
- **Connectivité** : USB HID + BLE HID (2 slots)

## Contributions

Voir [CONTRIBUTING.md](./CONTRIBUTING.md) pour le workflow de développement, les conventions de commit, et l'utilisation de Changeset pour les releases.

## Licence

À définir.
