idf_component_register(
    SRCS "device_status.c"
    INCLUDE_DIRS "include"
    REQUIRES esp_common esp_timer json battery ble_hid usb_hid web_config config_store
)
# Le header généré par CMake (fw_version.h) est dans build/generated/
target_include_directories(${COMPONENT_LIB} PRIVATE
    "${CMAKE_BINARY_DIR}/generated"
)
