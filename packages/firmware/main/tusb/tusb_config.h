#pragma once

#ifdef __cplusplus
extern "C" {
#endif

// System Settings
#define ESP_PLATFORM            1
#define CFG_TUSB_OS             OPT_OS_FREERTOS
#define CFG_TUSB_OS_INC_PATH    freertos/

// Device Mode Configuration
#define CFG_TUD_ENABLED         1
#define CFG_TUSB_RHPORT0_MODE   (OPT_MODE_DEVICE | OPT_MODE_FULL_SPEED)

// HID Configuration
#define CFG_TUD_HID             1
#define CFG_TUD_HID_BUFSIZE     64

// CDC Serial (WebSerial config channel)
#define CFG_TUD_CDC             1
#define CFG_TUD_CDC_RX_BUFSIZE  512
#define CFG_TUD_CDC_TX_BUFSIZE  512

#ifdef __cplusplus
}
#endif