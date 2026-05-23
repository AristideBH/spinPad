import { ai as spread_props } from "./renderer.js";
import { I as Icon } from "./Icon.js";
function html(value) {
  var html2 = String(value ?? "");
  var open = "<!---->";
  return open + html2 + "<!---->";
}
function Chevron_right($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [["path", { "d": "m9 18 6-6-6-6" }]];
  Icon($$renderer, spread_props([{ name: "chevron-right" }, props, { iconNode }]));
}
export {
  Chevron_right as C,
  html as h
};
