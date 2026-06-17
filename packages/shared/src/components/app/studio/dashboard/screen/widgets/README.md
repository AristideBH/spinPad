# OLED widgets — registry

Each widget of the OLED screen is described by **one file** in this folder that
exports a [`WidgetDef`](./types.ts). The registry [`index.ts`](./index.ts)
assembles all the definitions; the editor (`../ScreenEditor.svelte`) and the add
menu (`../ScreenAddMenu.svelte`) only read the registry — no `switch`
by type in the UI.

## Anatomy of a `WidgetDef`

```ts
export const monwidget: WidgetDef = {
  label: 'My widget',
  icon: SomeLucideIcon,
  size: { minW: 2, maxW: 4, minH: 1, maxH: 2 }, // the selector generates w∈[minW,maxW] × h∈[minH,maxH]
  singleton: true,                               // false → duplicates allowed
  options: [                                     // optional; rendered by bits/OptionControls
    { key: 'mon_flag', kind: 'bool', label: 'Enable', default: false },
    { key: 'mon_txt',  kind: 'text', label: 'Text', default: '', max: 12,
      disabled: (w) => w.h < 2 },                // greys out based on the current state
  ],
  preview: (w, now) => '…',                       // live text shown in the card
};
```

- `size` is a **min/max constraint** (not a list); every combination of the
  rectangle is allowed. `default` (optional) sets the size on add, otherwise
  `{ minW, minH }`. All widgets are at least `WIDGET_MIN_W` wide.
- `preview` reads the stores (`configState`, `deviceStatus`) directly; `now`
  serves the clock tick. For unions, narrow first:
  `if (w.type !== WIDGET_TYPE.X) return '';`.
- Each `option.default` also **seeds** the widget on creation (via
  `createWidget`) — no need for separate default logic.

## Available options

| `kind` | Rendered control | Useful fields |
|---|---|---|
| `'bool'` | Switch | `default: boolean`, `disabled?: (w)=>boolean` |
| `'text'` | Input | `default: string`, `max?: number` |
| `'icon'` | IconPreview + IconEditor dialog | `default: ''` (base64 24×24 1bpp) |

## Adding a widget — end to end

**Studio side (TypeScript)**

1. **`config-schema.ts`** (`packages/shared/src/constants/`) :
   - add the key to `WIDGET_TYPE` (e.g. `MY_WIDGET: 7`);
   - add a member to the `WidgetConfig` union (with its option fields);
   - (optional) include it in `defaultWidgets()`.
2. **`screen/widgets/my-widget.ts`** : export the `WidgetDef`.
3. **`screen/widgets/index.ts`** : import the def, add it to `WIDGET_DEFS` and
   to `PLACEABLE_WIDGET_TYPES`.
4. `pnpm codegen` — regenerates the C enum `kb_widget_type_t` (`widget_types.gen.h`).
5. `pnpm check:studio` — typecheck.

**Firmware side (C)** — `packages/firmware/`

6. **`components/display/display.c`** : add the `case WIDGET_MY_WIDGET:` in
   `render_widget()` (the actual drawing, by size). The enum is already generated.
7. **`components/config_store/config_store.c`** : *only if* the widget has
   new persisted fields — read/write them in the JSON parse/serialize
   (bits in `opts[]` for booleans, or a new field).

> The firmware draws any `w×h` (it places the content in the box),
> so "all sizes" does not require a per-size variant unless you
> want a rendering specific to one dimension.
