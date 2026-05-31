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
#include "web_config.h"
#include "display.h"
#include "led_engine.h"
#include "action_types.gen.h"
#include <stdio.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "esp_timer.h"      // Timestamps en microsecondes
#include "esp_log.h"
#include <string.h>         // memset, memcpy
#include <stdlib.h>         // malloc, free

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
static uint8_t  g_key_state[KB_TOTAL_KEYS];          // État actuel (1=pressé, 0=relâché)
static uint8_t  g_key_prev[KB_TOTAL_KEYS];           // État au scan précédent
static uint8_t  g_debounce_count[KB_TOTAL_KEYS];     // Compteur anti-rebond
static uint8_t  g_debounce_timeout[KB_TOTAL_KEYS];  // Scans totaux d'oscillation (force-accept)

#define KB_DEBOUNCE_TIMEOUT_SCANS 20  // Force-accept après 20 scans (~100ms) d'oscillation

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

// ── Mode moniteur (training) ──────────────────────────────────
static bool    g_monitor_enabled  = false;
static int64_t g_monitor_start_ms = 0;
#define MONITOR_AUTO_OFF_MS (5 * 60 * 1000)  // 5 minutes

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

    case ACTION_TYPE_MACRO:
        // Lancer la macro en arrière-plan à l'appui uniquement
        if (pressed && value < MACRO_COUNT) {
            keymap_play_macro((uint8_t)value);
        }
        break;

    case ACTION_TYPE_SPECIAL:
        // Actions firmware spéciales
        if (pressed) {
            if (value == SPECIAL_BLE_SWITCH) {
                ESP_LOGI(TAG, "BLE device switch demandé");
                ble_hid_switch_device();
            } else if (value == SPECIAL_ORIENT_CW || value == SPECIAL_ORIENT_CCW) {
                // Rotation de l'orientation globale
                kb_config_t *cfg = (kb_config_t *)config_store_get();
                int delta = (value == SPECIAL_ORIENT_CW) ? 1 : 3; // +1 ou -1 mod 4
                cfg->orientation = (kb_orientation_t)((cfg->orientation + delta) % 4);
                display_apply_orientation(cfg->orientation);
                config_store_save();
                ESP_LOGI(TAG, "Orientation → %d°", cfg->orientation * 90);
            }
            // BLE_PAIR est géré séparément (long press SW16+SW17)
        }
        break;

    default:
        break;
    }
}

// ─────────────────────────────────────────────────────────────
//  FONCTIONS PRIVÉES — STUDIO MODE LONG PRESS
//
//  SW8 + SW9 maintenus 3 secondes = basculer Studio Mode WiFi
// ─────────────────────────────────────────────────────────────

#define STUDIO_MODE_LONGPRESS_MS  3000

static int64_t g_sw8sw9_press_start  = 0;
static bool    g_studio_mode_triggered = false;

