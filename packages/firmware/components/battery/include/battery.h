#pragma once
#include <stdint.h>
#include "esp_err.h"

esp_err_t battery_init(void);
uint8_t   battery_get_percent(void);   // 0-100
uint16_t  battery_get_voltage_mv(void); // Tension en millivolts
void      battery_update(void);        // Lire ADC + mettre à jour LED
