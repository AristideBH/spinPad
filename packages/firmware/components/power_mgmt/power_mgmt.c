// ═══════════════════════════════════════════════════════════════
//  power_mgmt.c — Power management and automatic deep sleep
//
//  Deep sleep = ESP32 low-power mode (~10µA).
//  The CPU stops completely. Only the RTC logic stays active.
//
//  Wake: a pressed key (RTC GPIO) wakes the MCU.
//  After wake, the firmware restarts from app_main().
//
//  Inactivity timer:
//    - Each pressed key → resets the timer
//    - If no key for POWER_SLEEP_TIMEOUT_MS → deep sleep
//    - If no key for POWER_DISPLAY_TIMEOUT_MS → turn off screen
// ═══════════════════════════════════════════════════════════════

#include "power_mgmt.h"
#include "kb_config.h"
#include "config_store.h"
#include "display.h"
#include "battery.h"
#include "ble_hid.h"
#include "led_engine.h"

#include "esp_sleep.h"
#include "esp_timer.h"
#include "esp_log.h"
#include "driver/gpio.h"
#include "driver/rtc_io.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/timers.h"

static const char *TAG = "POWER";

// ─────────────────────────────────────────────────────────────
//  INTERNAL STATE
// ─────────────────────────────────────────────────────────────

static int64_t g_last_activity_ms = 0;   // Timestamp of the last activity
static bool    g_display_sleeping = false;  // Screen off?
static bool    g_led_dimmed       = false;  // LEDs reduced to 30% for power saving
static bool    g_ble_idle         = false;  // BLE in low-frequency mode

#define BLE_IDLE_INTERVAL_MS (60 * 1000)

// Dedicated FreeRTOS task for inactivity monitoring
static TaskHandle_t g_power_task_handle = NULL;

// ─────────────────────────────────────────────────────────────
//  GPIO WAKE CONFIGURATION
//
//  For deep sleep to wake on a key, we configure
//  one line of the matrix as the wake source.
//  Trick: configure COL0 as RTC GPIO → when a key
//  is pressed on any row, COL0 goes LOW.
//  But we must drive all rows LOW before sleeping.
// ─────────────────────────────────────────────────────────────
static void configure_wakeup_sources(void)
{
    // Drive all matrix rows LOW
    // (simulates a permanent scan during sleep)
    for (int r = 0; r < KB_MATRIX_ROWS; r++) {
        // Convert to RTC GPIO if possible (not all GPIOs are RTC)
        gpio_set_level(KB_ROW_PINS[r], 0);
    }

    // Configure COL0 as the wake source (LOW level = key pressed)
    // Note: only RTC GPIOs can serve as wake source
    // On ESP32-S3: GPIO0-21 are RTC GPIOs
    esp_sleep_enable_gpio_wakeup();
    gpio_wakeup_enable(KB_COL_PINS[0], GPIO_INTR_LOW_LEVEL);

    // Also wake via timer (every hour to check the battery)
    // esp_sleep_enable_timer_wakeup(3600ULL * 1000000);  // 1h in µs (uncomment if needed)
}

// ─────────────────────────────────────────────────────────────
//  SLEEP PROCEDURE
// ─────────────────────────────────────────────────────────────
static void enter_deep_sleep(void)
{
    ESP_LOGI(TAG, "Entering deep sleep...");

    // Save the config (in case there are unsaved changes)
    config_store_save();

    // Turn off the screen
    display_set_sleep(true);

    // Turn off the LED
    // (the battery handles this in battery_update, but here we force it off)

    // Configure the wake sources
    configure_wakeup_sources();

    // Enter deep sleep
    // The firmware will restart from app_main() on wake
    esp_deep_sleep_start();
    // ↑ This function never returns
}

