// ═══════════════════════════════════════════════════════════════
//  display.c — Écran SSD1315 (compatible SSD1306) via I2C
//
//  On utilise esp_lcd (composant natif ESP-IDF) avec un
//  panneau SSD1306 — le SSD1315 utilise le même protocole.
//
//  Rendu : on maintient un framebuffer 128x64 bits en RAM,
//  on y dessine, puis on envoie le tout via I2C.
//  Pas de lib externe nécessaire.
// ═══════════════════════════════════════════════════════════════

#include "display.h"
#include "kb_config.h"
#include "config_store.h"
#include "keymap.h"
#include "battery.h"
#include "ble_hid.h"

#include "driver/i2c.h"
#include "esp_lcd_panel_io.h"
#include "esp_lcd_panel_ops.h"
#include "esp_lcd_panel_vendor.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <string.h>
#include <stdio.h>

static const char *TAG = "DISPLAY";

// ─────────────────────────────────────────────────────────────
//  FRAMEBUFFER
//  128×64 pixels, 1 bit par pixel = 1024 bytes
//  Organisé en 8 "pages" de 128 bytes (8 lignes de 8px chacune)
// ─────────────────────────────────────────────────────────────
#define FB_WIDTH   128
#define FB_HEIGHT   64
#define FB_PAGES    (FB_HEIGHT / 8)   // = 8

static uint8_t g_framebuffer[FB_PAGES][FB_WIDTH];
static esp_lcd_panel_handle_t g_panel = NULL;
static bool g_display_on = true;

// ─────────────────────────────────────────────────────────────
//  POLICE DE CARACTÈRES 5×7 (ASCII 32-126)
//  Chaque caractère = 5 bytes (5 colonnes de 8 bits)
//  Source : police bitmap classique 5x7
// ─────────────────────────────────────────────────────────────
#include "font5x7.h"  // Voir font5x7.h dans ce même répertoire

// ─────────────────────────────────────────────────────────────
//  PRIMITIVES DE DESSIN
// ─────────────────────────────────────────────────────────────

// Effacer le framebuffer (tout noir)
static void fb_clear(void)
{
    memset(g_framebuffer, 0, sizeof(g_framebuffer));
}

// Allumer/éteindre un pixel
static void fb_draw_pixel(int x, int y, bool on)
{
    if (x < 0 || x >= FB_WIDTH || y < 0 || y >= FB_HEIGHT) return;
    int page = y / 8;
    int bit  = y % 8;
    if (on) {
        g_framebuffer[page][x] |=  (1 << bit);
    } else {
        g_framebuffer[page][x] &= ~(1 << bit);
    }
}

// Tracer une ligne horizontale
static void fb_draw_hline(int x, int y, int w, bool on)
{
    for (int i = 0; i < w; i++) fb_draw_pixel(x + i, y, on);
}

// Dessiner un caractère ASCII à la position (x, y)
// Retourne la largeur utilisée (5 + 1 pixel d'espacement)
static int fb_draw_char(int x, int y, char c, bool invert)
{
    if (c < 32 || c > 126) c = '?';
    const uint8_t *glyph = FONT5X7[c - 32];  // Pointeur vers les 5 bytes du caractère

    for (int col = 0; col < 5; col++) {
        uint8_t bits = glyph[col];
        for (int row = 0; row < 7; row++) {
            bool pixel = (bits >> row) & 1;
            if (invert) pixel = !pixel;
            fb_draw_pixel(x + col, y + row, pixel);
        }
    }
    return 6;  // 5px + 1px d'espace
}

// Dessiner une string
static void fb_draw_string(int x, int y, const char *str, bool invert)
{
    while (*str) {
        x += fb_draw_char(x, y, *str++, invert);
        if (x >= FB_WIDTH) break;
    }
}

// Envoyer le framebuffer à l'écran via esp_lcd
static void fb_flush(void)
{
    if (!g_panel || !g_display_on) return;
    // esp_lcd_panel_draw_bitmap envoie le buffer à l'écran
    // Le SSD1306/1315 accepte les données page par page
    esp_lcd_panel_draw_bitmap(g_panel, 0, 0, FB_WIDTH, FB_HEIGHT, g_framebuffer);
}

// ─────────────────────────────────────────────────────────────
//  ICÔNES SIMPLES (bitmap 8×8)
// ─────────────────────────────────────────────────────────────

// Icône batterie — 8 colonnes de 8 bits
static const uint8_t ICON_BATTERY[8] = {
    0x7E, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x7E
};
static const uint8_t ICON_BLE[8] = {
    0x18, 0x28, 0x4A, 0x2C, 0x18, 0x2C, 0x4A, 0x28
};

static void fb_draw_icon(int x, int y, const uint8_t icon[8])
{
    for (int col = 0; col < 8; col++) {
        for (int row = 0; row < 8; row++) {
            fb_draw_pixel(x + col, y + row, (icon[col] >> row) & 1);
        }
    }
}

// ─────────────────────────────────────────────────────────────
//  LAYOUT DE L'ÉCRAN
//
//  ┌────────────────────────────────────┐
//  │ [BLE] PC          Layer: Base       │  ligne 0 (y=0)
//  │────────────────────────────────────│
//  │ Profile: Default                    │  ligne 1 (y=16)
//  │────────────────────────────────────│
//  │ [BAT] ████░░░░ 78%                 │  ligne 2 (y=40)
//  └────────────────────────────────────┘
// ─────────────────────────────────────────────────────────────

