// ═══════════════════════════════════════════════════════════════
//  display.c — SSD1306 72×40px screen via I2C
//
//  Framebuffer 72×40 (5 pages of 8px × 72 columns = 360 bytes).
//  The SSD1306 72×40 has its active buffer shifted to column 28
//  in the internal 128-column memory (offset handled in fb_flush).
//
//  Layout 72×40 :
//    y= 0- 7  BLE status (icon + slot name)
//    y= 8     separator
//    y= 9-16  Active layer
//    y=17     separator
//    y=18-25  Active profile
//    y=26     separator
//    y=27-34  Battery (icon + bar + %)
// ═══════════════════════════════════════════════════════════════

#include "display.h"
#include "kb_config.h"
#include "config_store.h"
#include "keymap.h"
#include "battery.h"
#include "ble_hid.h"

#include "driver/i2c.h"
#include "esp_timer.h"
#include "esp_lcd_panel_io.h"
#include "esp_lcd_panel_ops.h"
#include "esp_lcd_panel_vendor.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <string.h>
#include <stdio.h>
#include <time.h>

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
//  5×7 FONT
// ─────────────────────────────────────────────────────────────
#include "font5x7.h"

// ─────────────────────────────────────────────────────────────
//  DRAWING PRIMITIVES
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

__attribute__((unused))
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
    return 6;  // 5px + 1px space
}

static void fb_draw_string(int x, int y, const char *str, bool invert)
{
    while (*str) {
        if (x + 5 > FB_WIDTH) break;
        x += fb_draw_char(x, y, *str++, invert);
    }
}

// Sends the framebuffer to the SSD1306 72×40.
// For 0°/180°, the rotation is handled in hardware via panel_mirror().
// For 90°/270°, we do a software rotation pixel by pixel.
static void fb_flush(void)
{
    if (!g_panel || !g_display_on) return;

    if (g_orientation == ORIENTATION_0 || g_orientation == ORIENTATION_180) {
        // Hardware mirror, direct send
        esp_lcd_panel_draw_bitmap(g_panel, 0, 0, FB_WIDTH, FB_HEIGHT, g_framebuffer);
    } else {
        // Software rotation 90° / 270°
        // The source framebuffer is 72×40.
        // After rotation, we send a 72×40 buffer (same physical dimensions).
        static uint8_t rotated[FB_PAGES][FB_WIDTH];
        memset(rotated, 0, sizeof(rotated));

        for (int sy = 0; sy < FB_HEIGHT; sy++) {
            for (int sx = 0; sx < FB_WIDTH; sx++) {
                bool px = (g_framebuffer[sy / 8][sx] >> (sy % 8)) & 1;
                if (!px) continue;

                int dx, dy;
                if (g_orientation == ORIENTATION_90) {
                    // 90° CW : (sx, sy) → (FB_HEIGHT-1-sy, sx)
                    dx = FB_HEIGHT - 1 - sy;
                    dy = sx;
                } else {
                    // 270° CW (= 90° CCW) : (sx, sy) → (sy, FB_WIDTH-1-sx)
                    dx = sy;
                    dy = FB_WIDTH - 1 - sx;
                }
                // Clip to physical dimensions
                if (dx >= 0 && dx < FB_WIDTH && dy >= 0 && dy < FB_HEIGHT) {
                    rotated[dy / 8][dx] |= (1 << (dy % 8));
                }
            }
        }
        esp_lcd_panel_draw_bitmap(g_panel, 0, 0, FB_WIDTH, FB_HEIGHT, rotated);
    }
}

// ─────────────────────────────────────────────────────────────
//  8×8 ICONS
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
//  4×4 MOSAIC GRID
//
//  Logical 4×4 layout drawn in orientation-0 space (framebuffer
//  72×40). The outer ring (col/row 0 and 3) = fixed band of
//  WIDGET_MIN_BAND_PX ; the 2 central tracks share the rest
//  (1fr). The physical orientation is applied by fb_flush (software
//  rotation 90/270, hardware mirror 180/270) — the render stays 72×40.
//
//  Each widget occupies a box (x, y, w, h) in cells. Each
//  pair (type, size) = a distinct drawing variant.
// ─────────────────────────────────────────────────────────────

// Left edge (px) of grid column c ∈ [0..WIDGET_GRID_COLS].
static int cell_col_edge(int c)
{
    const int band = WIDGET_MIN_BAND_PX;
    const int mid  = (FB_WIDTH - 2 * band) / (WIDGET_GRID_COLS - 2);
    if (c <= 0)                    return 0;
    if (c >= WIDGET_GRID_COLS)     return FB_WIDTH;
    if (c == WIDGET_GRID_COLS - 1) return FB_WIDTH - band;   // last track = band
    return band + (c - 1) * mid;
}

