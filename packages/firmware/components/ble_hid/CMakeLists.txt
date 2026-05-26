idf_component_register(
    SRCS "ble_hid.c"
    INCLUDE_DIRS "include"
    REQUIRES esp_common freertos nvs_flash bt config_store battery
)
target_include_directories(${COMPONENT_LIB} PRIVATE
    "${CMAKE_CURRENT_LIST_DIR}/../keymap/include"
)
