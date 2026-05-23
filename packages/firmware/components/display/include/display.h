#pragma once
#include "esp_err.h"
#include <stdint.h>
#include <stdbool.h>

esp_err_t display_init(void);
void display_show_boot_screen(void);
void display_update(void);          // À appeler régulièrement depuis une tâche
void display_set_sleep(bool sleep); // Extinction/allumage de l'écran

// ── Studio Mode ──────────────────────────────────────────────
/**
 * Afficher l'écran Studio Mode avec le SSID WiFi et l'IP.
 * Remplace l'écran normal jusqu'au prochain display_show_status().
 *
 * @param ssid  Nom du réseau WiFi (ex: "SpinPad-Config")
 * @param ip    Adresse IP (ex: "192.168.4.1")
 */
void display_show_studio_mode(const char *ssid, const char *ip);

/**
 * Retourner à l'écran de statut normal (après sortie du Studio Mode).
 */
void display_show_status(void);
