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
│   ├── website/           # Site public SvelteKit — landing, docs, Studio embarqué
│   └── shared/            # Constantes partagées JS → C (keycodes, action types)
├── hardware/
│   └── boards/
│       └── spinpad-v1/    # Pinmap (kb_config.h), sdkconfig.board, PCB, BOM
├── tools/
│   └── hyperion-bridge/   # Bridge Hyperion NG → SpinPad LEDs (Node.js)
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
pnpm dev                                    # → http://localhost:5173 (WebSerial, Chrome/Edge)
pnpm --filter @spinpad/studio build         # Build web standard
pnpm --filter @spinpad/studio build:embedded # Build pour Studio Mode (WiFi AP embarqué)
```

### Website

```bash
pnpm --filter @spinpad/website dev      # → http://localhost:5174
pnpm --filter @spinpad/website build
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

## Home Assistant

Le SpinPad s'intègre nativement avec Home Assistant via l'intégration [`keyboard_remote`](https://www.home-assistant.io/integrations/keyboard_remote/).

1. Appairer le SpinPad en BLE sur le host HA (Raspberry Pi, etc.) — slot BLE dédié recommandé
2. HA détecte le clavier BLE → déclencher des automatisations sur keypresses :

```yaml
automation:
  trigger:
    platform: event
    event_type: keyboard_remote_command_received
    event_data:
      device_name: "SpinPad"
      type: key_pressed
      key_code: 30    # Touche SW1 (keycode HID = 'a' par défaut)
  action:
    service: light.toggle
    target:
      entity_id: light.bureau
```

Aucun code firmware supplémentaire requis — le BLE HID standard suffit.

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

Le logiciel SpinPad est distribué sous licence **[PolyForm Noncommercial 1.0.0](LICENSE)**.

- Usage personnel, éducatif, et open-source : libre et gratuit
- Usage commercial : interdit sans accord explicite de l'auteur
- Toute redistribution doit inclure cette licence et l'avis de copyright

Le matériel (PCB) est publié sous **CC BY-NC-SA 4.0** sur [OSHWLAB](https://oshwlab.com/aristide.bruneau/spinpad-v1).

> Pour une demande de licence commerciale, ouvrir une issue ou contacter l'auteur directement.
