idf_component_register(
    SRCS "power_mgmt.c"
    INCLUDE_DIRS "include"
    REQUIRES esp_common freertos driver esp_hw_support keymap config_store display battery
)
