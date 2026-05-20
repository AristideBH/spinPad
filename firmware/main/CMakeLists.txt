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
