idf_component_register(
    SRCS "display.c"
    INCLUDE_DIRS "include"
    REQUIRES esp_common freertos driver esp_lcd esp_timer keymap battery ble_hid config_store
)
