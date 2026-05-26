// ═══════════════════════════════════════════════════════════════
//  power_mgmt.c — Gestion de l'énergie et deep sleep automatique
//
//  Deep sleep = mode basse consommation ESP32 (~10µA).
//  Le CPU s'arrête complètement. Seule la logique RTC reste active.
//
//  Wake-up : une touche pressée (GPIO RTC) réveille le MCU.
//  Après wake-up, le firmware redémarre depuis app_main().
//
//  Timer d'inactivité :
//    - Chaque touche pressée → reset le timer
//    - Si aucune touche pendant POWER_SLEEP_TIMEOUT_MS → deep sleep
//    - Si aucune touche pendant POWER_DISPLAY_TIMEOUT_MS → éteindre écran
// ═══════════════════════════════════════════════════════════════

#include "power_mgmt.h"
#include "kb_config.h"
#include "config_store.h"
#include "display.h"
#include "battery.h"
#include "ble_hid.h"

#include "esp_sleep.h"
#include "esp_timer.h"
#include "esp_log.h"
#include "driver/gpio.h"
#include "driver/rtc_io.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/timers.h"

static const char *TAG = "POWER";

// ─────────────────────────────────────────────────────────────
//  ÉTAT INTERNE
// ─────────────────────────────────────────────────────────────

static int64_t g_last_activity_ms = 0;   // Timestamp de la dernière activité
static bool    g_display_sleeping = false;  // Écran éteint ?

// Tâche FreeRTOS dédiée au monitoring d'inactivité
static TaskHandle_t g_power_task_handle = NULL;

// ─────────────────────────────────────────────────────────────
//  CONFIGURATION DU WAKE-UP GPIO
//
//  Pour que le deep sleep se réveille sur une touche,
//  on configure une ligne de la matrice en source de wake-up.
//  Astuce : configurer COL0 en RTC GPIO → quand une touche
//  est pressée sur n'importe quelle ligne, COL0 passe à LOW.
//  Mais on doit activer toutes les lignes à LOW avant de dormir.
// ─────────────────────────────────────────────────────────────
static void configure_wakeup_sources(void)
{
    // Activer toutes les lignes de la matrice à LOW
    // (simule un scan permanent pendant le sleep)
    for (int r = 0; r < KB_MATRIX_ROWS; r++) {
        // Convertir en GPIO RTC si possible (pas tous les GPIO sont RTC)
        gpio_set_level(KB_ROW_PINS[r], 0);
    }

    // Configurer COL0 comme source de wake-up (niveau BAS = touche pressée)
    // Note : seuls les GPIO RTC peuvent servir de wake-up
    // Sur ESP32-S3 : GPIO0-21 sont des GPIO RTC
    esp_sleep_enable_gpio_wakeup();
    gpio_wakeup_enable(KB_COL_PINS[0], GPIO_INTR_LOW_LEVEL);

    // Wake-up aussi via timer (toutes les heures pour vérifier la batterie)
    // esp_sleep_enable_timer_wakeup(3600ULL * 1000000);  // 1h en µs (décommenter si besoin)
}

// ─────────────────────────────────────────────────────────────
//  PROCÉDURE DE MISE EN VEILLE
// ─────────────────────────────────────────────────────────────
static void enter_deep_sleep(void)
{
    ESP_LOGI(TAG, "Mise en veille profonde...");

    // Sauvegarder la config (au cas où il y a des changements non sauvegardés)
    config_store_save();

    // Éteindre l'écran
    display_set_sleep(true);

    // Éteindre la LED
    // (la batterie gère ça dans battery_update, mais ici on force l'extinction)

    // Configurer les sources de réveil
    configure_wakeup_sources();

    // Entrer en deep sleep
    // Le firmware redémarrera depuis app_main() au réveil
    esp_deep_sleep_start();
    // ↑ Cette fonction ne retourne jamais
}

// ─────────────────────────────────────────────────────────────
//  TÂCHE POWER MONITORING
//  Tourne en arrière-plan et vérifie l'inactivité
// ─────────────────────────────────────────────────────────────
static void power_monitor_task(void *pvParameters)
{
    ESP_LOGI(TAG, "Tâche power monitor démarrée");

    while (1) {
        int64_t now = esp_timer_get_time() / 1000;  // µs → ms
        int64_t idle_ms = now - g_last_activity_ms;

        const kb_config_t *cfg = config_store_get();
        uint32_t sleep_timeout_ms   = cfg->power.sleep_timeout_s * 1000;
        uint32_t display_timeout_ms = cfg->display.timeout_s * 1000;

        // ── Timeout écran ────────────────────────────────────
        if (!g_display_sleeping && idle_ms >= display_timeout_ms) {
            ESP_LOGD(TAG, "Timeout écran (%lld ms)", idle_ms);
            display_set_sleep(true);
            g_display_sleeping = true;
        }

        // ── Timeout deep sleep ───────────────────────────────
        if (idle_ms >= sleep_timeout_ms) {
            ESP_LOGI(TAG, "Timeout inactivité (%lld ms) → deep sleep", idle_ms);
            enter_deep_sleep();
            // Ne retourne jamais ici
        }

        // ── Mise à jour batterie (toutes les 30s) ────────────
        // Skip si batterie absente (variante USB-only).
        static int64_t last_batt_update = 0;
        if (battery_is_present() && (now - last_batt_update) >= 30000) {
            battery_update();
            ble_hid_publish_battery(battery_get_percent());
            last_batt_update = now;
        }

        // Vérifier toutes les secondes
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

// ─────────────────────────────────────────────────────────────
//  FONCTIONS PUBLIQUES
// ─────────────────────────────────────────────────────────────

esp_err_t power_mgmt_init(void)
{
    // Vérifier la cause du dernier réveil (utile pour le debug)
    esp_sleep_wakeup_cause_t cause = esp_sleep_get_wakeup_cause();
    switch (cause) {
    case ESP_SLEEP_WAKEUP_GPIO:
        ESP_LOGI(TAG, "Réveil : touche pressée");
        break;
    case ESP_SLEEP_WAKEUP_TIMER:
        ESP_LOGI(TAG, "Réveil : timer");
        break;
    case ESP_SLEEP_WAKEUP_UNDEFINED:
        ESP_LOGI(TAG, "Démarrage initial (pas de deep sleep)");
        break;
    default:
        ESP_LOGI(TAG, "Réveil : cause %d", cause);
        break;
    }

    // Initialiser le timer d'activité
    g_last_activity_ms = esp_timer_get_time() / 1000;

    // Lancer la tâche de monitoring
    // Priorité 2 = basse (derrière le scan clavier)
    xTaskCreate(
        power_monitor_task,
        "power_mon",
        2048,
        NULL,
        2,
        &g_power_task_handle
    );

    ESP_LOGI(TAG, "Power manager initialisé (sleep: %lus, display: %us)",
             config_store_get()->power.sleep_timeout_s,
             config_store_get()->display.timeout_s);
    return ESP_OK;
}

void power_mgmt_reset_idle_timer(void)
{
    g_last_activity_ms = esp_timer_get_time() / 1000;

    // Si l'écran était éteint, le rallumer
    if (g_display_sleeping) {
        display_set_sleep(false);
        g_display_sleeping = false;
    }
}
