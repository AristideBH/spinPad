#pragma once
// ═══════════════════════════════════════════════════════════════
//  kb_config.h — Pinmap and hardware constants
//  THIS is the file to edit to adapt the firmware to your PCB.
//  Every other source imports this header.
// ═══════════════════════════════════════════════════════════════

#include "driver/gpio.h"

// ── Key matrix ────────────────────────────────────────────────
// Matrix of 4 rows × 3 columns = 12 cells, of which 2 empty = 10 keys.
//
// Physical layout (top view):
//   COL0           COL1    COL2
//   [SW1   --2u hori--  ]  [SW7 ]   ROW0  ← SW1 occupies COL0+COL1
//   [SW2 ]         [SW6 ]  [SW8 ]   ROW1
//   [SW3 2u vert]  [SW5 ]  [SW9 ]   ROW2  ← SW3 occupies ROW2+ROW3
//   [           ]  [SW4 ]  [SW10]   ROW3
//
// Empty cells in the electrical matrix (no switch wired):
//   (ROW0, COL1) and (ROW3, COL0)
//
// Index order mirrors packages/shared/src/constants/key-layout.ts

#define KB_MATRIX_ROWS      4       // Number of rows (ROW)
#define KB_MATRIX_COLS      3       // Number of columns (COL)
#define KB_NUM_KEYS         10      // Active keys (12 cells - 2 empty)

// Row GPIOs (outputs — the firmware drives them LOW one by one)
static const gpio_num_t KB_ROW_PINS[KB_MATRIX_ROWS] = {
    GPIO_NUM_10,  // ROW0
    GPIO_NUM_11,  // ROW1
    GPIO_NUM_12,  // ROW2
    GPIO_NUM_13,  // ROW3
};

// Column GPIOs (inputs with internal pull-up)
static const gpio_num_t KB_COL_PINS[KB_MATRIX_COLS] = {
    GPIO_NUM_14,  // COL0
    GPIO_NUM_15,  // COL1
    GPIO_NUM_16,  // COL2
};

// Validity of the matrix cells — false = no switch wired
static const bool KB_MATRIX_VALID[KB_MATRIX_ROWS][KB_MATRIX_COLS] = {
    {true,  false, true },  // ROW0: SW1, EMPTY, SW7
    {true,  true,  true },  // ROW1: SW2, SW6, SW8
    {true,  true,  true },  // ROW2: SW3, SW5, SW9
    {false, true,  true },  // ROW3: EMPTY, SW4, SW10
};

// Matrix cell → logical index mapping (0-9), -1 = empty cell
static const int8_t KB_MATRIX_TO_KEY[KB_MATRIX_ROWS][KB_MATRIX_COLS] = {
    { 0, -1,  1},  // ROW0: SW1=0, EMPTY, SW7=1
    { 2,  3,  4},  // ROW1: SW2=2, SW6=3, SW8=4
    { 5,  6,  7},  // ROW2: SW3=5, SW5=6, SW9=7
    {-1,  8,  9},  // ROW3: EMPTY, SW4=8, SW10=9
};

// Logical key indices of the keyboard (0-9)
#define SW1   0   // COL0/ROW0 — 2u horizontal key
#define SW7   1   // COL2/ROW0
#define SW2   2   // COL0/ROW1
#define SW6   3   // COL1/ROW1
#define SW8   4   // COL2/ROW1
#define SW3   5   // COL0/ROW2 — 2u vertical key
#define SW5   6   // COL1/ROW2
#define SW9   7   // COL2/ROW2
#define SW4   8   // COL1/ROW3
#define SW10  9   // COL2/ROW3

// Special off-matrix buttons (direct GPIOs, pull-up, active low)
// TODO: adjust the GPIOs for the final PCB
#define SW11_GPIO  GPIO_NUM_17   // BLE device switch (short press)
#define SW16_GPIO  GPIO_NUM_18   // BLE pairing (long press SW16+SW17)
#define SW17_GPIO  GPIO_NUM_19   // BLE pairing (long press SW16+SW17)
#define SW_BTN_ACTIVE_LEVEL  0   // Active low (internal pull-up)

