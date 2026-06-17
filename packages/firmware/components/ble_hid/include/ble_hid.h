#pragma once
#include <stdint.h>
#include <stdbool.h>
#include "esp_err.h"

// Initialize NimBLE and try to reconnect to the last device
esp_err_t ble_hid_init(void);

// Press/release a keyboard key via BLE
void ble_hid_key_press(uint8_t keycode, uint8_t modifier);
void ble_hid_key_release(uint8_t keycode);

// Media key via BLE
void ble_hid_consumer_press(uint16_t usage);
void ble_hid_consumer_release(void);

// Switch BLE device (cycle between the slots)
void ble_hid_switch_device(void);

// Enter pairing mode for the active slot
void ble_hid_enter_pairing_mode(void);

// True if BLE connected to a device
bool ble_hid_is_connected(void);

// Active slot (0 or 1)
uint8_t ble_hid_get_active_slot(void);

// Publish the battery level on the BAS GATT characteristic (0x2A19).
// No-op if the BAS service is not initialized (variant without battery).
void ble_hid_publish_battery(uint8_t percent);

// Adjust the BLE connection interval according to the idle state.
// idle=true → ~200ms (radio saving), idle=false → ~15ms (responsive)
void ble_hid_set_idle_conn_interval(bool idle);
