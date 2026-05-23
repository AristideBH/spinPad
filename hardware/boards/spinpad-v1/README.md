# SpinPad v1 — Hardware

PCB design and board-specific configuration for the SpinPad v1.

## Pinmap

| Signal          | GPIO  | Notes |
|-----------------|-------|-------|
| Matrix rows     | 10, 11, 12, 13 | Outputs (driven low to scan) |
| Matrix cols     | 14, 15, 16     | Inputs with pull-up |
| Encoder A       | 1     | Pull-up, interrupt on any edge |
| Encoder B       | 2     | Pull-up, interrupt on any edge |
| Encoder button  | 4     | Pull-up, active low |
| Key LEDs (WS2812) | 3   | RMT output, 10 LEDs + N extension |
| Status LED (WS2812) | 48 | RMT output, 1 LED (battery) |
| OLED SCL        | 5     | I2C clock |
| OLED SDA        | 6     | I2C data |
| OLED RST        | 7     | Active low reset |
| Battery ADC     | 17    | Voltage divider (÷2), 12-bit |
| USB D-          | 19    | Native USB (no UART-USB bridge needed) |
| USB D+          | 20    | Native USB |
| Charge detect   | 21    | HIGH when USB VBUS present |

> All GPIO assignments are defined in `kb_config.h`.

## Matrix layout

3 columns × 4 rows = 12 positions, 10 populated (SW1–SW10):

```
Row 0: SW8  SW1  SW1   (SW1 spans cols 1+2)
Row 1: SW9  SW7  SW2
Row 2: SW10 SW6  SW3   (SW10 spans rows 2+3)
Row 3: SW10 SW5  SW4
```

Logical indices in firmware:
```
SW1=0  SW2=2  SW3=5  SW4=8
SW5=9  SW6=6  SW7=3  SW8=1
SW9=4  SW10=7
```

Special switches (not in main matrix):
- **SW11**: encoder push button (GPIO4)
- **SW16 / SW17**: side buttons (GPIO used for BLE pairing combo)

## LED extension connector

The WS2812 chain (GPIO3) runs: `ESP32 → 10 key LEDs → EXT connector`.  
Connect additional WS2812 LEDs (up to 50) to the EXT connector to extend the chain.  
Configure in Studio → Écran & Power → Extension LED.

## OLED

- **Controller**: SSD1306 or SSD1315 (compatible)
- **Resolution**: 128×64 physical, 72×40 active area (centred)
- **Interface**: I2C at 400kHz, address 0x3C

## Bill of Materials

See `BOM.csv` (to be added).

## PCB files

KiCad project files (to be added).

## RF Compliance note

WiFi TX must stay at ≤ 10 dBm when VSYS > 4.5 V (USB powered) to respect duty-cycle limits.  
This is enforced in firmware via `sdkconfig`: `CONFIG_ESP_PHY_MAX_WIFI_TX_POWER=10`.
