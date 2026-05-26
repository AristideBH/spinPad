#pragma once
#include <stdint.h>
#include <stdbool.h>
#include "esp_err.h"

// Initialise l'ADC, la LED RGB, et fait une auto-détection batterie
// si power.battery_present == "auto". Ne crash jamais si HW absent :
// les erreurs ADC ⇒ batterie marquée absente.
esp_err_t battery_init(void);

uint8_t   battery_get_percent(void);   // 0-100 (0 si absente)
uint16_t  battery_get_voltage_mv(void); // 0 si absente
void      battery_update(void);        // No-op si absente

// Présence résolue (après auto-détection ou override config)
bool        battery_is_present(void);
// "auto" | "forced_yes" | "forced_no" — tel qu'exposé dans device_status
const char *battery_source_str(void);
