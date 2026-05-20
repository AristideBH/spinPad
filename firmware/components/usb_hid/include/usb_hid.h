#pragma once
#include <stdint.h>
#include <stdbool.h>
#include "esp_err.h"

// Initialiser TinyUSB et enregistrer les descripteurs HID
esp_err_t usb_hid_init(void);

// Presse une touche clavier standard
void usb_hid_key_press(uint8_t keycode, uint8_t modifier);
void usb_hid_key_release(uint8_t keycode);

// Touche média (Consumer Control)
void usb_hid_consumer_press(uint16_t usage);
void usb_hid_consumer_release(void);

// Envoyer un rapport JSON de config reçu depuis l'hôte USB
void usb_hid_process_config_packet(const uint8_t *data, size_t len);

// True si l'USB est monté (câble connecté + hôte prêt)
bool usb_hid_is_mounted(void);
