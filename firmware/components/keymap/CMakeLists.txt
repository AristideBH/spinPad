idf_component_register(
    SRCS "keymap.c"
    INCLUDE_DIRS "include"
    REQUIRES esp_common freertos nvs_flash driver
)
