// ═══════════════════════════════════════════════════════════════
//  usb_hid.c — USB HID + CDC via managed TinyUSB (espressif__tinyusb)
//
//  Composite device:
//    - Interface 0+1 : CDC Serial (WebSerial config JSON channel)
//    - Interface 2   : HID (keyboard + consumer control reports)
//
//  Note: tinyusb.h / tusb_cdc_acm.h were IDF-bundled wrappers removed
//  in IDF v5.x. This file uses the raw TinyUSB API directly.
// ═══════════════════════════════════════════════════════════════

#include "usb_hid.h"
#include "config_store.h"
#include "keymap.h"
#include "device_status.h"

#include "tusb.h"
#include "esp_log.h"
#include "esp_private/usb_phy.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <string.h>
#include <stdlib.h>

static const char *TAG = "USB_HID";

// ─────────────────────────────────────────────────────────────
//  HID REPORT DESCRIPTOR
// ─────────────────────────────────────────────────────────────

#define REPORT_ID_KEYBOARD  1
#define REPORT_ID_CONSUMER  2

static const uint8_t hid_report_descriptor[] = {
    TUD_HID_REPORT_DESC_KEYBOARD(HID_REPORT_ID(REPORT_ID_KEYBOARD)),
    TUD_HID_REPORT_DESC_CONSUMER(HID_REPORT_ID(REPORT_ID_CONSUMER)),
};

// ─────────────────────────────────────────────────────────────
//  USB DESCRIPTORS
// ─────────────────────────────────────────────────────────────

// Device descriptor
static const tusb_desc_device_t device_descriptor = {
    .bLength            = sizeof(tusb_desc_device_t),
    .bDescriptorType    = TUSB_DESC_DEVICE,
    .bcdUSB             = 0x0200,
    .bDeviceClass       = TUSB_CLASS_MISC,
    .bDeviceSubClass    = MISC_SUBCLASS_COMMON,
    .bDeviceProtocol    = MISC_PROTOCOL_IAD,
    .bMaxPacketSize0    = CFG_TUD_ENDPOINT0_SIZE,
    .idVendor           = 0x303A,
    .idProduct          = 0x4002,
    .bcdDevice          = 0x0100,
    .iManufacturer      = 0x01,
    .iProduct           = 0x02,
    .iSerialNumber      = 0x03,
    .bNumConfigurations = 0x01,
};

// Endpoint addresses
#define EPNUM_CDC_NOTIF   0x81
#define EPNUM_CDC_OUT     0x02
#define EPNUM_CDC_IN      0x82
#define EPNUM_HID         0x83

#define CONFIG_TOTAL_LEN  (TUD_CONFIG_DESC_LEN + TUD_CDC_DESC_LEN + TUD_HID_DESC_LEN)

static const uint8_t config_descriptor[] = {
    TUD_CONFIG_DESCRIPTOR(1, 3, 0, CONFIG_TOTAL_LEN, 0x00, 100),
    TUD_CDC_DESCRIPTOR(0, 4, EPNUM_CDC_NOTIF, 8, EPNUM_CDC_OUT, EPNUM_CDC_IN, 64),
    TUD_HID_DESCRIPTOR(2, 0, HID_ITF_PROTOCOL_NONE,
                       sizeof(hid_report_descriptor), EPNUM_HID,
                       CFG_TUD_HID_BUFSIZE, 5),
};

// String descriptors
enum { STRID_LANGID = 0, STRID_MANUFACTURER, STRID_PRODUCT, STRID_SERIAL, STRID_CDC };

static const char *string_desc_arr[] = {
    (const char[]){0x09, 0x04},  // 0: Language (English)
    "SpinPad",                    // 1: Manufacturer
    "SpinPad Keyboard",           // 2: Product
    "SP000001",                   // 3: Serial
    "SpinPad Config",             // 4: CDC interface name
};

