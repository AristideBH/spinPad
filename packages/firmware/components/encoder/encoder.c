// ═══════════════════════════════════════════════════════════════
//  encoder.c — Encodeur rotatif quadrature
//
//  Un encodeur quadrature génère deux signaux déphasés (A et B).
//  En lisant l'ordre d'apparition des fronts, on détermine
//  le sens de rotation (CW = horaire, CCW = anti-horaire).
//
//  Table de transition quadrature :
//    AB: 00→01→11→10→00 = sens horaire (CW)
//    AB: 00→10→11→01→00 = sens anti-horaire (CCW)
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
//  Table de décodage quadrature
//  Index = (prev_AB << 2) | curr_AB
//  Valeur = +1 (CW), -1 (CCW), 0 (invalide/pas de mouvement)
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

// État précédent des pins A et B
static uint8_t g_encoder_prev_ab = 0;
// Accumulateur de pas (pour éviter d'envoyer un event par micromovement)
static int8_t  g_encoder_accumulator = 0;
// Queue pour passer les événements de l'ISR à la tâche principale
static QueueHandle_t g_encoder_queue = NULL;

// ─────────────────────────────────────────────────────────────
//  ISR (Interrupt Service Routine)
//  Appelée automatiquement sur chaque front (montant ou descendant)
//  des pins A ou B.
//  IMPORTANT : les ISR doivent être rapides et ne pas bloquer.
//  On met juste un delta dans la queue, le traitement se fait ailleurs.
// ─────────────────────────────────────────────────────────────
static void IRAM_ATTR encoder_isr_handler(void *arg)
{
    // Lire l'état actuel des deux pins
    uint8_t a = gpio_get_level(ENCODER_PIN_A);
    uint8_t b = gpio_get_level(ENCODER_PIN_B);
    uint8_t curr_ab = (a << 1) | b;

    // Calculer le delta via la table quadrature
    int8_t delta = QUADRATURE_TABLE[(g_encoder_prev_ab << 2) | curr_ab];
    g_encoder_prev_ab = curr_ab;

    if (delta != 0) {
        // Envoyer le delta vers la queue (depuis une ISR → utiliser xQueueSendFromISR)
        BaseType_t woken = pdFALSE;
        xQueueSendFromISR(g_encoder_queue, &delta, &woken);
        // Donner la main à une tâche plus prioritaire si elle attend sur cette queue
        if (woken) portYIELD_FROM_ISR();
    }
}

// ─────────────────────────────────────────────────────────────
//  ENVOI DE L'ACTION ENCODER
// ─────────────────────────────────────────────────────────────
static void send_encoder_action(bool clockwise)
{
    // Récupérer l'action de l'encoder depuis le layer actif
    uint8_t active_layer = keymap_get_active_layer();
    uint8_t active_profile = config_store_get()->active_profile;
    const kb_layer_t *layer = &config_store_get()->profiles[active_profile].layers[active_layer];

    uint16_t action = clockwise ? layer->encoder_cw : layer->encoder_ccw;
    if (action == KC_NONE) return;

    // Envoyer l'action (press + release immédiat pour les encodeurs)
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
//  FONCTIONS PUBLIQUES
// ─────────────────────────────────────────────────────────────

esp_err_t encoder_init(void)
{
    // Créer la queue (capacité 32 deltas)
    g_encoder_queue = xQueueCreate(32, sizeof(int8_t));

    // Configurer les GPIO encodeur en entrée avec pull-up
    gpio_config_t cfg = {
        .pin_bit_mask = (1ULL << ENCODER_PIN_A) | (1ULL << ENCODER_PIN_B),
        .mode         = GPIO_MODE_INPUT,
        .pull_up_en   = GPIO_PULLUP_ENABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type    = GPIO_INTR_ANYEDGE,  // Interruption sur tout changement
    };
    gpio_config(&cfg);

    // Lire l'état initial
    uint8_t a = gpio_get_level(ENCODER_PIN_A);
    uint8_t b = gpio_get_level(ENCODER_PIN_B);
    g_encoder_prev_ab = (a << 1) | b;

    // Installer le service d'interruption GPIO
    gpio_install_isr_service(0);
    gpio_isr_handler_add(ENCODER_PIN_A, encoder_isr_handler, NULL);
    gpio_isr_handler_add(ENCODER_PIN_B, encoder_isr_handler, NULL);

    // Bouton de l'encodeur (optionnel)
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

    ESP_LOGI(TAG, "Encodeur initialisé (A=%d, B=%d)", ENCODER_PIN_A, ENCODER_PIN_B);
    return ESP_OK;
}

void encoder_process(void)
{
    // Drainer tous les deltas accumulés dans la queue
    int8_t delta;
    while (xQueueReceive(g_encoder_queue, &delta, 0) == pdTRUE) {
        g_encoder_accumulator += delta;
    }

    // Seuil adapté à la sensibilité config (1–4) :
    //   sensitivity=1 → seuil 4 (1 événement par détent, comportement standard)
    //   sensitivity=2 → seuil 2 (2× plus réactif)
    //   sensitivity=4 → seuil 1 (1 événement par impulsion quadrature)
    uint8_t sens = config_store_get()->encoder.sensitivity;
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
