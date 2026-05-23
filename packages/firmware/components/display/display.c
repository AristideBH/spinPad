// ═══════════════════════════════════════════════════════════════
//  display.c — Écran SSD1306 72×40px via I2C
//
//  Framebuffer 72×40 (5 pages de 8px × 72 colonnes = 360 bytes).
//  Le SSD1306 72×40 a son buffer actif décalé à la colonne 28
//  dans la mémoire interne 128 colonnes (offset géré dans fb_flush).
//
//  Layout 72×40 :
//    y= 0- 7  BLE status (icône + nom du slot)
//    y= 8     séparateur
//    y= 9-16  Layer actif
//    y=17     séparateur
//    y=18-25  Profil actif
//    y=26     séparateur
//    y=27-34  Batterie (icône + barre + %)
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
//  FRAMEBUFFER  72×40 = 5 pages × 72 colonnes = 360 bytes
// ─────────────────────────────────────────────────────────────
#define FB_WIDTH   DISPLAY_WIDTH    // 72
#define FB_HEIGHT  DISPLAY_HEIGHT   // 40
#define FB_PAGES   (FB_HEIGHT / 8)  // 5

static uint8_t g_framebuffer[FB_PAGES][FB_WIDTH];
static esp_lcd_panel_handle_t g_panel = NULL;
static bool g_display_on = true;

// ─────────────────────────────────────────────────────────────
//  POLICE 5×7
// ─────────────────────────────────────────────────────────────
#include "font5x7.h"

// ─────────────────────────────────────────────────────────────
//  PRIMITIVES DE DESSIN
// ─────────────────────────────────────────────────────────────

static void fb_clear(void)
{
    memset(g_framebuffer, 0, sizeof(g_framebuffer));
}

static void fb_draw_pixel(int x, int y, bool on)
{
    if (x < 0 || x >= FB_WIDTH || y < 0 || y >= FB_HEIGHT) return;
    int page = y / 8;
    int bit  = y % 8;
    if (on) g_framebuffer[page][x] |=  (1 << bit);
    else    g_framebuffer[page][x] &= ~(1 << bit);
}

static void fb_draw_hline(int x, int y, int w, bool on)
{
    for (int i = 0; i < w; i++) fb_draw_pixel(x + i, y, on);
}

static int fb_draw_char(int x, int y, char c, bool invert)
{
    if (c < 32 || c > 126) c = '?';
    const uint8_t *glyph = FONT5X7[c - 32];
    for (int col = 0; col < 5; col++) {
        uint8_t bits = glyph[col];
        for (int row = 0; row < 7; row++) {
            bool pixel = (bits >> row) & 1;
            if (invert) pixel = !pixel;
            fb_draw_pixel(x + col, y + row, pixel);
        }
    }
    return 6;  // 5px + 1px espace
}

static void fb_draw_string(int x, int y, const char *str, bool invert)
{
    while (*str) {
        if (x + 5 > FB_WIDTH) break;
        x += fb_draw_char(x, y, *str++, invert);
    }
}

// Envoie le framebuffer vers le SSD1306 72×40.
// draw_bitmap(panel, x1, y1, x2, y2, data) — coordonnées dans l'espace
// du panneau physique (0..71 en x, 0..39 en y).
// L'offset colonne 28 est géré par le driver esp_lcd via panel_mirror/offset
// ou directement dans les commandes d'init SSD1306.
static void fb_flush(void)
{
    if (!g_panel || !g_display_on) return;
    esp_lcd_panel_draw_bitmap(g_panel, 0, 0, FB_WIDTH, FB_HEIGHT, g_framebuffer);
}

// ─────────────────────────────────────────────────────────────
//  ICÔNES 8×8
// ─────────────────────────────────────────────────────────────

static const uint8_t ICON_BATTERY[8] = {
    0x3E, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x3E
};
static const uint8_t ICON_BLE[8] = {
    0x18, 0x28, 0x4A, 0x2C, 0x18, 0x2C, 0x4A, 0x28
};

static void fb_draw_icon(int x, int y, const uint8_t icon[8])
{
    for (int col = 0; col < 8; col++)
        for (int row = 0; row < 8; row++)
            fb_draw_pixel(x + col, y + row, (icon[col] >> row) & 1);
}

