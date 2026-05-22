// ═══════════════════════════════════════════════════════════════
//  keymap.c — Moteur de touches : layers, combos, modifiers
//
//  LECTURE RECOMMANDÉE si tu débutes en C :
//  Pense à ce fichier comme un "service" JavaScript.
//  Les fonctions statiques (static) = fonctions privées du module.
//  Les fonctions sans static = fonctions publiques (dans keymap.h).
// ═══════════════════════════════════════════════════════════════

#include "keymap.h"
#include "kb_config.h"
#include "config_store.h"
#include "usb_hid.h"
#include "ble_hid.h"

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "esp_timer.h"      // Timestamps en microsecondes
#include "esp_log.h"
#include <string.h>         // memset, memcpy

static const char *TAG = "KEYMAP";

// ─────────────────────────────────────────────────────────────
//  ÉTAT INTERNE DU MODULE
//  Variables "static" = privées, visibles uniquement dans ce fichier
// ─────────────────────────────────────────────────────────────

// Le keymap complet : [profil][layer][touche] = action
// Chargé depuis config_store au démarrage
static uint16_t g_keymap[CONFIG_MAX_PROFILES][KEYMAP_MAX_LAYERS][KB_NUM_KEYS];

// Nombre de layers actifs dans chaque profil
static uint8_t g_layer_count[CONFIG_MAX_PROFILES];

// Profil actuellement actif
static uint8_t g_active_profile = 0;

// Stack des layers actifs (like a z-index stack)
// Le layer d'index le plus élevé est prioritaire.
// Exemple : [0, 2] → layer 2 est actif, layer 0 en dessous
static uint8_t  g_layer_stack[KEYMAP_MAX_LAYERS];
static uint8_t  g_layer_stack_size = 0;

// ── État physique des touches ─────────────────────────────────
// Indices 0..KB_NUM_KEYS-1  : touches matrice (SW1-SW10)
// Indices KB_NUM_KEYS..KB_TOTAL_KEYS-1 : boutons spéciaux (SW11, SW16, SW17)
static uint8_t  g_key_state[KB_TOTAL_KEYS];       // État actuel (1=pressé, 0=relâché)
static uint8_t  g_key_prev[KB_TOTAL_KEYS];        // État au scan précédent
static uint8_t  g_debounce_count[KB_TOTAL_KEYS];  // Compteur anti-rebond

// Timestamp (µs) du moment où chaque touche a été pressée
static int64_t  g_key_press_time[KB_TOTAL_KEYS];

// Modificateur actuellement actif (byte HID : bits 0-7)
static uint8_t  g_modifier_state = 0;

// Flag "activité détectée" (reset après keymap_has_activity())
static bool     g_has_activity = false;

// ── Combos ────────────────────────────────────────────────────
static kb_combo_t g_combos[KEYMAP_MAX_COMBOS];
static uint8_t    g_combo_count = 0;

// État interne du détecteur de combos
typedef enum {
    COMBO_STATE_IDLE,       // Pas de combo en cours
    COMBO_STATE_DETECTING,  // Touches partiellement pressées, en attente
    COMBO_STATE_FIRED,      // Combo déclenché
} combo_state_t;

static combo_state_t g_combo_state = COMBO_STATE_IDLE;
static int64_t       g_combo_start_time = 0;   // Quand le premier appui du combo a eu lieu

// ── Long press (pour SW16+SW17 pairing) ──────────────────────
static int64_t g_sw16_press_time = 0;
static int64_t g_sw17_press_time = 0;
static bool    g_pairing_triggered = false;

// ─────────────────────────────────────────────────────────────
//  FONCTIONS PRIVÉES — MATRICE GPIO
// ─────────────────────────────────────────────────────────────

