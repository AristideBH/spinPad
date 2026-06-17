#pragma once
#include "esp_err.h"
esp_err_t encoder_init(void);
// Called from keymap_process_events() to send the encoder actions
void encoder_process(void);
