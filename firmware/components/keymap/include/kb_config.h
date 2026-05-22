#pragma once
// ═══════════════════════════════════════════════════════════════
//  kb_config.h — Pinmap et constantes matérielles
//  C'est LE fichier à modifier pour adapter le firmware à ton PCB.
//  Toutes les autres sources importent ce header.
// ═══════════════════════════════════════════════════════════════

#include "driver/gpio.h"

// ── Matrice de touches ────────────────────────────────────────
// Matrice 4 lignes × 3 colonnes = 12 cellules, dont 2 vides = 10 touches.
//
// Layout physique (vue de dessus) :
//   COL0     COL1     COL2
//   [SW1 2u] [SW8 ]   [----]   ROW0
//            [SW7 ]   [SW9 ]   ROW1  ← SW2 est aussi en ROW1/COL0
//   [SW2 ]                           (SW1 est 2u, occupe ROW0+ROW1 physiquement)
//   [SW3 ]   [SW6 ]   [SW10 2u] ROW2
//   [SW4 ]   [SW5 ]   [----]   ROW3
//
// Cellules vides (pas de switch câblé) :
//   (ROW0, COL2) et (ROW3, COL2)

#define KB_MATRIX_ROWS      4       // Nombre de lignes (ROW)
#define KB_MATRIX_COLS      3       // Nombre de colonnes (COL)
#define KB_NUM_KEYS         10      // Touches actives (12 cellules - 2 vides)

// GPIO des lignes (sorties — le firmware les met à LOW un par un)
static const gpio_num_t KB_ROW_PINS[KB_MATRIX_ROWS] = {
    GPIO_NUM_10,  // ROW0
    GPIO_NUM_11,  // ROW1
    GPIO_NUM_12,  // ROW2
    GPIO_NUM_13,  // ROW3
};

// GPIO des colonnes (entrées avec pull-up interne)
static const gpio_num_t KB_COL_PINS[KB_MATRIX_COLS] = {
    GPIO_NUM_14,  // COL0
    GPIO_NUM_15,  // COL1
    GPIO_NUM_16,  // COL2
};

// Validité des cellules de la matrice — false = pas de switch câblé
static const bool KB_MATRIX_VALID[KB_MATRIX_ROWS][KB_MATRIX_COLS] = {
    {true,  true,  false},  // ROW0: SW1, SW8, VIDE
    {true,  true,  true },  // ROW1: SW2, SW7, SW9
    {true,  true,  true },  // ROW2: SW3, SW6, SW10
    {true,  true,  false},  // ROW3: SW4, SW5, VIDE
};

// Correspondance cellule matrice → index logique (0-9), -1 = cellule vide
static const int8_t KB_MATRIX_TO_KEY[KB_MATRIX_ROWS][KB_MATRIX_COLS] = {
    { 0,  1, -1},  // ROW0: SW1=0, SW8=1
    { 2,  3,  4},  // ROW1: SW2=2, SW7=3, SW9=4
    { 5,  6,  7},  // ROW2: SW3=5, SW6=6, SW10=7
    { 8,  9, -1},  // ROW3: SW4=8, SW5=9
};

// Index logiques des touches du clavier (0-9)
#define SW1   0   // COL0/ROW0 — touche 2u
#define SW8   1   // COL1/ROW0
#define SW2   2   // COL0/ROW1
#define SW7   3   // COL1/ROW1
#define SW9   4   // COL2/ROW1
#define SW3   5   // COL0/ROW2
#define SW6   6   // COL1/ROW2
#define SW10  7   // COL2/ROW2 — touche 2u
#define SW4   8   // COL0/ROW3
#define SW5   9   // COL1/ROW3

// Boutons spéciaux hors matrice (GPIO directs, pull-up, actif bas)
// TODO: ajuster les GPIO selon le PCB final
#define SW11_GPIO  GPIO_NUM_17   // Changement d'appareil BLE (court appui)
#define SW16_GPIO  GPIO_NUM_18   // Pairing BLE (long appui SW16+SW17)
#define SW17_GPIO  GPIO_NUM_19   // Pairing BLE (long appui SW16+SW17)
#define SW_BTN_ACTIVE_LEVEL  0   // Actif bas (pull-up interne)