// Configure les GPIO de la matrice et des boutons spéciaux
static void matrix_gpio_init(void)
{
    // Lignes (ROW) = sorties, HIGH par défaut
    for (int r = 0; r < KB_MATRIX_ROWS; r++) {
        gpio_config_t cfg = {
            .pin_bit_mask = (1ULL << KB_ROW_PINS[r]),
            .mode         = GPIO_MODE_OUTPUT,
            .pull_up_en   = GPIO_PULLUP_DISABLE,
            .pull_down_en = GPIO_PULLDOWN_DISABLE,
            .intr_type    = GPIO_INTR_DISABLE,
        };
        gpio_config(&cfg);
        gpio_set_level(KB_ROW_PINS[r], 1);
    }

    // Colonnes (COL) = entrées avec pull-up — LOW = touche pressée
    for (int c = 0; c < KB_MATRIX_COLS; c++) {
        gpio_config_t cfg = {
            .pin_bit_mask = (1ULL << KB_COL_PINS[c]),
            .mode         = GPIO_MODE_INPUT,
            .pull_up_en   = GPIO_PULLUP_ENABLE,
            .pull_down_en = GPIO_PULLDOWN_DISABLE,
            .intr_type    = GPIO_INTR_DISABLE,
        };
        gpio_config(&cfg);
    }

    // Boutons spéciaux hors matrice (SW11, SW16, SW17)
    const gpio_num_t special_pins[] = {SW11_GPIO, SW16_GPIO, SW17_GPIO};
    for (int i = 0; i < 3; i++) {
        gpio_config_t cfg = {
            .pin_bit_mask = (1ULL << special_pins[i]),
            .mode         = GPIO_MODE_INPUT,
            .pull_up_en   = GPIO_PULLUP_ENABLE,
            .pull_down_en = GPIO_PULLDOWN_DISABLE,
            .intr_type    = GPIO_INTR_DISABLE,
        };
        gpio_config(&cfg);
    }

    ESP_LOGI(TAG, "GPIO matrice initialisée (%dx%d + 3 boutons spéciaux)",
             KB_MATRIX_ROWS, KB_MATRIX_COLS);
}

// ─────────────────────────────────────────────────────────────
//  FONCTIONS PRIVÉES — LAYERS
// ─────────────────────────────────────────────────────────────

// Pousser un layer sur la stack (le rendre actif)
// Équivalent à "z-index: auto" en CSS
static void layer_push(uint8_t layer)
{
    if (g_layer_stack_size >= KEYMAP_MAX_LAYERS) {
        ESP_LOGW(TAG, "Layer stack plein");
        return;
    }
    // Éviter les doublons
    for (int i = 0; i < g_layer_stack_size; i++) {
        if (g_layer_stack[i] == layer) return;
    }
    g_layer_stack[g_layer_stack_size++] = layer;
    ESP_LOGD(TAG, "Layer %d activé (stack size: %d)", layer, g_layer_stack_size);
}

// Retirer un layer de la stack
static void layer_pop(uint8_t layer)
{
    for (int i = 0; i < g_layer_stack_size; i++) {
        if (g_layer_stack[i] == layer) {
            // Décaler tous les éléments suivants vers la gauche
            // (comme Array.splice en JS)
            memmove(&g_layer_stack[i], &g_layer_stack[i+1],
                    (g_layer_stack_size - i - 1) * sizeof(uint8_t));
            g_layer_stack_size--;
            ESP_LOGD(TAG, "Layer %d désactivé", layer);
            return;
        }
    }
}

// Retourner l'action pour une touche donnée selon les layers actifs
// Cherche depuis le layer le plus haut vers le bas (priorité descendante)
static uint16_t layer_resolve_action(uint8_t key_index)
{
    // Cherche du layer le plus haut (fin de stack) vers le bas
    for (int i = g_layer_stack_size - 1; i >= 0; i--) {
        uint8_t layer = g_layer_stack[i];
        uint16_t action = g_keymap[g_active_profile][layer][key_index];
        // KC_NONE = "transparent" → passer au layer en dessous
        if (action != KC_NONE) {
            return action;
        }
    }
    return KC_NONE;  // Aucune action trouvée dans aucun layer
}

// ─────────────────────────────────────────────────────────────
//  FONCTIONS PRIVÉES — COMBOS
// ─────────────────────────────────────────────────────────────

// Vérifier si un ensemble de touches correspond à un combo défini
// Retourne l'index du combo, ou -1 si pas de match
static int combo_find_match(void)
{
    for (int c = 0; c < g_combo_count; c++) {
        if (!g_combos[c].active) continue;

        bool all_pressed = true;
        for (int k = 0; k < g_combos[c].key_count; k++) {
            uint8_t sw = g_combos[c].keys[k];
            if (!g_key_state[sw]) {
                all_pressed = false;
                break;
            }
        }
        if (all_pressed) return c;
    }
    return -1;
}