// ─────────────────────────────────────────────────────────────
//  INTERNAL STATE
// ─────────────────────────────────────────────────────────────

static bool              g_mounted    = false;
static uint8_t           g_keyboard_report[8] = {0};
static uint8_t           g_cdc_rx_buf[CONFIG_JSON_MAX_SIZE];
static size_t            g_cdc_rx_len = 0;
static usb_phy_handle_t  g_phy        = NULL;

// ─────────────────────────────────────────────────────────────
//  USB DEVICE TASK
// ─────────────────────────────────────────────────────────────

static void usb_device_task(void *param)
{
    (void)param;
    while (1) {
        tud_task();
        vTaskDelay(pdMS_TO_TICKS(1));
    }
}

// ─────────────────────────────────────────────────────────────
//  PUBLIC API
// ─────────────────────────────────────────────────────────────

esp_err_t usb_hid_init(void)
{
    usb_phy_config_t phy_cfg = {
        .controller = USB_PHY_CTRL_OTG,
        .target     = USB_PHY_TARGET_INT,
        .otg_mode   = USB_OTG_MODE_DEVICE,
        .otg_speed  = USB_PHY_SPEED_FULL,
    };
    ESP_ERROR_CHECK(usb_new_phy(&phy_cfg, &g_phy));

    if (!tud_init(0)) {
        ESP_LOGE(TAG, "tud_init failed");
        return ESP_FAIL;
    }

    xTaskCreate(usb_device_task, "usb_task", 4096, NULL, 5, NULL);

    ESP_LOGI(TAG, "USB HID + CDC initialisés");
    return ESP_OK;
}

void usb_hid_key_press(uint8_t keycode, uint8_t modifier)
{
    if (!g_mounted) return;

    g_keyboard_report[0] = modifier;
    for (int i = 2; i < 8; i++) {
        if (g_keyboard_report[i] == 0) {
            g_keyboard_report[i] = keycode;
            break;
        }
    }
    tud_hid_n_report(0, REPORT_ID_KEYBOARD, g_keyboard_report, sizeof(g_keyboard_report));
}

void usb_hid_key_release(uint8_t keycode)
{
    if (!g_mounted) return;

    for (int i = 2; i < 8; i++) {
        if (g_keyboard_report[i] == keycode) {
            g_keyboard_report[i] = 0;
            break;
        }
    }
    tud_hid_n_report(0, REPORT_ID_KEYBOARD, g_keyboard_report, sizeof(g_keyboard_report));
}

void usb_hid_consumer_press(uint16_t usage)
{
    if (!g_mounted) return;
    uint8_t report[2] = { (uint8_t)(usage & 0xFF), (uint8_t)(usage >> 8) };
    tud_hid_n_report(0, REPORT_ID_CONSUMER, report, sizeof(report));
}

void usb_hid_consumer_release(void)
{
    if (!g_mounted) return;
    uint8_t report[2] = {0, 0};
    tud_hid_n_report(0, REPORT_ID_CONSUMER, report, sizeof(report));
}

void usb_hid_process_config_packet(const uint8_t *data, size_t len)
{
    const char *str = (const char *)data;

    if (strstr(str, "\"get_config\"")) {
        char *buf = malloc(CONFIG_JSON_MAX_SIZE);
        if (buf) {
            config_store_to_json(buf, CONFIG_JSON_MAX_SIZE);
            tud_cdc_n_write(0, buf, strlen(buf));
            tud_cdc_n_write_flush(0);
            free(buf);
        }
    } else if (strstr(str, "\"set_config\"")) {
        const char *payload = strstr(str, "\"payload\":");
        if (payload) {
            payload += 10;
            config_store_update_from_json(payload);
            keymap_reload_from_config();
            const char *ok = "{\"status\":\"ok\"}\n";
            tud_cdc_n_write(0, ok, strlen(ok));
            tud_cdc_n_write_flush(0);
        }
    } else if (strstr(str, "\"factory_reset\"")) {
        config_store_factory_reset();
        keymap_reload_from_config();
        const char *ok = "{\"status\":\"ok\",\"msg\":\"factory_reset\"}\n";
        tud_cdc_n_write(0, ok, strlen(ok));
        tud_cdc_n_write_flush(0);
    } else if (strstr(str, "\"device_status\"")) {
        // Buffer dédié — 512 octets suffisent largement pour le payload actuel.
        char buf[512];
        size_t n = 0;
        if (device_status_to_json(buf, sizeof(buf), &n, true) == ESP_OK) {
            tud_cdc_n_write(0, buf, n);
            tud_cdc_n_write_flush(0);
        }
    }
}

