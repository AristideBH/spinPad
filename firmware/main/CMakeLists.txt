idf_component_register(
    SRCS "main.c"
    INCLUDE_DIRS "."
    REQUIRES
        keymap
        config_store
        usb_hid
        ble_hid
        encoder
        display
        battery
        power_mgmt
)

idf_component_get_property(tusb_lib espressif__tinyusb COMPONENT_LIB)
target_include_directories(${tusb_lib} PUBLIC "${COMPONENT_DIR}/tusb")