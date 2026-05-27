#pragma once
// ═══════════════════════════════════════════════════════════════
//  keymap.h — Interface publique du moteur de touches
//
//  Ce header expose uniquement ce que les autres composants
//  ont besoin de savoir. L'implémentation est dans keymap.c.
// ═══════════════════════════════════════════════════════════════

#include <stdint.h>
#include <stdbool.h>
#include "esp_err.h"

// ─────────────────────────────────────────────────────────────
//  ENCODAGE DES ACTIONS (16 bits)
//
//  Chaque touche est associée à une "action" — un uint16_t
//  qui encode à la fois le TYPE d'action et sa VALEUR.
//
//  Structure des 16 bits :
//    [15..12] = type (4 bits)  → quel genre d'action
//    [11..0]  = valeur (12 bits) → quoi exactement
//
//  Exemples :
//    0x0004  → KC (keycode normal), valeur 4 = KC_A
//    0x1000  → LAYER_MO, valeur 0 = activer layer 0 tant que pressé
//    0x2001  → LAYER_TG, valeur 1 = toggle layer 1
//    0xF000  → ACTION_SPECIAL, valeur 0 = BLE switch
// ─────────────────────────────────────────────────────────────

// Types d'action (4 bits hauts)
#define ACTION_TYPE_KC          0x0   // Keycode HID standard
#define ACTION_TYPE_MOD         0x1   // Modificateur (Ctrl, Shift, Alt, GUI)
#define ACTION_TYPE_LAYER_MO    0x2   // Momentary layer (actif tant que pressé)
#define ACTION_TYPE_LAYER_TG    0x3   // Toggle layer (appui = on/off)
#define ACTION_TYPE_LAYER_TO    0x4   // To layer (aller sur ce layer définitivement)
#define ACTION_TYPE_MEDIA       0x5   // Touche média (volume, play, etc.)
#define ACTION_TYPE_MACRO       0x6   // Séquence macro (bits 11–0 = index 0–15)
#define ACTION_TYPE_SPECIAL     0xF   // Actions spéciales du firmware

// Macro pour construire une action — combine type et valeur
// Exemple : ACTION(ACTION_TYPE_KC, 0x04) = touche 'A'
#define ACTION(type, val)   ((uint16_t)(((type) << 12) | ((val) & 0x0FFF)))

// ── Keycodes HID standard (valeurs USB HID Usage ID) ─────────
// Source : USB HID Usage Tables 1.12, section Keyboard/Keypad
#define KC_NONE     ACTION(ACTION_TYPE_KC, 0x00)   // Aucune action
#define KC_A        ACTION(ACTION_TYPE_KC, 0x04)
#define KC_B        ACTION(ACTION_TYPE_KC, 0x05)
#define KC_C        ACTION(ACTION_TYPE_KC, 0x06)
#define KC_D        ACTION(ACTION_TYPE_KC, 0x07)
#define KC_E        ACTION(ACTION_TYPE_KC, 0x08)
#define KC_F        ACTION(ACTION_TYPE_KC, 0x09)
#define KC_G        ACTION(ACTION_TYPE_KC, 0x0A)
#define KC_H        ACTION(ACTION_TYPE_KC, 0x0B)
#define KC_I        ACTION(ACTION_TYPE_KC, 0x0C)
#define KC_J        ACTION(ACTION_TYPE_KC, 0x0D)
#define KC_K        ACTION(ACTION_TYPE_KC, 0x0E)
#define KC_L        ACTION(ACTION_TYPE_KC, 0x0F)
#define KC_M        ACTION(ACTION_TYPE_KC, 0x10)
#define KC_N        ACTION(ACTION_TYPE_KC, 0x11)
#define KC_O        ACTION(ACTION_TYPE_KC, 0x12)
#define KC_P        ACTION(ACTION_TYPE_KC, 0x13)
#define KC_Q        ACTION(ACTION_TYPE_KC, 0x14)
#define KC_R        ACTION(ACTION_TYPE_KC, 0x15)
#define KC_S        ACTION(ACTION_TYPE_KC, 0x16)
#define KC_T        ACTION(ACTION_TYPE_KC, 0x17)
#define KC_U        ACTION(ACTION_TYPE_KC, 0x18)
#define KC_V        ACTION(ACTION_TYPE_KC, 0x19)
#define KC_W        ACTION(ACTION_TYPE_KC, 0x1A)
#define KC_X        ACTION(ACTION_TYPE_KC, 0x1B)
#define KC_Y        ACTION(ACTION_TYPE_KC, 0x1C)
#define KC_Z        ACTION(ACTION_TYPE_KC, 0x1D)
#define KC_1        ACTION(ACTION_TYPE_KC, 0x1E)
#define KC_2        ACTION(ACTION_TYPE_KC, 0x1F)
#define KC_3        ACTION(ACTION_TYPE_KC, 0x20)
#define KC_4        ACTION(ACTION_TYPE_KC, 0x21)
#define KC_5        ACTION(ACTION_TYPE_KC, 0x22)
#define KC_ESC      ACTION(ACTION_TYPE_KC, 0x29)
#define KC_ENTER    ACTION(ACTION_TYPE_KC, 0x28)
#define KC_SPACE    ACTION(ACTION_TYPE_KC, 0x2C)
#define KC_BSPC     ACTION(ACTION_TYPE_KC, 0x2A)
#define KC_TAB      ACTION(ACTION_TYPE_KC, 0x2B)
#define KC_DEL      ACTION(ACTION_TYPE_KC, 0x4C)
#define KC_F1       ACTION(ACTION_TYPE_KC, 0x3A)
#define KC_F2       ACTION(ACTION_TYPE_KC, 0x3B)
#define KC_F3       ACTION(ACTION_TYPE_KC, 0x3C)
#define KC_F4       ACTION(ACTION_TYPE_KC, 0x3D)
#define KC_F5       ACTION(ACTION_TYPE_KC, 0x3E)

