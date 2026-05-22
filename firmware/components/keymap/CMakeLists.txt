idf_component_register(
    SRCS "keymap.c"
    INCLUDE_DIRS "include"
    REQUIRES esp_common freertos nvs_flash driver config_store usb_hid ble_hid
)