// ─────────────────────────────────────────────────────────────
//  POWER MONITORING TASK
//  Runs in the background and checks for inactivity
// ─────────────────────────────────────────────────────────────
static void power_monitor_task(void *pvParameters)
{
    ESP_LOGI(TAG, "Power monitor task started");

    while (1) {
        int64_t now = esp_timer_get_time() / 1000;  // µs → ms
        int64_t idle_ms = now - g_last_activity_ms;

        const kb_config_t *cfg = config_store_get();
        uint32_t sleep_timeout_ms   = cfg->power.sleep_timeout_s * 1000;
        uint32_t display_timeout_ms = cfg->display.timeout_s * 1000;

        // ── Dim LEDs at 50% of the screen timeout ─────────────────
        uint32_t led_dim_ms = display_timeout_ms / 2;
        if (!g_led_dimmed && idle_ms >= led_dim_ms) {
            led_engine_set_brightness_global(77);  // ~30% of 255
            g_led_dimmed = true;
            ESP_LOGD(TAG, "LEDs reduced (idle %lld ms)", idle_ms);
        }

        // ── BLE idle (60s) ──────────────────────────────────
        if (!g_ble_idle && idle_ms >= BLE_IDLE_INTERVAL_MS) {
            ble_hid_set_idle_conn_interval(true);
            g_ble_idle = true;
            ESP_LOGD(TAG, "BLE interval widened (idle %lld ms)", idle_ms);
        }

        // ── Screen timeout ────────────────────────────────────
        if (!g_display_sleeping && idle_ms >= display_timeout_ms) {
            ESP_LOGD(TAG, "Screen timeout (%lld ms)", idle_ms);
            display_set_sleep(true);
            g_display_sleeping = true;
        }

        // ── Deep sleep timeout ───────────────────────────────
        if (idle_ms >= sleep_timeout_ms) {
            ESP_LOGI(TAG, "Inactivity timeout (%lld ms) → deep sleep", idle_ms);
            enter_deep_sleep();
            // Never returns here
        }

        // ── Battery update (every 30s) ────────────
        // Skip if battery absent (USB-only variant).
        static int64_t last_batt_update = 0;
        if (battery_is_present() && (now - last_batt_update) >= 30000) {
            battery_update();
            ble_hid_publish_battery(battery_get_percent());
            last_batt_update = now;
        }

        // Check every second
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

// ─────────────────────────────────────────────────────────────
//  PUBLIC FUNCTIONS
// ─────────────────────────────────────────────────────────────

esp_err_t power_mgmt_init(void)
{
    // Check the cause of the last wake (useful for debugging)
    esp_sleep_wakeup_cause_t cause = esp_sleep_get_wakeup_cause();
    switch (cause) {
    case ESP_SLEEP_WAKEUP_GPIO:
        ESP_LOGI(TAG, "Wake: key pressed");
        break;
    case ESP_SLEEP_WAKEUP_TIMER:
        ESP_LOGI(TAG, "Wake: timer");
        break;
    case ESP_SLEEP_WAKEUP_UNDEFINED:
        ESP_LOGI(TAG, "Initial startup (no deep sleep)");
        break;
    default:
        ESP_LOGI(TAG, "Wake: cause %d", cause);
        break;
    }

    // Initialize the activity timer
    g_last_activity_ms = esp_timer_get_time() / 1000;

    // Start the monitoring task
    // Priority 2 = low (behind the keyboard scan)
    xTaskCreate(
        power_monitor_task,
        "power_mon",
        2048,
        NULL,
        2,
        &g_power_task_handle
    );

    ESP_LOGI(TAG, "Power manager initialized (sleep: %lus, display: %us)",
             config_store_get()->power.sleep_timeout_s,
             config_store_get()->display.timeout_s);
    return ESP_OK;
}

void power_mgmt_reset_idle_timer(void)
{
    g_last_activity_ms = esp_timer_get_time() / 1000;

    // If the screen was off, turn it back on
    if (g_display_sleeping) {
        display_set_sleep(false);
        g_display_sleeping = false;
    }

    // If the LEDs were dimmed, restore them to the config brightness
    if (g_led_dimmed) {
        const kb_config_t *cfg = config_store_get();
        led_engine_set_brightness_global(cfg ? cfg->display.brightness : 200);
        g_led_dimmed = false;
    }

    // Restore the active BLE interval
    if (g_ble_idle) {
        ble_hid_set_idle_conn_interval(false);
        g_ble_idle = false;
    }
}
