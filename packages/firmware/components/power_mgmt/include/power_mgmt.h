#pragma once
#include "esp_err.h"
esp_err_t power_mgmt_init(void);
void      power_mgmt_reset_idle_timer(void);  // Appelé à chaque touche
