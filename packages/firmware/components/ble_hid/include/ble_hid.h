#pragma once
#include <stdint.h>
#include <stdbool.h>
#include "esp_err.h"

// Initialiser NimBLE et tenter de se reconnecter au dernier appareil
esp_err_t ble_hid_init(void);

// Presse/relâche une touche clavier via BLE
void ble_hid_key_press(uint8_t keycode, uint8_t modifier);
void ble_hid_key_release(uint8_t keycode);

// Touche média via BLE
void ble_hid_consumer_press(uint16_t usage);
void ble_hid_consumer_release(void);

// Changer d'appareil BLE (cycle entre les slots)
void ble_hid_switch_device(void);

// Entrer en mode pairing pour le slot actif
void ble_hid_enter_pairing_mode(void);

// True si BLE connecté à un appareil
bool ble_hid_is_connected(void);

// Slot actif (0 ou 1)
uint8_t ble_hid_get_active_slot(void);

// Publier le niveau de batterie sur la caractéristique GATT BAS (0x2A19).
// No-op si le service BAS n'est pas initialisé (variante sans batterie).
void ble_hid_publish_battery(uint8_t percent);

// Ajuster l'intervalle de connexion BLE selon l'état d'inactivité.
// idle=true → ~200ms (économie radio), idle=false → ~15ms (réactif)
void ble_hid_set_idle_conn_interval(bool idle);
