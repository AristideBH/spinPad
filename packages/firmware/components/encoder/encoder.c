// ═══════════════════════════════════════════════════════════════
//  encoder.c — Quadrature rotary encoder
//
//  A quadrature encoder generates two phase-shifted signals (A and B).
//  By reading the order in which the edges appear, we determine
//  the rotation direction (CW = clockwise, CCW = counter-clockwise).
//
//  Quadrature transition table:
//    AB: 00→01→11→10→00 = clockwise (CW)
//    AB: 00→10→11→01→00 = counter-clockwise (CCW)
// ═══════════════════════════════════════════════════════════════

#include "encoder.h"
#include "kb_config.h"
#include "config_store.h"
#include "keymap.h"
#include "usb_hid.h"
#include "ble_hid.h"

#include "driver/gpio.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include <stdint.h>

static const char *TAG = "ENCODER";

// ─────────────────────────────────────────────────────────────
//  Quadrature decoding table
//  Index = (prev_AB << 2) | curr_AB
//  Value = +1 (CW), -1 (CCW), 0 (invalid/no movement)
// ─────────────────────────────────────────────────────────────
static const int8_t QUADRATURE_TABLE[16] = {
//  AB: 00→00  00→01  00→10  00→11
        0,     +1,    -1,     0,
//  AB: 01→00  01→01  01→10  01→11
       -1,      0,     0,    +1,
//  AB: 10→00  10→01  10→10  10→11
       +1,      0,     0,    -1,
//  AB: 11→00  11→01  11→10  11→11
        0,     -1,    +1,     0,
};

// Previous state of pins A and B
static uint8_t g_encoder_prev_ab = 0;
// Step accumulator (to avoid sending one event per micro-movement)
static int8_t  g_encoder_accumulator = 0;
// Queue to pass events from the ISR to the main task
static QueueHandle_t g_encoder_queue = NULL;

// ─────────────────────────────────────────────────────────────
//  ISR (Interrupt Service Routine)
//  Called automatically on each edge (rising or falling)
//  of pins A or B.
//  IMPORTANT: ISRs must be fast and must not block.
//  We just put a delta in the queue, the processing happens elsewhere.
// ─────────────────────────────────────────────────────────────
static void IRAM_ATTR encoder_isr_handler(void *arg)
{
    // Read the current state of both pins
    uint8_t a = gpio_get_level(ENCODER_PIN_A);
    uint8_t b = gpio_get_level(ENCODER_PIN_B);
    uint8_t curr_ab = (a << 1) | b;

    // Compute the delta via the quadrature table
    int8_t delta = QUADRATURE_TABLE[(g_encoder_prev_ab << 2) | curr_ab];
    g_encoder_prev_ab = curr_ab;

    if (delta != 0) {
        // Send the delta to the queue (from an ISR → use xQueueSendFromISR)
        BaseType_t woken = pdFALSE;
        xQueueSendFromISR(g_encoder_queue, &delta, &woken);
        // Yield to a higher-priority task if it is waiting on this queue
        if (woken) portYIELD_FROM_ISR();
    }
}

// ─────────────────────────────────────────────────────────────
//  SENDING THE ENCODER ACTION
// ─────────────────────────────────────────────────────────────
static void send_encoder_action(bool clockwise)
{
    // Get the encoder action from the active layer
    uint8_t active_layer = keymap_get_active_layer();
    uint8_t active_profile = config_store_get()->active_profile;
    const kb_layer_t *layer = &config_store_get()->profiles[active_profile].layers[active_layer];

    uint16_t action = clockwise ? layer->encoder_cw : layer->encoder_ccw;
    if (action == KC_NONE) return;

    // Send the action (press + immediate release for encoders)
    uint8_t type  = (action >> 12) & 0xF;
    uint16_t value = action & 0x0FFF;

    if (type == ACTION_TYPE_MEDIA) {
        usb_hid_consumer_press(value);
        usb_hid_consumer_release();
        ble_hid_consumer_press(value);
        ble_hid_consumer_release();
    } else if (type == ACTION_TYPE_KC) {
        usb_hid_key_press((uint8_t)value, 0);
        usb_hid_key_release((uint8_t)value);
        ble_hid_key_press((uint8_t)value, 0);
        ble_hid_key_release((uint8_t)value);
    }

    ESP_LOGD(TAG, "Encoder %s → action 0x%04X", clockwise ? "CW" : "CCW", action);
}

