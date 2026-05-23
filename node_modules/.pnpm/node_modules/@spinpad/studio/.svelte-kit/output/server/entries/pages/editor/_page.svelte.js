import { ai as spread_props, $ as escape_html, O as attributes, P as bind_props, Y as derived, Q as clsx, a5 as head, aj as stringify } from "../../../chunks/renderer.js";
import { e as serial, c as configState, l as loadConfig, s as saveConfig, b as disconnect, a as connect, f as factoryReset, d as devMode } from "../../../chunks/config.svelte.js";
import { A as APP_CONFIG } from "../../../chunks/app.config.js";
import { B as Button } from "../../../chunks/button.js";
import "clsx";
import { C as Card, a as Card_content } from "../../../chunks/card-content.js";
import { c as cn } from "../../../chunks/utils2.js";
import { tv } from "tailwind-variants";
import { F as Flask_conical, S as Spinner, L as Log_out, T as Trash_2 } from "../../../chunks/spinner.js";
import { I as Icon } from "../../../chunks/Icon.js";
function Plug_zap($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"
      }
    ],
    ["path", { "d": "m2 22 3-3" }],
    ["path", { "d": "M7.5 13.5 10 11" }],
    ["path", { "d": "M10.5 16.5 13 14" }],
    ["path", { "d": "m18 3-4 4h6l-4 4" }]
  ];
  Icon($$renderer, spread_props([{ name: "plug-zap" }, props, { iconNode }]));
}
function Refresh_cw($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      { "d": "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }
    ],
    ["path", { "d": "M21 3v5h-5" }],
    [
      "path",
      { "d": "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }
    ],
    ["path", { "d": "M8 16H3v5" }]
  ];
  Icon($$renderer, spread_props([{ name: "refresh-cw" }, props, { iconNode }]));
}
function InfoCard($$renderer, $$props) {
  let { label, value } = $$props;
  Card($$renderer, {
    children: ($$renderer2) => {
      Card_content($$renderer2, {
        class: "p-4",
        children: ($$renderer3) => {
          $$renderer3.push(`<p class="text-xs text-muted-foreground uppercase tracking-widest mb-1.5">${escape_html(label)}</p> <p class="text-xl font-bold">${escape_html(value ?? "—")}</p>`);
        },
        $$slots: { default: true }
      });
    },
    $$slots: { default: true }
  });
}
const itemVariants = tv({
  base: "[a]:hover:bg-muted rounded-lg border text-sm group/item focus-visible:border-ring focus-visible:ring-ring/50 flex w-full flex-wrap items-center transition-colors duration-100 outline-none focus-visible:ring-[3px] [a]:transition-colors",
  variants: {
    variant: {
      default: "border-transparent",
      outline: "border-border",
      muted: "bg-muted/50 border-transparent"
    },
    size: {
      default: "gap-2.5 px-3 py-2.5",
      sm: "gap-2.5 px-3 py-2.5",
      xs: "gap-2 px-2.5 py-2 in-data-[slot=dropdown-menu-content]:p-0"
    }
  },
  defaultVariants: { variant: "default", size: "default" }
});
function Item($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      child,
      variant,
      size,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const mergedProps = derived(() => ({
      class: cn(itemVariants({ variant, size }), className),
      "data-slot": "item",
      "data-variant": variant,
      "data-size": size,
      ...restProps
    }));
    if (child) {
      $$renderer2.push("<!--[0-->");
      child($$renderer2, { props: mergedProps() });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div${attributes({ ...mergedProps() })}>`);
      mergedProps().children?.($$renderer2);
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref });
  });
}
function Item_content($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    $$renderer2.push(`<div${attributes({
      "data-slot": "item-content",
      class: clsx(cn("gap-1 group-data-[size=xs]/item:gap-0 flex flex-1 flex-col [&+[data-slot=item-content]]:flex-none", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { ref });
  });
}
function Item_title($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    $$renderer2.push(`<div${attributes({
      "data-slot": "item-title",
      class: clsx(cn("font-heading gap-2 text-sm leading-snug font-medium underline-offset-4 line-clamp-1 flex w-fit items-center", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { ref });
  });
}
const itemMediaVariants = tv({
  base: "gap-2 group-has-data-[slot=item-description]/item:translate-y-0.5 group-has-data-[slot=item-description]/item:self-start flex shrink-0 items-center justify-center [&_svg]:pointer-events-none",
  variants: {
    variant: {
      default: "bg-transparent",
      icon: "[&_svg:not([class*='size-'])]:size-4",
      image: "size-10 overflow-hidden rounded-sm group-data-[size=sm]/item:size-8 group-data-[size=xs]/item:size-6 [&_img]:size-full [&_img]:object-cover"
    }
  },
  defaultVariants: { variant: "default" }
});
function Item_media($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      children,
      variant = "default",
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    $$renderer2.push(`<div${attributes({
      "data-slot": "item-media",
      "data-variant": variant,
      class: clsx(cn(itemMediaVariants({ variant }), className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { ref });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    async function handleConnect() {
      const ok = await connect();
      if (ok) await loadConfig();
    }
    async function handleFactoryReset() {
      if (!confirm("Remettre la config à zéro ? Toutes les modifications seront perdues.")) return;
      await factoryReset();
      await loadConfig();
    }
    async function handleDevMode() {
      devMode.active = true;
      await loadConfig();
    }
    const isOnline = derived(() => serial.connected || devMode.active);
    head("mb2odu", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Editor — ${escape_html(APP_CONFIG.name)}</title>`);
      });
    });
    $$renderer2.push(`<div class="text-center py-10"><h1 class="text-3xl font-bold mb-2">${escape_html(APP_CONFIG.name)}</h1> <p class="text-muted-foreground text-sm">${escape_html(APP_CONFIG.tagline)}</p></div> `);
    if (!isOnline()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="flex flex-col items-center gap-4 mt-4">`);
      Button($$renderer2, {
        onclick: handleConnect,
        size: "lg",
        class: "gap-2",
        children: ($$renderer3) => {
          Plug_zap($$renderer3, { class: "size-5" });
          $$renderer3.push(`<!----> Connecter le clavier`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----> `);
      if (serial.error) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p class="text-destructive text-sm">${escape_html(serial.error)}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="mt-2 text-center">`);
      Button($$renderer2, {
        variant: "ghost",
        size: "sm",
        onclick: handleDevMode,
        class: "text-amber-400 hover:text-amber-300 gap-1.5",
        children: ($$renderer3) => {
          Flask_conical($$renderer3, { class: "size-4" });
          $$renderer3.push(`<!----> Lancer le mode démo`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----> <p class="text-xs text-muted-foreground mt-1">Prérequis : Chrome ou Edge, clavier USB. WebSerial non supporté sur
        Firefox.</p></div></div>`);
    } else if (configState.isLoading) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<div class="flex w-full max-w-xs mx-auto flex-col gap-4 [--radius:1rem]">`);
      if (Item) {
        $$renderer2.push("<!--[-->");
        Item($$renderer2, {
          variant: "muted",
          children: ($$renderer3) => {
            if (Item_media) {
              $$renderer3.push("<!--[-->");
              Item_media($$renderer3, {
                children: ($$renderer4) => {
                  Spinner($$renderer4, {});
                },
                $$slots: { default: true }
              });
              $$renderer3.push("<!--]-->");
            } else {
              $$renderer3.push("<!--[!-->");
              $$renderer3.push("<!--]-->");
            }
            $$renderer3.push(` `);
            if (Item_content) {
              $$renderer3.push("<!--[-->");
              Item_content($$renderer3, {
                children: ($$renderer4) => {
                  if (Item_title) {
                    $$renderer4.push("<!--[-->");
                    Item_title($$renderer4, {
                      class: "line-clamp-1",
                      children: ($$renderer5) => {
                        $$renderer5.push(`<!---->Chargement de la configuration...`);
                      },
                      $$slots: { default: true }
                    });
                    $$renderer4.push("<!--]-->");
                  } else {
                    $$renderer4.push("<!--[!-->");
                    $$renderer4.push("<!--]-->");
                  }
                },
                $$slots: { default: true }
              });
              $$renderer3.push("<!--]-->");
            } else {
              $$renderer3.push("<!--[!-->");
              $$renderer3.push("<!--]-->");
            }
          },
          $$slots: { default: true }
        });
        $$renderer2.push("<!--]-->");
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push("<!--]-->");
      }
      $$renderer2.push(`</div>`);
    } else if (configState.data) {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">`);
      InfoCard($$renderer2, {
        label: "Profils",
        value: configState.data.profile_count ?? configState.data.profiles?.length
      });
      $$renderer2.push(`<!----> `);
      InfoCard($$renderer2, {
        label: "Profil actif",
        value: configState.data.profiles?.[configState.data.active_profile]?.name
      });
      $$renderer2.push(`<!----> `);
      InfoCard($$renderer2, {
        label: "BLE Device",
        value: configState.data.ble?.slot_names?.[configState.data.ble?.active_slot]
      });
      $$renderer2.push(`<!----> `);
      InfoCard($$renderer2, {
        label: "Sleep timeout",
        value: `${stringify(configState.data.power?.sleep_timeout_s)}s`
      });
      $$renderer2.push(`<!----> `);
      InfoCard($$renderer2, {
        label: "Version",
        value: `v${stringify(configState.data.version)}`
      });
      $$renderer2.push(`<!----></div> `);
      if (configState.loadError) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p class="text-destructive text-sm mt-4">${escape_html(configState.loadError)}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="text-center mt-10"><p class="text-muted-foreground text-sm mb-3">Aucune config chargée.</p> `);
      Button($$renderer2, {
        variant: "outline",
        onclick: loadConfig,
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->Charger`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]--> <div class="flex flex-wrap gap-2">`);
    if (configState.isDirty) {
      $$renderer2.push("<!--[0-->");
      Button($$renderer2, {
        onclick: saveConfig,
        class: "gap-1.5",
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->💾 Sauvegarder`);
        },
        $$slots: { default: true }
      });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    Button($$renderer2, {
      variant: "outline",
      onclick: loadConfig,
      class: "gap-1.5",
      children: ($$renderer3) => {
        Refresh_cw($$renderer3, { class: "size-4" });
        $$renderer3.push(`<!----> Recharger`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----> `);
    if (serial.connected) {
      $$renderer2.push("<!--[0-->");
      Button($$renderer2, {
        variant: "outline",
        onclick: disconnect,
        class: "gap-1.5",
        children: ($$renderer3) => {
          Log_out($$renderer3, { class: "size-4" });
          $$renderer3.push(`<!----> Déconnecter`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----> `);
      Button($$renderer2, {
        variant: "destructive",
        onclick: handleFactoryReset,
        class: "gap-1.5",
        children: ($$renderer3) => {
          Trash_2($$renderer3, { class: "size-4" });
          $$renderer3.push(`<!----> Reset usine`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
