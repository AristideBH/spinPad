idf_component_register(
    SRCS "usb_hid.c"
    INCLUDE_DIRS "include"
    REQUIRES esp_common freertos espressif__tinyusb config_store
)
