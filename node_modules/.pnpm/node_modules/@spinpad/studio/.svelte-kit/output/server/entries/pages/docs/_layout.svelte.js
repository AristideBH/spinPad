import { K as attr_class, _ as ensure_array_like, $ as escape_html, J as attr, aj as stringify, Y as derived } from "../../../chunks/renderer.js";
import { p as page } from "../../../chunks/index.js";
import "clsx";
import { A as APP_CONFIG } from "../../../chunks/app.config.js";
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, children } = $$props;
    const grouped = derived(() => {
      const groups = {};
      for (const doc of data.manifest) {
        const key = doc.group ?? "_root";
        if (!groups[key]) groups[key] = [];
        groups[key].push(doc);
      }
      return groups;
    });
    const groupLabel = (key) => key === "_root" ? APP_CONFIG.name : key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, " ");
    $$renderer2.push(`<div class="flex min-h-[calc(100vh-3.5rem)]"><aside class="w-56 shrink-0 border-r bg-[hsl(var(--sidebar))] py-6 px-3"><nav class="flex flex-col gap-1"><a href="/docs"${attr_class("px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-accent mb-2", void 0, { "bg-accent": page.url.pathname === "/docs" })}>Documentation</a> <!--[-->`);
    const each_array = ensure_array_like(Object.entries(grouped()));
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let [group, docs] = each_array[$$index_1];
      if (group !== "_root") {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p class="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">${escape_html(groupLabel(group))}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <!--[-->`);
      const each_array_1 = ensure_array_like(docs);
      for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
        let doc = each_array_1[$$index];
        $$renderer2.push(`<a${attr("href", `/docs/${stringify(doc.slug)}`)}${attr_class("px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:hover:bg-accent transition-colors", void 0, {
          "bg-accent": page.url.pathname === `/docs/${doc.slug}`,
          "test": page.url.pathname === `/docs/${doc.slug}`
        })}>${escape_html(doc.title)}</a>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></nav></aside> <div class="flex-1 min-w-0 py-8 px-8">`);
    children($$renderer2);
    $$renderer2.push(`<!----></div></div>`);
  });
}
export {
  _layout as default
};
