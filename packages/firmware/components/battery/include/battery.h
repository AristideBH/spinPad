#pragma once
#include <stdint.h>
#include <stdbool.h>
#include "esp_err.h"

// Initializes the ADC, the RGB LED, and does a battery auto-detection
// if power.battery_present == "auto". Never crashes if HW absent:
// ADC errors ⇒ battery marked absent.
esp_err_t battery_init(void);

uint8_t   battery_get_percent(void);   // 0-100 (0 if absent)
uint16_t  battery_get_voltage_mv(void); // 0 if absent
void      battery_update(void);        // No-op if absent

// Resolved presence (after auto-detection or config override)
bool        battery_is_present(void);
// "auto" | "forced_yes" | "forced_no" — as exposed in device_status
const char *battery_source_str(void);