static void check_studio_mode_longpress(void)
{
    bool sw8 = g_key_state[SW8];   // index 1
    bool sw9 = g_key_state[SW9];   // index 4
    int64_t now = esp_timer_get_time() / 1000;  // µs → ms

    if (sw8 && sw9) {
        if (g_sw8sw9_press_start == 0) {
            g_sw8sw9_press_start = now;
        }
        if (!g_studio_mode_triggered &&
            (now - g_sw8sw9_press_start) >= STUDIO_MODE_LONGPRESS_MS) {
            if (web_config_is_running()) {
                ESP_LOGI(TAG, "Long press SW8+SW9 → arrêt Studio Mode");
                web_config_stop();
            } else {
                ESP_LOGI(TAG, "Long press SW8+SW9 → démarrage Studio Mode");
                web_config_start();
            }
            g_studio_mode_triggered = true;
        }
    } else {
        // Réinitialiser quand l'une des touches est relâchée
        g_sw8sw9_press_start    = 0;
        g_studio_mode_triggered = false;
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

// Valide l'état d'une touche après anti-rebond asymétrique avec timeout.
// Retourne true si l'état a changé et doit être appliqué.
static bool _debounce_update(int key_idx, int raw, int64_t now,
                             uint8_t press_scans, uint8_t release_scans)
{
    if (raw == g_key_state[key_idx]) {
        // Signal stable → réinitialiser les compteurs
        g_debounce_count[key_idx]   = 0;
        g_debounce_timeout[key_idx] = 0;
        return false;
    }

    g_debounce_count[key_idx]++;
    g_debounce_timeout[key_idx]++;

    uint8_t threshold = raw ? press_scans : release_scans;

    bool timeout_force = (g_debounce_timeout[key_idx] >= KB_DEBOUNCE_TIMEOUT_SCANS);
    bool threshold_met = (g_debounce_count[key_idx]   >= threshold);

    if (threshold_met || timeout_force) {
        if (timeout_force && !threshold_met) {
            ESP_LOGD("KEYMAP", "Debounce timeout forcé key=%d raw=%d", key_idx, raw);
        }
        g_debounce_count[key_idx]   = 0;
        g_debounce_timeout[key_idx] = 0;
        g_key_prev[key_idx]         = g_key_state[key_idx];
        g_key_state[key_idx]        = raw;
        return true;
    }
    return false;
}

static void _monitor_emit(int key_idx, int state, int64_t now)
{
    if (!g_monitor_enabled) return;
    char buf[96];
    uint16_t act = (key_idx < KB_NUM_KEYS) ? g_keymap[g_active_profile][g_layer_stack[g_layer_stack_size - 1]][key_idx] : 0;
    snprintf(buf, sizeof(buf),
             "{\"event\":\"key\",\"idx\":%d,\"state\":\"%s\",\"layer\":%d,\"action\":%u,\"ts_ms\":%lld}\n",
             key_idx, state ? "down" : "up",
             (int)g_layer_stack[g_layer_stack_size - 1], (unsigned)act, (long long)now);
    usb_hid_cdc_send(buf);
}

// Scan de la matrice : met à jour g_key_state[0..KB_NUM_KEYS-1]
void keymap_scan_matrix(void)
{
    int64_t now = esp_timer_get_time() / 1000;  // µs → ms
    const kb_config_t *cfg = config_store_get();
    uint8_t press_scans   = cfg->power.debounce_press_scans   ? cfg->power.debounce_press_scans   : 3;
    uint8_t release_scans = cfg->power.debounce_release_scans ? cfg->power.debounce_release_scans : 5;

    // Auto-disable monitor après 5 minutes
    if (g_monitor_enabled && (now - g_monitor_start_ms) > MONITOR_AUTO_OFF_MS) {
        g_monitor_enabled = false;
        ESP_LOGI(TAG, "Mode moniteur désactivé (timeout)");
    }

    for (int r = 0; r < KB_MATRIX_ROWS; r++) {
        gpio_set_level(KB_ROW_PINS[r], 0);
        esp_rom_delay_us(5);

        for (int c = 0; c < KB_MATRIX_COLS; c++) {
            if (!KB_MATRIX_VALID[r][c]) continue;  // Cellule vide

            int key_idx = KB_MATRIX_TO_KEY[r][c];
            int raw = gpio_get_level(KB_COL_PINS[c]) == 0 ? 1 : 0;

            if (_debounce_update(key_idx, raw, now, press_scans, release_scans)) {
                if (raw) {
                    g_key_press_time[key_idx] = now;
                    g_has_activity = true;
                }
                _monitor_emit(key_idx, raw, now);
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

        if (_debounce_update(ki, raw, now, press_scans, release_scans)) {
            if (raw) {
                g_key_press_time[ki] = now;
                if (ki == SW16) g_sw16_press_time = now;
                if (ki == SW17) g_sw17_press_time = now;
                g_has_activity = true;
            }
        }
    }
}

void keymap_set_monitor(bool enable)
{
    g_monitor_enabled = enable;
    if (enable) {
        g_monitor_start_ms = esp_timer_get_time() / 1000;
        ESP_LOGI(TAG, "Mode moniteur activé");
    } else {
        ESP_LOGI(TAG, "Mode moniteur désactivé");
    }
}

bool keymap_get_monitor(void) { return g_monitor_enabled; }

// ─────────────────────────────────────────────────────────────
//  MACRO PLAYBACK
//  Chaque appui sur une touche macro lance une tâche éphémère
//  qui joue les étapes dans l'ordre, puis se termine.
// ─────────────────────────────────────────────────────────────
typedef struct { uint8_t macro_idx; } MacroTaskArg;

static void macro_task(void *pvArg)
{
    MacroTaskArg *arg = (MacroTaskArg *)pvArg;
    const kb_config_t *cfg = config_store_get();

    if (arg->macro_idx >= MACRO_COUNT) goto done;
    const kb_macro_t *macro = &cfg->macros[arg->macro_idx];

    for (int si = 0; si < macro->step_count; si++) {
        const kb_macro_step_t *step = &macro->steps[si];
        switch (step->type) {
        case MACRO_STEP_KEY_DOWN:
            usb_hid_key_press(step->keycode_or_delay, 0);
            ble_hid_key_press(step->keycode_or_delay, 0);
            break;
        case MACRO_STEP_KEY_UP:
            usb_hid_key_release(step->keycode_or_delay);
            ble_hid_key_release(step->keycode_or_delay);
            break;
        case MACRO_STEP_DELAY_MS:
            if (step->keycode_or_delay > 0) {
                vTaskDelay(pdMS_TO_TICKS(step->keycode_or_delay));
            }
            break;
        default:
            break;
        }
    }

done:
    free(pvArg);
    vTaskDelete(NULL);
}

void keymap_play_macro(uint8_t macro_idx)
{
    const kb_config_t *cfg = config_store_get();

    if (macro_idx >= MACRO_COUNT || cfg->macros[macro_idx].step_count == 0) {
        ESP_LOGW(TAG, "Macro %d inexistante ou vide", macro_idx);
        return;
    }

    MacroTaskArg *arg = malloc(sizeof(MacroTaskArg));
    if (!arg) {
        ESP_LOGE(TAG, "OOM — macro ignorée");
        return;
    }
    arg->macro_idx = macro_idx;

    // Tâche éphémère, priorité 4 (légèrement au-dessus du scan)
    // Stack 1024 mots = 4KB, suffisant pour des appels HID simples
    BaseType_t rc = xTaskCreate(macro_task, "macro", 1024, arg, 4, NULL);
    if (rc != pdPASS) {
        free(arg);
        ESP_LOGE(TAG, "xTaskCreate macro échoué");
    }
}

// Traitement des événements : combos, layers, envoi HID
void keymap_process_events(void)
{
    // ── 0. Notifier le moteur LED si une touche vient d'être pressée ──
    if (g_has_activity) {
        led_engine_notify_activity();
        // NB : on ne remet PAS g_has_activity à false ici — keymap_has_activity()
        // le fait séparément pour les autres consommateurs (display, etc.)
    }

    // ── 1. Vérifier les long press spéciaux ──────────────────
    check_studio_mode_longpress();   // SW8+SW9 → Studio Mode WiFi
    check_pairing_longpress();       // SW16+SW17 → Pairing BLE

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
