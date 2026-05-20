# Custom Keyboard Firmware — ESP32-S3

Firmware pour clavier custom ESP32-S3 avec USB HID, BLE multi-device, encoder, écran SSD1315 et app de configuration SvelteKit.

---

## Architecture rapide

```
keyboard-firmware/
├── main/
│   ├── main.c           ← Point d'entrée, init de tout
│   └── kb_config.h      ← GPIO pinmap — LE fichier à modifier pour ton PCB
├── components/
│   ├── keymap/          ← Moteur de touches (layers, combos, modifiers)
│   ├── config_store/    ← Persistence JSON ↔ NVS flash
│   ├── usb_hid/         ← USB HID + port série virtuel (WebSerial)
│   ├── ble_hid/         ← BLE HID multi-device (2 slots)
│   ├── encoder/         ← Encodeur rotatif quadrature
│   ├── display/         ← Écran SSD1315 I2C
│   ├── battery/         ← ADC batterie + LED RGB WS2812
│   └── power_mgmt/      ← Deep sleep automatique
├── config/
│   └── default_config.json  ← Schéma de config (édité par l'app)
└── config-app/          ← App SvelteKit de configuration
```

---

## Prérequis

### 1. Installer ESP-IDF (version 5.x recommandée)

**macOS / Linux :**
```bash
mkdir -p ~/esp
cd ~/esp
git clone --recursive https://github.com/espressif/esp-idf.git
cd esp-idf
./install.sh esp32s3
```

**Windows :** Utilise l'installeur officiel sur https://dl.espressif.com/dl/esp-idf/

### 2. Configurer l'environnement (à faire dans chaque nouveau terminal)

```bash
# macOS/Linux
source ~/esp/esp-idf/export.sh

# Windows (PowerShell)
. ~/esp/esp-idf/export.ps1
```

---

## Premier build

```bash
# 1. Cloner ce repo
git clone <ton-repo> && cd keyboard-firmware

# 2. Définir la cible (ESP32-S3)
idf.py set-target esp32s3

# 3. (Optionnel) Configurer — la plupart des paramètres sont dans sdkconfig.defaults
idf.py menuconfig

# 4. Compiler
idf.py build

# 5. Flasher (remplace /dev/ttyUSB0 par ton port)
idf.py -p /dev/ttyUSB0 flash monitor
```

**Trouver ton port :**
- macOS : `ls /dev/cu.*` → cherche `cu.usbmodem*`
- Linux : `ls /dev/ttyUSB*` ou `ls /dev/ttyACM*`
- Windows : Gestionnaire de périphériques → Ports COM

---

## Adapter le firmware à ton PCB

**Tout est dans `main/kb_config.h`** — c'est le seul fichier à modifier pour changer les GPIO.

```c
// Exemple : changer le GPIO de l'encodeur signal A
#define ENCODER_PIN_A   GPIO_NUM_4   // ← changer ici
```

Sections à vérifier :
- `KB_ROW_PINS[]` et `KB_COL_PINS[]` — matrice de touches
- `SW11`, `SW16`, `SW17` — index dans la matrice (row×cols + col)
- `ENCODER_PIN_A/B/BTN` — encodeur
- `DISPLAY_I2C_SDA/SCL` — écran
- `LED_RGB_GPIO` — LED WS2812
- `BATTERY_ADC_CHANNEL` — ADC batterie

---

## Comportement BLE

| Action | Comportement |
|--------|-------------|
| **SW11** court appui | Bascule entre slot 0 (PC) et slot 1 (HA) |
| **SW16 + SW17** maintenu 2s | Mode pairing pour le slot actif |
| Démarrage | Reconnexion automatique au dernier appareil du slot actif |
| Écran pendant pairing | Affiche "PAIRING — Slot X" avec timeout 30s |

---

## App de configuration SvelteKit

```bash
cd config-app
npm install
npm run dev
```

Ouvrir http://localhost:5173 dans Chrome ou Edge (WebSerial requis).

Connecter le clavier en USB → cliquer "Connecter" → configurer.

---

## Structure des actions (keycodes)

Les keycodes sont des `uint16` encodés sur 16 bits :
- Bits 15-12 : type d'action
- Bits 11-0 : valeur

| Type | Valeur | Exemple |
|------|--------|---------|
| `0x0` | Keycode HID standard | `0x0004` = A |
| `0x1` | Modifier | `0x0001` = Ctrl gauche |
| `0x2` | Layer momentary | `0x2001` = MO(1) |
| `0x3` | Layer toggle | `0x3001` = TG(1) |
| `0x5` | Touche média | `0x5001` = Volume+ |
| `0xF` | Spécial firmware | `0xF001` = BLE switch |

L'app SvelteKit te donne une interface visuelle pour choisir les keycodes — pas besoin de calculer les valeurs à la main.

---

## Deep sleep

Le deep sleep est **automatique** :
- Aucune touche pendant **5 minutes** (configurable) → deep sleep
- Réveil par pression sur n'importe quelle touche
- L'écran s'éteint après **30 secondes** d'inactivité (configurable)

---

## Logs de debug

```bash
idf.py monitor
```

Chaque composant préfixe ses logs avec son nom :
```
[MAIN] === Custom Keyboard démarrage ===
[CONFIG] Config par défaut appliquée
[KEYMAP] Keymap initialisée — 1 profils, 1 combos
[USB_HID] USB HID + CDC initialisés
[BLE_HID] BLE HID initialisé — 2 slots
[ENCODER] Encodeur initialisé (A=4, B=5)
[DISPLAY] Écran SSD1315 initialisé (128x64)
[BATTERY] Batterie init : 3850mV → 62%
[POWER] Power manager initialisé (sleep: 300s, display: 30s)
```

---

## FAQ débutant en C

**Q : C'est quoi un `uint8_t` ?**  
R : Un entier non signé sur 8 bits (0-255). Équivalent à un `number` JS limité à 0-255.

**Q : C'est quoi `static` devant une fonction ?**  
R : La fonction est "privée" au fichier — comme une fonction non exportée en JS.

**Q : Pourquoi `memset` au lieu de `= 0` ?**  
R : En C, les tableaux et structs ne s'initialisent pas automatiquement à zéro. `memset` le fait explicitement.

**Q : Comment débugger ?**  
R : `ESP_LOGI(TAG, "valeur = %d", ma_variable)` → apparaît dans le terminal `idf.py monitor`.

**Q : J'ai une erreur de compilation ?**  
R : Lis le message d'erreur jusqu'à la ligne `error:` — elle indique le fichier et le numéro de ligne.
