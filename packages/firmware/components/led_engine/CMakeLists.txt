idf_component_register(
    SRCS "led_engine.c"
    INCLUDE_DIRS "include"
    REQUIRES
        led_strip
        config_store
        freertos
        esp_timer
)

# Lier libm pour sinf()
target_link_libraries(${COMPONENT_LIB} PUBLIC m)
