#pragma once
#include <stdint.h>
#include <stdbool.h>
#include "esp_err.h"

// Initialize TinyUSB and register the HID descriptors
esp_err_t usb_hid_init(void);

// Press a standard keyboard key
void usb_hid_key_press(uint8_t keycode, uint8_t modifier);
void usb_hid_key_release(uint8_t keycode);

// Media key (Consumer Control)
void usb_hid_consumer_press(uint16_t usage);
void usb_hid_consumer_release(void);

// Send a config JSON report received from the USB host
void usb_hid_process_config_packet(const uint8_t *data, size_t len);

// True if USB is mounted (cable connected + host ready)
bool usb_hid_is_mounted(void);

// Emit a JSON line terminated by \n on the CDC serial port
void usb_hid_cdc_send(const char *msg);
