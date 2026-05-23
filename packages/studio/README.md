# SpinPad Studio

SvelteKit configuration app for the SpinPad macropad.

## Development

```bash
pnpm install   # from repo root
pnpm --filter @spinpad/studio dev
```

Opens at `http://localhost:5173`. Uses the **WebSerial transport** by default
(Chrome/Edge required for serial access).

## Build

### Web build (WebSerial transport)

```bash
pnpm --filter @spinpad/studio build
```

Output: `packages/studio/build/`

### Embedded build (HTTP transport — for SPIFFS)

```bash
pnpm --filter @spinpad/studio build:embedded
```

Output: `packages/studio/build-embedded/`  
Uses `VITE_TRANSPORT=http` → all device communication goes through `/api/*`.

## Transports

| Build flag            | Transport | Use case |
|-----------------------|-----------|----------|
| `VITE_TRANSPORT` unset | WebSerial | Browser standalone (USB) |
| `VITE_TRANSPORT=http`  | HTTP fetch | Embedded in SPIFFS, served by the device |

Transport selection happens at build time in `src/lib/store/config.svelte.js`.

## Key features

- **Auto-save**: config syncs to device 800ms after the last change (debounced)
- **Undo/Redo**: full history via `runed` `StateHistory` — Ctrl+Z / Ctrl+Y
- **Import/Export**: `.spinpad` file format (JSON wrapper with version metadata)
- **Encoder presets**: one-click CW+CCW pairs (Volume, Scroll, Zoom…)
- **LED extension**: configure extension chain mode, color, brightness
- **Orientation**: visual rotation of the keymap editor to match physical orientation
- **Studio Mode**: shown when device serves the app over WiFi AP

## Project structure

```
src/
├── lib/
│   ├── components/        Shadcn-svelte UI components + app-specific
│   ├── keycodes/          Re-exports from @spinpad/shared
│   ├── serial/            WebSerial transport
│   ├── transport/         HTTP transport (http.js)
│   └── store/
│       ├── config.svelte.js   Main config store (auto-save, undo/redo, I/O)
│       └── devMode.svelte.js  Dev mode toggle (disables device sync)
└── routes/
    ├── editor/
    │   ├── keymap/        Keymap editor (key pickers, encoder, rotation)
    │   ├── display/       Screen, orientation, encoder sensitivity, LED extension
    │   ├── ble/           BLE device name
    │   └── profiles/      Profile management
    └── docs/              Built-in documentation
```

## Dependencies

- [SvelteKit](https://kit.svelte.dev) + [adapter-static](https://github.com/sveltejs/kit/tree/main/packages/adapter-static)
- [shadcn-svelte](https://shadcn-svelte.com) (UI components)
- [runed](https://runed.dev) (`StateHistory`, `useDebounce`)
- [@spinpad/shared](../shared) (keycodes, action types, config schema)
