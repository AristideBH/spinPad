idf_component_register(
    SRCS "config_store.c"
    INCLUDE_DIRS "include"
    REQUIRES esp_common freertos nvs_flash driver espressif__cjson
)
target_include_directories(${COMPONENT_LIB} PRIVATE
    "${CMAKE_CURRENT_LIST_DIR}/../keymap/include"
)