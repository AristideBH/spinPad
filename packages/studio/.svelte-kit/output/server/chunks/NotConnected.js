import { $ as escape_html } from "./renderer.js";
import "clsx";
function NotConnected($$renderer, $$props) {
  let {
    message = "Connecte le clavier pour accéder à cette section."
  } = $$props;
  $$renderer.push(`<div class="flex flex-col items-center justify-center py-16 text-center gap-3"><div class="text-4xl opacity-30">⌨️</div> <p class="text-muted-foreground text-sm max-w-xs">${escape_html(message)}</p></div>`);
}
export {
  NotConnected as N
};
