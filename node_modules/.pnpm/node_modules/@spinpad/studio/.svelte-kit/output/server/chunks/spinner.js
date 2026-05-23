import { ai as spread_props } from "./renderer.js";
import { I as Icon } from "./Icon.js";
import { c as cn } from "./utils2.js";
function Flask_conical($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"
      }
    ],
    ["path", { "d": "M6.453 15h11.094" }],
    ["path", { "d": "M8.5 2h7" }]
  ];
  Icon($$renderer, spread_props([{ name: "flask-conical" }, props, { iconNode }]));
}
function Loader_circle($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [["path", { "d": "M21 12a9 9 0 1 1-6.219-8.56" }]];
  Icon($$renderer, spread_props([{ name: "loader-circle" }, props, { iconNode }]));
}
function Log_out($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["path", { "d": "m16 17 5-5-5-5" }],
    ["path", { "d": "M21 12H9" }],
    ["path", { "d": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }]
  ];
  Icon($$renderer, spread_props([{ name: "log-out" }, props, { iconNode }]));
}
function Trash_2($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["path", { "d": "M10 11v6" }],
    ["path", { "d": "M14 11v6" }],
    ["path", { "d": "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }],
    ["path", { "d": "M3 6h18" }],
    ["path", { "d": "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }]
  ];
  Icon($$renderer, spread_props([{ name: "trash-2" }, props, { iconNode }]));
}
function Spinner($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      class: className,
      role = "status",
      // we add name, color, and stroke for compatibility with different icon libraries props
      name,
      color,
      stroke,
      "aria-label": ariaLabel = "Loading",
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    Loader_circle($$renderer2, spread_props([
      {
        role,
        name: name === null ? void 0 : name,
        color: color === null ? void 0 : color,
        stroke: stroke === null ? void 0 : stroke,
        "aria-label": ariaLabel,
        class: cn("size-4 animate-spin", className)
      },
      restProps
    ]));
  });
}
export {
  Flask_conical as F,
  Log_out as L,
  Spinner as S,
  Trash_2 as T
};