// Virtual indices of the special buttons in the state array
#define SW11  10
#define SW16  11
#define SW17  12
#define KB_TOTAL_KEYS  13   // 10 matrix keys + 3 special buttons

// ── Per-key RGB LEDs — WS2812 chain (one LED per switch) ─────────────
// TODO: adjust the GPIO for the final PCB
#define LED_KEY_GPIO    GPIO_NUM_3
#define LED_KEY_COUNT   KB_NUM_KEYS  // 10 LEDs

// ── Rotary encoder ───────────────────────────────────────────
#define ENCODER_PIN_A       GPIO_NUM_4   // Signal A (CLK)
#define ENCODER_PIN_B       GPIO_NUM_5   // Signal B (DT)
#define ENCODER_PIN_BTN     GPIO_NUM_6   // Encoder push button (optional)
#define ENCODER_BTN_ACTIVE  0            // 0 = active low (pull-up)

// ── SSD1306 72×40 screen (I2C) ───────────────────────────────
#define DISPLAY_I2C_SDA     GPIO_NUM_8
#define DISPLAY_I2C_SCL     GPIO_NUM_9
#define DISPLAY_I2C_ADDR    0x3C         // Standard SSD1306 I2C address
#define DISPLAY_WIDTH       72
#define DISPLAY_HEIGHT      40
// The SSD1306 72×40 maps its active buffer starting at column 28
// (128-column internal memory, 72 active centered → offset = (128-72)/2 = 28)
#define DISPLAY_COL_OFFSET  28
#define DISPLAY_I2C_PORT    I2C_NUM_0

// ── RGB LED (battery) — addressable WS2812 ───────────────────
// LED11 = a single WS2812/SK6812 LED on the DATA pin
#define LED_RGB_GPIO        GPIO_NUM_48  // WS2812 data pin
#define LED_RGB_COUNT       1            // Number of LEDs in the chain

// Battery thresholds for the LED color
#define LED_BATT_GREEN_PCT  60           // > 60% → green
#define LED_BATT_YELLOW_PCT 25           // 25-60% → yellow
// < 25% → red (blinking if < 10%)

// ── Battery (ADC) ────────────────────────────────────────────
#define BATTERY_ADC_CHANNEL ADC_CHANNEL_0  // GPIO1 = ADC1_CH0
#define BATTERY_ADC_UNIT    ADC_UNIT_1
// Voltage divider on the PCB (e.g. R1=100k, R2=100k → ratio 0.5)
#define BATTERY_VOLTAGE_DIVIDER_RATIO  0.5f
// Max/min voltage of the LiPo battery in mV
#define BATTERY_VOLTAGE_MAX_MV   4200
#define BATTERY_VOLTAGE_MIN_MV   3300

// ── BLE ──────────────────────────────────────────────────────
#define BLE_DEVICE_NAME         "SpinPad"
#define BLE_NUM_DEVICE_SLOTS    2
#define BLE_SLOT_0              0
#define BLE_SLOT_1              1
// Long-press duration to trigger pairing mode (ms)
#define BLE_PAIRING_LONG_PRESS_MS   2000
// Pairing-mode timeout with no connection (ms)
#define BLE_PAIRING_TIMEOUT_MS      30000

// ── Power management ─────────────────────────────────────────
// Inactivity delay before deep sleep (ms) — 5 minutes
#define POWER_SLEEP_TIMEOUT_MS      (5 * 60 * 1000)
// Inactivity delay before screen turns off (ms) — 30 seconds
#define POWER_DISPLAY_TIMEOUT_MS    (30 * 1000)

// ── Matrix scan ──────────────────────────────────────────────
// Key scan frequency (ms between each full scan)
#define KB_SCAN_INTERVAL_MS     5
// Debounce: number of consecutive identical scans to validate
#define KB_DEBOUNCE_SCANS       3
