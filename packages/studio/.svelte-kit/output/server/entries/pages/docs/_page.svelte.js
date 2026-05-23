import { a5 as head, $ as escape_html, _ as ensure_array_like, J as attr, aj as stringify } from "../../../chunks/renderer.js";
import { A as APP_CONFIG } from "../../../chunks/app.config.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    head("1xmjmrw", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Documentation — ${escape_html(APP_CONFIG.name)}</title>`);
      });
    });
    $$renderer2.push(`<h1 class="text-3xl font-bold mb-2">${escape_html(APP_CONFIG.name)}</h1> <p class="text-muted-foreground mb-8">${escape_html(APP_CONFIG.tagline)}</p> <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl"><!--[-->`);
    const each_array = ensure_array_like(data.manifest);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let doc = each_array[$$index];
      $$renderer2.push(`<a${attr("href", `/docs/${stringify(doc.slug)}`)} class="group block p-4 rounded-lg border bg-card hover:border-primary/50 hover:bg-accent transition-colors">`);
      if (doc.group) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p class="text-xs text-muted-foreground uppercase tracking-widest mb-1">${escape_html(doc.group)}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <p class="font-semibold group-hover:text-primary transition-colors">${escape_html(doc.title)}</p></a>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