// ─────────────────────────────────────────────────────────────
//  PUBLIC FUNCTIONS
// ─────────────────────────────────────────────────────────────

esp_err_t encoder_init(void)
{
    // Create the queue (capacity 32 deltas)
    g_encoder_queue = xQueueCreate(32, sizeof(int8_t));

    // Configure the encoder GPIOs as input with pull-up
    gpio_config_t cfg = {
        .pin_bit_mask = (1ULL << ENCODER_PIN_A) | (1ULL << ENCODER_PIN_B),
        .mode         = GPIO_MODE_INPUT,
        .pull_up_en   = GPIO_PULLUP_ENABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type    = GPIO_INTR_ANYEDGE,  // Interrupt on any change
    };
    gpio_config(&cfg);

    // Read the initial state
    uint8_t a = gpio_get_level(ENCODER_PIN_A);
    uint8_t b = gpio_get_level(ENCODER_PIN_B);
    g_encoder_prev_ab = (a << 1) | b;

    // Install the GPIO interrupt service
    gpio_install_isr_service(0);
    gpio_isr_handler_add(ENCODER_PIN_A, encoder_isr_handler, NULL);
    gpio_isr_handler_add(ENCODER_PIN_B, encoder_isr_handler, NULL);

    // Encoder button (optional)
    if (ENCODER_PIN_BTN >= 0) {
        gpio_config_t btn_cfg = {
            .pin_bit_mask = (1ULL << ENCODER_PIN_BTN),
            .mode         = GPIO_MODE_INPUT,
            .pull_up_en   = GPIO_PULLUP_ENABLE,
            .pull_down_en = GPIO_PULLDOWN_DISABLE,
            .intr_type    = GPIO_INTR_DISABLE,
        };
        gpio_config(&btn_cfg);
    }

    ESP_LOGI(TAG, "Encoder initialized (A=%d, B=%d)", ENCODER_PIN_A, ENCODER_PIN_B);
    return ESP_OK;
}

void encoder_process(void)
{
    // Drain all deltas accumulated in the queue
    int8_t delta;
    while (xQueueReceive(g_encoder_queue, &delta, 0) == pdTRUE) {
        g_encoder_accumulator += delta;
    }

    // Threshold adapted to the config sensitivity (1-4):
    //   sensitivity=1 → threshold 4 (1 event per detent, standard behavior)
    //   sensitivity=2 → threshold 2 (2× more reactive)
    //   sensitivity=4 → threshold 1 (1 event per quadrature pulse)
    // Override per layer (0 = inherits from global).
    uint8_t active_layer_idx = keymap_get_active_layer();
    uint8_t active_profile_idx = config_store_get()->active_profile;
    const kb_layer_t *active_layer = &config_store_get()->profiles[active_profile_idx].layers[active_layer_idx];
    uint8_t sens = active_layer->encoder_sensitivity;
    if (sens == 0) sens = config_store_get()->encoder.sensitivity;
    if (sens < 1 || sens > 4) sens = 1;
    int8_t threshold = (int8_t)(4 / sens);  // 4, 2, 1, 1

    while (g_encoder_accumulator >= threshold) {
        send_encoder_action(true);   // Clockwise
        g_encoder_accumulator -= threshold;
    }
    while (g_encoder_accumulator <= -threshold) {
        send_encoder_action(false);  // Counter-clockwise
        g_encoder_accumulator += threshold;
    }
}
