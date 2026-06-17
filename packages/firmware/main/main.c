// ═══════════════════════════════════════════════════════════════
//  main.c — Firmware entry point
//
//  Role: initialize all components in the right order,
//  then start the main keyboard scan task.
//
//  Important init order:
//    1. NVS (flash storage) — first, everyone needs it
//    2. Config — loads the JSON from NVS
//    3. Keymap — initializes with the loaded config
//    4. USB HID / BLE HID — interfaces with the OS
//    5. Encoder, Display, Battery — peripherals
//    6. Power manager — last (handles wake from sleep)
// ═══════════════════════════════════════════════════════════════

#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "nvs_flash.h"          // Key-value storage in flash
#include "esp_log.h"            // ESP-IDF logging system
#include "esp_task_wdt.h"       // Task watchdog
#include "esp_heap_caps.h"      // Heap monitoring

// Our components
#include "kb_config.h"
#include "config_store.h"
#include "keymap.h"
#include "usb_hid.h"
#include "ble_hid.h"
#include "encoder.h"
#include "display.h"
#include "battery.h"
#include "led_engine.h"
#include "power_mgmt.h"
#include "web_config.h"

// Tag for logs — appears in the console as "[MAIN] message"
static const char *TAG = "MAIN";

// ─────────────────────────────────────────────────────────────
//  Main task: scan the key matrix
//
//  A FreeRTOS "task" = a thread that runs in a loop.
//  vTaskDelay(pdMS_TO_TICKS(5)) = wait 5ms between each scan.
// ─────────────────────────────────────────────────────────────
#define HEAP_WARN_THRESHOLD 8192   // Log warning if free heap < 8 KB
#define HEAP_CHECK_EVERY_N  200    // Check the heap every N iterations (~1s)

static void keyboard_scan_task(void *pvParameters)
{
    ESP_LOGI(TAG, "Keyboard scan task started");
    esp_task_wdt_add(NULL);   // Register this task with the TWDT

    uint32_t heap_check_counter = 0;

    while (1) {
        esp_task_wdt_reset();  // Feed the watchdog — must happen < 10s

        // 1. Scan the physical matrix → detect pressed keys
        keymap_scan_matrix();

        // 2. Process events (combos, tap-hold, layers)
        keymap_process_events();

        // 3. Send HID reports if needed
        //    (keymap calls usb_hid_send() or ble_hid_send() depending on mode)

        // 4. Notify the power manager that there was activity
        //    (resets the inactivity timer)
        if (keymap_has_activity()) {
            power_mgmt_reset_idle_timer();
        }

        // 5. Tick LED engine (updates animated effects + refreshes WS2812)
        led_engine_tick();

        // 6. Heap monitoring (periodic, not every tick)
        if (++heap_check_counter >= HEAP_CHECK_EVERY_N) {
            heap_check_counter = 0;
            size_t free_heap = esp_get_free_heap_size();
            if (free_heap < HEAP_WARN_THRESHOLD) {
                ESP_LOGW(TAG, "Low heap: %u bytes free", (unsigned)free_heap);
            }
        }

        // Pause of 5ms before the next scan
        // pdMS_TO_TICKS converts milliseconds into FreeRTOS "ticks"
        vTaskDelay(pdMS_TO_TICKS(KB_SCAN_INTERVAL_MS));
    }
}

// ─────────────────────────────────────────────────────────────
//  app_main() — equivalent of standard C "main()" for ESP-IDF
//  Called automatically at startup by the framework.
// ─────────────────────────────────────────────────────────────
void app_main(void)
{
    ESP_LOGI(TAG, "=== SpinPad startup ===");

    // ── 0. Network pre-init (required before keymap for web_config) ─
    // esp_netif and the event loop must be created only once.
    ESP_ERROR_CHECK(web_config_init());

    // ── 1. NVS (Non-Volatile Storage) ────────────────────────
    // NVS = flash space to store persistent data
    // (config, BLE bonds, profile state...)
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        // NVS corrupted or old version → erase and reinitialize
        ESP_LOGW(TAG, "NVS corrupted, erasing...");
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);
    ESP_LOGI(TAG, "NVS OK");

    // ── 2. Config store ──────────────────────────────────────
    // Loads the config JSON from NVS.
    // If no config exists, loads the default values.
    ESP_ERROR_CHECK(config_store_init());
    ESP_LOGI(TAG, "Config loaded");

    // ── 3. Keymap engine ─────────────────────────────────────
    // Initializes the GPIO matrix, the layers, and the combo engine.
    ESP_ERROR_CHECK(keymap_init());
    ESP_LOGI(TAG, "Keymap initialized");

    // ── 4a. USB HID ──────────────────────────────────────────
    // Starts TinyUSB and registers the keyboard HID descriptors.
    ESP_ERROR_CHECK(usb_hid_init());
    ESP_LOGI(TAG, "USB HID ready");

    // ── 4b. Battery + RGB LED ──────────────────────────────
    // Must be init BEFORE ble_hid so the BAS service knows
    // whether it should be advertised (presence detected via ADC).
    ESP_ERROR_CHECK(battery_init());
    ESP_LOGI(TAG, "Battery initialized");

    // ── 4c. BLE HID ──────────────────────────────────────────
    // Starts NimBLE, loads the bonds from NVS,
    // and tries to reconnect to the last used device.
    ESP_ERROR_CHECK(ble_hid_init());
    ESP_LOGI(TAG, "BLE HID ready");

    // ── 5a. Encoder ─────────────────────────────────────────
    ESP_ERROR_CHECK(encoder_init());
    ESP_LOGI(TAG, "Encoder ready");

    // ── 5b. SSD1315 screen ────────────────────────────────────
    ESP_ERROR_CHECK(display_init());
    display_show_boot_screen();   // Shows the splash screen at startup
    ESP_LOGI(TAG, "Screen ready");

    // ── 5d. LED Engine (WS2812 key chain) ───────────────
    // Initialize after battery_init to avoid an RMT conflict at startup.
    ESP_ERROR_CHECK(led_engine_init());
    ESP_LOGI(TAG, "LED Engine ready");

    // ── 6. Power manager ─────────────────────────────────────
    // Must be initialized last to know
    // the wake reason (key? timer?) and act accordingly.
    ESP_ERROR_CHECK(power_mgmt_init());
    ESP_LOGI(TAG, "Power manager ready");

    // ── Launch the scan task ────────────────────────
    // xTaskCreate(function, name, stack_size, params, priority, handle)
    // A 4096-byte stack is enough for the scan.
    // Priority 5 = higher than background tasks (1-2).
    xTaskCreate(
        keyboard_scan_task,   // Function to execute
        "kb_scan",            // Name (for debugging)
        4096,                 // Stack size in bytes
        NULL,                 // Parameters (none here)
        5,                    // Priority (1=low, 25=max)
        NULL                  // Task handle (we don't need one)
    );

    ESP_LOGI(TAG, "=== Startup finished ===");
    // app_main() can end here — the tasks keep running
}
