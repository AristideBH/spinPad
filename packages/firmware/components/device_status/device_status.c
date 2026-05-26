// ═══════════════════════════════════════════════════════════════
//  device_status.c — Construction du payload device_status
// ═══════════════════════════════════════════════════════════════

#include "device_status.h"
#include "battery.h"
#include "ble_hid.h"
#include "usb_hid.h"
#include "web_config.h"
#include "fw_version.h"

#include "esp_timer.h"
#include "esp_log.h"

#include <string.h>
#include <stdlib.h>

static const char *TAG = "DEV_STATUS";

cJSON *device_status_build(void)
{
    cJSON *root = cJSON_CreateObject();
    if (!root) return NULL;

    // ── fw ──────────────────────────────────────────────────
    cJSON *fw = cJSON_AddObjectToObject(root, "fw");
    cJSON_AddStringToObject(fw, "version", KB_FW_VERSION);
    cJSON_AddStringToObject(fw, "build",   KB_FW_BUILD);
    cJSON_AddBoolToObject  (fw, "dirty",   KB_FW_BUILD_DIRTY ? true : false);

    // ── uptime ──────────────────────────────────────────────
    int64_t uptime_us = esp_timer_get_time();
    cJSON_AddNumberToObject(root, "uptime_s", (double)(uptime_us / 1000000));

    // ── connection ──────────────────────────────────────────
    cJSON *conn = cJSON_AddObjectToObject(root, "connection");
    cJSON_AddBoolToObject  (conn, "usb",          usb_hid_is_mounted());
    cJSON_AddBoolToObject  (conn, "ble",          ble_hid_is_connected());
    cJSON_AddNumberToObject(conn, "ble_slot",     ble_hid_get_active_slot());
    cJSON_AddBoolToObject  (conn, "studio_mode",  web_config_is_running());

    // ── battery (union discriminée sur "present") ───────────
    cJSON *batt = cJSON_AddObjectToObject(root, "battery");
    bool present = battery_is_present();
    cJSON_AddBoolToObject(batt, "present", present);
    if (present) {
        cJSON_AddNumberToObject(batt, "percent",    battery_get_percent());
        cJSON_AddNumberToObject(batt, "voltage_mv", battery_get_voltage_mv());
        cJSON_AddStringToObject(batt, "source",     battery_source_str());
    }

    return root;
}

esp_err_t device_status_to_json(char *buf, size_t buf_size,
                                size_t *written, bool line_terminated)
{
    if (!buf || buf_size < 2) return ESP_ERR_INVALID_ARG;

    cJSON *root = device_status_build();
    if (!root) return ESP_ERR_NO_MEM;

    char *json_str = cJSON_PrintUnformatted(root);
    cJSON_Delete(root);
    if (!json_str) return ESP_ERR_NO_MEM;

    size_t len = strlen(json_str);
    size_t need = len + (line_terminated ? 1 : 0) + 1;
    if (need > buf_size) {
        ESP_LOGW(TAG, "buffer trop petit (%u < %u)", (unsigned)buf_size, (unsigned)need);
        free(json_str);
        return ESP_ERR_NO_MEM;
    }

    memcpy(buf, json_str, len);
    if (line_terminated) buf[len++] = '\n';
    buf[len] = '\0';
    if (written) *written = len;

    free(json_str);
    return ESP_OK;
}