static void render_screen(void)
{
    fb_clear();

    const kb_config_t *cfg = config_store_get();
    const kb_display_config_t *dcfg = &cfg->display;

    // ── Ligne 1 : BLE + Layer ────────────────────────────────
    if (dcfg->show_ble_status) {
        if (ble_hid_is_connected()) {
            fb_draw_icon(0, 0, ICON_BLE);
            // Nom du slot actif
            uint8_t slot = ble_hid_get_active_slot();
            fb_draw_string(10, 1, cfg->ble.slot_names[slot], false);
        } else {
            fb_draw_string(0, 1, "BLE--", false);
        }
    }

    if (dcfg->show_layer) {
        char layer_str[16];
        uint8_t layer = keymap_get_active_layer();
        const char *lname = cfg->profiles[cfg->active_profile].layers[layer].name;
        snprintf(layer_str, sizeof(layer_str), "L:%s", lname);
        fb_draw_string(70, 1, layer_str, false);
    }

    // Séparateur
    fb_draw_hline(0, 11, FB_WIDTH, true);

    // ── Ligne 2 : Profil ─────────────────────────────────────
    if (dcfg->show_profile) {
        char prof_str[24];
        snprintf(prof_str, sizeof(prof_str), "%s",
                 cfg->profiles[cfg->active_profile].name);
        fb_draw_string(0, 16, prof_str, false);
    }

    // ── Ligne 3 : Batterie ───────────────────────────────────
    if (dcfg->show_battery) {
        fb_draw_hline(0, 38, FB_WIDTH, true);
        fb_draw_icon(0, 42, ICON_BATTERY);

        uint8_t pct = battery_get_percent();
        // Barre de progression 80px
        int bar_w = (pct * 80) / 100;
        for (int x = 12; x < 12 + bar_w; x++) {
            fb_draw_pixel(x, 43, true);
            fb_draw_pixel(x, 44, true);
            fb_draw_pixel(x, 45, true);
            fb_draw_pixel(x, 46, true);
            fb_draw_pixel(x, 47, true);
        }
        // Bordure de la barre
        fb_draw_hline(12, 42, 80, true);
        fb_draw_hline(12, 48, 80, true);

        char pct_str[8];
        snprintf(pct_str, sizeof(pct_str), "%d%%", pct);
        fb_draw_string(96, 43, pct_str, false);
    }
}

// ─────────────────────────────────────────────────────────────
//  FONCTIONS PUBLIQUES
// ─────────────────────────────────────────────────────────────

esp_err_t display_init(void)
{
    // ── Init I2C ─────────────────────────────────────────────
    i2c_config_t i2c_conf = {
        .mode             = I2C_MODE_MASTER,
        .sda_io_num       = DISPLAY_I2C_SDA,
        .scl_io_num       = DISPLAY_I2C_SCL,
        .sda_pullup_en    = GPIO_PULLUP_ENABLE,
        .scl_pullup_en    = GPIO_PULLUP_ENABLE,
        .master.clk_speed = 400000,  // 400kHz (Fast mode I2C)
    };
    ESP_ERROR_CHECK(i2c_param_config(DISPLAY_I2C_PORT, &i2c_conf));
    ESP_ERROR_CHECK(i2c_driver_install(DISPLAY_I2C_PORT, I2C_MODE_MASTER, 0, 0, 0));

    // ── Init esp_lcd avec panel I2C ───────────────────────────
    esp_lcd_panel_io_handle_t io_handle = NULL;
    esp_lcd_panel_io_i2c_config_t io_config = {
        .dev_addr            = DISPLAY_I2C_ADDR,
        .control_phase_bytes = 1,
        .dc_bit_offset       = 6,
        .lcd_cmd_bits        = 8,
        .lcd_param_bits      = 8,
    };
    ESP_ERROR_CHECK(esp_lcd_new_panel_io_i2c(
        (esp_lcd_i2c_bus_handle_t)DISPLAY_I2C_PORT, &io_config, &io_handle));

    esp_lcd_panel_dev_config_t panel_config = {
        .bits_per_pixel = 1,
        .reset_gpio_num = -1,  // Pas de pin RESET
    };
    ESP_ERROR_CHECK(esp_lcd_new_panel_ssd1306(io_handle, &panel_config, &g_panel));

    ESP_ERROR_CHECK(esp_lcd_panel_reset(g_panel));
    ESP_ERROR_CHECK(esp_lcd_panel_init(g_panel));
    ESP_ERROR_CHECK(esp_lcd_panel_disp_on_off(g_panel, true));

    // Luminosité initiale depuis config
    const kb_config_t *cfg = config_store_get();
    // Commande SSD1306 pour la luminosité (0x00-0xFF)
    // Note: esp_lcd ne l'expose pas directement, on passe par la commande brute
    // Pour l'instant, brightness par défaut

    fb_clear();
    ESP_LOGI(TAG, "Écran SSD1315 initialisé (%dx%d)", FB_WIDTH, FB_HEIGHT);
    return ESP_OK;
}

void display_show_boot_screen(void)
{
    fb_clear();
    fb_draw_string(20, 20, "Custom KB", false);
    fb_draw_string(30, 32, "Loading...", false);
    fb_flush();
    vTaskDelay(pdMS_TO_TICKS(1500));
}

void display_update(void)
{
    if (!g_display_on) return;
    render_screen();
    fb_flush();
}

void display_set_sleep(bool sleep)
{
    g_display_on = !sleep;
    if (g_panel) {
        esp_lcd_panel_disp_on_off(g_panel, !sleep);
    }
}
