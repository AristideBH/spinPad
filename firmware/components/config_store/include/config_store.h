#pragma once
// ═══════════════════════════════════════════════════════════════
//  config_store.h — Structures de données de configuration
//
//  Ces structs reflètent exactement le JSON que l'app SvelteKit
//  envoie. Si tu modifies le JSON, modifie ces structs en miroir.
// ═══════════════════════════════════════════════════════════════

#include <stdint.h>
#include <stdbool.h>
#include "esp_err.h"

#define CONFIG_MAX_PROFILES     4
#define CONFIG_MAX_LAYERS       8
#define CONFIG_MAX_COMBOS      16
#define CONFIG_NAME_MAX_LEN    32

// Combo definition (mirrors keymap's internal type)
#define KEYMAP_COMBO_MAX_KEYS   4

typedef struct {
    uint8_t  keys[KEYMAP_COMBO_MAX_KEYS];
    uint8_t  key_count;
    uint16_t action;
    uint16_t window_ms;
    bool     active;
} kb_combo_t;

// ── Un layer : tableau de keycodes ───────────────────────────
typedef struct {
    char     name[CONFIG_NAME_MAX_LEN];    // Ex: "Base", "Fn", "Media"
    uint16_t keys[20];                     // Action pour chaque touche (KB_NUM_KEYS)
    uint16_t encoder_cw;                   // Encodeur sens horaire
    uint16_t encoder_ccw;                  // Encodeur sens anti-horaire
    uint16_t encoder_press;                // Bouton de l'encodeur
} kb_layer_t;

// ── Un profil : plusieurs layers + combos ────────────────────
typedef struct {
    char        name[CONFIG_NAME_MAX_LEN]; // Ex: "Default", "Gaming", "Dev"
    uint8_t     layer_count;
    kb_layer_t  layers[CONFIG_MAX_LAYERS];
    uint8_t     combo_count;
    kb_combo_t  combos[CONFIG_MAX_COMBOS];
} kb_profile_t;

// ── Config BLE ────────────────────────────────────────────────
typedef struct {
    char device_name[CONFIG_NAME_MAX_LEN];   // Nom diffusé en BLE
    char slot_names[2][CONFIG_NAME_MAX_LEN]; // Ex: ["PC Bureau", "Home Assistant"]
    uint8_t active_slot;                     // 0 ou 1
} kb_ble_config_t;

// ── Config écran ──────────────────────────────────────────────
typedef struct {
    uint8_t  brightness;       // 0-255
    uint16_t timeout_s;        // Extinction après N secondes
    bool     show_battery;
    bool     show_layer;
    bool     show_profile;
    bool     show_ble_status;
} kb_display_config_t;

// ── Config power ─────────────────────────────────────────────
typedef struct {
    uint32_t sleep_timeout_s;    // Deep sleep après N secondes d'inactivité
    uint8_t  battery_critical_pct;  // % batterie → LED rouge clignotant
} kb_power_config_t;

// ── Config complète ───────────────────────────────────────────
typedef struct {
    uint8_t             version;         // Version du schéma (pour migrations futures)
    uint8_t             profile_count;
    uint8_t             active_profile;
    kb_profile_t        profiles[CONFIG_MAX_PROFILES];
    kb_ble_config_t     ble;
    kb_display_config_t display;
    kb_power_config_t   power;
} kb_config_t;

// ─────────────────────────────────────────────────────────────
//  FONCTIONS PUBLIQUES
// ─────────────────────────────────────────────────────────────

// Initialiser : charger depuis NVS (ou créer config par défaut si absente)
esp_err_t config_store_init(void);

// Obtenir un pointeur vers la config en mémoire (lecture seule)
const kb_config_t *config_store_get(void);

// Mettre à jour la config depuis un JSON reçu via WebSerial/BLE
// json_str = string JSON null-terminated
esp_err_t config_store_update_from_json(const char *json_str);

// Sauvegarder la config actuelle en NVS
esp_err_t config_store_save(void);

// Exporter la config actuelle en JSON (dans un buffer alloué par l'appelant)
// buffer doit être assez grand (utilise CONFIG_JSON_MAX_SIZE)
esp_err_t config_store_to_json(char *buffer, size_t buffer_size);

// Remettre la config à zéro (valeurs par défaut)
esp_err_t config_store_factory_reset(void);

#define CONFIG_JSON_MAX_SIZE  8192  // 8KB max pour le JSON de config
