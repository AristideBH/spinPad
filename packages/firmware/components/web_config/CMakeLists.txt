idf_component_register(
    SRCS "web_config.c"
    INCLUDE_DIRS "include"
    REQUIRES
        esp_wifi
        esp_http_server
        esp_netif
        esp_event
        spiffs
        nvs_flash
        config_store
        display
        led_engine
        keymap
)