// Top edge (px) of grid row r ∈ [0..WIDGET_GRID_ROWS].
static int cell_row_edge(int r)
{
    const int band = WIDGET_MIN_BAND_PX;
    const int mid  = (FB_HEIGHT - 2 * band) / (WIDGET_GRID_ROWS - 2);
    if (r <= 0)                    return 0;
    if (r >= WIDGET_GRID_ROWS)     return FB_HEIGHT;
    if (r == WIDGET_GRID_ROWS - 1) return FB_HEIGHT - band;
    return band + (r - 1) * mid;
}

// Draws a centered string (H+V) in the box (bx,by,bw,bh), clipped.
static void fb_draw_string_in(int bx, int by, int bw, int bh, const char *str, bool invert)
{
    int len = (int)strlen(str);
    int tw  = len > 0 ? len * 6 - 1 : 0;   // last letter without the space
    int x   = bx + (bw - tw) / 2;
    int y   = by + (bh - 7) / 2;
    if (x < bx) x = bx;
    if (y < by) y = by;
    while (*str && x + 5 <= bx + bw) {
        x += fb_draw_char(x, y, *str++, invert);
    }
}

static void render_widget(const kb_config_t *cfg, const kb_widget_t *w)
{
    if (w->type == WIDGET_NONE) return;

    const int  px   = cell_col_edge(w->x);
    const int  py   = cell_row_edge(w->y);
    const int  pw   = cell_col_edge(w->x + w->w) - px;
    const int  ph   = cell_row_edge(w->y + w->h) - py;
    const bool wide = w->w >= 2;
    const bool tall = w->h >= 2;

    switch (w->type) {

    case WIDGET_BLE_STATUS:
        // 1×1 : BLE icon (state = connected/not handled elsewhere by the app).
        if (ble_hid_is_connected())
            fb_draw_icon(px + (pw - 8) / 2, py + (ph - 8) / 2, ICON_BLE);
        break;

    case WIDGET_BATTERY: {
        if (!battery_is_present()) break;
        uint8_t pct = battery_get_percent();
        if (wide) {
            // 2×1 : icon + percentage
            fb_draw_icon(px + 1, py + (ph - 8) / 2, ICON_BATTERY);
            char b[6];
            snprintf(b, sizeof(b), "%u%%", pct);
            fb_draw_string_in(px + 11, py, pw - 11, ph, b, false);
        } else {
            // 1×1 : icon only
            fb_draw_icon(px + (pw - 8) / 2, py + (ph - 8) / 2, ICON_BATTERY);
        }
        break;
    }

    case WIDGET_LAYER: {
        uint8_t layer = keymap_get_active_layer();
        char b[16];
        if (wide) {
            // 2×1 : "L:<name>"
            const char *ln = cfg->profiles[cfg->active_profile].layers[layer].name;
            snprintf(b, sizeof(b), "L:%s", ln);
        } else {
            // 1×1 : layer number
            snprintf(b, sizeof(b), "%u", (unsigned)(layer + 1));
        }
        fb_draw_string_in(px, py, pw, ph, b, false);
        break;
    }

    case WIDGET_PROFILE: {
        // 2×1 / 2×2 : centered profile name (variant 2×2 = more vertical space)
        fb_draw_string_in(px, py, pw, ph, cfg->profiles[cfg->active_profile].name, false);
        break;
    }

    case WIDGET_CUSTOM_TEXT:
        fb_draw_string_in(px, py, pw, ph, w->custom_text, false);
        break;

    case WIDGET_CLOCK: {
        if (cfg->display.clock_base_unix_ts == 0) break;
        uint64_t now_ms   = (uint64_t)(esp_timer_get_time() / 1000);
        uint64_t elapsed  = now_ms > cfg->display.clock_base_uptime_ms
                            ? (now_ms - cfg->display.clock_base_uptime_ms) / 1000 : 0;
        uint32_t unix_now = cfg->display.clock_base_unix_ts + (uint32_t)elapsed;
        bool     h24      = w->opts[0] & WIDGET_OPT_CLOCK_24H;
        uint8_t  hour     = (unix_now % 86400) / 3600;
        uint8_t  min      = (unix_now % 3600)  / 60;
        uint8_t  disp_h   = h24 ? hour : (hour % 12 == 0 ? 12 : hour % 12);
        char     tbuf[6];
        snprintf(tbuf, sizeof(tbuf), "%02u:%02u", disp_h, min);

        if (tall && (w->opts[0] & WIDGET_OPT_CLOCK_SHOW_DATE)) {
            // 2×2 + date : time on top, DD/MM at the bottom
            fb_draw_string_in(px, py, pw, ph / 2, tbuf, false);
            time_t    t = (time_t)unix_now;
            struct tm tmv;
            gmtime_r(&t, &tmv);
            char dbuf[6];
            snprintf(dbuf, sizeof(dbuf), "%02d/%02d", tmv.tm_mday, tmv.tm_mon + 1);
            fb_draw_string_in(px, py + ph / 2, pw, ph - ph / 2, dbuf, false);
        } else {
            fb_draw_string_in(px, py, pw, ph, tbuf, false);
        }
        break;
    }

    case WIDGET_ICON: {
        // Bitmap 24×24 1bpp scaled (nearest-neighbor) in the box (px,py,pw,ph).
        // Column-major layout : byteIndex = x * 3 + (y >> 3), bit = y & 7.
        if (pw <= 0 || ph <= 0) break;
        for (int dy = 0; dy < ph; dy++) {
            int sy = (dy * PROFILE_ICON_H) / ph;
            for (int dx = 0; dx < pw; dx++) {
                int sx = (dx * PROFILE_ICON_W) / pw;
                int bidx = sx * (PROFILE_ICON_H / 8) + (sy >> 3);
                bool pixel = (w->icon[bidx] >> (sy & 7)) & 1;
                fb_draw_pixel(px + dx, py + dy, pixel);
            }
        }
        break;
    }

    default:
        break;
    }
}

