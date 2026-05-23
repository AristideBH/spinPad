import { a5 as head, _ as ensure_array_like, $ as escape_html } from "../../../../chunks/renderer.js";
import { c as configState } from "../../../../chunks/config.svelte.js";
import { A as APP_CONFIG } from "../../../../chunks/app.config.js";
import { C as Card, a as Card_content } from "../../../../chunks/card-content.js";
import "clsx";
import { C as Card_header, a as Card_title } from "../../../../chunks/card-title.js";
import { L as Label, I as Input } from "../../../../chunks/label.js";
import { B as Badge } from "../../../../chunks/badge.js";
import { N as NotConnected } from "../../../../chunks/NotConnected.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    function updateSlotName(slotIdx, value) {
      const cfg = structuredClone(configState.data);
      cfg.ble.slot_names[slotIdx] = value;
      configState.data = cfg;
      configState.isDirty = true;
    }
    function updateDeviceName(value) {
      const cfg = structuredClone(configState.data);
      cfg.ble.device_name = value;
      configState.data = cfg;
      configState.isDirty = true;
    }
    head("sqmalc", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>BLE — ${escape_html(APP_CONFIG.name)}</title>`);
      });
    });
    $$renderer2.push(`<h2 class="text-xl font-bold mb-6">Configuration BLE</h2> `);
    if (!configState.data) {
      $$renderer2.push("<!--[0-->");
      NotConnected($$renderer2, {});
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="flex flex-col gap-4 max-w-md">`);
      Card($$renderer2, {
        children: ($$renderer3) => {
          Card_header($$renderer3, {
            children: ($$renderer4) => {
              Card_title($$renderer4, {
                class: "text-sm uppercase tracking-widest text-muted-foreground font-semibold",
                children: ($$renderer5) => {
                  $$renderer5.push(`<!---->Appareil`);
                },
                $$slots: { default: true }
              });
            },
            $$slots: { default: true }
          });
          $$renderer3.push(`<!----> `);
          Card_content($$renderer3, {
            class: "pt-0",
            children: ($$renderer4) => {
              $$renderer4.push(`<div class="flex flex-col gap-1.5">`);
              Label($$renderer4, {
                children: ($$renderer5) => {
                  $$renderer5.push(`<!---->Nom diffusé en Bluetooth`);
                },
                $$slots: { default: true }
              });
              $$renderer4.push(`<!----> `);
              Input($$renderer4, {
                value: configState.data.ble.device_name,
                oninput: (e) => updateDeviceName(e.target.value),
                maxlength: 31
              });
              $$renderer4.push(`<!----></div>`);
            },
            $$slots: { default: true }
          });
          $$renderer3.push(`<!---->`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----> `);
      Card($$renderer2, {
        children: ($$renderer3) => {
          Card_header($$renderer3, {
            children: ($$renderer4) => {
              Card_title($$renderer4, {
                class: "text-sm uppercase tracking-widest text-muted-foreground font-semibold",
                children: ($$renderer5) => {
                  $$renderer5.push(`<!---->Slots de connexion`);
                },
                $$slots: { default: true }
              });
            },
            $$slots: { default: true }
          });
          $$renderer3.push(`<!----> `);
          Card_content($$renderer3, {
            class: "pt-0 flex flex-col gap-4",
            children: ($$renderer4) => {
              $$renderer4.push(`<!--[-->`);
              const each_array = ensure_array_like([0, 1]);
              for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                let slotIdx = each_array[$$index];
                $$renderer4.push(`<div class="flex flex-col gap-1.5"><div class="flex items-center gap-2">`);
                Badge($$renderer4, {
                  variant: slotIdx === 0 ? "default" : "secondary",
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->Slot ${escape_html(slotIdx)}`);
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!----> `);
                Label($$renderer4, {
                  class: "text-muted-foreground text-xs",
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->${escape_html(slotIdx === 0 ? "Premier appareil" : "Second appareil")}`);
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!----></div> `);
                Input($$renderer4, {
                  value: configState.data.ble.slot_names[slotIdx],
                  oninput: (e) => updateSlotName(slotIdx, e.target.value)
                });
                $$renderer4.push(`<!----></div>`);
              }
              $$renderer4.push(`<!--]--> <p class="text-xs text-muted-foreground bg-muted/50 rounded-md p-3 leading-relaxed"><strong>Comment switcher ?</strong><br/> • <strong>SW11</strong> (court appui) = changer d'appareil actif<br/> • <strong>SW16 + SW17 maintenus 2s</strong> = mode pairing pour le slot
          actif</p>`);
            },
            $$slots: { default: true }
          });
          $$renderer3.push(`<!---->`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
