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
#define CONFIG_NUM_KEYS        10  // Doit correspondre à KB_NUM_KEYS dans kb_config.h

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
    uint16_t keys[CONFIG_NUM_KEYS];        // Action pour chaque touche (KB_NUM_KEYS)
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

// ── Orientation globale ───────────────────────────────────────
typedef enum {
    ORIENTATION_0   = 0,   // Normal
    ORIENTATION_90  = 1,   // +90° CW
    ORIENTATION_180 = 2,   // 180°
    ORIENTATION_270 = 3,   // +270° CW (= -90°)
} kb_orientation_t;

// ── Config encodeur ───────────────────────────────────────────
typedef struct {
    uint8_t sensitivity;   // Pas par événement : 1 (1 clic/détent) à 4 (1 clic/4 détents)
} kb_encoder_config_t;

// ── Extension LED chain ───────────────────────────────────────
typedef enum {
    LED_EXT_MODE_OFF      = 0,   // Extension éteinte
    LED_EXT_MODE_MIRROR   = 1,   // Copie les couleurs des 10 touches en boucle
    LED_EXT_MODE_AMBIENT  = 2,   // Couleur unique douce (breathe)
    LED_EXT_MODE_STATIC   = 3,   // Couleur statique configurable
    LED_EXT_MODE_REACTIVE = 4,   // Flash sur touche pressée
    LED_EXT_MODE_HYPERION = 5,   // Piloté par Hyperion NG bridge (set_extension_frame)
} kb_led_ext_mode_t;

typedef struct {
    bool              enabled;
    uint8_t           count;       // Nombre de LEDs extension (1–50)
    kb_led_ext_mode_t mode;
    uint8_t           r, g, b;    // Couleur statique (si mode = STATIC ou AMBIENT)
    uint8_t           brightness; // 0–255 (indépendant de la luminosité touches)
} kb_led_extension_t;

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
    uint32_t sleep_timeout_s;       // Deep sleep après N secondes d'inactivité
    uint8_t  battery_critical_pct;  // % batterie → LED rouge clignotant
    // Présence de la batterie (variantes SpinPad sans batterie LiPo) :
    //   "auto" → auto-détection ADC (défaut)
    //   "yes"  → forcer présente
    //   "no"   → désactiver totalement
    char     battery_present[8];
} kb_power_config_t;

// ── Config complète ───────────────────────────────────────────
typedef struct {
    uint8_t             version;         // Version du schéma (pour migrations futures)
    uint8_t             profile_count;
    uint8_t             active_profile;
    kb_orientation_t    orientation;     // Rotation globale (0/90/180/270°)
    kb_profile_t        profiles[CONFIG_MAX_PROFILES];
    kb_ble_config_t     ble;
    kb_display_config_t display;
    kb_encoder_config_t encoder;
    kb_led_extension_t  led_extension;
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
