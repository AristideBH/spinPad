// ═══════════════════════════════════════════════════════════════
//  led_engine.h — Moteur LED WS2812 pour les touches SpinPad
//
//  Gère la chaîne WS2812 des 10 touches (LED_KEY_GPIO).
//  Supporte effets par touche, luminosité globale, extension de chaîne.
//
//  Usage :
//    led_engine_init()             — à appeler dans app_main après battery_init
//    led_engine_tick()             — à appeler dans keyboard_scan_task (~5ms)
//    led_engine_apply_config()     — recharger depuis config_store après un changement
//    led_engine_set_brightness_global(50) — en Studio Mode (dim ~20%)
//
//  Extension de chaîne :
//    Les LEDs supplémentaires (led_extension dans la config) sont ajoutées
//    après les 10 LEDs touches dans la même chaîne physique.
// ═══════════════════════════════════════════════════════════════

#pragma once

#include <stdint.h>
#include <stdbool.h>
#include "esp_err.h"

// ─────────────────────────────────────────────────────────────
//  Effets disponibles par touche
// ─────────────────────────────────────────────────────────────

typedef enum {
    LED_EFFECT_OFF     = 0,   // Éteint
    LED_EFFECT_SOLID   = 1,   // Couleur fixe
    LED_EFFECT_BREATHE = 2,   // Pulsation douce (sinusoïdale ~2s)
} led_effect_t;

// ─────────────────────────────────────────────────────────────
//  Config d'une touche individuelle
// ─────────────────────────────────────────────────────────────

typedef struct {
    uint8_t      r, g, b;    // Couleur (0–255)
    led_effect_t effect;     // Effet
} led_key_config_t;

// ─────────────────────────────────────────────────────────────
//  API publique
// ─────────────────────────────────────────────────────────────

/**
 * Initialise le moteur LED et démarre la chaîne WS2812 via RMT.
 * Appeler après battery_init() dans app_main (les deux utilisent RMT).
 */
esp_err_t led_engine_init(void);

/**
 * Tick du moteur LED (~5ms). Met à jour les effets animés (breathe)
 * et rafraîchit la chaîne si nécessaire.
 * Appeler depuis keyboard_scan_task.
 */
void led_engine_tick(void);

/**
 * Recharge les couleurs/effets depuis config_store.
 * Appeler après loadConfig côté firmware ou après web_config update.
 */
void led_engine_apply_config(void);

/**
 * Définit la config LED d'une touche individuelle.
 * @param key_idx Index de la touche (0–9)
 * @param cfg     Couleur + effet
 */
void led_engine_set_key(uint8_t key_idx, const led_key_config_t *cfg);

/**
 * Applique la même config à toutes les touches.
 */
void led_engine_set_all(const led_key_config_t *cfg);

/**
 * Luminosité globale (0–255). Toutes les couleurs sont scalées par ce facteur.
 * 255 = pleine luminosité, 50 = ~20% (mode Studio dim).
 */
void led_engine_set_brightness_global(uint8_t brightness);

/**
 * Injecte des pixels RGB externes pour l'extension de chaîne
 * (Hyperion NG bridge, mode Mirror, etc.).
 * @param rgb   Tableau de triplets R,G,B
 * @param count Nombre de LEDs extension à mettre à jour
 */
void led_engine_set_extension_frame(const uint8_t *rgb, uint8_t count);

/**
 * Retourne la luminosité globale actuelle.
 */
uint8_t led_engine_get_brightness(void);

/**
 * Signale une activité clavier au moteur LED (pour le mode REACTIVE).
 * Appeler depuis keymap_process_events() à chaque touche pressée.
 */
void led_engine_notify_activity(void);
