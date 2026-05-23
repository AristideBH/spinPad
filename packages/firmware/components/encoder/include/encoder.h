#pragma once
#include "esp_err.h"
esp_err_t encoder_init(void);
// Appelé depuis keymap_process_events() pour envoyer les actions encoder
void encoder_process(void);