static void render_screen(void)
{
    fb_clear();

    const kb_config_t *cfg = config_store_get();

    for (int i = 0; i < cfg->display.widget_count && i < DISPLAY_MAX_WIDGETS; i++) {
        render_widget(cfg, &cfg->display.widgets[i]);
    }
}

// ─────────────────────────────────────────────────────────────
//  PUBLIC FUNCTIONS
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

    // The SSD1306 72×40 only uses 72 of the 128 internal columns.
    // The column 28 offset is applied via mirror/gap so that the
    // data sent at x=0 arrives properly on physical column 0.
    ESP_ERROR_CHECK(esp_lcd_panel_set_gap(g_panel, DISPLAY_COL_OFFSET, 0));

    ESP_ERROR_CHECK(esp_lcd_panel_disp_on_off(g_panel, true));

    fb_clear();

    // Apply the orientation from the initial config
    const kb_config_t *cfg = config_store_get();
    display_apply_orientation(cfg->orientation);

    ESP_LOGI(TAG, "SSD1306 %dx%d screen initialized", FB_WIDTH, FB_HEIGHT);
    return ESP_OK;
}

void display_apply_orientation(kb_orientation_t orient)
{
    g_orientation = orient;

    if (!g_panel) return;

    // 0° and 90° : no hardware mirror (or handled by the software rotation)
    // 180° and 270° : horizontal+vertical mirror to complete the hardware rotation
    bool mirror_x = (orient == ORIENTATION_180 || orient == ORIENTATION_270);
    bool mirror_y = (orient == ORIENTATION_180 || orient == ORIENTATION_270);
    esp_lcd_panel_mirror(g_panel, mirror_x, mirror_y);
    ESP_LOGI(TAG, "Orientation %d° applied", orient * 90);
}

void display_show_boot_screen(void)
{
    fb_clear();
    // Approximate center : 72/2 - 9*6/2 = 36 - 27 = 9
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

// ── Studio Mode ──────────────────────────────────────────────
//
//  Studio Mode screen :
//    ╔══════════════════╗
//    ║  STUDIO MODE     ║   y= 2 (line 1)
//    ║──────────────────║   y= 9 (separator)
//    ║  SpinPad-Config  ║   y=13 (SSID)
//    ║  192.168.4.1     ║   y=25 (IP)
//    ╚══════════════════╝

static bool g_studio_mode_screen = false;    // True = screen locked on Studio Mode
static kb_orientation_t g_orientation = ORIENTATION_0;

void display_show_studio_mode(const char *ssid, const char *ip)
{
    g_studio_mode_screen = true;

    fb_clear();

    // Centered title
    int title_x = (FB_WIDTH - (int)(strlen("STUDIO MODE") * 6)) / 2;
    if (title_x < 0) title_x = 0;
    fb_draw_string(title_x, 1, "STUDIO MODE", false);

    // Horizontal separator
    for (int x = 0; x < FB_WIDTH; x++) {
        g_framebuffer[1][x] |= 0x01;   // Pixel at the very bottom of page 1 (y=8)
    }

    // SSID (truncated if too long for 72px)
    char ssid_buf[13];
    snprintf(ssid_buf, sizeof(ssid_buf), "%s", ssid);
    int ssid_x = (FB_WIDTH - (int)(strlen(ssid_buf) * 6)) / 2;
    if (ssid_x < 0) ssid_x = 0;
    fb_draw_string(ssid_x, 13, ssid_buf, false);

    // IP
    int ip_x = (FB_WIDTH - (int)(strlen(ip) * 6)) / 2;
    if (ip_x < 0) ip_x = 0;
    fb_draw_string(ip_x, 25, ip, false);

    fb_flush();
    ESP_LOGI(TAG, "Studio Mode screen displayed — %s / %s", ssid, ip);
}

void display_show_status(void)
{
    g_studio_mode_screen = false;
    // Force an update to the normal status screen
    display_update();
}

void display_set_clock(uint32_t unix_ts)
{
    kb_config_t *cfg = (kb_config_t *)config_store_get();  // cast const away for clock only
    cfg->display.clock_base_unix_ts  = unix_ts;
    cfg->display.clock_base_uptime_ms = (uint64_t)(esp_timer_get_time() / 1000);
    ESP_LOGI(TAG, "Clock synced : %lu", (unsigned long)unix_ts);
}
