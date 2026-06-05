# Widgets OLED — registre

Chaque widget de l'écran OLED est décrit par **un fichier** dans ce dossier qui
exporte un [`WidgetDef`](./types.ts). Le registre [`index.ts`](./index.ts)
assemble toutes les définitions ; l'éditeur (`../ScreenEditor.svelte`) et le menu
d'ajout (`../ScreenAddMenu.svelte`) ne lisent que le registre — aucun `switch`
par type dans l'UI.

## Anatomie d'un `WidgetDef`

```ts
export const monwidget: WidgetDef = {
  label: 'Mon widget',
  icon: SomeLucideIcon,
  size: { minW: 2, maxW: 4, minH: 1, maxH: 2 }, // le sélecteur génère w∈[minW,maxW] × h∈[minH,maxH]
  singleton: true,                               // false → duplications autorisées
  options: [                                     // facultatif ; rendu par bits/OptionControls
    { key: 'mon_flag', kind: 'bool', label: 'Activer', default: false },
    { key: 'mon_txt',  kind: 'text', label: 'Texte', default: '', max: 12,
      disabled: (w) => w.h < 2 },                // grise selon l'état courant
  ],
  preview: (w, now) => '…',                       // texte live affiché dans la carte
};
```

- `size` est une **contrainte min/max** (pas une liste) ; toute combinaison du
  rectangle est autorisée. `default` (optionnel) fixe la taille à l'ajout, sinon
  `{ minW, minH }`. Tous les widgets font au moins `WIDGET_MIN_W` de large.
- `preview` lit les stores (`configState`, `deviceStatus`) directement ; `now`
  sert au tick de l'horloge. Pour les unions, narrow d'abord :
  `if (w.type !== WIDGET_TYPE.X) return '';`.
- Chaque `option.default` **seed** aussi le widget à la création (via
  `createWidget`) — pas besoin de logique de défaut séparée.

## Options disponibles

| `kind` | Contrôle rendu | Champs utiles |
|---|---|---|
| `'bool'` | Switch | `default: boolean`, `disabled?: (w)=>boolean` |
| `'text'` | Input | `default: string`, `max?: number` |
| `'icon'` | IconPreview + dialog IconEditor | `default: ''` (base64 24×24 1bpp) |

## Ajouter un widget — de bout en bout

**Côté Studio (TypeScript)**

1. **`config-schema.ts`** (`packages/shared/src/constants/`) :
   - ajouter la clé à `WIDGET_TYPE` (ex. `MY_WIDGET: 7`) ;
   - ajouter un membre à l'union `WidgetConfig` (avec ses champs d'options) ;
   - (optionnel) l'inclure dans `defaultWidgets()`.
2. **`screen/widgets/my-widget.ts`** : exporter le `WidgetDef`.
3. **`screen/widgets/index.ts`** : importer le def, l'ajouter à `WIDGET_DEFS` et
   à `PLACEABLE_WIDGET_TYPES`.
4. `pnpm codegen` — régénère l'enum C `kb_widget_type_t` (`widget_types.gen.h`).
5. `pnpm check:studio` — typecheck.

**Côté firmware (C)** — `packages/firmware/`

6. **`components/display/display.c`** : ajouter le `case WIDGET_MY_WIDGET:` dans
   `render_widget()` (le dessin réel, par taille). L'enum est déjà généré.
7. **`components/config_store/config_store.c`** : *seulement si* le widget a de
   nouveaux champs persistés — les lire/écrire dans le parse/serialize JSON
   (bits dans `opts[]` pour les booléens, ou un nouveau champ).

> Le firmware dessine n'importe quel `w×h` (il place le contenu dans la boîte),
> donc « toutes les tailles » ne demande pas de variante par taille sauf si tu
> veux un rendu spécifique à une dimension.
