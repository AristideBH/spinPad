// ═══════════════════════════════════════════════════════════════
//  main.c — Point d'entrée du firmware
//
//  Rôle : initialiser tous les composants dans le bon ordre,
//  puis lancer la tâche principale de scan clavier.
//
//  Ordre d'init important :
//    1. NVS (stockage flash) — en premier, tout le monde en a besoin
//    2. Config — charge le JSON depuis NVS
//    3. Keymap — initialise avec la config chargée
//    4. USB HID / BLE HID — interfaces avec l'OS
//    5. Encoder, Display, Battery — périphériques
//    6. Power manager — en dernier (gère le wake-up du sleep)
// ═══════════════════════════════════════════════════════════════

#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "nvs_flash.h"          // Stockage clé-valeur en flash
#include "esp_log.h"            // Système de logs ESP-IDF

// Nos composants
#include "kb_config.h"
#include "config_store.h"
#include "keymap.h"
#include "usb_hid.h"
#include "ble_hid.h"
#include "encoder.h"
#include "display.h"
#include "battery.h"
#include "led_engine.h"
#include "power_mgmt.h"
#include "web_config.h"

// Tag pour les logs — apparaît dans la console comme "[MAIN] message"
static const char *TAG = "MAIN";

// ─────────────────────────────────────────────────────────────
//  Tâche principale : scan de la matrice de touches
//
//  Une "tâche" FreeRTOS = un thread qui tourne en boucle.
//  vTaskDelay(pdMS_TO_TICKS(5)) = attendre 5ms entre chaque scan.
// ─────────────────────────────────────────────────────────────
static void keyboard_scan_task(void *pvParameters)
{
    ESP_LOGI(TAG, "Tâche scan clavier démarrée");

    while (1) {
        // 1. Scanner la matrice physique → détecter les touches pressées
        keymap_scan_matrix();

        // 2. Traiter les événements (combos, tap-hold, layers)
        keymap_process_events();

        // 3. Envoyer les rapports HID si nécessaire
        //    (keymap appelle usb_hid_send() ou ble_hid_send() selon le mode)

        // 4. Notifier le power manager qu'il y a eu activité
        //    (réinitialise le timer d'inactivité)
        if (keymap_has_activity()) {
            power_mgmt_reset_idle_timer();
        }

        // 5. Tick LED engine (met à jour les effets animés + refresh WS2812)
        led_engine_tick();

        // Pause de 5ms avant le prochain scan
        // pdMS_TO_TICKS convertit des millisecondes en "ticks" FreeRTOS
        vTaskDelay(pdMS_TO_TICKS(KB_SCAN_INTERVAL_MS));
    }
}

// ─────────────────────────────────────────────────────────────
//  app_main() — équivalent du "main()" en C standard pour ESP-IDF
//  Appelé automatiquement au démarrage par le framework.
// ─────────────────────────────────────────────────────────────
void app_main(void)
{
    ESP_LOGI(TAG, "=== SpinPad démarrage ===");

    // ── 0. Pré-init réseau (requis avant keymap pour web_config) ─
    // esp_netif et l'event loop doivent être créés une seule fois.
    ESP_ERROR_CHECK(web_config_init());

    // ── 1. NVS (Non-Volatile Storage) ────────────────────────
    // NVS = espace flash pour stocker des données persistantes
    // (config, bonds BLE, état des profils...)
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        // NVS corrompu ou ancienne version → effacer et réinitialiser
        ESP_LOGW(TAG, "NVS corrompu, effacement...");
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);
    ESP_LOGI(TAG, "NVS OK");

    // ── 2. Config store ──────────────────────────────────────
    // Charge le JSON de config depuis NVS.
    // Si aucune config n'existe, charge les valeurs par défaut.
    ESP_ERROR_CHECK(config_store_init());
    ESP_LOGI(TAG, "Config chargée");

    // ── 3. Moteur keymap ─────────────────────────────────────
    // Initialise la matrice GPIO, les layers, et le moteur de combos.
    ESP_ERROR_CHECK(keymap_init());
    ESP_LOGI(TAG, "Keymap initialisée");

    // ── 4a. USB HID ──────────────────────────────────────────
    // Démarre TinyUSB et enregistre les descripteurs HID clavier.
    ESP_ERROR_CHECK(usb_hid_init());
    ESP_LOGI(TAG, "USB HID prêt");

    // ── 4b. Batterie + LED RGB ──────────────────────────────
    // Doit être init AVANT ble_hid pour que le service BAS sache
    // s'il doit être annoncé (présence détectée via ADC).
    ESP_ERROR_CHECK(battery_init());
    ESP_LOGI(TAG, "Batterie initialisée");

    // ── 4c. BLE HID ──────────────────────────────────────────
    // Démarre NimBLE, charge les bonds depuis NVS,
    // et tente de se reconnecter au dernier appareil utilisé.
    ESP_ERROR_CHECK(ble_hid_init());
    ESP_LOGI(TAG, "BLE HID prêt");

    // ── 5a. Encodeur ─────────────────────────────────────────
    ESP_ERROR_CHECK(encoder_init());
    ESP_LOGI(TAG, "Encodeur prêt");

    // ── 5b. Écran SSD1315 ────────────────────────────────────
    ESP_ERROR_CHECK(display_init());
    display_show_boot_screen();   // Affiche le splash screen au démarrage
    ESP_LOGI(TAG, "Écran prêt");

    // ── 5d. LED Engine (chaîne WS2812 touches) ───────────────
    // Initialiser après battery_init pour éviter un conflit RMT au démarrage.
    ESP_ERROR_CHECK(led_engine_init());
    ESP_LOGI(TAG, "LED Engine prêt");

    // ── 6. Power manager ─────────────────────────────────────
    // Doit être initialisé en dernier pour connaître
    // la raison du wake-up (touche ? timer ?) et agir en conséquence.
    ESP_ERROR_CHECK(power_mgmt_init());
    ESP_LOGI(TAG, "Power manager prêt");

    // ── Lancement de la tâche de scan ────────────────────────
    // xTaskCreate(fonction, nom, taille_stack, params, priorité, handle)
    // Stack de 4096 bytes suffit pour le scan.
    // Priorité 5 = plus haute que les tâches background (1-2).
    xTaskCreate(
        keyboard_scan_task,   // Fonction à exécuter
        "kb_scan",            // Nom (pour le debug)
        4096,                 // Taille de la pile en bytes
        NULL,                 // Paramètres (aucun ici)
        5,                    // Priorité (1=bas, 25=max)
        NULL                  // Handle de la tâche (on n'en a pas besoin)
    );

    ESP_LOGI(TAG, "=== Démarrage terminé ===");
    // app_main() peut se terminer ici — les tâches continuent de tourner
}
