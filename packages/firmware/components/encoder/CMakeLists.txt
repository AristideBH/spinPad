idf_component_register(
    SRCS "encoder.c"
    INCLUDE_DIRS "include"
    REQUIRES esp_common freertos nvs_flash driver keymap usb_hid ble_hid
)