bool usb_hid_is_mounted(void) { return g_mounted; }

// ─────────────────────────────────────────────────────────────
//  TINYUSB DESCRIPTOR CALLBACKS
// ─────────────────────────────────────────────────────────────

uint8_t const *tud_descriptor_device_cb(void)
{
    return (uint8_t const *)&device_descriptor;
}

uint8_t const *tud_descriptor_configuration_cb(uint8_t index)
{
    (void)index;
    return config_descriptor;
}

uint16_t const *tud_descriptor_string_cb(uint8_t index, uint16_t langid)
{
    (void)langid;
    static uint16_t desc_str[32];
    uint8_t chr_count;

    if (index == 0) {
        memcpy(&desc_str[1], string_desc_arr[0], 2);
        chr_count = 1;
    } else if (index >= sizeof(string_desc_arr) / sizeof(string_desc_arr[0])) {
        return NULL;
    } else {
        const char *str = string_desc_arr[index];
        chr_count = (uint8_t)strlen(str);
        if (chr_count > 31) chr_count = 31;
        for (uint8_t i = 0; i < chr_count; i++) {
            desc_str[1 + i] = str[i];
        }
    }

    desc_str[0] = (uint16_t)((TUSB_DESC_STRING << 8) | (2 * chr_count + 2));
    return desc_str;
}

uint8_t const *tud_hid_descriptor_report_cb(uint8_t instance)
{
    (void)instance;
    return hid_report_descriptor;
}

// ─────────────────────────────────────────────────────────────
//  TINYUSB EVENT CALLBACKS
// ─────────────────────────────────────────────────────────────

void tud_mount_cb(void)
{
    g_mounted = true;
    ESP_LOGI(TAG, "USB monté");
}

void tud_umount_cb(void)
{
    g_mounted = false;
    ESP_LOGI(TAG, "USB démonté");
}

// Called by TinyUSB when CDC data arrives
void tud_cdc_rx_cb(uint8_t itf)
{
    uint32_t count = tud_cdc_n_read(itf,
                                    g_cdc_rx_buf + g_cdc_rx_len,
                                    sizeof(g_cdc_rx_buf) - g_cdc_rx_len - 1);
    g_cdc_rx_len += count;

    if (g_cdc_rx_len > 0 && g_cdc_rx_buf[g_cdc_rx_len - 1] == '\n') {
        g_cdc_rx_buf[g_cdc_rx_len] = '\0';
        usb_hid_process_config_packet(g_cdc_rx_buf, g_cdc_rx_len);
        g_cdc_rx_len = 0;
    }
}

uint16_t tud_hid_get_report_cb(uint8_t instance, uint8_t report_id,
                                hid_report_type_t report_type,
                                uint8_t *buffer, uint16_t reqlen)
{
    (void)instance; (void)report_id; (void)report_type; (void)buffer; (void)reqlen;
    return 0;
}

void tud_hid_set_report_cb(uint8_t instance, uint8_t report_id,
                            hid_report_type_t report_type,
                            const uint8_t *buffer, uint16_t bufsize)
{
    (void)instance; (void)report_id; (void)report_type; (void)buffer; (void)bufsize;
}
