#pragma once
// ═══════════════════════════════════════════════════════════════
//  web_config.h — Studio Mode : WiFi AP + HTTP server
//
//  Studio Mode lets you configure the SpinPad wirelessly :
//  - Starts a WiFi access point "SpinPad-Config"
//  - Serves the Studio app via HTTP from the SPIFFS partition
//  - Exposes a REST API to read/write the JSON config
//
//  Trigger : SW8 + SW9 held for 3 seconds (in keymap.c)
//  Auto-exit : timeout of WEB_CONFIG_IDLE_TIMEOUT_MS without HTTP activity
// ═══════════════════════════════════════════════════════════════

#include "esp_err.h"
#include <stdbool.h>

// ── Configuration ────────────────────────────────────────────────

#define WEB_CONFIG_AP_SSID            "SpinPad-Config"
#define WEB_CONFIG_AP_PASS            ""               // Open network
#define WEB_CONFIG_AP_CHANNEL         1
#define WEB_CONFIG_AP_MAX_CONNECTIONS 4
#define WEB_CONFIG_AP_IP              "192.168.4.1"    // ESP32 softAP default IP

// Max WiFi TX power : 10 dBm (hardware constraint VSYS > 4.5V)
#define WEB_CONFIG_WIFI_TX_POWER_DBM  40               // Unit = 0.25 dBm → 10 dBm

// Inactivity timeout before automatic exit : 5 minutes
#define WEB_CONFIG_IDLE_TIMEOUT_MS    (5 * 60 * 1000)

// Brightness of the key LEDs in Studio Mode (about 20% of normal)
#define WEB_CONFIG_LED_DIM_BRIGHTNESS 50               // 0–255

// ── Public API ─────────────────────────────────────────────────

/**
 * Pre-initialize the network (esp_netif).
 * To be called only once in app_main(), before keymap_init().
 */
esp_err_t web_config_init(void);

/**
 * Start Studio Mode :
 *  - Launches the WiFi AP
 *  - Mounts SPIFFS
 *  - Starts the HTTP server
 *  - Sends the LED dim command
 *  - Updates the OLED screen
 */
esp_err_t web_config_start(void);

/**
 * Stop Studio Mode :
 *  - Stops the HTTP server
 *  - Stops the WiFi
 *  - Unmounts SPIFFS
 *  - Restores the LED brightness
 *  - Returns the OLED screen to normal mode
 */
esp_err_t web_config_stop(void);

/**
 * Returns true if Studio Mode is active.
 */
bool web_config_is_running(void);
