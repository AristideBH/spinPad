#pragma once
// ═══════════════════════════════════════════════════════════════
//  web_config.h — Studio Mode : WiFi AP + serveur HTTP
//
//  Le Studio Mode permet de configurer le SpinPad sans fil :
//  - Démarre un point d'accès WiFi "SpinPad-Config"
//  - Sert l'app Studio via HTTP depuis la partition SPIFFS
//  - Expose une API REST pour lire/écrire la config JSON
//
//  Déclenchement : SW8 + SW9 maintenus 3 secondes (dans keymap.c)
//  Auto-exit : timeout de WEB_CONFIG_IDLE_TIMEOUT_MS sans activité HTTP
// ═══════════════════════════════════════════════════════════════

#include "esp_err.h"
#include <stdbool.h>

// ── Configuration ────────────────────────────────────────────────

#define WEB_CONFIG_AP_SSID            "SpinPad-Config"
#define WEB_CONFIG_AP_PASS            ""               // Réseau ouvert
#define WEB_CONFIG_AP_CHANNEL         1
#define WEB_CONFIG_AP_MAX_CONNECTIONS 4
#define WEB_CONFIG_AP_IP              "192.168.4.1"    // IP par défaut softAP ESP32

// Puissance TX WiFi max : 10 dBm (contrainte hardware VSYS > 4.5V)
#define WEB_CONFIG_WIFI_TX_POWER_DBM  40               // Unité = 0.25 dBm → 10 dBm

// Timeout d'inactivité avant exit automatique : 5 minutes
#define WEB_CONFIG_IDLE_TIMEOUT_MS    (5 * 60 * 1000)

// Luminosité des LEDs touches en Studio Mode (environ 20% de la normale)
#define WEB_CONFIG_LED_DIM_BRIGHTNESS 50               // 0–255

// ── API publique ─────────────────────────────────────────────────

/**
 * Pré-initialiser le réseau (esp_netif).
 * À appeler une seule fois dans app_main(), avant keymap_init().
 */
esp_err_t web_config_init(void);

/**
 * Démarrer le Studio Mode :
 *  - Lance le WiFi AP
 *  - Monte SPIFFS
 *  - Démarre le serveur HTTP
 *  - Envoie la commande LED dim
 *  - Met à jour l'écran OLED
 */
esp_err_t web_config_start(void);

/**
 * Arrêter le Studio Mode :
 *  - Arrête le serveur HTTP
 *  - Stoppe le WiFi
 *  - Démonte SPIFFS
 *  - Restaure la luminosité LEDs
 *  - Remet l'écran OLED en mode normal
 */
esp_err_t web_config_stop(void);

/**
 * Retourne true si le Studio Mode est actif.
 */
bool web_config_is_running(void);
