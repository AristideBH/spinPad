# SpinPad ↔ Hyperion NG Bridge

Forwards LED colors from [Hyperion NG](https://docs.hyperion-project.org/) to
the SpinPad via serial, extending your ambilight setup onto the macropad.

```
Screen → HDMI capture → Hyperion NG → TCP JSON → bridge.mjs → Serial → SpinPad LEDs
```

## Requirements

- Node.js ≥ 18
- Hyperion NG running with JSON server enabled (port 19444)
- SpinPad connected via USB

## Install

```bash
cd tools/hyperion-bridge
npm install
```

## Usage

```bash
# List available serial ports
node bridge.mjs --list

# Connect (Linux/macOS)
node bridge.mjs --port /dev/ttyACM0

# Connect (Windows)
node bridge.mjs --port COM3

# Connect to Hyperion on another machine
node bridge.mjs --port /dev/ttyACM0 --hyperion 192.168.1.42

# Demo mode (rainbow without a real device)
node bridge.mjs --demo
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--port <path>` | — | Serial port of the SpinPad (required) |
| `--hyperion <host>` | `127.0.0.1` | Hyperion NG host |
| `--hport <port>` | `19444` | Hyperion NG JSON server port |
| `--leds <n>` | `10` | Number of SpinPad LEDs to drive |
| `--priority <n>` | `150` | Hyperion source priority |
| `--demo` | — | Rainbow demo (no connections needed) |
| `--list` | — | List available serial ports and exit |

## Hyperion configuration

In Hyperion NG, add a new LED device segment that covers the SpinPad position
(e.g. the N LEDs mapped to the bottom edge below your screen).

The bridge reads the first `--leds` LED entries from the Hyperion update and
sends them to the SpinPad as RGB triplets.

## Serial protocol

The bridge sends newline-terminated JSON commands to the SpinPad firmware:

```json
{"cmd":"ext","rgb":[R0,G0,B0,R1,G1,B1,...]}
```

The firmware handles this in `web_config.c` (serial command handler) and calls
`led_engine_set_extension_frame()` with the received data.