// ─────────────────────────────────────────────────────────────
//  LAYOUT 72×40
//
//  ┌────────────────────────────┐  ← 72px
//  │[B] Slot name               │  y=0  (8px, icône BLE + texte)
//  │────────────────────────────│  y=8
//  │L: Base                     │  y=9  (7px, layer)
//  │────────────────────────────│  y=17
//  │Default                     │  y=18 (7px, profil)
//  │────────────────────────────│  y=26
//  │[=] ████████ 78%            │  y=27 (7px, batterie)
//  └────────────────────────────┘  y=40 (5px inutilisés en bas)
// ─────────────────────────────────────────────────────────────

static void render_screen(void)
{
    fb_clear();

    const kb_config_t *cfg  = config_store_get();
    const kb_display_config_t *dcfg = &cfg->display;

    // ── BLE status (y=0) ──────────────────────────────────────
    if (dcfg->show_ble_status) {
        if (ble_hid_is_connected()) {
            fb_draw_icon(0, 0, ICON_BLE);
            uint8_t slot = ble_hid_get_active_slot();
            fb_draw_string(10, 1, cfg->ble.slot_names[slot], false);
        } else {
            fb_draw_string(0, 1, "BLE--", false);
        }
    }

    fb_draw_hline(0, 8, FB_WIDTH, true);

    // ── Layer actif (y=9) ─────────────────────────────────────
    if (dcfg->show_layer) {
        char buf[14];  // "L:" + 11 chars + '\0' (72px / 6px = 12 chars max)
        uint8_t layer = keymap_get_active_layer();
        const char *lname = cfg->profiles[cfg->active_profile].layers[layer].name;
        snprintf(buf, sizeof(buf), "L:%s", lname);
        fb_draw_string(0, 9, buf, false);
    }

    fb_draw_hline(0, 17, FB_WIDTH, true);

    // ── Profil actif (y=18) ───────────────────────────────────
    if (dcfg->show_profile) {
        char buf[13];  // 12 chars + '\0'
        snprintf(buf, sizeof(buf), "%s",
                 cfg->profiles[cfg->active_profile].name);
        fb_draw_string(0, 18, buf, false);
    }

    fb_draw_hline(0, 26, FB_WIDTH, true);

    // ── Batterie (y=27) ───────────────────────────────────────
    if (dcfg->show_battery) {
        fb_draw_icon(0, 27, ICON_BATTERY);

        uint8_t pct = battery_get_percent();
        // Barre : x=10..49 (40px), centrée verticalement dans 8px → y=30..32
        int bar_w = (pct * 40) / 100;
        for (int x = 10; x < 10 + bar_w; x++) {
            fb_draw_pixel(x, 30, true);
            fb_draw_pixel(x, 31, true);
            fb_draw_pixel(x, 32, true);
        }
        fb_draw_hline(10, 29, 40, true);  // bord haut
        fb_draw_hline(10, 33, 40, true);  // bord bas

        char pct_str[6];  // "100%" + '\0'
        snprintf(pct_str, sizeof(pct_str), "%d%%", pct);
        fb_draw_string(52, 28, pct_str, false);
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
        .master.clk_speed = 400000,
    };
    ESP_ERROR_CHECK(i2c_param_config(DISPLAY_I2C_PORT, &i2c_conf));
    ESP_ERROR_CHECK(i2c_driver_install(DISPLAY_I2C_PORT, I2C_MODE_MASTER, 0, 0, 0));

    // ── Init esp_lcd ─────────────────────────────────────────
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
        .reset_gpio_num = -1,
    };
    ESP_ERROR_CHECK(esp_lcd_new_panel_ssd1306(io_handle, &panel_config, &g_panel));

    ESP_ERROR_CHECK(esp_lcd_panel_reset(g_panel));
    ESP_ERROR_CHECK(esp_lcd_panel_init(g_panel));

    // Le SSD1306 72×40 n'utilise que 72 des 128 colonnes internes.
    // L'offset colonne 28 est appliqué via mirror/gap pour que les
    // données envoyées à x=0 arrivent bien sur la colonne physique 0.
    ESP_ERROR_CHECK(esp_lcd_panel_set_gap(g_panel, DISPLAY_COL_OFFSET, 0));

    ESP_ERROR_CHECK(esp_lcd_panel_disp_on_off(g_panel, true));

    fb_clear();
    ESP_LOGI(TAG, "Écran SSD1306 %dx%d initialisé", FB_WIDTH, FB_HEIGHT);
    return ESP_OK;
}

void display_show_boot_screen(void)
{
    fb_clear();
    // Centre approximatif : 72/2 - 9*6/2 = 36 - 27 = 9
    fb_draw_string(9, 10, "SpinPad", false);
    fb_draw_string(6, 24, "Loading...", false);
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