// ── Modificateurs ─────────────────────────────────────────────
// Correspondent aux bits du byte "modifier" du rapport HID
#define MOD_LCTRL   ACTION(ACTION_TYPE_MOD, 0x01)
#define MOD_LSHIFT  ACTION(ACTION_TYPE_MOD, 0x02)
#define MOD_LALT    ACTION(ACTION_TYPE_MOD, 0x04)
#define MOD_LGUI    ACTION(ACTION_TYPE_MOD, 0x08)   // Touche Windows/Cmd
#define MOD_RCTRL   ACTION(ACTION_TYPE_MOD, 0x10)
#define MOD_RSHIFT  ACTION(ACTION_TYPE_MOD, 0x20)
#define MOD_RALT    ACTION(ACTION_TYPE_MOD, 0x40)
#define MOD_RGUI    ACTION(ACTION_TYPE_MOD, 0x80)

// ── Touches média (HID Consumer Control) ─────────────────────
#define KC_VOLU     ACTION(ACTION_TYPE_MEDIA, 0x01)   // Volume +
#define KC_VOLD     ACTION(ACTION_TYPE_MEDIA, 0x02)   // Volume -
#define KC_MUTE     ACTION(ACTION_TYPE_MEDIA, 0x03)   // Mute
#define KC_PLAY     ACTION(ACTION_TYPE_MEDIA, 0x04)   // Play/Pause
#define KC_NEXT     ACTION(ACTION_TYPE_MEDIA, 0x05)   // Piste suivante
#define KC_PREV     ACTION(ACTION_TYPE_MEDIA, 0x06)   // Piste précédente
#define KC_SCRL_U   ACTION(ACTION_TYPE_MEDIA, 0x10)   // Scroll haut
#define KC_SCRL_D   ACTION(ACTION_TYPE_MEDIA, 0x11)   // Scroll bas
#define KC_ZOOM_IN  ACTION(ACTION_TYPE_MEDIA, 0x20)   // Zoom +
#define KC_ZOOM_OUT ACTION(ACTION_TYPE_MEDIA, 0x21)   // Zoom -

// ── Actions layers ────────────────────────────────────────────
#define MO(n)   ACTION(ACTION_TYPE_LAYER_MO, n)   // Momentary layer n
#define TG(n)   ACTION(ACTION_TYPE_LAYER_TG, n)   // Toggle layer n
#define TO(n)   ACTION(ACTION_TYPE_LAYER_TO, n)   // Go to layer n

// ── Actions spéciales firmware ────────────────────────────────
#define BLE_SWITCH  ACTION(ACTION_TYPE_SPECIAL, 0x01)  // SW11 : changer appareil BLE
#define BLE_PAIR    ACTION(ACTION_TYPE_SPECIAL, 0x02)  // SW16+SW17 : mode pairing

// ─────────────────────────────────────────────────────────────
//  STRUCTURES DE DONNÉES
// ─────────────────────────────────────────────────────────────

#define KEYMAP_MAX_LAYERS    8    // Nombre maximum de layers simultanés
#define KEYMAP_MAX_COMBOS   16    // Nombre maximum de combos définis

// ─────────────────────────────────────────────────────────────
//  FONCTIONS PUBLIQUES
// ─────────────────────────────────────────────────────────────

// Initialise la matrice GPIO et charge le keymap depuis la config
esp_err_t keymap_init(void);

// Scanner la matrice physique (à appeler toutes les KB_SCAN_INTERVAL_MS)
void keymap_scan_matrix(void);

// Traiter les événements: combos, tap-hold, envoyer les rapports HID
void keymap_process_events(void);

// Retourne true si une touche a été pressée depuis le dernier appel
bool keymap_has_activity(void);

// Recharger le keymap depuis la config (après mise à jour via app SvelteKit)
void keymap_reload_from_config(void);

// Obtenir le layer actif actuellement (pour affichage sur l'écran)
uint8_t keymap_get_active_layer(void);

// Activer/désactiver le streaming d'événements clavier (mode entraînement)
// Quand activé, chaque changement d'état est émis via usb_hid_cdc_send().
void keymap_set_monitor(bool enable);
bool keymap_get_monitor(void);

// Lancer la macro macro_idx du profil actif dans une tâche FreeRTOS éphémère.
void keymap_play_macro(uint8_t macro_idx);
