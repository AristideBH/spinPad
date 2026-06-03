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

// Limites structurelles : source de vérité unique dans config-schema.ts,
// générées par `pnpm codegen` (CONFIG_MAX_PROFILES, CONFIG_MAX_LAYERS,
// CONFIG_NAME_MAX_LEN, CONFIG_NUM_KEYS, PROFILE_ICON_*).
#include "config_limits.gen.h"

#define CONFIG_MAX_COMBOS      16

// Macro step definitions
// MACRO_COUNT, MACRO_MAX_STEPS, MACRO_NAME_MAX_LEN proviennent de config_limits.gen.h

typedef enum {
    MACRO_STEP_KEY_DOWN = 0,
    MACRO_STEP_KEY_UP   = 1,
    MACRO_STEP_DELAY_MS = 2,
} kb_macro_step_type_t;

typedef struct {
    kb_macro_step_type_t type;
    uint16_t             keycode_or_delay;  // HID keycode (KEY_DOWN/UP) ou ms (DELAY, max 1000)
} kb_macro_step_t;

typedef struct {
    char            name[MACRO_NAME_MAX_LEN];  // Nom convivial (vide → "Macro N")
    uint8_t         step_count;
    kb_macro_step_t steps[MACRO_MAX_STEPS];
} kb_macro_t;

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

// ── Un profil : plusieurs layers + combos + macros ───────────
typedef struct {
    char        name[CONFIG_NAME_MAX_LEN]; // Ex: "Default", "Gaming", "Dev"
    uint8_t     icon[PROFILE_ICON_BYTES];  // Bitmap 24×24 1bpp (0 = pas d'icône)
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
    uint8_t           count;          // Nombre de LEDs extension (1–50)
    kb_led_ext_mode_t mode;
    uint8_t           r, g, b;       // Couleur statique (si mode = STATIC ou AMBIENT)
    uint8_t           brightness;    // 0–255 (indépendant de la luminosité touches)
    uint16_t          max_power_mw;  // Budget max en mW (0 = illimité, défaut : 500)
} kb_led_extension_t;

// ── Config BLE ────────────────────────────────────────────────
typedef struct {
    char device_name[CONFIG_NAME_MAX_LEN];   // Nom diffusé en BLE
    char slot_names[2][CONFIG_NAME_MAX_LEN]; // Ex: ["PC Bureau", "Home Assistant"]
    uint8_t active_slot;                     // 0 ou 1
} kb_ble_config_t;

// ── Widgets OLED ─────────────────────────────────────────────
typedef enum {
    WIDGET_NONE        = 0,
    WIDGET_BLE_STATUS  = 1,
    WIDGET_LAYER       = 2,
    WIDGET_PROFILE     = 3,
    WIDGET_BATTERY     = 4,
    WIDGET_CUSTOM_TEXT = 5,
    WIDGET_CLOCK       = 6,
} kb_widget_type_t;

#define WIDGET_MAX_CUSTOM_LEN  13   // 12 chars max + '\0'
#define DISPLAY_MAX_WIDGETS     8

typedef struct {
    kb_widget_type_t type;
    bool             enabled;
    uint8_t          row;                          // 0–4 (chaque rangée = 8px)
    uint8_t          col;                          // 0–11 (chaque colonne = 6px)
    char             custom_text[WIDGET_MAX_CUSTOM_LEN];
} kb_widget_t;

// ── Config écran ──────────────────────────────────────────────
typedef struct {
    uint8_t     brightness;       // 0-255
    uint16_t    timeout_s;        // Extinction après N secondes
    kb_widget_t widgets[DISPLAY_MAX_WIDGETS];
    uint8_t     widget_count;
    // Référence pour le widget horloge : unix timestamp + uptime au moment du set_time
    uint32_t    clock_base_unix_ts;
    uint64_t    clock_base_uptime_ms;
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
    uint8_t  debounce_press_scans;    // Scans consécutifs requis pour valider un appui (défaut : 3)
    uint8_t  debounce_release_scans;  // Scans consécutifs requis pour valider un relâchement (défaut : 5)
} kb_power_config_t;

// ── Config complète ───────────────────────────────────────────
typedef struct {
    uint8_t             version;         // Version du schéma (pour migrations futures)
    uint8_t             profile_count;
    uint8_t             active_profile;
    kb_orientation_t    orientation;     // Rotation globale (0/90/180/270°)
    kb_profile_t        profiles[CONFIG_MAX_PROFILES];
    uint8_t             macro_count;     // Macros globales utilisées (<= MACRO_COUNT)
    kb_macro_t          macros[MACRO_COUNT];
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

// Définir le profil actif (couche données uniquement) : clamp à profile_count,
// met à jour g_config.active_profile et persiste en NVS. Ne touche PAS au keymap
// ni à l'écran — utiliser keymap_set_active_profile() pour la bascule complète.
// Écrit l'index réellement appliqué (après clamp) dans *applied si non NULL.
esp_err_t config_store_set_active_profile(uint8_t idx, uint8_t *applied);

// Exporter la config actuelle en JSON (dans un buffer alloué par l'appelant)
// buffer doit être assez grand (utilise CONFIG_JSON_MAX_SIZE)
esp_err_t config_store_to_json(char *buffer, size_t buffer_size);

// Remettre la config à zéro (valeurs par défaut)
esp_err_t config_store_factory_reset(void);

#define CONFIG_JSON_MAX_SIZE  8192  // 8KB max pour le JSON de config