// ─────────────────────────────────────────────────────────────
//  FONCTIONS PRIVÉES — ENVOI HID
// ─────────────────────────────────────────────────────────────

// Dispatcher l'action vers le bon handler (USB ou BLE)
static void send_action(uint16_t action, bool pressed)
{
    uint8_t  type  = (action >> 12) & 0xF;   // 4 bits hauts = type
    uint16_t value = action & 0x0FFF;          // 12 bits bas  = valeur

    switch (type) {

    case ACTION_TYPE_KC:
        // Keycode standard : envoyer via USB HID ou BLE HID
        if (pressed) {
            usb_hid_key_press((uint8_t)value, g_modifier_state);
            ble_hid_key_press((uint8_t)value, g_modifier_state);
        } else {
            usb_hid_key_release((uint8_t)value);
            ble_hid_key_release((uint8_t)value);
        }
        break;

    case ACTION_TYPE_MOD:
        // Modificateur : mettre à jour le byte de modificateur
        if (pressed) {
            g_modifier_state |= (uint8_t)value;   // Activer le bit
        } else {
            g_modifier_state &= ~(uint8_t)value;  // Désactiver le bit
        }
        break;

    case ACTION_TYPE_LAYER_MO:
        // Momentary : layer actif tant que la touche est pressée
        if (pressed) layer_push((uint8_t)value);
        else         layer_pop((uint8_t)value);
        break;

    case ACTION_TYPE_LAYER_TG:
        // Toggle : chaque appui active/désactive
        if (pressed) {
            bool found = false;
            for (int i = 0; i < g_layer_stack_size; i++) {
                if (g_layer_stack[i] == (uint8_t)value) {
                    layer_pop((uint8_t)value);
                    found = true;
                    break;
                }
            }
            if (!found) layer_push((uint8_t)value);
        }
        break;

    case ACTION_TYPE_LAYER_TO:
        // To : aller directement sur ce layer (reset la stack)
        if (pressed) {
            g_layer_stack_size = 0;
            layer_push(0);               // Layer 0 toujours en base
            layer_push((uint8_t)value);  // Layer cible
        }
        break;

    case ACTION_TYPE_MEDIA:
        // Touche média : Consumer Control HID
        if (pressed) {
            usb_hid_consumer_press((uint16_t)value);
            ble_hid_consumer_press((uint16_t)value);
        } else {
            usb_hid_consumer_release();
            ble_hid_consumer_release();
        }
        break;

    case ACTION_TYPE_SPECIAL:
        // Actions firmware spéciales
        if (pressed) {
            if (value == 0x01) {
                // BLE_SWITCH : changer d'appareil BLE
                ESP_LOGI(TAG, "BLE device switch demandé");
                ble_hid_switch_device();
            }
            // BLE_PAIR est géré séparément (long press SW16+SW17)
        }
        break;

    default:
        break;
    }
}

// ─────────────────────────────────────────────────────────────
//  FONCTIONS PRIVÉES — DÉTECTION LONG PRESS PAIRING
//
//  SW16 + SW17 maintenus BLE_PAIRING_LONG_PRESS_MS = pairing BLE
// ─────────────────────────────────────────────────────────────
static void check_pairing_longpress(void)
{
    bool sw16 = g_key_state[SW16];
    bool sw17 = g_key_state[SW17];
    int64_t now = esp_timer_get_time() / 1000;  // µs → ms

    if (sw16 && sw17 && !g_pairing_triggered) {
        // Les deux sont pressées : vérifier depuis combien de temps
        int64_t press_start = (g_sw16_press_time < g_sw17_press_time)
                              ? g_sw17_press_time   // Le plus récent des deux
                              : g_sw16_press_time;
        if ((now - press_start) >= BLE_PAIRING_LONG_PRESS_MS) {
            ESP_LOGI(TAG, "Long press SW16+SW17 → mode pairing BLE");
            ble_hid_enter_pairing_mode();
            g_pairing_triggered = true;
        }
    }

    // Reset quand une des deux touches est relâchée
    if (!sw16 || !sw17) {
        g_pairing_triggered = false;
    }
}

