#pragma once
#include "esp_err.h"
#include <stdint.h>
#include <stdbool.h>

esp_err_t display_init(void);
void display_show_boot_screen(void);
void display_update(void);          // À appeler régulièrement depuis une tâche
void display_set_sleep(bool sleep); // Extinction/allumage de l'écran
