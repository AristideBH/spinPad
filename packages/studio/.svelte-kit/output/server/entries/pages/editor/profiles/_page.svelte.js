import { a5 as head, _ as ensure_array_like, K as attr_class, $ as escape_html } from "../../../../chunks/renderer.js";
import { c as configState } from "../../../../chunks/config.svelte.js";
import { A as APP_CONFIG } from "../../../../chunks/app.config.js";
import { C as Card, a as Card_content } from "../../../../chunks/card-content.js";
import "clsx";
import { B as Badge } from "../../../../chunks/badge.js";
import { N as NotConnected } from "../../../../chunks/NotConnected.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    head("1an97z3", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Profils — ${escape_html(APP_CONFIG.name)}</title>`);
      });
    });
    $$renderer2.push(`<h2 class="text-xl font-bold mb-6">Profils</h2> `);
    if (!configState.data) {
      $$renderer2.push("<!--[0-->");
      NotConnected($$renderer2, {});
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="flex flex-col gap-3 max-w-md"><!--[-->`);
      const each_array = ensure_array_like(configState.data.profiles);
      for (let i = 0, $$length = each_array.length; i < $$length; i++) {
        let prof = each_array[i];
        const isActive = i === configState.data.active_profile;
        Card($$renderer2, {
          class: isActive ? "border-primary/60" : "",
          children: ($$renderer3) => {
            Card_content($$renderer3, {
              class: "p-4 flex items-center gap-3",
              children: ($$renderer4) => {
                $$renderer4.push(`<div${attr_class("size-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0", void 0, {
                  "bg-primary": isActive,
                  "text-primary-foreground": isActive,
                  "bg-muted": !isActive,
                  "text-muted-foreground": !isActive
                })}>${escape_html(i)}</div> <div class="flex-1 min-w-0"><div class="flex items-center gap-2"><span class="font-semibold">${escape_html(prof.name)}</span> `);
                if (isActive) {
                  $$renderer4.push("<!--[0-->");
                  Badge($$renderer4, {
                    variant: "default",
                    class: "text-[10px] px-1.5 py-0",
                    children: ($$renderer5) => {
                      $$renderer5.push(`<!---->Actif`);
                    },
                    $$slots: { default: true }
                  });
                } else {
                  $$renderer4.push("<!--[-1-->");
                }
                $$renderer4.push(`<!--]--></div> <p class="text-xs text-muted-foreground">${escape_html(prof.layers?.length ?? 0)} layer(s) · ${escape_html(prof.combos?.length ?? 0)} combo(s)</p></div>`);
              },
              $$slots: { default: true }
            });
          },
          $$slots: { default: true }
        });
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