// ─────────────────────────────────────────────────────────────
//  FONCTIONS PUBLIQUES
// ─────────────────────────────────────────────────────────────

esp_err_t keymap_init(void)
{
    // Initialiser les GPIO de la matrice
    matrix_gpio_init();

    // Réinitialiser les états internes (matrice + boutons spéciaux)
    memset(g_key_state,      0, sizeof(g_key_state));
    memset(g_key_prev,       0, sizeof(g_key_prev));
    memset(g_debounce_count, 0, sizeof(g_debounce_count));
    g_modifier_state = 0;
    g_has_activity   = false;

    // Layer 0 toujours actif (layer de base)
    g_layer_stack[0]  = 0;
    g_layer_stack_size = 1;

    // Charger le keymap et les combos depuis la config
    keymap_reload_from_config();

    ESP_LOGI(TAG, "Keymap initialisée — %d profils, %d combos",
             CONFIG_MAX_PROFILES, g_combo_count);
    return ESP_OK;
}

// Scan de la matrice : met à jour g_key_state[0..KB_NUM_KEYS-1]
void keymap_scan_matrix(void)
{
    int64_t now = esp_timer_get_time() / 1000;  // µs → ms

    for (int r = 0; r < KB_MATRIX_ROWS; r++) {
        gpio_set_level(KB_ROW_PINS[r], 0);
        esp_rom_delay_us(5);

        for (int c = 0; c < KB_MATRIX_COLS; c++) {
            if (!KB_MATRIX_VALID[r][c]) continue;  // Cellule vide

            int key_idx = KB_MATRIX_TO_KEY[r][c];
            int raw = gpio_get_level(KB_COL_PINS[c]) == 0 ? 1 : 0;

            if (raw != g_key_state[key_idx]) {
                g_debounce_count[key_idx]++;
                if (g_debounce_count[key_idx] >= KB_DEBOUNCE_SCANS) {
                    g_debounce_count[key_idx] = 0;
                    g_key_prev[key_idx]  = g_key_state[key_idx];
                    g_key_state[key_idx] = raw;
                    if (raw) {
                        g_key_press_time[key_idx] = now;
                        g_has_activity = true;
                    }
                }
            } else {
                g_debounce_count[key_idx] = 0;
            }
        }

        gpio_set_level(KB_ROW_PINS[r], 1);
    }

    // Scan des boutons spéciaux hors matrice (SW11, SW16, SW17)
    const gpio_num_t special_pins[] = {SW11_GPIO, SW16_GPIO, SW17_GPIO};
    const int        special_idx[]  = {SW11,      SW16,      SW17     };
    for (int i = 0; i < 3; i++) {
        int ki  = special_idx[i];
        int raw = gpio_get_level(special_pins[i]) == SW_BTN_ACTIVE_LEVEL ? 1 : 0;

        if (raw != g_key_state[ki]) {
            g_debounce_count[ki]++;
            if (g_debounce_count[ki] >= KB_DEBOUNCE_SCANS) {
                g_debounce_count[ki] = 0;
                g_key_prev[ki]  = g_key_state[ki];
                g_key_state[ki] = raw;
                if (raw) {
                    g_key_press_time[ki] = now;
                    if (ki == SW16) g_sw16_press_time = now;
                    if (ki == SW17) g_sw17_press_time = now;
                    g_has_activity = true;
                }
            }
        } else {
            g_debounce_count[ki] = 0;
        }
    }
}

