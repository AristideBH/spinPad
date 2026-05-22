#pragma once
// ═══════════════════════════════════════════════════════════════
//  kb_config.h — Pinmap et constantes matérielles
//  C'est LE fichier à modifier pour adapter le firmware à ton PCB.
//  Toutes les autres sources importent ce header.
// ═══════════════════════════════════════════════════════════════

#include "driver/gpio.h"

// ── Matrice de touches ────────────────────────────────────────
// Le clavier utilise une matrice ligne × colonne.
// Chaque touche = une ligne + une colonne.
// Exemple : SW1 = ligne 0, colonne 0

#define KB_MATRIX_ROWS      4       // Nombre de lignes (ROW)
#define KB_MATRIX_COLS      5       // Nombre de colonnes (COL)
#define KB_NUM_KEYS         (KB_MATRIX_ROWS * KB_MATRIX_COLS)  // = 20

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
    GPIO_NUM_17,  // COL3
    GPIO_NUM_18,  // COL4
};

// Index logique de chaque switch dans la matrice (row * COLS + col)
// SW1..SW20 — ajuste selon ton schéma PCB
#define SW1   0
#define SW2   1
#define SW3   2
#define SW4   3
#define SW5   4
#define SW6   5
#define SW7   6
#define SW8   7
#define SW9   8
#define SW10  9
#define SW11  10   // ← switch BLE device (court appui = changer d'appareil)
#define SW12  11
#define SW13  12
#define SW14  13
#define SW15  14
#define SW16  15   // ← pairing BLE (long appui SW16+SW17 simultané)
#define SW17  16   // ← pairing BLE (idem)
#define SW18  17
#define SW19  18
#define SW20  19

// ── Encodeur rotatif ─────────────────────────────────────────
#define ENCODER_PIN_A       GPIO_NUM_4   // Signal A (CLK)
#define ENCODER_PIN_B       GPIO_NUM_5   // Signal B (DT)
#define ENCODER_PIN_BTN     GPIO_NUM_6   // Bouton push de l'encodeur (optionnel)
#define ENCODER_BTN_ACTIVE  0            // 0 = actif à l'état bas (pull-up)

// ── Écran SSD1315 (I2C) ──────────────────────────────────────
#define DISPLAY_I2C_SDA     GPIO_NUM_8
#define DISPLAY_I2C_SCL     GPIO_NUM_9
#define DISPLAY_I2C_ADDR    0x3C         // Adresse I2C standard SSD1315
#define DISPLAY_WIDTH       128
#define DISPLAY_HEIGHT      64
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
