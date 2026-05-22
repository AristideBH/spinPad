idf_component_register(
    SRCS "ble_hid.c"
    INCLUDE_DIRS "include"
    REQUIRES esp_common freertos nvs_flash bt keymap
)