// Traitement des événements : combos, layers, envoi HID
void keymap_process_events(void)
{
    // ── 1. Vérifier le long press pairing ────────────────────
    check_pairing_longpress();

    // ── 2. Détection de combos ───────────────────────────────
    int64_t now = esp_timer_get_time() / 1000;

    if (g_combo_state == COMBO_STATE_IDLE) {
        // Chercher si une touche pressée peut être le début d'un combo
        for (int k = 0; k < KB_NUM_KEYS; k++) {
            if (g_key_state[k] && !g_key_prev[k]) {
                // Nouvelle touche pressée — peut-elle initier un combo ?
                for (int c = 0; c < g_combo_count; c++) {
                    for (int ki = 0; ki < g_combos[c].key_count; ki++) {
                        if (g_combos[c].keys[ki] == k) {
                            g_combo_state      = COMBO_STATE_DETECTING;
                            g_combo_start_time = now;
                            goto combo_detection_started;
                        }
                    }
                }
            }
        }
        combo_detection_started:;
    }

    if (g_combo_state == COMBO_STATE_DETECTING) {
        int match = combo_find_match();
        if (match >= 0) {
            // Combo complet ! Déclencher l'action
            ESP_LOGD(TAG, "Combo déclenché : %d", match);
            send_action(g_combos[match].action, true);
            send_action(g_combos[match].action, false);
            g_combo_state = COMBO_STATE_FIRED;
        } else if ((now - g_combo_start_time) > 50) {
            // Timeout de la fenêtre combo → traiter les touches normalement
            g_combo_state = COMBO_STATE_IDLE;
        }
    }

    if (g_combo_state == COMBO_STATE_FIRED) {
        // Attendre que toutes les touches du combo soient relâchées
        bool any_pressed = false;
        for (int k = 0; k < KB_NUM_KEYS; k++) {
            if (g_key_state[k]) { any_pressed = true; break; }
        }
        if (!any_pressed) g_combo_state = COMBO_STATE_IDLE;
        return;  // Ignorer les touches individuelles pendant un combo
    }

    // ── 3. Traitement touche par touche (touches matrice uniquement) ─
    for (int k = 0; k < KB_NUM_KEYS; k++) {
        bool curr = g_key_state[k];
        bool prev = g_key_prev[k];

        if (curr == prev) continue;

        uint16_t action = layer_resolve_action(k);

        if (curr && !prev) {
            ESP_LOGD(TAG, "SW%d pressé → action 0x%04X", k+1, action);
            send_action(action, true);
        } else if (!curr && prev) {
            ESP_LOGD(TAG, "SW%d relâché → action 0x%04X", k+1, action);
            send_action(action, false);
        }

        g_key_prev[k] = curr;
    }

    // ── 4. Boutons spéciaux hors matrice ─────────────────────
    // SW11 : changement d'appareil BLE (front montant)
    if (g_key_state[SW11] && !g_key_prev[SW11]) {
        ESP_LOGI(TAG, "SW11 → BLE device switch");
        ble_hid_switch_device();
    }
    g_key_prev[SW11] = g_key_state[SW11];
    g_key_prev[SW16] = g_key_state[SW16];
    g_key_prev[SW17] = g_key_state[SW17];
}

bool keymap_has_activity(void)
{
    if (g_has_activity) {
        g_has_activity = false;  // Auto-reset après lecture
        return true;
    }
    return false;
}

uint8_t keymap_get_active_layer(void)
{
    // Retourner le layer le plus haut dans la stack
    if (g_layer_stack_size > 0) {
        return g_layer_stack[g_layer_stack_size - 1];
    }
    return 0;
}

void keymap_reload_from_config(void)
{
    // Charger le keymap depuis config_store
    const kb_config_t *cfg = config_store_get();

    // Copier les keymaps de chaque profil/layer
    for (int p = 0; p < cfg->profile_count && p < CONFIG_MAX_PROFILES; p++) {
        g_layer_count[p] = cfg->profiles[p].layer_count;
        for (int l = 0; l < cfg->profiles[p].layer_count && l < KEYMAP_MAX_LAYERS; l++) {
            for (int k = 0; k < KB_NUM_KEYS; k++) {
                g_keymap[p][l][k] = cfg->profiles[p].layers[l].keys[k];
            }
        }
    }

    // Charger les combos du profil actif
    g_combo_count = 0;
    const kb_profile_t *prof = &cfg->profiles[g_active_profile];
    for (int c = 0; c < prof->combo_count && c < KEYMAP_MAX_COMBOS; c++) {
        g_combos[c] = prof->combos[c];
        g_combo_count++;
    }

    ESP_LOGI(TAG, "Keymap rechargée : profil %d, %d layers, %d combos",
             g_active_profile, g_layer_count[g_active_profile], g_combo_count);
}
