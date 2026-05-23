# SpinPad Firmware

ESP-IDF firmware for the SpinPad 10-key macropad + rotary encoder on ESP32-S3.

## Requirements

- [ESP-IDF v5.x](https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/get-started/index.html)
- Python 3.8+ (included with ESP-IDF)

## Build & Flash

```bash
# From this directory
idf.py build
idf.py -p /dev/ttyUSB0 flash monitor
```

### Build SPIFFS image (Studio embedded)

Run from the repo root after building the studio:

```bash
# Build Studio in embedded mode (HTTP transport)
pnpm --filter @spinpad/studio build:embedded

# Generate SPIFFS image (960 KB)
python $IDF_PATH/components/spiffs/spiffsgen.py 983040 \
    packages/studio/build-embedded \
    packages/firmware/spiffs_image.bin

# Flash SPIFFS
esptool.py write_flash 0x310000 packages/firmware/spiffs_image.bin
```

## Partition Table

Custom table at `partitions.csv`:

| Name      | Type | Size    | Offset     |
|-----------|------|---------|------------|
| nvs       | data | 24 KB   | 0x9000     |
| phy_init  | data | 4 KB    | 0xF000     |
| factory   | app  | 3 MB    | 0x10000    |
| spiffs    | data | 960 KB  | 0x310000   |

## Components

| Component      | Description |
|---------------|-------------|
| `battery`      | Battery ADC + status LED (WS2812 GPIO48) |
| `ble_hid`      | BLE HID (keyboard + consumer) |
| `config_store` | NVS config persistence + cJSON serialisation |
| `display`      | SSD1306/SSD1315 OLED via I2C (72×40 px) |
| `encoder`      | Quadrature rotary encoder decode + FreeRTOS queue |
| `keymap`       | Matrix scan, layers, combos, HID dispatch |
| `led_engine`   | WS2812 LED chain (10 keys + N extension) |
| `usb_hid`      | USB HID (keyboard + consumer) |
| `web_config`   | WiFi AP + HTTP server + SPIFFS (Studio Mode) |

## Studio Mode

Hold **SW8 + SW9** for 3 seconds → WiFi AP `SpinPad-Config` starts.  
Connect to the network and open `192.168.4.1` in a browser.  
Hold **SW8 + SW9** again for 3 seconds to exit.

Auto-exit after 5 minutes of HTTP inactivity.

## Code generation

Action type constants are generated from `packages/shared`:

```bash
pnpm --filter @spinpad/shared codegen
# → components/keymap/include/action_types.gen.h
```

The generated `.gen.h` file is committed so the firmware can build without Node.js.

## Hardware

Pin assignments and board-specific config: `packages/firmware/main/kb_config.h`  
PCB files and BOM: `hardware/boards/spinpad-v1/`
