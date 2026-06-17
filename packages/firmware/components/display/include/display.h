#pragma once
#include "esp_err.h"
#include "config_store.h"
#include <stdint.h>
#include <stdbool.h>

esp_err_t display_init(void);
void display_show_boot_screen(void);
void display_update(void);          // To be called regularly from a task
void display_set_sleep(bool sleep); // Turn the screen off/on

// ── Studio Mode ──────────────────────────────────────────────
/**
 * Display the Studio Mode screen with the WiFi SSID and IP.
 * Replaces the normal screen until the next display_show_status().
 *
 * @param ssid  WiFi network name (e.g.: "SpinPad-Config")
 * @param ip    IP address (e.g.: "192.168.4.1")
 */
void display_show_studio_mode(const char *ssid, const char *ip);

/**
 * Return to the normal status screen (after exiting Studio Mode).
 */
void display_show_status(void);

/**
 * Apply the display orientation (0°/90°/180°/270°).
 * To be called after display_init() and on each config change.
 */
void display_apply_orientation(kb_orientation_t orient);

/**
 * Synchronize the Clock widget's clock.
 * unix_ts = current Unix timestamp (seconds since epoch).
 * The firmware computes the displayed time from this point + the uptime.
 */
void display_set_clock(uint32_t unix_ts);
