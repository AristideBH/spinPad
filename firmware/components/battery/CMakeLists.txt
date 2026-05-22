idf_component_register(
    SRCS "battery.c"
    INCLUDE_DIRS "include"
    REQUIRES esp_common freertos driver esp_adc led_strip keymap config_store
)
