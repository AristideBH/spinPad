import { O as attributes, Q as clsx, P as bind_props, Y as derived, a5 as head, _ as ensure_array_like, $ as escape_html, aj as stringify } from "../../../../chunks/renderer.js";
import { marked } from "marked";
import "../../../../chunks/client.js";
import { c as cn } from "../../../../chunks/utils2.js";
import "clsx";
import { C as Chevron_right, h as html } from "../../../../chunks/chevron-right.js";
import { A as APP_CONFIG } from "../../../../chunks/app.config.js";
function Breadcrumb($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    $$renderer2.push(`<nav${attributes({
      "data-slot": "breadcrumb",
      "aria-label": "breadcrumb",
      class: clsx(cn("cn-breadcrumb", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></nav>`);
    bind_props($$props, { ref });
  });
}
function Breadcrumb_item($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    $$renderer2.push(`<li${attributes({
      "data-slot": "breadcrumb-item",
      class: clsx(cn("gap-1 inline-flex items-center", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></li>`);
    bind_props($$props, { ref });
  });
}
function Breadcrumb_separator($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    $$renderer2.push(`<li${attributes({
      "data-slot": "breadcrumb-separator",
      role: "presentation",
      "aria-hidden": "true",
      class: clsx(cn("[&>svg]:size-3.5", className)),
      ...restProps
    })}>`);
    if (children) {
      $$renderer2.push("<!--[0-->");
      children?.($$renderer2);
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      Chevron_right($$renderer2, {});
    }
    $$renderer2.push(`<!--]--></li>`);
    bind_props($$props, { ref });
  });
}
function Breadcrumb_link($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      href = void 0,
      child,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const attrs = derived(() => ({
      "data-slot": "breadcrumb-link",
      class: cn("hover:text-foreground transition-colors", className),
      href,
      ...restProps
    }));
    if (child) {
      $$renderer2.push("<!--[0-->");
      child($$renderer2, { props: attrs() });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<a${attributes({ ...attrs() })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></a>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref });
  });
}
function Breadcrumb_list($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    $$renderer2.push(`<ol${attributes({
      "data-slot": "breadcrumb-list",
      class: clsx(cn("text-muted-foreground gap-1.5 text-sm flex flex-wrap items-center wrap-break-word", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></ol>`);
    bind_props($$props, { ref });
  });
}
function Breadcrumb_page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    $$renderer2.push(`<span${attributes({
      "data-slot": "breadcrumb-page",
      role: "link",
      "aria-disabled": "true",
      "aria-current": "page",
      class: clsx(cn("text-foreground font-normal", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></span>`);
    bind_props($$props, { ref });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const html$1 = derived(() => marked(data.doc.content));
    const segments = derived(() => data.doc.slug.split("/"));
    head("100slfm", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(data.doc.title)} — ${escape_html(APP_CONFIG.name)}</title>`);
      });
    });
    Breadcrumb($$renderer2, {
      class: "mb-6",
      children: ($$renderer3) => {
        Breadcrumb_list($$renderer3, {
          children: ($$renderer4) => {
            Breadcrumb_item($$renderer4, {
              children: ($$renderer5) => {
                Breadcrumb_link($$renderer5, {
                  href: "/docs",
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->Docs`);
                  },
                  $$slots: { default: true }
                });
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----> <!--[-->`);
            const each_array = ensure_array_like(segments().slice(0, -1));
            for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
              let seg = each_array[$$index];
              Breadcrumb_separator($$renderer4, {});
              $$renderer4.push(`<!----> `);
              Breadcrumb_item($$renderer4, {
                children: ($$renderer5) => {
                  Breadcrumb_link($$renderer5, {
                    href: `/docs/${stringify(seg)}`,
                    children: ($$renderer6) => {
                      $$renderer6.push(`<!---->${escape_html(seg.charAt(0).toUpperCase() + seg.slice(1))}`);
                    },
                    $$slots: { default: true }
                  });
                },
                $$slots: { default: true }
              });
              $$renderer4.push(`<!---->`);
            }
            $$renderer4.push(`<!--]--> `);
            Breadcrumb_separator($$renderer4, {});
            $$renderer4.push(`<!----> `);
            Breadcrumb_item($$renderer4, {
              children: ($$renderer5) => {
                Breadcrumb_page($$renderer5, {
                  children: ($$renderer6) => {
                    $$renderer6.push(`<!---->${escape_html(data.doc.title)}`);
                  },
                  $$slots: { default: true }
                });
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!---->`);
          },
          $$slots: { default: true }
        });
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----> <div class="prose">${html(html$1())}</div>`);
  });
}
export {
  _page as default
};