// Index virtuels des boutons spéciaux dans le tableau d'état
#define SW11  10
#define SW16  11
#define SW17  12
#define KB_TOTAL_KEYS  13   // 10 touches matrice + 3 boutons spéciaux

// ── LEDs RGB par touche — chaîne WS2812 (une LED par switch) ─────────
// TODO: ajuster le GPIO selon le PCB final
#define LED_KEY_GPIO    GPIO_NUM_3
#define LED_KEY_COUNT   KB_NUM_KEYS  // 10 LEDs

// ── Encodeur rotatif ─────────────────────────────────────────
#define ENCODER_PIN_A       GPIO_NUM_4   // Signal A (CLK)
#define ENCODER_PIN_B       GPIO_NUM_5   // Signal B (DT)
#define ENCODER_PIN_BTN     GPIO_NUM_6   // Bouton push de l'encodeur (optionnel)
#define ENCODER_BTN_ACTIVE  0            // 0 = actif à l'état bas (pull-up)

// ── Écran SSD1306 72×40 (I2C) ────────────────────────────────
#define DISPLAY_I2C_SDA     GPIO_NUM_8
#define DISPLAY_I2C_SCL     GPIO_NUM_9
#define DISPLAY_I2C_ADDR    0x3C         // Adresse I2C standard SSD1306
#define DISPLAY_WIDTH       72
#define DISPLAY_HEIGHT      40
// Le SSD1306 72×40 mappe son buffer actif à partir de la colonne 28
// (mémoire interne 128 colonnes, 72 actives centrées → offset = (128-72)/2 = 28)
#define DISPLAY_COL_OFFSET  28
#define DISPLAY_I2C_PORT    I2C_NUM_0

// ── LED RGB (batterie) — WS2812 addressable ──────────────────
// LED11 = une seule LED WS2812/SK6812 sur le pin DATA
#define LED_RGB_GPIO        GPIO_NUM_48  // Pin data WS2812
#define LED_RGB_COUNT       1            // Nombre de LEDs dans la chaîne

// Seuils batterie pour la couleur de la LED
#define LED_BATT_GREEN_PCT  60           // > 60% → vert
#define LED_BATT_YELLOW_PCT 25           // 25-60% → jaune
// < 25% → rouge (clignotant si < 10%)

// ── Batterie (ADC) ───────────────────────────────────────────
#define BATTERY_ADC_CHANNEL ADC_CHANNEL_0  // GPIO1 = ADC1_CH0
#define BATTERY_ADC_UNIT    ADC_UNIT_1
// Diviseur de tension sur le PCB (ex: R1=100k, R2=100k → ratio 0.5)
#define BATTERY_VOLTAGE_DIVIDER_RATIO  0.5f
// Tension max/min de la batterie LiPo en mV
#define BATTERY_VOLTAGE_MAX_MV   4200
#define BATTERY_VOLTAGE_MIN_MV   3300

// ── BLE ──────────────────────────────────────────────────────
#define BLE_DEVICE_NAME         "CustomKeyboard"
#define BLE_NUM_DEVICE_SLOTS    2       // slot 0 = PC, slot 1 = HA
#define BLE_SLOT_PC             0
#define BLE_SLOT_HA             1
// Durée du long appui pour déclencher le mode pairing (ms)
#define BLE_PAIRING_LONG_PRESS_MS   2000
// Timeout du mode pairing sans connexion (ms)
#define BLE_PAIRING_TIMEOUT_MS      30000

// ── Power management ─────────────────────────────────────────
// Délai d'inactivité avant deep sleep (ms) — 5 minutes
#define POWER_SLEEP_TIMEOUT_MS      (5 * 60 * 1000)
// Délai d'inactivité avant extinction écran (ms) — 30 secondes
#define POWER_DISPLAY_TIMEOUT_MS    (30 * 1000)

// ── Scan de la matrice ───────────────────────────────────────
// Fréquence de scan des touches (ms entre chaque scan complet)
#define KB_SCAN_INTERVAL_MS     5
// Anti-rebond : nombre de scans consécutifs identiques pour valider
#define KB_DEBOUNCE_SCANS       3
