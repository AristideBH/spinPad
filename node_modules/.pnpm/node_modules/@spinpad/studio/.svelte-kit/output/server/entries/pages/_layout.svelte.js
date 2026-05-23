import "clsx";
import { e as serial, d as devMode, c as configState, l as loadConfig, s as saveConfig } from "../../chunks/config.svelte.js";
import { B as Button } from "../../chunks/button.js";
import { ah as setContext, a1 as getContext, Y as derived, O as attributes, Q as clsx, P as bind_props, ad as props_id, J as attr, ai as spread_props, $ as escape_html, aj as stringify, K as attr_class, a5 as head, _ as ensure_array_like } from "../../chunks/renderer.js";
import { c as cn } from "../../chunks/utils2.js";
import { M as MediaQuery, C as Context, D as DOMContext, F as watch, S as SPACE, d as ENTER, z as noop, m as getDocument, q as isElement, s as isFocusVisible, j as createSubscriber } from "../../chunks/arrays.js";
import { k as createId, h as boxWith$1, v as mergeProps, a as attachRef, j as createBitsAttrs, b as boolToEmptyStrOrUndef, p as getDataOpenClosed, c as boolToStr, q as getDataTransitionAttrs, d as boolToStrTrueOrUndef, w as simpleBox } from "../../chunks/create-id.js";
import { C as on } from "../../chunks/events.js";
import { b as DialogDescriptionState, q as PresenceManager, s as afterTick, v as useId, F as FloatingArrowState, k as MenuItemState, j as MenuGroupState, n as MenuSeparatorState, m as MenuRootState, l as MenuMenuState, h as Floating_layer, M as MenuContentState, o as Popper_layer_force_mount, P as Popper_layer, u as getFloatingContentCSSVars, g as DropdownMenuTriggerState, i as Floating_layer_anchor, p as Portal, a as Dialog, e as Dialog_overlay, d as Dialog_content, c as Dialog_close, X, f as Dialog_title } from "../../chunks/x.js";
import { tv } from "tailwind-variants";
import { I as Icon } from "../../chunks/Icon.js";
import { h as html, C as Chevron_right } from "../../chunks/chevron-right.js";
import { T as Trash_2, L as Log_out, F as Flask_conical, S as Spinner } from "../../chunks/spinner.js";
import { B as Badge } from "../../chunks/badge.js";
import "../../chunks/client.js";
const DEFAULT_MOBILE_BREAKPOINT = 768;
class IsMobile extends MediaQuery {
  constructor(breakpoint = DEFAULT_MOBILE_BREAKPOINT) {
    super(`max-width: ${breakpoint - 1}px`);
  }
}
const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
class SidebarState {
  props;
  #open = derived(() => this.props.open());
  get open() {
    return this.#open();
  }
  set open($$value) {
    return this.#open($$value);
  }
  openMobile = false;
  setOpen;
  #isMobile;
  #state = derived(() => this.open ? "expanded" : "collapsed");
  get state() {
    return this.#state();
  }
  set state($$value) {
    return this.#state($$value);
  }
  constructor(props) {
    this.setOpen = props.setOpen;
    this.#isMobile = new IsMobile();
    this.props = props;
  }
  // Convenience getter for checking if the sidebar is mobile
  // without this, we would need to use `sidebar.isMobile.current` everywhere
  get isMobile() {
    return this.#isMobile.current;
  }
  // Event handler to apply to the `<svelte:window>`
  handleShortcutKeydown = (e) => {
    if (e.key === SIDEBAR_KEYBOARD_SHORTCUT && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      this.toggle();
    }
  };
  setOpenMobile = (value) => {
    this.openMobile = value;
  };
  toggle = () => {
    return this.#isMobile.current ? this.openMobile = !this.openMobile : this.setOpen(!this.open);
  };
}
const SYMBOL_KEY = "scn-sidebar";
function setSidebar(props) {
  return setContext(Symbol.for(SYMBOL_KEY), new SidebarState(props));
}
function useSidebar() {
  return getContext(Symbol.for(SYMBOL_KEY));
}
function Sidebar_content($$renderer, $$props) {
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
      "data-slot": "sidebar-content",
      "data-sidebar": "content",
      class: clsx(cn("no-scrollbar gap-0 flex min-h-0 flex-1 flex-col overflow-auto group-data-[collapsible=icon]:overflow-hidden", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { ref });
  });
}
function Sidebar_footer($$renderer, $$props) {
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
      "data-slot": "sidebar-footer",
      "data-sidebar": "footer",
      class: clsx(cn("gap-2 p-2 flex flex-col", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { ref });
  });
}
function Sidebar_group_content($$renderer, $$props) {
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
      "data-slot": "sidebar-group-content",
      "data-sidebar": "group-content",
      class: clsx(cn("text-sm w-full", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { ref });
  });
}
function Sidebar_group_label($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      children,
      child,
      class: className,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const mergedProps = derived(() => ({
      class: cn("text-sidebar-foreground/70 ring-sidebar-ring h-8 rounded-md px-2 text-xs font-medium transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&>svg]:size-4 flex shrink-0 items-center outline-hidden [&>svg]:shrink-0", className),
      "data-slot": "sidebar-group-label",
      "data-sidebar": "group-label",
      ...restProps
    }));
    if (child) {
      $$renderer2.push("<!--[0-->");
      child($$renderer2, { props: mergedProps() });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div${attributes({ ...mergedProps() })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref });
  });
}
function Sidebar_group($$renderer, $$props) {
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
      "data-slot": "sidebar-group",
      "data-sidebar": "group",
      class: clsx(cn("p-2 relative flex w-full min-w-0 flex-col", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { ref });
  });
}
function Sidebar_header($$renderer, $$props) {
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
      "data-slot": "sidebar-header",
      "data-sidebar": "header",
      class: clsx(cn("gap-2 p-2 flex flex-col", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { ref });
  });
}
function Sidebar_inset($$renderer, $$props) {
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
      "data-slot": "sidebar-inset",
      class: clsx(cn("bg-background md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2 relative flex w-full flex-1 flex-col", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { ref });
  });
}
function Sidebar_menu_action($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      showOnHover = false,
      children,
      child,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const mergedProps = derived(() => ({
      class: cn("text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 aspect-square w-5 rounded-md p-0 peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 focus-visible:ring-2 [&>svg]:size-4 flex items-center justify-center outline-hidden transition-transform group-data-[collapsible=icon]:hidden after:absolute after:-inset-2 md:after:hidden [&>svg]:shrink-0", showOnHover && "peer-data-active/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-open:opacity-100 md:opacity-0", className),
      "data-slot": "sidebar-menu-action",
      "data-sidebar": "menu-action",
      ...restProps
    }));
    if (child) {
      $$renderer2.push("<!--[0-->");
      child($$renderer2, { props: mergedProps() });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<button${attributes({ ...mergedProps() })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></button>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref });
  });
}
function onDestroyEffect(fn) {
}
function Dialog_description($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const uid = props_id($$renderer2);
    let {
      id = createId(uid),
      children,
      child,
      ref = null,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const descriptionState = DialogDescriptionState.create({
      id: boxWith$1(() => id),
      ref: boxWith$1(() => ref, (v) => ref = v)
    });
    const mergedProps = derived(() => mergeProps(restProps, descriptionState.props));
    if (child) {
      $$renderer2.push("<!--[0-->");
      child($$renderer2, { props: mergedProps() });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div${attributes({ ...mergedProps() })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref });
  });
}
const avatarAttrs = createBitsAttrs({ component: "avatar", parts: ["root", "image", "fallback"] });
const AvatarRootContext = new Context("Avatar.Root");
class AvatarRootState {
  static create(opts) {
    return AvatarRootContext.set(new AvatarRootState(opts));
  }
  opts;
  domContext;
  attachment;
  constructor(opts) {
    this.opts = opts;
    this.domContext = new DOMContext(this.opts.ref);
    this.loadImage = this.loadImage.bind(this);
    this.attachment = attachRef(this.opts.ref);
  }
  loadImage(src, crossorigin, referrerPolicy) {
    if (this.opts.loadingStatus.current === "loaded") return;
    let imageTimerId;
    const image = new Image();
    image.src = src;
    if (crossorigin !== void 0) image.crossOrigin = crossorigin;
    if (referrerPolicy) image.referrerPolicy = referrerPolicy;
    this.opts.loadingStatus.current = "loading";
    image.onload = () => {
      imageTimerId = this.domContext.setTimeout(
        () => {
          this.opts.loadingStatus.current = "loaded";
        },
        this.opts.delayMs.current
      );
    };
    image.onerror = () => {
      this.opts.loadingStatus.current = "error";
    };
    return () => {
      if (!imageTimerId) return;
      this.domContext.clearTimeout(imageTimerId);
    };
  }
  #props = derived(() => ({
    id: this.opts.id.current,
    [avatarAttrs.root]: "",
    "data-status": this.opts.loadingStatus.current,
    ...this.attachment
  }));
  get props() {
    return this.#props();
  }
  set props($$value) {
    return this.#props($$value);
  }
}
class AvatarImageState {
  static create(opts) {
    return new AvatarImageState(opts, AvatarRootContext.get());
  }
  opts;
  root;
  attachment;
  constructor(opts, root) {
    this.opts = opts;
    this.root = root;
    this.attachment = attachRef(this.opts.ref);
    watch.pre(
      [
        () => this.opts.src.current,
        () => this.opts.crossOrigin.current
      ],
      ([src, crossOrigin]) => {
        if (!src) {
          this.root.opts.loadingStatus.current = "error";
          return;
        }
        this.root.loadImage(src, crossOrigin, this.opts.referrerPolicy.current);
      }
    );
  }
  #props = derived(() => ({
    id: this.opts.id.current,
    style: {
      display: this.root.opts.loadingStatus.current === "loaded" ? "block" : "none"
    },
    "data-status": this.root.opts.loadingStatus.current,
    [avatarAttrs.image]: "",
    src: this.opts.src.current,
    crossorigin: this.opts.crossOrigin.current,
    referrerpolicy: this.opts.referrerPolicy.current,
    ...this.attachment
  }));
  get props() {
    return this.#props();
  }
  set props($$value) {
    return this.#props($$value);
  }
}
class AvatarFallbackState {
  static create(opts) {
    return new AvatarFallbackState(opts, AvatarRootContext.get());
  }
  opts;
  root;
  attachment;
  constructor(opts, root) {
    this.opts = opts;
    this.root = root;
    this.attachment = attachRef(this.opts.ref);
  }
  #style = derived(() => this.root.opts.loadingStatus.current === "loaded" ? { display: "none" } : void 0);
  get style() {
    return this.#style();
  }
  set style($$value) {
    return this.#style($$value);
  }
  #props = derived(() => ({
    style: this.style,
    "data-status": this.root.opts.loadingStatus.current,
    [avatarAttrs.fallback]: "",
    ...this.attachment
  }));
  get props() {
    return this.#props();
  }
  set props($$value) {
    return this.#props($$value);
  }
}
function Avatar$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const uid = props_id($$renderer2);
    let {
      delayMs = 0,
      loadingStatus = "loading",
      onLoadingStatusChange,
      child,
      children,
      id = createId(uid),
      ref = null,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const rootState = AvatarRootState.create({
      delayMs: boxWith$1(() => delayMs),
      loadingStatus: boxWith$1(() => loadingStatus, (v) => {
        if (loadingStatus !== v) {
          loadingStatus = v;
          onLoadingStatusChange?.(v);
        }
      }),
      id: boxWith$1(() => id),
      ref: boxWith$1(() => ref, (v) => ref = v)
    });
    const mergedProps = derived(() => mergeProps(restProps, rootState.props));
    if (child) {
      $$renderer2.push("<!--[0-->");
      child($$renderer2, { props: mergedProps() });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div${attributes({ ...mergedProps() })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { loadingStatus, ref });
  });
}
function Avatar_image$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const uid = props_id($$renderer2);
    let {
      src,
      child,
      id = createId(uid),
      ref = null,
      crossorigin = void 0,
      referrerpolicy = void 0,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const imageState = AvatarImageState.create({
      src: boxWith$1(() => src),
      id: boxWith$1(() => id),
      ref: boxWith$1(() => ref, (v) => ref = v),
      crossOrigin: boxWith$1(() => crossorigin),
      referrerPolicy: boxWith$1(() => referrerpolicy)
    });
    const mergedProps = derived(() => mergeProps(restProps, imageState.props));
    if (child) {
      $$renderer2.push("<!--[0-->");
      child($$renderer2, { props: mergedProps() });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<img${attributes({ ...mergedProps(), src })} onload="this.__e=event" onerror="this.__e=event"/>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref });
  });
}
function Avatar_fallback$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const uid = props_id($$renderer2);
    let {
      children,
      child,
      id = createId(uid),
      ref = null,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const fallbackState = AvatarFallbackState.create({
      id: boxWith$1(() => id),
      ref: boxWith$1(() => ref, (v) => ref = v)
    });
    const mergedProps = derived(() => mergeProps(restProps, fallbackState.props));
    if (child) {
      $$renderer2.push("<!--[0-->");
      child($$renderer2, { props: mergedProps() });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<span${attributes({ ...mergedProps() })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></span>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref });
  });
}
const collapsibleAttrs = createBitsAttrs({
  component: "collapsible",
  parts: ["root", "content", "trigger"]
});
const CollapsibleRootContext = new Context("Collapsible.Root");
class CollapsibleRootState {
  static create(opts) {
    return CollapsibleRootContext.set(new CollapsibleRootState(opts));
  }
  opts;
  attachment;
  contentNode = null;
  contentPresence;
  contentId = void 0;
  constructor(opts) {
    this.opts = opts;
    this.toggleOpen = this.toggleOpen.bind(this);
    this.attachment = attachRef(this.opts.ref);
    this.contentPresence = new PresenceManager({
      ref: boxWith$1(() => this.contentNode),
      open: this.opts.open,
      onComplete: () => {
        this.opts.onOpenChangeComplete.current(this.opts.open.current);
      }
    });
  }
  toggleOpen() {
    this.opts.open.current = !this.opts.open.current;
  }
  #props = derived(() => ({
    id: this.opts.id.current,
    "data-state": getDataOpenClosed(this.opts.open.current),
    "data-disabled": boolToEmptyStrOrUndef(this.opts.disabled.current),
    [collapsibleAttrs.root]: "",
    ...this.attachment
  }));
  get props() {
    return this.#props();
  }
  set props($$value) {
    return this.#props($$value);
  }
}
class CollapsibleContentState {
  static create(opts) {
    return new CollapsibleContentState(opts, CollapsibleRootContext.get());
  }
  opts;
  root;
  attachment;
  #present = derived(() => {
    if (this.opts.hiddenUntilFound.current) return this.root.opts.open.current;
    return this.opts.forceMount.current || this.root.opts.open.current;
  });
  get present() {
    return this.#present();
  }
  set present($$value) {
    return this.#present($$value);
  }
  #originalStyles;
  #isMountAnimationPrevented = false;
  #width = 0;
  #height = 0;
  constructor(opts, root) {
    this.opts = opts;
    this.root = root;
    this.#isMountAnimationPrevented = root.opts.open.current;
    this.root.contentId = this.opts.id.current;
    this.attachment = attachRef(this.opts.ref, (v) => this.root.contentNode = v);
    watch.pre(() => this.opts.id.current, (id) => {
      this.root.contentId = id;
    });
    watch.pre(
      [
        () => this.opts.ref.current,
        () => this.opts.hiddenUntilFound.current
      ],
      ([node, hiddenUntilFound]) => {
        if (!node || !hiddenUntilFound) return;
        const handleBeforeMatch = () => {
          if (this.root.opts.open.current) return;
          requestAnimationFrame(() => {
            this.root.opts.open.current = true;
          });
        };
        return on(node, "beforematch", handleBeforeMatch);
      }
    );
    watch([() => this.opts.ref.current, () => this.present], ([node]) => {
      if (!node) return;
      afterTick(() => {
        if (!this.opts.ref.current) return;
        this.#originalStyles = this.#originalStyles || {
          transitionDuration: node.style.transitionDuration,
          animationName: node.style.animationName
        };
        node.style.transitionDuration = "0s";
        node.style.animationName = "none";
        const rect = node.getBoundingClientRect();
        this.#height = rect.height;
        this.#width = rect.width;
        if (!this.#isMountAnimationPrevented) {
          const { animationName, transitionDuration } = this.#originalStyles;
          node.style.transitionDuration = transitionDuration;
          node.style.animationName = animationName;
        }
      });
    });
  }
  get shouldRender() {
    return this.root.contentPresence.shouldRender;
  }
  #snippetProps = derived(() => ({ open: this.root.opts.open.current }));
  get snippetProps() {
    return this.#snippetProps();
  }
  set snippetProps($$value) {
    return this.#snippetProps($$value);
  }
  #props = derived(() => ({
    id: this.opts.id.current,
    style: {
      "--bits-collapsible-content-height": this.#height ? `${this.#height}px` : void 0,
      "--bits-collapsible-content-width": this.#width ? `${this.#width}px` : void 0
    },
    hidden: this.opts.hiddenUntilFound.current && !this.root.opts.open.current ? "until-found" : void 0,
    "data-state": getDataOpenClosed(this.root.opts.open.current),
    ...getDataTransitionAttrs(this.root.contentPresence.transitionStatus),
    "data-disabled": boolToEmptyStrOrUndef(this.root.opts.disabled.current),
    [collapsibleAttrs.content]: "",
    ...this.opts.hiddenUntilFound.current && !this.shouldRender ? {} : {
      hidden: this.opts.hiddenUntilFound.current ? !this.shouldRender : this.opts.forceMount.current ? void 0 : !this.shouldRender
    },
    ...this.attachment
  }));
  get props() {
    return this.#props();
  }
  set props($$value) {
    return this.#props($$value);
  }
}
class CollapsibleTriggerState {
  static create(opts) {
    return new CollapsibleTriggerState(opts, CollapsibleRootContext.get());
  }
  opts;
  root;
  attachment;
  #isDisabled = derived(() => this.opts.disabled.current || this.root.opts.disabled.current);
  constructor(opts, root) {
    this.opts = opts;
    this.root = root;
    this.attachment = attachRef(this.opts.ref);
    this.onclick = this.onclick.bind(this);
    this.onkeydown = this.onkeydown.bind(this);
  }
  onclick(e) {
    if (this.#isDisabled()) return;
    if (e.button !== 0) return e.preventDefault();
    this.root.toggleOpen();
  }
  onkeydown(e) {
    if (this.#isDisabled()) return;
    if (e.key === SPACE || e.key === ENTER) {
      e.preventDefault();
      this.root.toggleOpen();
    }
  }
  #props = derived(() => ({
    id: this.opts.id.current,
    type: "button",
    disabled: this.#isDisabled(),
    "aria-controls": this.root.contentId,
    "aria-expanded": boolToStr(this.root.opts.open.current),
    "data-state": getDataOpenClosed(this.root.opts.open.current),
    "data-disabled": boolToEmptyStrOrUndef(this.#isDisabled()),
    [collapsibleAttrs.trigger]: "",
    //
    onclick: this.onclick,
    onkeydown: this.onkeydown,
    ...this.attachment
  }));
  get props() {
    return this.#props();
  }
  set props($$value) {
    return this.#props($$value);
  }
}
function Collapsible$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const uid = props_id($$renderer2);
    let {
      children,
      child,
      id = createId(uid),
      ref = null,
      open = false,
      disabled = false,
      onOpenChange = noop,
      onOpenChangeComplete = noop,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const rootState = CollapsibleRootState.create({
      open: boxWith$1(() => open, (v) => {
        open = v;
        onOpenChange(v);
      }),
      disabled: boxWith$1(() => disabled),
      id: boxWith$1(() => id),
      ref: boxWith$1(() => ref, (v) => ref = v),
      onOpenChangeComplete: boxWith$1(() => onOpenChangeComplete)
    });
    const mergedProps = derived(() => mergeProps(restProps, rootState.props));
    if (child) {
      $$renderer2.push("<!--[0-->");
      child($$renderer2, { props: mergedProps() });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div${attributes({ ...mergedProps() })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref, open });
  });
}
function Collapsible_content$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const uid = props_id($$renderer2);
    let {
      child,
      ref = null,
      forceMount = false,
      hiddenUntilFound = false,
      children,
      id = createId(uid),
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const contentState = CollapsibleContentState.create({
      id: boxWith$1(() => id),
      forceMount: boxWith$1(() => forceMount),
      hiddenUntilFound: boxWith$1(() => hiddenUntilFound),
      ref: boxWith$1(() => ref, (v) => ref = v)
    });
    const mergedProps = derived(() => mergeProps(restProps, contentState.props));
    if (child) {
      $$renderer2.push("<!--[0-->");
      child($$renderer2, { ...contentState.snippetProps, props: mergedProps() });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div${attributes({ ...mergedProps() })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref });
  });
}
function Collapsible_trigger$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const uid = props_id($$renderer2);
    let {
      children,
      child,
      ref = null,
      id = createId(uid),
      disabled = false,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const triggerState = CollapsibleTriggerState.create({
      id: boxWith$1(() => id),
      ref: boxWith$1(() => ref, (v) => ref = v),
      disabled: boxWith$1(() => disabled)
    });
    const mergedProps = derived(() => mergeProps(restProps, triggerState.props));
    if (child) {
      $$renderer2.push("<!--[0-->");
      child($$renderer2, { props: mergedProps() });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<button${attributes({ ...mergedProps() })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></button>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref });
  });
}
function Arrow($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      id = useId(),
      children,
      child,
      width = 10,
      height = 5,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const mergedProps = derived(() => mergeProps(restProps, { id }));
    if (child) {
      $$renderer2.push("<!--[0-->");
      child($$renderer2, { props: mergedProps() });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<span${attributes({ ...mergedProps() })}>`);
      if (children) {
        $$renderer2.push("<!--[0-->");
        children?.($$renderer2);
        $$renderer2.push(`<!---->`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<svg${attr("width", width)}${attr("height", height)} viewBox="0 0 30 10" preserveAspectRatio="none" data-arrow=""><polygon points="0,0 30,0 15,10" fill="currentColor"></polygon></svg>`);
      }
      $$renderer2.push(`<!--]--></span>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function Floating_layer_arrow($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { id = useId(), ref = null, $$slots, $$events, ...restProps } = $$props;
    const arrowState = FloatingArrowState.create({
      id: boxWith$1(() => id),
      ref: boxWith$1(() => ref, (v) => ref = v)
    });
    const mergedProps = derived(() => mergeProps(restProps, arrowState.props));
    Arrow($$renderer2, spread_props([mergedProps()]));
    bind_props($$props, { ref });
  });
}
const separatorAttrs = createBitsAttrs({ component: "separator", parts: ["root"] });
class SeparatorRootState {
  static create(opts) {
    return new SeparatorRootState(opts);
  }
  opts;
  attachment;
  constructor(opts) {
    this.opts = opts;
    this.attachment = attachRef(opts.ref);
  }
  #props = derived(() => ({
    id: this.opts.id.current,
    role: this.opts.decorative.current ? "none" : "separator",
    "aria-orientation": this.opts.orientation.current,
    "aria-hidden": boolToStrTrueOrUndef(this.opts.decorative.current),
    "data-orientation": this.opts.orientation.current,
    [separatorAttrs.root]: "",
    ...this.attachment
  }));
  get props() {
    return this.#props();
  }
  set props($$value) {
    return this.#props($$value);
  }
}
function Separator$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const uid = props_id($$renderer2);
    let {
      id = createId(uid),
      ref = null,
      child,
      children,
      decorative = false,
      orientation = "horizontal",
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const rootState = SeparatorRootState.create({
      ref: boxWith$1(() => ref, (v) => ref = v),
      id: boxWith$1(() => id),
      decorative: boxWith$1(() => decorative),
      orientation: boxWith$1(() => orientation)
    });
    const mergedProps = derived(() => mergeProps(restProps, rootState.props));
    if (child) {
      $$renderer2.push("<!--[0-->");
      child($$renderer2, { props: mergedProps() });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div${attributes({ ...mergedProps() })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref });
  });
}
function Menu_item($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const uid = props_id($$renderer2);
    let {
      child,
      children,
      ref = null,
      id = createId(uid),
      disabled = false,
      onSelect = noop,
      closeOnSelect = true,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const itemState = MenuItemState.create({
      id: boxWith$1(() => id),
      disabled: boxWith$1(() => disabled),
      onSelect: boxWith$1(() => onSelect),
      ref: boxWith$1(() => ref, (v) => ref = v),
      closeOnSelect: boxWith$1(() => closeOnSelect)
    });
    const mergedProps = derived(() => mergeProps(restProps, itemState.props));
    if (child) {
      $$renderer2.push("<!--[0-->");
      child($$renderer2, { props: mergedProps() });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div${attributes({ ...mergedProps() })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref });
  });
}
function Menu_group($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const uid = props_id($$renderer2);
    let {
      children,
      child,
      ref = null,
      id = createId(uid),
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const groupState = MenuGroupState.create({
      id: boxWith$1(() => id),
      ref: boxWith$1(() => ref, (v) => ref = v)
    });
    const mergedProps = derived(() => mergeProps(restProps, groupState.props));
    if (child) {
      $$renderer2.push("<!--[0-->");
      child($$renderer2, { props: mergedProps() });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div${attributes({ ...mergedProps() })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref });
  });
}
function Menu_separator($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const uid = props_id($$renderer2);
    let {
      ref = null,
      id = createId(uid),
      child,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const separatorState = MenuSeparatorState.create({
      id: boxWith$1(() => id),
      ref: boxWith$1(() => ref, (v) => ref = v)
    });
    const mergedProps = derived(() => mergeProps(restProps, separatorState.props));
    if (child) {
      $$renderer2.push("<!--[0-->");
      child($$renderer2, { props: mergedProps() });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div${attributes({ ...mergedProps() })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref });
  });
}
function isPointInPolygon(point, polygon) {
  const [x, y] = point;
  let isInside = false;
  const length = polygon.length;
  for (let i = 0, j = length - 1; i < length; j = i++) {
    const [xi, yi] = polygon[i] ?? [0, 0];
    const [xj, yj] = polygon[j] ?? [0, 0];
    const intersect = yi >= y !== yj >= y && x <= (xj - xi) * (y - yi) / (yj - yi) + xi;
    if (intersect) {
      isInside = !isInside;
    }
  }
  return isInside;
}
function isInsideRect(point, rect) {
  return point[0] >= rect.left && point[0] <= rect.right && point[1] >= rect.top && point[1] <= rect.bottom;
}
function getSide(triggerRect, contentRect) {
  const triggerCenterX = triggerRect.left + triggerRect.width / 2;
  const triggerCenterY = triggerRect.top + triggerRect.height / 2;
  const contentCenterX = contentRect.left + contentRect.width / 2;
  const contentCenterY = contentRect.top + contentRect.height / 2;
  const deltaX = contentCenterX - triggerCenterX;
  const deltaY = contentCenterY - triggerCenterY;
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > 0 ? "right" : "left";
  }
  return deltaY > 0 ? "bottom" : "top";
}
class SafePolygon {
  #opts;
  #buffer;
  #transitIntentTimeout;
  // tracks the cursor position when leaving trigger or content
  #exitPoint = null;
  // tracks what we're moving toward: "content" when leaving trigger, "trigger" when leaving content
  #exitTarget = null;
  #transitTargets = [];
  #trackedTriggerNode = null;
  #leaveFallbackRafId = null;
  #transitIntentTimeoutId = null;
  #cancelLeaveFallback() {
    if (this.#leaveFallbackRafId !== null) {
      cancelAnimationFrame(this.#leaveFallbackRafId);
      this.#leaveFallbackRafId = null;
    }
  }
  #scheduleLeaveFallback() {
    this.#cancelLeaveFallback();
    this.#leaveFallbackRafId = requestAnimationFrame(() => {
      this.#leaveFallbackRafId = null;
      if (!this.#exitPoint || !this.#exitTarget) return;
      this.#clearTracking();
      this.#opts.onPointerExit();
    });
  }
  #cancelTransitIntentTimeout() {
    if (this.#transitIntentTimeoutId !== null) {
      clearTimeout(this.#transitIntentTimeoutId);
      this.#transitIntentTimeoutId = null;
    }
  }
  #scheduleTransitIntentTimeout() {
    if (this.#transitIntentTimeout === null) return;
    this.#cancelTransitIntentTimeout();
    this.#transitIntentTimeoutId = window.setTimeout(
      () => {
        this.#transitIntentTimeoutId = null;
        if (!this.#exitPoint || !this.#exitTarget) return;
        this.#clearTracking();
        this.#opts.onPointerExit();
      },
      this.#transitIntentTimeout
    );
  }
  constructor(opts) {
    this.#opts = opts;
    this.#buffer = opts.buffer ?? 1;
    const transitIntentTimeout = opts.transitIntentTimeout;
    this.#transitIntentTimeout = typeof transitIntentTimeout === "number" && transitIntentTimeout > 0 ? transitIntentTimeout : null;
    watch([opts.triggerNode, opts.contentNode, opts.enabled], ([triggerNode, contentNode, enabled]) => {
      if (!triggerNode || !contentNode || !enabled) {
        this.#trackedTriggerNode = null;
        this.#clearTracking();
        return;
      }
      if (this.#trackedTriggerNode && this.#trackedTriggerNode !== triggerNode) {
        this.#clearTracking();
      }
      this.#trackedTriggerNode = triggerNode;
      const doc = getDocument(triggerNode);
      const handlePointerMove = (e) => {
        this.#onPointerMove([e.clientX, e.clientY], triggerNode, contentNode);
      };
      const handleTriggerLeave = (e) => {
        const target = e.relatedTarget;
        if (isElement(target) && contentNode.contains(target)) {
          return;
        }
        const ignoredTargets = this.#opts.ignoredTargets?.() ?? [];
        if (isElement(target) && ignoredTargets.some((n) => n === target || n.contains(target))) {
          return;
        }
        this.#transitTargets = isElement(target) && ignoredTargets.length > 0 ? ignoredTargets.filter((n) => target.contains(n)) : [];
        this.#exitPoint = [e.clientX, e.clientY];
        this.#exitTarget = "content";
        this.#scheduleLeaveFallback();
      };
      const handleTriggerEnter = () => {
        this.#clearTracking();
      };
      const handleContentEnter = () => {
        this.#clearTracking();
      };
      const handleContentLeave = (e) => {
        const target = e.relatedTarget;
        if (isElement(target) && triggerNode.contains(target)) {
          return;
        }
        this.#exitPoint = [e.clientX, e.clientY];
        this.#exitTarget = "trigger";
        this.#scheduleLeaveFallback();
      };
      return [
        on(doc, "pointermove", handlePointerMove),
        on(triggerNode, "pointerleave", handleTriggerLeave),
        on(triggerNode, "pointerenter", handleTriggerEnter),
        on(contentNode, "pointerenter", handleContentEnter),
        on(contentNode, "pointerleave", handleContentLeave)
      ].reduce(
        (acc, cleanup) => () => {
          acc();
          cleanup();
        },
        () => {
        }
      );
    });
  }
  #onPointerMove(clientPoint, triggerNode, contentNode) {
    if (!this.#exitPoint || !this.#exitTarget) return;
    this.#cancelLeaveFallback();
    this.#scheduleTransitIntentTimeout();
    const triggerRect = triggerNode.getBoundingClientRect();
    const contentRect = contentNode.getBoundingClientRect();
    if (this.#exitTarget === "content" && isInsideRect(clientPoint, contentRect)) {
      this.#clearTracking();
      return;
    }
    if (this.#exitTarget === "trigger" && isInsideRect(clientPoint, triggerRect)) {
      this.#clearTracking();
      return;
    }
    if (this.#exitTarget === "content" && this.#transitTargets.length > 0) {
      for (const transitTarget of this.#transitTargets) {
        const transitRect = transitTarget.getBoundingClientRect();
        if (isInsideRect(clientPoint, transitRect)) return;
        const transitSide = getSide(triggerRect, transitRect);
        const transitCorridor = this.#getCorridorPolygon(triggerRect, transitRect, transitSide);
        if (transitCorridor && isPointInPolygon(clientPoint, transitCorridor)) return;
      }
    }
    const side = getSide(triggerRect, contentRect);
    const corridorPoly = this.#getCorridorPolygon(triggerRect, contentRect, side);
    if (corridorPoly && isPointInPolygon(clientPoint, corridorPoly)) {
      return;
    }
    const targetRect = this.#exitTarget === "content" ? contentRect : triggerRect;
    const safePoly = this.#getSafePolygon(this.#exitPoint, targetRect, side, this.#exitTarget);
    if (isPointInPolygon(clientPoint, safePoly)) {
      return;
    }
    this.#clearTracking();
    this.#opts.onPointerExit();
  }
  #clearTracking() {
    this.#exitPoint = null;
    this.#exitTarget = null;
    this.#transitTargets = [];
    this.#cancelLeaveFallback();
    this.#cancelTransitIntentTimeout();
  }
  /**
   * Creates a rectangular corridor between trigger and content
   * This prevents closing when cursor is in the gap between them
   */
  #getCorridorPolygon(triggerRect, contentRect, side) {
    const buffer = this.#buffer;
    switch (side) {
      case "top":
        return [
          [
            Math.min(triggerRect.left, contentRect.left) - buffer,
            triggerRect.top
          ],
          [
            Math.min(triggerRect.left, contentRect.left) - buffer,
            contentRect.bottom
          ],
          [
            Math.max(triggerRect.right, contentRect.right) + buffer,
            contentRect.bottom
          ],
          [
            Math.max(triggerRect.right, contentRect.right) + buffer,
            triggerRect.top
          ]
        ];
      case "bottom":
        return [
          [
            Math.min(triggerRect.left, contentRect.left) - buffer,
            triggerRect.bottom
          ],
          [
            Math.min(triggerRect.left, contentRect.left) - buffer,
            contentRect.top
          ],
          [
            Math.max(triggerRect.right, contentRect.right) + buffer,
            contentRect.top
          ],
          [
            Math.max(triggerRect.right, contentRect.right) + buffer,
            triggerRect.bottom
          ]
        ];
      case "left":
        return [
          [
            triggerRect.left,
            Math.min(triggerRect.top, contentRect.top) - buffer
          ],
          [
            contentRect.right,
            Math.min(triggerRect.top, contentRect.top) - buffer
          ],
          [
            contentRect.right,
            Math.max(triggerRect.bottom, contentRect.bottom) + buffer
          ],
          [
            triggerRect.left,
            Math.max(triggerRect.bottom, contentRect.bottom) + buffer
          ]
        ];
      case "right":
        return [
          [
            triggerRect.right,
            Math.min(triggerRect.top, contentRect.top) - buffer
          ],
          [
            contentRect.left,
            Math.min(triggerRect.top, contentRect.top) - buffer
          ],
          [
            contentRect.left,
            Math.max(triggerRect.bottom, contentRect.bottom) + buffer
          ],
          [
            triggerRect.right,
            Math.max(triggerRect.bottom, contentRect.bottom) + buffer
          ]
        ];
    }
  }
  /**
   * Creates a triangular/trapezoidal safe zone from the exit point to the target
   */
  #getSafePolygon(exitPoint, targetRect, side, exitTarget) {
    const buffer = this.#buffer * 4;
    const [x, y] = exitPoint;
    const effectiveSide = exitTarget === "trigger" ? this.#flipSide(side) : side;
    switch (effectiveSide) {
      case "top":
        return [
          [x - buffer, y + buffer],
          [x + buffer, y + buffer],
          [targetRect.right + buffer, targetRect.bottom],
          [targetRect.right + buffer, targetRect.top],
          [targetRect.left - buffer, targetRect.top],
          [targetRect.left - buffer, targetRect.bottom]
        ];
      case "bottom":
        return [
          [x - buffer, y - buffer],
          [x + buffer, y - buffer],
          [targetRect.right + buffer, targetRect.top],
          [targetRect.right + buffer, targetRect.bottom],
          [targetRect.left - buffer, targetRect.bottom],
          [targetRect.left - buffer, targetRect.top]
        ];
      case "left":
        return [
          [x + buffer, y - buffer],
          [x + buffer, y + buffer],
          [targetRect.right, targetRect.bottom + buffer],
          [targetRect.left, targetRect.bottom + buffer],
          [targetRect.left, targetRect.top - buffer],
          [targetRect.right, targetRect.top - buffer]
        ];
      case "right":
        return [
          [x - buffer, y - buffer],
          [x - buffer, y + buffer],
          [targetRect.left, targetRect.bottom + buffer],
          [targetRect.right, targetRect.bottom + buffer],
          [targetRect.right, targetRect.top - buffer],
          [targetRect.left, targetRect.top - buffer]
        ];
    }
  }
  #flipSide(side) {
    switch (side) {
      case "top":
        return "bottom";
      case "bottom":
        return "top";
      case "left":
        return "right";
      case "right":
        return "left";
    }
  }
}
function Menu($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      open = false,
      dir = "ltr",
      // debugMode = false,
      onOpenChange = noop,
      onOpenChangeComplete = noop,
      _internal_variant: variant = "dropdown-menu",
      _internal_should_skip_exit_animation: shouldSkipExitAnimation = void 0,
      children
    } = $$props;
    const root = MenuRootState.create({
      variant: boxWith$1(() => variant),
      dir: boxWith$1(() => dir),
      // debugMode: boxWith(() => debugMode),
      onClose: () => {
        open = false;
        onOpenChange(false);
      },
      shouldSkipExitAnimation: () => shouldSkipExitAnimation?.() ?? false
    });
    MenuMenuState.create(
      {
        open: boxWith$1(() => open, (v) => {
          open = v;
          onOpenChange(v);
        }),
        onOpenChangeComplete: boxWith$1(() => onOpenChangeComplete)
      },
      root
    );
    Floating_layer($$renderer2, {
      children: ($$renderer3) => {
        children?.($$renderer3);
        $$renderer3.push(`<!---->`);
      }
    });
    bind_props($$props, { open });
  });
}
function Dropdown_menu_content$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const uid = props_id($$renderer2);
    let {
      id = createId(uid),
      child,
      children,
      ref = null,
      loop = true,
      onInteractOutside = noop,
      onEscapeKeydown = noop,
      onCloseAutoFocus = noop,
      forceMount = false,
      trapFocus = false,
      style,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const contentState = MenuContentState.create({
      id: boxWith$1(() => id),
      loop: boxWith$1(() => loop),
      ref: boxWith$1(() => ref, (v) => ref = v),
      onCloseAutoFocus: boxWith$1(() => onCloseAutoFocus)
    });
    const mergedProps = derived(() => mergeProps(restProps, contentState.props));
    function handleInteractOutside(e) {
      contentState.handleInteractOutside(e);
      if (e.defaultPrevented) return;
      onInteractOutside(e);
      if (e.defaultPrevented) return;
      if (e.target && e.target instanceof Element) {
        const subContentSelector = `[${contentState.parentMenu.root.getBitsAttr("sub-content")}]`;
        if (e.target.closest(subContentSelector)) return;
      }
      contentState.parentMenu.onClose();
    }
    function handleEscapeKeydown(e) {
      onEscapeKeydown(e);
      if (e.defaultPrevented) return;
      contentState.parentMenu.onClose();
    }
    if (forceMount) {
      $$renderer2.push("<!--[0-->");
      {
        let popper = function($$renderer3, { props, wrapperProps }) {
          const finalProps = mergeProps(props, { style: getFloatingContentCSSVars("dropdown-menu") }, { style });
          if (child) {
            $$renderer3.push("<!--[0-->");
            child($$renderer3, {
              props: finalProps,
              wrapperProps,
              ...contentState.snippetProps
            });
            $$renderer3.push(`<!---->`);
          } else {
            $$renderer3.push("<!--[-1-->");
            $$renderer3.push(`<div${attributes({ ...wrapperProps })}><div${attributes({ ...finalProps })}>`);
            children?.($$renderer3);
            $$renderer3.push(`<!----></div></div>`);
          }
          $$renderer3.push(`<!--]-->`);
        };
        Popper_layer_force_mount($$renderer2, spread_props([
          mergedProps(),
          contentState.popperProps,
          {
            ref: contentState.opts.ref,
            enabled: contentState.parentMenu.opts.open.current,
            onInteractOutside: handleInteractOutside,
            onEscapeKeydown: handleEscapeKeydown,
            trapFocus,
            loop,
            forceMount: true,
            id,
            shouldRender: contentState.shouldRender,
            popper,
            $$slots: { popper: true }
          }
        ]));
      }
    } else if (!forceMount) {
      $$renderer2.push("<!--[1-->");
      {
        let popper = function($$renderer3, { props, wrapperProps }) {
          const finalProps = mergeProps(props, { style: getFloatingContentCSSVars("dropdown-menu") }, { style });
          if (child) {
            $$renderer3.push("<!--[0-->");
            child($$renderer3, {
              props: finalProps,
              wrapperProps,
              ...contentState.snippetProps
            });
            $$renderer3.push(`<!---->`);
          } else {
            $$renderer3.push("<!--[-1-->");
            $$renderer3.push(`<div${attributes({ ...wrapperProps })}><div${attributes({ ...finalProps })}>`);
            children?.($$renderer3);
            $$renderer3.push(`<!----></div></div>`);
          }
          $$renderer3.push(`<!--]-->`);
        };
        Popper_layer($$renderer2, spread_props([
          mergedProps(),
          contentState.popperProps,
          {
            ref: contentState.opts.ref,
            open: contentState.parentMenu.opts.open.current,
            onInteractOutside: handleInteractOutside,
            onEscapeKeydown: handleEscapeKeydown,
            trapFocus,
            loop,
            forceMount: false,
            id,
            shouldRender: contentState.shouldRender,
            popper,
            $$slots: { popper: true }
          }
        ]));
      }
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref });
  });
}
function Menu_trigger($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const uid = props_id($$renderer2);
    let {
      id = createId(uid),
      ref = null,
      child,
      children,
      disabled = false,
      type = "button",
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const triggerState = DropdownMenuTriggerState.create({
      id: boxWith$1(() => id),
      disabled: boxWith$1(() => disabled ?? false),
      ref: boxWith$1(() => ref, (v) => ref = v)
    });
    const mergedProps = derived(() => mergeProps(restProps, triggerState.props, { type }));
    Floating_layer_anchor($$renderer2, {
      id,
      ref: triggerState.opts.ref,
      children: ($$renderer3) => {
        if (child) {
          $$renderer3.push("<!--[0-->");
          child($$renderer3, { props: mergedProps() });
          $$renderer3.push(`<!---->`);
        } else {
          $$renderer3.push("<!--[-1-->");
          $$renderer3.push(`<button${attributes({ ...mergedProps() })}>`);
          children?.($$renderer3);
          $$renderer3.push(`<!----></button>`);
        }
        $$renderer3.push(`<!--]-->`);
      }
    });
    bind_props($$props, { ref });
  });
}
class TimeoutFn {
  #interval;
  #cb;
  #timer = null;
  constructor(cb, interval) {
    this.#cb = cb;
    this.#interval = interval;
    this.stop = this.stop.bind(this);
    this.start = this.start.bind(this);
    onDestroyEffect(this.stop);
  }
  #clear() {
    if (this.#timer !== null) {
      window.clearTimeout(this.#timer);
      this.#timer = null;
    }
  }
  stop() {
    this.#clear();
  }
  start(...args) {
    this.#clear();
    this.#timer = window.setTimeout(() => {
      this.#timer = null;
      this.#cb(...args);
    }, this.#interval);
  }
}
const tooltipAttrs = createBitsAttrs({ component: "tooltip", parts: ["content", "trigger"] });
const TooltipProviderContext = new Context("Tooltip.Provider");
const TooltipRootContext = new Context("Tooltip.Root");
class TooltipTriggerRegistryState {
  triggers = /* @__PURE__ */ new Map();
  activeTriggerId = null;
  #activeTriggerNode = derived(() => {
    const activeTriggerId = this.activeTriggerId;
    if (activeTriggerId === null) return null;
    return this.triggers.get(activeTriggerId)?.node ?? null;
  });
  get activeTriggerNode() {
    return this.#activeTriggerNode();
  }
  set activeTriggerNode($$value) {
    return this.#activeTriggerNode($$value);
  }
  #activePayload = derived(() => {
    const activeTriggerId = this.activeTriggerId;
    if (activeTriggerId === null) return null;
    return this.triggers.get(activeTriggerId)?.payload ?? null;
  });
  get activePayload() {
    return this.#activePayload();
  }
  set activePayload($$value) {
    return this.#activePayload($$value);
  }
  register = (record) => {
    const next = new Map(this.triggers);
    next.set(record.id, record);
    this.triggers = next;
    this.#coerceActiveTrigger();
  };
  update = (record) => {
    const next = new Map(this.triggers);
    next.set(record.id, record);
    this.triggers = next;
    this.#coerceActiveTrigger();
  };
  unregister = (id) => {
    if (!this.triggers.has(id)) return;
    const next = new Map(this.triggers);
    next.delete(id);
    this.triggers = next;
    if (this.activeTriggerId === id) {
      this.activeTriggerId = null;
    }
  };
  setActiveTrigger = (id) => {
    if (id === null) {
      this.activeTriggerId = null;
      return;
    }
    if (!this.triggers.has(id)) {
      this.activeTriggerId = null;
      return;
    }
    this.activeTriggerId = id;
  };
  get = (id) => {
    return this.triggers.get(id);
  };
  has = (id) => {
    return this.triggers.has(id);
  };
  getFirstTriggerId = () => {
    const firstEntry = this.triggers.entries().next();
    if (firstEntry.done) return null;
    return firstEntry.value[0];
  };
  #coerceActiveTrigger = () => {
    const activeTriggerId = this.activeTriggerId;
    if (activeTriggerId === null) return;
    if (!this.triggers.has(activeTriggerId)) {
      this.activeTriggerId = null;
    }
  };
}
class TooltipProviderState {
  static create(opts) {
    return TooltipProviderContext.set(new TooltipProviderState(opts));
  }
  opts;
  isOpenDelayed = true;
  isPointerInTransit = simpleBox(false);
  #timerFn;
  #openTooltip = null;
  constructor(opts) {
    this.opts = opts;
    this.#timerFn = new TimeoutFn(
      () => {
        this.isOpenDelayed = true;
      },
      this.opts.skipDelayDuration.current
    );
  }
  #startTimer = () => {
    const skipDuration = this.opts.skipDelayDuration.current;
    if (skipDuration === 0) {
      this.isOpenDelayed = true;
      return;
    } else {
      this.#timerFn.start();
    }
  };
  #clearTimer = () => {
    this.#timerFn.stop();
  };
  onOpen = (tooltip) => {
    if (this.#openTooltip && this.#openTooltip !== tooltip) {
      this.#openTooltip.handleClose();
    }
    this.#clearTimer();
    this.isOpenDelayed = false;
    this.#openTooltip = tooltip;
  };
  onClose = (tooltip) => {
    if (this.#openTooltip === tooltip) {
      this.#openTooltip = null;
      this.#startTimer();
    }
  };
  isTooltipOpen = (tooltip) => {
    return this.#openTooltip === tooltip;
  };
}
class TooltipRootState {
  static create(opts) {
    return TooltipRootContext.set(new TooltipRootState(opts, TooltipProviderContext.get()));
  }
  opts;
  provider;
  #delayDuration = derived(() => this.opts.delayDuration.current ?? this.provider.opts.delayDuration.current);
  get delayDuration() {
    return this.#delayDuration();
  }
  set delayDuration($$value) {
    return this.#delayDuration($$value);
  }
  #disableHoverableContent = derived(() => this.opts.disableHoverableContent.current ?? this.provider.opts.disableHoverableContent.current);
  get disableHoverableContent() {
    return this.#disableHoverableContent();
  }
  set disableHoverableContent($$value) {
    return this.#disableHoverableContent($$value);
  }
  #disableCloseOnTriggerClick = derived(() => this.opts.disableCloseOnTriggerClick.current ?? this.provider.opts.disableCloseOnTriggerClick.current);
  get disableCloseOnTriggerClick() {
    return this.#disableCloseOnTriggerClick();
  }
  set disableCloseOnTriggerClick($$value) {
    return this.#disableCloseOnTriggerClick($$value);
  }
  #disabled = derived(() => this.opts.disabled.current ?? this.provider.opts.disabled.current);
  get disabled() {
    return this.#disabled();
  }
  set disabled($$value) {
    return this.#disabled($$value);
  }
  #ignoreNonKeyboardFocus = derived(() => this.opts.ignoreNonKeyboardFocus.current ?? this.provider.opts.ignoreNonKeyboardFocus.current);
  get ignoreNonKeyboardFocus() {
    return this.#ignoreNonKeyboardFocus();
  }
  set ignoreNonKeyboardFocus($$value) {
    return this.#ignoreNonKeyboardFocus($$value);
  }
  registry;
  tether;
  contentNode = null;
  contentPresence;
  #wasOpenDelayed = false;
  #timerFn;
  #stateAttr = derived(() => {
    if (!this.opts.open.current) return "closed";
    return this.#wasOpenDelayed ? "delayed-open" : "instant-open";
  });
  get stateAttr() {
    return this.#stateAttr();
  }
  set stateAttr($$value) {
    return this.#stateAttr($$value);
  }
  constructor(opts, provider) {
    this.opts = opts;
    this.provider = provider;
    this.tether = opts.tether.current?.state ?? null;
    this.registry = this.tether?.registry ?? new TooltipTriggerRegistryState();
    this.#timerFn = new TimeoutFn(
      () => {
        this.#wasOpenDelayed = true;
        this.opts.open.current = true;
      },
      this.delayDuration ?? 0
    );
    if (this.tether) {
      this.tether.root = this;
    }
    this.contentPresence = new PresenceManager({
      open: this.opts.open,
      ref: boxWith$1(() => this.contentNode),
      onComplete: () => {
        this.opts.onOpenChangeComplete.current(this.opts.open.current);
      }
    });
    watch(() => this.delayDuration, () => {
      if (this.delayDuration === void 0) return;
      this.#timerFn = new TimeoutFn(
        () => {
          this.#wasOpenDelayed = true;
          this.opts.open.current = true;
        },
        this.delayDuration
      );
    });
    watch(
      () => this.opts.open.current,
      (isOpen) => {
        if (isOpen) {
          this.ensureActiveTrigger();
          this.provider.onOpen(this);
        } else {
          this.provider.onClose(this);
        }
      },
      { lazy: true }
    );
    watch(() => this.opts.triggerId.current, (triggerId) => {
      if (triggerId === this.registry.activeTriggerId) return;
      this.registry.setActiveTrigger(triggerId);
    });
    watch(() => this.registry.activeTriggerId, (activeTriggerId) => {
      if (this.opts.triggerId.current === activeTriggerId) return;
      this.opts.triggerId.current = activeTriggerId;
    });
  }
  handleOpen = () => {
    this.#timerFn.stop();
    this.#wasOpenDelayed = false;
    this.ensureActiveTrigger();
    this.opts.open.current = true;
  };
  handleClose = () => {
    this.#timerFn.stop();
    this.opts.open.current = false;
  };
  #handleDelayedOpen = () => {
    this.#timerFn.stop();
    const shouldSkipDelay = !this.provider.isOpenDelayed;
    const delayDuration = this.delayDuration ?? 0;
    if (shouldSkipDelay || delayDuration === 0) {
      this.#wasOpenDelayed = false;
      this.opts.open.current = true;
    } else {
      this.#timerFn.start();
    }
  };
  onTriggerEnter = (triggerId) => {
    this.setActiveTrigger(triggerId);
    this.#handleDelayedOpen();
  };
  onTriggerLeave = () => {
    if (this.disableHoverableContent) {
      this.handleClose();
    } else {
      this.#timerFn.stop();
    }
  };
  ensureActiveTrigger = () => {
    if (this.registry.activeTriggerId !== null && this.registry.has(this.registry.activeTriggerId)) {
      return;
    }
    if (this.opts.triggerId.current !== null && this.registry.has(this.opts.triggerId.current)) {
      this.registry.setActiveTrigger(this.opts.triggerId.current);
      return;
    }
    const firstTriggerId = this.registry.getFirstTriggerId();
    this.registry.setActiveTrigger(firstTriggerId);
  };
  setActiveTrigger = (triggerId) => {
    this.registry.setActiveTrigger(triggerId);
  };
  registerTrigger = (trigger) => {
    this.registry.register(trigger);
    if (trigger.disabled && this.registry.activeTriggerId === trigger.id && this.opts.open.current) {
      this.handleClose();
    }
  };
  updateTrigger = (trigger) => {
    this.registry.update(trigger);
    if (trigger.disabled && this.registry.activeTriggerId === trigger.id && this.opts.open.current) {
      this.handleClose();
    }
  };
  unregisterTrigger = (id) => {
    const isActive = this.registry.activeTriggerId === id;
    this.registry.unregister(id);
    if (isActive && this.opts.open.current) {
      this.handleClose();
    }
  };
  isActiveTrigger = (triggerId) => {
    return this.registry.activeTriggerId === triggerId;
  };
  get triggerNode() {
    return this.registry.activeTriggerNode;
  }
  get activePayload() {
    return this.registry.activePayload;
  }
  get activeTriggerId() {
    return this.registry.activeTriggerId;
  }
}
class TooltipTriggerState {
  static create(opts) {
    if (opts.tether.current) {
      return new TooltipTriggerState(opts, null, opts.tether.current.state);
    }
    return new TooltipTriggerState(opts, TooltipRootContext.get(), null);
  }
  opts;
  root;
  tether;
  attachment;
  #isPointerDown = simpleBox(false);
  #hasPointerMoveOpened = false;
  domContext;
  #transitCheckTimeout = null;
  #mounted = false;
  #lastRegisteredId = null;
  constructor(opts, root, tether) {
    this.opts = opts;
    this.root = root;
    this.tether = tether;
    this.domContext = new DOMContext(opts.ref);
    this.attachment = attachRef(this.opts.ref, (v) => this.#register(v));
    watch(() => this.opts.id.current, () => {
      this.#register(this.opts.ref.current);
    });
    watch(() => this.opts.payload.current, () => {
      this.#register(this.opts.ref.current);
    });
    watch(() => this.opts.disabled.current, () => {
      this.#register(this.opts.ref.current);
    });
  }
  #getRoot = () => {
    return this.tether?.root ?? this.root;
  };
  #isDisabled = () => {
    const root = this.#getRoot();
    return this.opts.disabled.current || Boolean(root?.disabled);
  };
  #register = (node) => {
    if (!this.#mounted) return;
    const id = this.opts.id.current;
    const payload = this.opts.payload.current;
    const disabled = this.opts.disabled.current;
    if (this.#lastRegisteredId && this.#lastRegisteredId !== id) {
      const root2 = this.#getRoot();
      if (this.tether) {
        this.tether.registry.unregister(this.#lastRegisteredId);
      } else {
        root2?.unregisterTrigger(this.#lastRegisteredId);
      }
    }
    const triggerRecord = { id, node, payload, disabled };
    const root = this.#getRoot();
    if (this.tether) {
      if (this.tether.registry.has(id)) {
        this.tether.registry.update(triggerRecord);
      } else {
        this.tether.registry.register(triggerRecord);
      }
      if (disabled && this.tether.registry.activeTriggerId === id && root?.opts.open.current) {
        root.handleClose();
      }
    } else {
      if (root?.registry.has(id)) {
        root.updateTrigger(triggerRecord);
      } else {
        root?.registerTrigger(triggerRecord);
      }
    }
    this.#lastRegisteredId = id;
  };
  #clearTransitCheck = () => {
    if (this.#transitCheckTimeout !== null) {
      clearTimeout(this.#transitCheckTimeout);
      this.#transitCheckTimeout = null;
    }
  };
  handlePointerUp = () => {
    this.#isPointerDown.current = false;
  };
  #onpointerup = () => {
    if (this.#isDisabled()) return;
    this.#isPointerDown.current = false;
  };
  #onpointerdown = () => {
    if (this.#isDisabled()) return;
    this.#isPointerDown.current = true;
    this.domContext.getDocument().addEventListener(
      "pointerup",
      () => {
        this.handlePointerUp();
      },
      { once: true }
    );
  };
  #onpointerenter = (e) => {
    const root = this.#getRoot();
    if (!root) return;
    if (this.#isDisabled()) {
      if (root.opts.open.current) {
        root.handleClose();
      }
      return;
    }
    if (e.pointerType === "touch") return;
    if (root.provider.isPointerInTransit.current) {
      this.#clearTransitCheck();
      this.#transitCheckTimeout = window.setTimeout(
        () => {
          if (root.provider.isPointerInTransit.current) {
            root.provider.isPointerInTransit.current = false;
            root.onTriggerEnter(this.opts.id.current);
            this.#hasPointerMoveOpened = true;
          }
        },
        250
      );
      return;
    }
    root.onTriggerEnter(this.opts.id.current);
    this.#hasPointerMoveOpened = true;
  };
  #onpointermove = (e) => {
    const root = this.#getRoot();
    if (!root) return;
    if (this.#isDisabled()) {
      if (root.opts.open.current) {
        root.handleClose();
      }
      return;
    }
    if (e.pointerType === "touch") return;
    if (this.#hasPointerMoveOpened) return;
    this.#clearTransitCheck();
    root.provider.isPointerInTransit.current = false;
    root.onTriggerEnter(this.opts.id.current);
    this.#hasPointerMoveOpened = true;
  };
  #onpointerleave = (e) => {
    const root = this.#getRoot();
    if (!root) return;
    if (this.#isDisabled()) return;
    this.#clearTransitCheck();
    if (!root.isActiveTrigger(this.opts.id.current)) {
      this.#hasPointerMoveOpened = false;
      return;
    }
    const relatedTarget = e.relatedTarget;
    if (isElement(relatedTarget)) {
      for (const record of root.registry.triggers.values()) {
        if (record.node !== relatedTarget) continue;
        if (root.provider.opts.skipDelayDuration.current > 0) {
          this.#hasPointerMoveOpened = false;
          return;
        }
        root.handleClose();
        this.#hasPointerMoveOpened = false;
        return;
      }
    }
    root.onTriggerLeave();
    this.#hasPointerMoveOpened = false;
  };
  #onfocus = (e) => {
    const root = this.#getRoot();
    if (!root) return;
    if (this.#isPointerDown.current) return;
    if (this.#isDisabled()) {
      if (root.opts.open.current) {
        root.handleClose();
      }
      return;
    }
    if (root.ignoreNonKeyboardFocus && !isFocusVisible(e.currentTarget)) return;
    root.setActiveTrigger(this.opts.id.current);
    root.handleOpen();
  };
  #onblur = () => {
    const root = this.#getRoot();
    if (!root || this.#isDisabled()) return;
    root.handleClose();
  };
  #onclick = () => {
    const root = this.#getRoot();
    if (!root || root.disableCloseOnTriggerClick || this.#isDisabled()) return;
    root.handleClose();
  };
  #props = derived(() => {
    const root = this.#getRoot();
    const isOpenForTrigger = Boolean(root?.opts.open.current && root.isActiveTrigger(this.opts.id.current));
    const isDisabled = this.#isDisabled();
    return {
      id: this.opts.id.current,
      "aria-describedby": isOpenForTrigger ? root?.contentNode?.id : void 0,
      "data-state": isOpenForTrigger ? root?.stateAttr : "closed",
      "data-disabled": boolToEmptyStrOrUndef(isDisabled),
      "data-delay-duration": `${root?.delayDuration ?? 0}`,
      [tooltipAttrs.trigger]: "",
      tabindex: isDisabled ? void 0 : this.opts.tabindex.current,
      disabled: this.opts.disabled.current,
      onpointerup: this.#onpointerup,
      onpointerdown: this.#onpointerdown,
      onpointerenter: this.#onpointerenter,
      onpointermove: this.#onpointermove,
      onpointerleave: this.#onpointerleave,
      onfocus: this.#onfocus,
      onblur: this.#onblur,
      onclick: this.#onclick,
      ...this.attachment
    };
  });
  get props() {
    return this.#props();
  }
  set props($$value) {
    return this.#props($$value);
  }
}
class TooltipContentState {
  static create(opts) {
    return new TooltipContentState(opts, TooltipRootContext.get());
  }
  opts;
  root;
  attachment;
  constructor(opts, root) {
    this.opts = opts;
    this.root = root;
    this.attachment = attachRef(this.opts.ref, (v) => this.root.contentNode = v);
    new SafePolygon({
      triggerNode: () => this.root.triggerNode,
      contentNode: () => this.root.contentNode,
      enabled: () => this.root.opts.open.current && !this.root.disableHoverableContent,
      transitIntentTimeout: 180,
      ignoredTargets: () => {
        if (this.root.provider.opts.skipDelayDuration.current === 0) return [];
        const nodes = [];
        const activeTriggerNode = this.root.triggerNode;
        for (const record of this.root.registry.triggers.values()) {
          if (record.node && record.node !== activeTriggerNode) {
            nodes.push(record.node);
          }
        }
        return nodes;
      },
      onPointerExit: () => {
        if (this.root.provider.isTooltipOpen(this.root)) {
          this.root.handleClose();
        }
      }
    });
  }
  onInteractOutside = (e) => {
    if (isElement(e.target) && this.root.triggerNode?.contains(e.target) && this.root.disableCloseOnTriggerClick) {
      e.preventDefault();
      return;
    }
    this.opts.onInteractOutside.current(e);
    if (e.defaultPrevented) return;
    this.root.handleClose();
  };
  onEscapeKeydown = (e) => {
    this.opts.onEscapeKeydown.current?.(e);
    if (e.defaultPrevented) return;
    this.root.handleClose();
  };
  onOpenAutoFocus = (e) => {
    e.preventDefault();
  };
  onCloseAutoFocus = (e) => {
    e.preventDefault();
  };
  get shouldRender() {
    return this.root.contentPresence.shouldRender;
  }
  #snippetProps = derived(() => ({ open: this.root.opts.open.current }));
  get snippetProps() {
    return this.#snippetProps();
  }
  set snippetProps($$value) {
    return this.#snippetProps($$value);
  }
  #props = derived(() => ({
    id: this.opts.id.current,
    "data-state": this.root.stateAttr,
    "data-disabled": boolToEmptyStrOrUndef(this.root.disabled),
    ...getDataTransitionAttrs(this.root.contentPresence.transitionStatus),
    style: { outline: "none" },
    [tooltipAttrs.content]: "",
    ...this.attachment
  }));
  get props() {
    return this.#props();
  }
  set props($$value) {
    return this.#props($$value);
  }
  popperProps = {
    onInteractOutside: this.onInteractOutside,
    onEscapeKeydown: this.onEscapeKeydown,
    onOpenAutoFocus: this.onOpenAutoFocus,
    onCloseAutoFocus: this.onCloseAutoFocus
  };
}
function Tooltip$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      open = false,
      triggerId = null,
      onOpenChange = noop,
      onOpenChangeComplete = noop,
      disabled,
      delayDuration,
      disableCloseOnTriggerClick,
      disableHoverableContent,
      ignoreNonKeyboardFocus,
      tether,
      children
    } = $$props;
    const rootState = TooltipRootState.create({
      open: boxWith$1(() => open, (v) => {
        open = v;
        onOpenChange(v);
      }),
      triggerId: boxWith$1(() => triggerId, (v) => {
        triggerId = v;
      }),
      delayDuration: boxWith$1(() => delayDuration),
      disableCloseOnTriggerClick: boxWith$1(() => disableCloseOnTriggerClick),
      disableHoverableContent: boxWith$1(() => disableHoverableContent),
      ignoreNonKeyboardFocus: boxWith$1(() => ignoreNonKeyboardFocus),
      disabled: boxWith$1(() => disabled),
      onOpenChangeComplete: boxWith$1(() => onOpenChangeComplete),
      tether: boxWith$1(() => tether)
    });
    Floating_layer($$renderer2, {
      tooltip: true,
      children: ($$renderer3) => {
        children?.($$renderer3, {
          open: rootState.opts.open.current,
          triggerId: rootState.activeTriggerId,
          payload: rootState.activePayload
        });
        $$renderer3.push(`<!---->`);
      }
    });
    bind_props($$props, { open, triggerId });
  });
}
function Tooltip_content$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const uid = props_id($$renderer2);
    let {
      children,
      child,
      id = createId(uid),
      ref = null,
      side = "top",
      sideOffset = 0,
      align = "center",
      avoidCollisions = true,
      arrowPadding = 0,
      sticky = "partial",
      strategy,
      hideWhenDetached = false,
      customAnchor,
      collisionPadding = 0,
      onInteractOutside = noop,
      onEscapeKeydown = noop,
      forceMount = false,
      style,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const contentState = TooltipContentState.create({
      id: boxWith$1(() => id),
      ref: boxWith$1(() => ref, (v) => ref = v),
      onInteractOutside: boxWith$1(() => onInteractOutside),
      onEscapeKeydown: boxWith$1(() => onEscapeKeydown)
    });
    const floatingProps = derived(() => ({
      side,
      sideOffset,
      align,
      avoidCollisions,
      arrowPadding,
      sticky,
      hideWhenDetached,
      collisionPadding,
      strategy,
      customAnchor: customAnchor ?? contentState.root.triggerNode
    }));
    const mergedProps = derived(() => mergeProps(restProps, floatingProps(), contentState.props));
    if (forceMount) {
      $$renderer2.push("<!--[0-->");
      {
        let popper = function($$renderer3, { props, wrapperProps }) {
          const finalWrapperProps = mergeProps(wrapperProps, {
            style: {
              pointerEvents: contentState.root.disableHoverableContent ? "none" : void 0
            }
          });
          const finalProps = mergeProps(props, { style: getFloatingContentCSSVars("tooltip") }, { style });
          if (child) {
            $$renderer3.push("<!--[0-->");
            child($$renderer3, {
              props: finalProps,
              wrapperProps: finalWrapperProps,
              ...contentState.snippetProps
            });
            $$renderer3.push(`<!---->`);
          } else {
            $$renderer3.push("<!--[-1-->");
            $$renderer3.push(`<div${attributes({ ...finalWrapperProps })}><div${attributes({ ...finalProps })}>`);
            children?.($$renderer3);
            $$renderer3.push(`<!----></div></div>`);
          }
          $$renderer3.push(`<!--]-->`);
        };
        Popper_layer_force_mount($$renderer2, spread_props([
          mergedProps(),
          contentState.popperProps,
          {
            enabled: contentState.root.opts.open.current,
            id,
            trapFocus: false,
            loop: false,
            preventScroll: false,
            forceMount: true,
            ref: contentState.opts.ref,
            tooltip: true,
            shouldRender: contentState.shouldRender,
            contentPointerEvents: contentState.root.disableHoverableContent ? "none" : "auto",
            popper,
            $$slots: { popper: true }
          }
        ]));
      }
    } else if (!forceMount) {
      $$renderer2.push("<!--[1-->");
      {
        let popper = function($$renderer3, { props, wrapperProps }) {
          const finalWrapperProps = mergeProps(wrapperProps, {
            style: {
              pointerEvents: contentState.root.disableHoverableContent ? "none" : void 0
            }
          });
          const finalProps = mergeProps(props, { style: getFloatingContentCSSVars("tooltip") }, { style });
          if (child) {
            $$renderer3.push("<!--[0-->");
            child($$renderer3, {
              props: finalProps,
              wrapperProps: finalWrapperProps,
              ...contentState.snippetProps
            });
            $$renderer3.push(`<!---->`);
          } else {
            $$renderer3.push("<!--[-1-->");
            $$renderer3.push(`<div${attributes({ ...finalWrapperProps })}><div${attributes({ ...finalProps })}>`);
            children?.($$renderer3);
            $$renderer3.push(`<!----></div></div>`);
          }
          $$renderer3.push(`<!--]-->`);
        };
        Popper_layer($$renderer2, spread_props([
          mergedProps(),
          contentState.popperProps,
          {
            open: contentState.root.opts.open.current,
            id,
            trapFocus: false,
            loop: false,
            preventScroll: false,
            forceMount: false,
            ref: contentState.opts.ref,
            tooltip: true,
            shouldRender: contentState.shouldRender,
            contentPointerEvents: contentState.root.disableHoverableContent ? "none" : "auto",
            popper,
            $$slots: { popper: true }
          }
        ]));
      }
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref });
  });
}
function Tooltip_trigger$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const uid = props_id($$renderer2);
    let {
      children,
      child,
      id = createId(uid),
      disabled = false,
      payload,
      tether,
      type = "button",
      tabindex = 0,
      ref = null,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const triggerState = TooltipTriggerState.create({
      id: boxWith$1(() => id),
      disabled: boxWith$1(() => disabled ?? false),
      tabindex: boxWith$1(() => tabindex ?? 0),
      payload: boxWith$1(() => payload),
      tether: boxWith$1(() => tether),
      ref: boxWith$1(() => ref, (v) => ref = v)
    });
    const mergedProps = derived(() => mergeProps(restProps, triggerState.props, { type }));
    if (child) {
      $$renderer2.push("<!--[0-->");
      child($$renderer2, { props: mergedProps() });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<button${attributes({ ...mergedProps() })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></button>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref });
  });
}
function Tooltip_arrow($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { ref = null, $$slots, $$events, ...restProps } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Floating_layer_arrow($$renderer3, spread_props([
        restProps,
        {
          get ref() {
            return ref;
          },
          set ref($$value) {
            ref = $$value;
            $$settled = false;
          }
        }
      ]));
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Tooltip_provider$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      children,
      delayDuration = 700,
      disableCloseOnTriggerClick = false,
      disableHoverableContent = false,
      disabled = false,
      ignoreNonKeyboardFocus = false,
      skipDelayDuration = 300
    } = $$props;
    TooltipProviderState.create({
      delayDuration: boxWith$1(() => delayDuration),
      disableCloseOnTriggerClick: boxWith$1(() => disableCloseOnTriggerClick),
      disableHoverableContent: boxWith$1(() => disableHoverableContent),
      disabled: boxWith$1(() => disabled),
      ignoreNonKeyboardFocus: boxWith$1(() => ignoreNonKeyboardFocus),
      skipDelayDuration: boxWith$1(() => skipDelayDuration)
    });
    children?.($$renderer2);
    $$renderer2.push(`<!---->`);
  });
}
function Tooltip($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { open = false, $$slots, $$events, ...restProps } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Tooltip$1) {
        $$renderer3.push("<!--[-->");
        Tooltip$1($$renderer3, spread_props([
          restProps,
          {
            get open() {
              return open;
            },
            set open($$value) {
              open = $$value;
              $$settled = false;
            }
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { open });
  });
}
function Tooltip_trigger($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { ref = null, $$slots, $$events, ...restProps } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Tooltip_trigger$1) {
        $$renderer3.push("<!--[-->");
        Tooltip_trigger$1($$renderer3, spread_props([
          { "data-slot": "tooltip-trigger" },
          restProps,
          {
            get ref() {
              return ref;
            },
            set ref($$value) {
              ref = $$value;
              $$settled = false;
            }
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Tooltip_portal($$renderer, $$props) {
  let { $$slots, $$events, ...restProps } = $$props;
  if (Portal) {
    $$renderer.push("<!--[-->");
    Portal($$renderer, spread_props([restProps]));
    $$renderer.push("<!--]-->");
  } else {
    $$renderer.push("<!--[!-->");
    $$renderer.push("<!--]-->");
  }
}
function Tooltip_content($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      sideOffset = 0,
      side = "top",
      children,
      arrowClasses,
      portalProps,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Tooltip_portal($$renderer3, spread_props([
        portalProps,
        {
          children: ($$renderer4) => {
            if (Tooltip_content$1) {
              $$renderer4.push("<!--[-->");
              Tooltip_content$1($$renderer4, spread_props([
                {
                  "data-slot": "tooltip-content",
                  sideOffset,
                  side,
                  class: cn("data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs has-data-[slot=kbd]:pr-1.5 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm bg-foreground text-background z-50 w-fit max-w-xs origin-(--bits-tooltip-content-transform-origin)", className)
                },
                restProps,
                {
                  get ref() {
                    return ref;
                  },
                  set ref($$value) {
                    ref = $$value;
                    $$settled = false;
                  },
                  children: ($$renderer5) => {
                    children?.($$renderer5);
                    $$renderer5.push(`<!----> `);
                    {
                      let child = function($$renderer6, { props }) {
                        $$renderer6.push(`<div${attributes({
                          class: clsx(cn("size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground z-50", "data-[side=top]:translate-x-1/2 data-[side=top]:translate-y-[calc(-50%+2px)]", "data-[side=bottom]:-translate-x-1/2 data-[side=bottom]:-translate-y-[calc(-50%+1px)]", "data-[side=right]:translate-x-[calc(50%+2px)] data-[side=right]:translate-y-1/2", "data-[side=left]:-translate-y-[calc(50%-3px)]", arrowClasses)),
                          ...props
                        })}></div>`);
                      };
                      if (Tooltip_arrow) {
                        $$renderer5.push("<!--[-->");
                        Tooltip_arrow($$renderer5, { child, $$slots: { child: true } });
                        $$renderer5.push("<!--]-->");
                      } else {
                        $$renderer5.push("<!--[!-->");
                        $$renderer5.push("<!--]-->");
                      }
                    }
                  },
                  $$slots: { default: true }
                }
              ]));
              $$renderer4.push("<!--]-->");
            } else {
              $$renderer4.push("<!--[!-->");
              $$renderer4.push("<!--]-->");
            }
          },
          $$slots: { default: true }
        }
      ]));
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Tooltip_provider($$renderer, $$props) {
  let { delayDuration = 0, $$slots, $$events, ...restProps } = $$props;
  if (Tooltip_provider$1) {
    $$renderer.push("<!--[-->");
    Tooltip_provider$1($$renderer, spread_props([{ delayDuration }, restProps]));
    $$renderer.push("<!--]-->");
  } else {
    $$renderer.push("<!--[!-->");
    $$renderer.push("<!--]-->");
  }
}
const sidebarMenuButtonVariants = tv({
  base: "ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground gap-2 rounded-md p-2 text-left text-sm transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 data-active:font-medium peer/menu-button group/menu-button flex w-full items-center overflow-hidden outline-hidden disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate",
  variants: {
    variant: {
      default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      outline: "bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]"
    },
    size: {
      default: "h-8 text-sm",
      sm: "h-7 text-xs",
      lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!"
    }
  },
  defaultVariants: { variant: "default", size: "default" }
});
function Sidebar_menu_button($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      children,
      child,
      variant = "default",
      size = "default",
      isActive = false,
      tooltipContent,
      tooltipContentProps,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const sidebar = useSidebar();
    const buttonProps = derived(() => ({
      class: cn(sidebarMenuButtonVariants({ variant, size }), className),
      "data-slot": "sidebar-menu-button",
      "data-sidebar": "menu-button",
      "data-size": size,
      "data-active": isActive,
      ...restProps
    }));
    function Button2($$renderer3, { props }) {
      const mergedProps = mergeProps(buttonProps(), props);
      if (child) {
        $$renderer3.push("<!--[0-->");
        child($$renderer3, { props: mergedProps });
        $$renderer3.push(`<!---->`);
      } else {
        $$renderer3.push("<!--[-1-->");
        $$renderer3.push(`<button${attributes({ ...mergedProps })}>`);
        children?.($$renderer3);
        $$renderer3.push(`<!----></button>`);
      }
      $$renderer3.push(`<!--]-->`);
    }
    if (!tooltipContent) {
      $$renderer2.push("<!--[0-->");
      Button2($$renderer2, {});
    } else {
      $$renderer2.push("<!--[-1-->");
      if (Tooltip) {
        $$renderer2.push("<!--[-->");
        Tooltip($$renderer2, {
          children: ($$renderer3) => {
            {
              let child2 = function($$renderer4, { props }) {
                Button2($$renderer4, { props });
              };
              if (Tooltip_trigger) {
                $$renderer3.push("<!--[-->");
                Tooltip_trigger($$renderer3, { child: child2, $$slots: { child: true } });
                $$renderer3.push("<!--]-->");
              } else {
                $$renderer3.push("<!--[!-->");
                $$renderer3.push("<!--]-->");
              }
            }
            $$renderer3.push(` `);
            if (Tooltip_content) {
              $$renderer3.push("<!--[-->");
              Tooltip_content($$renderer3, spread_props([
                {
                  side: "right",
                  align: "center",
                  hidden: sidebar.state !== "collapsed" || sidebar.isMobile
                },
                tooltipContentProps,
                {
                  children: ($$renderer4) => {
                    if (typeof tooltipContent === "string") {
                      $$renderer4.push("<!--[0-->");
                      $$renderer4.push(`${escape_html(tooltipContent)}`);
                    } else if (tooltipContent) {
                      $$renderer4.push("<!--[1-->");
                      tooltipContent($$renderer4);
                      $$renderer4.push(`<!---->`);
                    } else {
                      $$renderer4.push("<!--[-1-->");
                    }
                    $$renderer4.push(`<!--]-->`);
                  },
                  $$slots: { default: true }
                }
              ]));
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
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref });
  });
}
function Sidebar_menu_item($$renderer, $$props) {
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
      "data-slot": "sidebar-menu-item",
      "data-sidebar": "menu-item",
      class: clsx(cn("group/menu-item relative", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></li>`);
    bind_props($$props, { ref });
  });
}
function Sidebar_menu_sub_button($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      children,
      child,
      class: className,
      size = "md",
      isActive = false,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const mergedProps = derived(() => ({
      class: cn("text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground h-7 gap-2 rounded-md px-2 focus-visible:ring-2 data-[size=md]:text-sm data-[size=sm]:text-xs [&>svg]:size-4 flex min-w-0 -translate-x-px items-center overflow-hidden outline-hidden group-data-[collapsible=icon]:hidden disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:shrink-0", className),
      "data-slot": "sidebar-menu-sub-button",
      "data-sidebar": "menu-sub-button",
      "data-size": size,
      "data-active": isActive,
      ...restProps
    }));
    if (child) {
      $$renderer2.push("<!--[0-->");
      child($$renderer2, { props: mergedProps() });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<a${attributes({ ...mergedProps() })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></a>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref });
  });
}
function Sidebar_menu_sub_item($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      children,
      class: className,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    $$renderer2.push(`<li${attributes({
      "data-slot": "sidebar-menu-sub-item",
      "data-sidebar": "menu-sub-item",
      class: clsx(cn("group/menu-sub-item relative", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></li>`);
    bind_props($$props, { ref });
  });
}
function Sidebar_menu_sub($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    $$renderer2.push(`<ul${attributes({
      "data-slot": "sidebar-menu-sub",
      "data-sidebar": "menu-sub",
      class: clsx(cn("border-sidebar-border mx-3.5 translate-x-px gap-1 border-l px-2.5 py-0.5 group-data-[collapsible=icon]:hidden flex min-w-0 flex-col", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></ul>`);
    bind_props($$props, { ref });
  });
}
function Sidebar_menu($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    $$renderer2.push(`<ul${attributes({
      "data-slot": "sidebar-menu",
      "data-sidebar": "menu",
      class: clsx(cn("gap-0 flex w-full min-w-0 flex-col", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></ul>`);
    bind_props($$props, { ref });
  });
}
function Sidebar_provider($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      open = true,
      onOpenChange = () => {
      },
      class: className,
      style,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    setSidebar({
      open: () => open,
      setOpen: (value) => {
        open = value;
        onOpenChange(value);
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      }
    });
    if (Tooltip_provider) {
      $$renderer2.push("<!--[-->");
      Tooltip_provider($$renderer2, {
        delayDuration: 0,
        children: ($$renderer3) => {
          $$renderer3.push(`<div${attributes({
            "data-slot": "sidebar-wrapper",
            style: `--sidebar-width: ${stringify(SIDEBAR_WIDTH)}; --sidebar-width-icon: ${stringify(SIDEBAR_WIDTH_ICON)}; ${stringify(style)}`,
            class: clsx(cn("group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full", className)),
            ...restProps
          })}>`);
          children?.($$renderer3);
          $$renderer3.push(`<!----></div>`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push("<!--]-->");
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push("<!--]-->");
    }
    bind_props($$props, { ref, open });
  });
}
function Sidebar_rail($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    useSidebar();
    $$renderer2.push(`<button${attributes({
      "data-sidebar": "rail",
      "data-slot": "sidebar-rail",
      "aria-label": "Toggle Sidebar",
      tabindex: -1,
      title: "Toggle Sidebar",
      class: clsx(cn("hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex", "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize", "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize", "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full", "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2", "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></button>`);
    bind_props($$props, { ref });
  });
}
function Separator($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      "data-slot": dataSlot = "separator",
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Separator$1) {
        $$renderer3.push("<!--[-->");
        Separator$1($$renderer3, spread_props([
          {
            "data-slot": dataSlot,
            class: cn("bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px", "data-[orientation=vertical]:h-full", className)
          },
          restProps,
          {
            get ref() {
              return ref;
            },
            set ref($$value) {
              ref = $$value;
              $$settled = false;
            }
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Panel_left($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "rect",
      { "width": "18", "height": "18", "x": "3", "y": "3", "rx": "2" }
    ],
    ["path", { "d": "M9 3v18" }]
  ];
  Icon($$renderer, spread_props([{ name: "panel-left" }, props, { iconNode }]));
}
function Sidebar_trigger($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      onclick,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const sidebar = useSidebar();
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Button($$renderer3, spread_props([
        {
          "data-sidebar": "trigger",
          "data-slot": "sidebar-trigger",
          variant: "ghost",
          size: "icon-sm",
          class: cn("cn-sidebar-trigger", className),
          type: "button",
          onclick: (e) => {
            onclick?.(e);
            sidebar.toggle();
          }
        },
        restProps,
        {
          get ref() {
            return ref;
          },
          set ref($$value) {
            ref = $$value;
            $$settled = false;
          },
          children: ($$renderer4) => {
            Panel_left($$renderer4, {});
            $$renderer4.push(`<!----> <span class="sr-only">Toggle Sidebar</span>`);
          },
          $$slots: { default: true }
        }
      ]));
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Sheet($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { open = false, $$slots, $$events, ...restProps } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Dialog) {
        $$renderer3.push("<!--[-->");
        Dialog($$renderer3, spread_props([
          restProps,
          {
            get open() {
              return open;
            },
            set open($$value) {
              open = $$value;
              $$settled = false;
            }
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { open });
  });
}
function Sheet_portal($$renderer, $$props) {
  let { $$slots, $$events, ...restProps } = $$props;
  if (Portal) {
    $$renderer.push("<!--[-->");
    Portal($$renderer, spread_props([restProps]));
    $$renderer.push("<!--]-->");
  } else {
    $$renderer.push("<!--[!-->");
    $$renderer.push("<!--]-->");
  }
}
function Sheet_overlay($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Dialog_overlay) {
        $$renderer3.push("<!--[-->");
        Dialog_overlay($$renderer3, spread_props([
          {
            "data-slot": "sheet-overlay",
            class: cn("bg-black/10 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 z-50", className)
          },
          restProps,
          {
            get ref() {
              return ref;
            },
            set ref($$value) {
              ref = $$value;
              $$settled = false;
            }
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Sheet_content($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      side = "right",
      showCloseButton = true,
      portalProps,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Sheet_portal($$renderer3, spread_props([
        portalProps,
        {
          children: ($$renderer4) => {
            Sheet_overlay($$renderer4, {});
            $$renderer4.push(`<!----> `);
            if (Dialog_content) {
              $$renderer4.push("<!--[-->");
              Dialog_content($$renderer4, spread_props([
                {
                  "data-slot": "sheet-content",
                  "data-side": side,
                  class: cn("bg-popover text-popover-foreground fixed z-50 flex flex-col gap-4 bg-clip-padding text-sm shadow-lg transition duration-200 ease-in-out data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-[side=bottom]:data-open:slide-in-from-bottom-10 data-[side=left]:data-open:slide-in-from-left-10 data-[side=right]:data-open:slide-in-from-right-10 data-[side=top]:data-open:slide-in-from-top-10 data-closed:animate-out data-closed:fade-out-0 data-[side=bottom]:data-closed:slide-out-to-bottom-10 data-[side=left]:data-closed:slide-out-to-left-10 data-[side=right]:data-closed:slide-out-to-right-10 data-[side=top]:data-closed:slide-out-to-top-10", className)
                },
                restProps,
                {
                  get ref() {
                    return ref;
                  },
                  set ref($$value) {
                    ref = $$value;
                    $$settled = false;
                  },
                  children: ($$renderer5) => {
                    children?.($$renderer5);
                    $$renderer5.push(`<!----> `);
                    if (showCloseButton) {
                      $$renderer5.push("<!--[0-->");
                      {
                        let child = function($$renderer6, { props }) {
                          Button($$renderer6, spread_props([
                            {
                              variant: "ghost",
                              class: "absolute top-3 right-3",
                              size: "icon-sm"
                            },
                            props,
                            {
                              children: ($$renderer7) => {
                                X($$renderer7, {});
                                $$renderer7.push(`<!----> <span class="sr-only">Close</span>`);
                              },
                              $$slots: { default: true }
                            }
                          ]));
                        };
                        if (Dialog_close) {
                          $$renderer5.push("<!--[-->");
                          Dialog_close($$renderer5, { "data-slot": "sheet-close", child, $$slots: { child: true } });
                          $$renderer5.push("<!--]-->");
                        } else {
                          $$renderer5.push("<!--[!-->");
                          $$renderer5.push("<!--]-->");
                        }
                      }
                    } else {
                      $$renderer5.push("<!--[-1-->");
                    }
                    $$renderer5.push(`<!--]-->`);
                  },
                  $$slots: { default: true }
                }
              ]));
              $$renderer4.push("<!--]-->");
            } else {
              $$renderer4.push("<!--[!-->");
              $$renderer4.push("<!--]-->");
            }
          },
          $$slots: { default: true }
        }
      ]));
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Sheet_header($$renderer, $$props) {
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
      "data-slot": "sheet-header",
      class: clsx(cn("gap-0.5 p-4 flex flex-col", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { ref });
  });
}
function Sheet_title($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Dialog_title) {
        $$renderer3.push("<!--[-->");
        Dialog_title($$renderer3, spread_props([
          {
            "data-slot": "sheet-title",
            class: cn("font-heading text-foreground text-base font-medium", className)
          },
          restProps,
          {
            get ref() {
              return ref;
            },
            set ref($$value) {
              ref = $$value;
              $$settled = false;
            }
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Sheet_description($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Dialog_description) {
        $$renderer3.push("<!--[-->");
        Dialog_description($$renderer3, spread_props([
          {
            "data-slot": "sheet-description",
            class: cn("text-muted-foreground text-sm", className)
          },
          restProps,
          {
            get ref() {
              return ref;
            },
            set ref($$value) {
              ref = $$value;
              $$settled = false;
            }
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Sidebar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      class: className,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const sidebar = useSidebar();
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (collapsible === "none") {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div${attributes({
          class: clsx(cn("bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col", className)),
          ...restProps
        })}>`);
        children?.($$renderer3);
        $$renderer3.push(`<!----></div>`);
      } else if (sidebar.isMobile) {
        $$renderer3.push("<!--[1-->");
        var bind_get = () => sidebar.openMobile;
        var bind_set = (v) => sidebar.setOpenMobile(v);
        if (Sheet) {
          $$renderer3.push("<!--[-->");
          Sheet($$renderer3, spread_props([
            {
              get open() {
                return bind_get();
              },
              set open($$value) {
                bind_set($$value);
              }
            },
            restProps,
            {
              children: ($$renderer4) => {
                if (Sheet_content) {
                  $$renderer4.push("<!--[-->");
                  Sheet_content($$renderer4, {
                    "data-sidebar": "sidebar",
                    "data-slot": "sidebar",
                    "data-mobile": "true",
                    class: cn("bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden", className),
                    style: `--sidebar-width: ${stringify(SIDEBAR_WIDTH_MOBILE)};`,
                    side,
                    get ref() {
                      return ref;
                    },
                    set ref($$value) {
                      ref = $$value;
                      $$settled = false;
                    },
                    children: ($$renderer5) => {
                      if (Sheet_header) {
                        $$renderer5.push("<!--[-->");
                        Sheet_header($$renderer5, {
                          class: "sr-only",
                          children: ($$renderer6) => {
                            if (Sheet_title) {
                              $$renderer6.push("<!--[-->");
                              Sheet_title($$renderer6, {
                                children: ($$renderer7) => {
                                  $$renderer7.push(`<!---->Sidebar`);
                                },
                                $$slots: { default: true }
                              });
                              $$renderer6.push("<!--]-->");
                            } else {
                              $$renderer6.push("<!--[!-->");
                              $$renderer6.push("<!--]-->");
                            }
                            $$renderer6.push(` `);
                            if (Sheet_description) {
                              $$renderer6.push("<!--[-->");
                              Sheet_description($$renderer6, {
                                children: ($$renderer7) => {
                                  $$renderer7.push(`<!---->Displays the mobile sidebar.`);
                                },
                                $$slots: { default: true }
                              });
                              $$renderer6.push("<!--]-->");
                            } else {
                              $$renderer6.push("<!--[!-->");
                              $$renderer6.push("<!--]-->");
                            }
                          },
                          $$slots: { default: true }
                        });
                        $$renderer5.push("<!--]-->");
                      } else {
                        $$renderer5.push("<!--[!-->");
                        $$renderer5.push("<!--]-->");
                      }
                      $$renderer5.push(` <div class="flex h-full w-full flex-col">`);
                      children?.($$renderer5);
                      $$renderer5.push(`<!----></div>`);
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
            }
          ]));
          $$renderer3.push("<!--]-->");
        } else {
          $$renderer3.push("<!--[!-->");
          $$renderer3.push("<!--]-->");
        }
      } else {
        $$renderer3.push("<!--[-1-->");
        $$renderer3.push(`<aside class="text-sidebar-foreground group peer hidden md:block"${attr("data-state", sidebar.state)}${attr("data-collapsible", sidebar.state === "collapsed" ? collapsible : "")}${attr("data-variant", variant)}${attr("data-side", side)} data-slot="sidebar"><div data-slot="sidebar-gap"${attr_class(clsx(cn("transition-[width] duration-200 ease-linear relative w-(--sidebar-width) bg-transparent", "group-data-[collapsible=offcanvas]:w-0", "group-data-[side=right]:rotate-180", variant === "floating" || variant === "inset" ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]" : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)")))}></div> <div${attributes({
          "data-slot": "sidebar-container",
          class: clsx(cn(
            "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
            side === "left" ? "start-0 group-data-[collapsible=offcanvas]:start-[calc(var(--sidebar-width)*-1)]" : "end-0 group-data-[collapsible=offcanvas]:end-[calc(var(--sidebar-width)*-1)]",
            variant === "floating" || variant === "inset" ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]" : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-e group-data-[side=right]:border-s",
            className
          )),
          ...restProps
        })}><div data-sidebar="sidebar" data-slot="sidebar-inner" class="bg-sidebar group-data-[variant=floating]:ring-sidebar-border group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 flex size-full flex-col">`);
        children?.($$renderer3);
        $$renderer3.push(`<!----></div></div></aside>`);
      }
      $$renderer3.push(`<!--]-->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Badge_check($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      }
    ],
    ["path", { "d": "m9 12 2 2 4-4" }]
  ];
  Icon($$renderer, spread_props([{ name: "badge-check" }, props, { iconNode }]));
}
function Bell($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["path", { "d": "M10.268 21a2 2 0 0 0 3.464 0" }],
    [
      "path",
      {
        "d": "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
      }
    ]
  ];
  Icon($$renderer, spread_props([{ name: "bell" }, props, { iconNode }]));
}
function Book_open($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["path", { "d": "M12 7v14" }],
    [
      "path",
      {
        "d": "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"
      }
    ]
  ];
  Icon($$renderer, spread_props([{ name: "book-open" }, props, { iconNode }]));
}
function Bot($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["path", { "d": "M12 8V4H8" }],
    [
      "rect",
      { "width": "16", "height": "12", "x": "4", "y": "8", "rx": "2" }
    ],
    ["path", { "d": "M2 14h2" }],
    ["path", { "d": "M20 14h2" }],
    ["path", { "d": "M15 13v2" }],
    ["path", { "d": "M9 13v2" }]
  ];
  Icon($$renderer, spread_props([{ name: "bot" }, props, { iconNode }]));
}
function Chart_pie($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"
      }
    ],
    ["path", { "d": "M21.21 15.89A10 10 0 1 1 8 2.83" }]
  ];
  Icon($$renderer, spread_props([{ name: "chart-pie" }, props, { iconNode }]));
}
function Chevrons_up_down($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["path", { "d": "m7 15 5 5 5-5" }],
    ["path", { "d": "m7 9 5-5 5 5" }]
  ];
  Icon($$renderer, spread_props([{ name: "chevrons-up-down" }, props, { iconNode }]));
}
function Command($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"
      }
    ]
  ];
  Icon($$renderer, spread_props([{ name: "command" }, props, { iconNode }]));
}
function Credit_card($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "rect",
      { "width": "20", "height": "14", "x": "2", "y": "5", "rx": "2" }
    ],
    ["line", { "x1": "2", "x2": "22", "y1": "10", "y2": "10" }]
  ];
  Icon($$renderer, spread_props([{ name: "credit-card" }, props, { iconNode }]));
}
function Ellipsis($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "1" }],
    ["circle", { "cx": "19", "cy": "12", "r": "1" }],
    ["circle", { "cx": "5", "cy": "12", "r": "1" }]
  ];
  Icon($$renderer, spread_props([{ name: "ellipsis" }, props, { iconNode }]));
}
function Folder($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
      }
    ]
  ];
  Icon($$renderer, spread_props([{ name: "folder" }, props, { iconNode }]));
}
function Frame($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["line", { "x1": "22", "x2": "2", "y1": "6", "y2": "6" }],
    ["line", { "x1": "22", "x2": "2", "y1": "18", "y2": "18" }],
    ["line", { "x1": "6", "x2": "6", "y1": "2", "y2": "22" }],
    ["line", { "x1": "18", "x2": "18", "y1": "2", "y2": "22" }]
  ];
  Icon($$renderer, spread_props([{ name: "frame" }, props, { iconNode }]));
}
function Life_buoy($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    ["path", { "d": "m4.93 4.93 4.24 4.24" }],
    ["path", { "d": "m14.83 9.17 4.24-4.24" }],
    ["path", { "d": "m14.83 14.83 4.24 4.24" }],
    ["path", { "d": "m9.17 14.83-4.24 4.24" }],
    ["circle", { "cx": "12", "cy": "12", "r": "4" }]
  ];
  Icon($$renderer, spread_props([{ name: "life-buoy" }, props, { iconNode }]));
}
function Map$1($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"
      }
    ],
    ["path", { "d": "M15 5.764v15" }],
    ["path", { "d": "M9 3.236v15" }]
  ];
  Icon($$renderer, spread_props([{ name: "map" }, props, { iconNode }]));
}
function Save($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
      }
    ],
    ["path", { "d": "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" }],
    ["path", { "d": "M7 3v4a1 1 0 0 0 1 1h7" }]
  ];
  Icon($$renderer, spread_props([{ name: "save" }, props, { iconNode }]));
}
function Send($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"
      }
    ],
    ["path", { "d": "m21.854 2.147-10.94 10.939" }]
  ];
  Icon($$renderer, spread_props([{ name: "send" }, props, { iconNode }]));
}
function Settings_2($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["path", { "d": "M14 17H5" }],
    ["path", { "d": "M19 7h-9" }],
    ["circle", { "cx": "17", "cy": "17", "r": "3" }],
    ["circle", { "cx": "7", "cy": "7", "r": "3" }]
  ];
  Icon($$renderer, spread_props([{ name: "settings-2" }, props, { iconNode }]));
}
function Share($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["path", { "d": "M12 2v13" }],
    ["path", { "d": "m16 6-4-4-4 4" }],
    ["path", { "d": "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" }]
  ];
  Icon($$renderer, spread_props([{ name: "share" }, props, { iconNode }]));
}
function Sparkles($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"
      }
    ],
    ["path", { "d": "M20 2v4" }],
    ["path", { "d": "M22 4h-4" }],
    ["circle", { "cx": "4", "cy": "20", "r": "2" }]
  ];
  Icon($$renderer, spread_props([{ name: "sparkles" }, props, { iconNode }]));
}
function Square_terminal($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["path", { "d": "m7 11 2-2-2-2" }],
    ["path", { "d": "M11 13h4" }],
    [
      "rect",
      {
        "width": "18",
        "height": "18",
        "x": "3",
        "y": "3",
        "rx": "2",
        "ry": "2"
      }
    ]
  ];
  Icon($$renderer, spread_props([{ name: "square-terminal" }, props, { iconNode }]));
}
const defaultWindow$1 = void 0;
function getActiveElement$1(document2) {
  let activeElement = document2.activeElement;
  while (activeElement?.shadowRoot) {
    const node = activeElement.shadowRoot.activeElement;
    if (node === activeElement)
      break;
    else
      activeElement = node;
  }
  return activeElement;
}
let ActiveElement$1 = class ActiveElement {
  #document;
  #subscribe;
  constructor(options = {}) {
    const { window: window2 = defaultWindow$1, document: document2 = window2?.document } = options;
    if (window2 === void 0) return;
    this.#document = document2;
    this.#subscribe = createSubscriber();
  }
  get current() {
    this.#subscribe?.();
    if (!this.#document) return null;
    return getActiveElement$1(this.#document);
  }
};
new ActiveElement$1();
const isBrowser = typeof document !== "undefined";
function isFunction(value) {
  return typeof value === "function";
}
function isObject(value) {
  return value !== null && typeof value === "object";
}
const BoxSymbol = Symbol("box");
const isWritableSymbol = Symbol("is-writable");
function isBox(value) {
  return isObject(value) && BoxSymbol in value;
}
function isWritableBox(value) {
  return box.isBox(value) && isWritableSymbol in value;
}
function box(initialValue) {
  let current = initialValue;
  return {
    [BoxSymbol]: true,
    [isWritableSymbol]: true,
    get current() {
      return current;
    },
    set current(v) {
      current = v;
    }
  };
}
function boxWith(getter, setter) {
  const derived$1 = derived(getter);
  if (setter) {
    return {
      [BoxSymbol]: true,
      [isWritableSymbol]: true,
      get current() {
        return derived$1();
      },
      set current(v) {
        setter(v);
      }
    };
  }
  return {
    [BoxSymbol]: true,
    get current() {
      return getter();
    }
  };
}
function boxFrom(value) {
  if (box.isBox(value)) return value;
  if (isFunction(value)) return box.with(value);
  return box(value);
}
function boxFlatten(boxes) {
  return Object.entries(boxes).reduce(
    (acc, [key, b]) => {
      if (!box.isBox(b)) {
        return Object.assign(acc, { [key]: b });
      }
      if (box.isWritableBox(b)) {
        Object.defineProperty(acc, key, {
          get() {
            return b.current;
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          set(v) {
            b.current = v;
          }
        });
      } else {
        Object.defineProperty(acc, key, {
          get() {
            return b.current;
          }
        });
      }
      return acc;
    },
    {}
  );
}
function toReadonlyBox(b) {
  if (!box.isWritableBox(b)) return b;
  return {
    [BoxSymbol]: true,
    get current() {
      return b.current;
    }
  };
}
box.from = boxFrom;
box.with = boxWith;
box.flatten = boxFlatten;
box.readonly = toReadonlyBox;
box.isBox = isBox;
box.isWritableBox = isWritableBox;
function createParser(matcher, replacer) {
  const regex = RegExp(matcher, "g");
  return (str) => {
    if (typeof str !== "string") {
      throw new TypeError(`expected an argument of type string, but got ${typeof str}`);
    }
    if (!str.match(regex))
      return str;
    return str.replace(regex, replacer);
  };
}
const camelToKebab = createParser(/[A-Z]/, (match) => `-${match.toLowerCase()}`);
function styleToCSS(styleObj) {
  if (!styleObj || typeof styleObj !== "object" || Array.isArray(styleObj)) {
    throw new TypeError(`expected an argument of type object, but got ${typeof styleObj}`);
  }
  return Object.keys(styleObj).map((property) => `${camelToKebab(property)}: ${styleObj[property]};`).join("\n");
}
function styleToString(style = {}) {
  return styleToCSS(style).replace("\n", " ");
}
const srOnlyStyles = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: "0",
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  borderWidth: "0",
  transform: "translateX(-100%)"
};
styleToString(srOnlyStyles);
const defaultWindow = void 0;
function getActiveElement(document2) {
  let activeElement = document2.activeElement;
  while (activeElement?.shadowRoot) {
    const node = activeElement.shadowRoot.activeElement;
    if (node === activeElement)
      break;
    else
      activeElement = node;
  }
  return activeElement;
}
class ActiveElement2 {
  #document;
  #subscribe;
  constructor(options = {}) {
    const { window: window2 = defaultWindow, document: document2 = window2?.document } = options;
    if (window2 === void 0) return;
    this.#document = document2;
    this.#subscribe = createSubscriber();
  }
  get current() {
    this.#subscribe?.();
    if (!this.#document) return null;
    return getActiveElement(this.#document);
  }
}
new ActiveElement2();
const modeStorageKey = box("mode-watcher-mode");
const themeStorageKey = box("mode-watcher-theme");
class SystemPrefersMode {
  #defaultValue = void 0;
  #track = true;
  #current = this.#defaultValue;
  #mediaQueryState = typeof window !== "undefined" && typeof window.matchMedia === "function" ? new MediaQuery("prefers-color-scheme: light") : { current: false };
  query() {
    if (!isBrowser) return;
    this.#current = this.#mediaQueryState.current ? "light" : "dark";
  }
  tracking(active) {
    this.#track = active;
  }
  constructor() {
    this.query = this.query.bind(this);
    this.tracking = this.tracking.bind(this);
  }
  get current() {
    return this.#current;
  }
}
new SystemPrefersMode();
const themeColors = box(void 0);
const disableTransitions = box(true);
const synchronousModeChanges = box(false);
const darkClassNames = box([]);
const lightClassNames = box([]);
function defineConfig(config) {
  return config;
}
function setInitialMode({ defaultMode = "system", themeColors: themeColors2, darkClassNames: darkClassNames2 = ["dark"], lightClassNames: lightClassNames2 = [], defaultTheme = "", modeStorageKey: modeStorageKey2 = "mode-watcher-mode", themeStorageKey: themeStorageKey2 = "mode-watcher-theme" }) {
  const rootEl = document.documentElement;
  const mode = localStorage.getItem(modeStorageKey2) ?? defaultMode;
  const theme = localStorage.getItem(themeStorageKey2) ?? defaultTheme;
  const light = mode === "light" || mode === "system" && window.matchMedia("(prefers-color-scheme: light)").matches;
  if (light) {
    if (darkClassNames2.length)
      rootEl.classList.remove(...darkClassNames2.filter(Boolean));
    if (lightClassNames2.length)
      rootEl.classList.add(...lightClassNames2.filter(Boolean));
  } else {
    if (lightClassNames2.length)
      rootEl.classList.remove(...lightClassNames2.filter(Boolean));
    if (darkClassNames2.length)
      rootEl.classList.add(...darkClassNames2.filter(Boolean));
  }
  rootEl.style.colorScheme = light ? "light" : "dark";
  if (themeColors2) {
    const themeMetaEl = document.querySelector('meta[name="theme-color"]');
    if (themeMetaEl) {
      themeMetaEl.setAttribute("content", mode === "light" ? themeColors2.light : themeColors2.dark);
    }
  }
  if (theme) {
    rootEl.setAttribute("data-theme", theme);
    localStorage.setItem(themeStorageKey2, theme);
  }
  localStorage.setItem(modeStorageKey2, mode);
}
function Mode_watcher_lite($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { themeColors: themeColors2 } = $$props;
    if (themeColors2) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<meta name="theme-color"${attr("content", themeColors2.dark)}/>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function Mode_watcher_full($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { trueNonce = "", initConfig, themeColors: themeColors2 } = $$props;
    head("af9dr3", $$renderer2, ($$renderer3) => {
      if (themeColors2) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<meta name="theme-color"${attr("content", themeColors2.dark)}/>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> ${html(`<script${trueNonce ? ` nonce=${trueNonce}` : ""}>(` + setInitialMode.toString() + `)(` + JSON.stringify(initConfig) + `);<\/script>`)}`);
    });
  });
}
function Mode_watcher($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      defaultMode = "system",
      themeColors: themeColorsProp,
      disableTransitions: disableTransitionsProp = true,
      darkClassNames: darkClassNamesProp = ["dark"],
      lightClassNames: lightClassNamesProp = [],
      defaultTheme = "",
      nonce = "",
      themeStorageKey: themeStorageKeyProp = "mode-watcher-theme",
      modeStorageKey: modeStorageKeyProp = "mode-watcher-mode",
      disableHeadScriptInjection = false,
      synchronousModeChanges: synchronousModeChangesProp = false
    } = $$props;
    modeStorageKey.current = modeStorageKeyProp;
    themeStorageKey.current = themeStorageKeyProp;
    darkClassNames.current = darkClassNamesProp;
    lightClassNames.current = lightClassNamesProp;
    disableTransitions.current = disableTransitionsProp;
    themeColors.current = themeColorsProp;
    synchronousModeChanges.current = synchronousModeChangesProp;
    const initConfig = defineConfig({
      defaultMode,
      themeColors: themeColorsProp,
      darkClassNames: darkClassNamesProp,
      lightClassNames: lightClassNamesProp,
      defaultTheme,
      modeStorageKey: modeStorageKeyProp,
      themeStorageKey: themeStorageKeyProp
    });
    const trueNonce = derived(() => typeof window === "undefined" ? nonce : "");
    if (disableHeadScriptInjection) {
      $$renderer2.push("<!--[0-->");
      Mode_watcher_lite($$renderer2, { themeColors: themeColors.current });
    } else {
      $$renderer2.push("<!--[-1-->");
      Mode_watcher_full($$renderer2, {
        trueNonce: trueNonce(),
        initConfig,
        themeColors: themeColors.current
      });
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function Collapsible($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { ref = null, open = false, $$slots, $$events, ...restProps } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Collapsible$1) {
        $$renderer3.push("<!--[-->");
        Collapsible$1($$renderer3, spread_props([
          { "data-slot": "collapsible" },
          restProps,
          {
            get ref() {
              return ref;
            },
            set ref($$value) {
              ref = $$value;
              $$settled = false;
            },
            get open() {
              return open;
            },
            set open($$value) {
              open = $$value;
              $$settled = false;
            }
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref, open });
  });
}
function Collapsible_trigger($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { ref = null, $$slots, $$events, ...restProps } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Collapsible_trigger$1) {
        $$renderer3.push("<!--[-->");
        Collapsible_trigger$1($$renderer3, spread_props([
          { "data-slot": "collapsible-trigger" },
          restProps,
          {
            get ref() {
              return ref;
            },
            set ref($$value) {
              ref = $$value;
              $$settled = false;
            }
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Collapsible_content($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { ref = null, $$slots, $$events, ...restProps } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Collapsible_content$1) {
        $$renderer3.push("<!--[-->");
        Collapsible_content$1($$renderer3, spread_props([
          { "data-slot": "collapsible-content" },
          restProps,
          {
            get ref() {
              return ref;
            },
            set ref($$value) {
              ref = $$value;
              $$settled = false;
            }
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Nav_main($$renderer, $$props) {
  let {
    items
    // This should be `Component` after @lucide/svelte updates types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = $$props;
  if (Sidebar_group) {
    $$renderer.push("<!--[-->");
    Sidebar_group($$renderer, {
      children: ($$renderer2) => {
        if (Sidebar_group_label) {
          $$renderer2.push("<!--[-->");
          Sidebar_group_label($$renderer2, {
            children: ($$renderer3) => {
              $$renderer3.push(`<!---->Platform`);
            },
            $$slots: { default: true }
          });
          $$renderer2.push("<!--]-->");
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push("<!--]-->");
        }
        $$renderer2.push(` `);
        if (Sidebar_menu) {
          $$renderer2.push("<!--[-->");
          Sidebar_menu($$renderer2, {
            children: ($$renderer3) => {
              $$renderer3.push(`<!--[-->`);
              const each_array = ensure_array_like(items);
              for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
                let mainItem = each_array[$$index_1];
                {
                  let child = function($$renderer4, { props }) {
                    if (Sidebar_menu_item) {
                      $$renderer4.push("<!--[-->");
                      Sidebar_menu_item($$renderer4, spread_props([
                        props,
                        {
                          children: ($$renderer5) => {
                            {
                              let child2 = function($$renderer6, { props: props2 }) {
                                $$renderer6.push(`<a${attributes({ href: mainItem.url, ...props2 })}>`);
                                if (mainItem.icon) {
                                  $$renderer6.push("<!--[-->");
                                  mainItem.icon($$renderer6, {});
                                  $$renderer6.push("<!--]-->");
                                } else {
                                  $$renderer6.push("<!--[!-->");
                                  $$renderer6.push("<!--]-->");
                                }
                                $$renderer6.push(` <span>${escape_html(mainItem.title)}</span></a>`);
                              };
                              if (Sidebar_menu_button) {
                                $$renderer5.push("<!--[-->");
                                Sidebar_menu_button($$renderer5, {
                                  tooltipContent: mainItem.title,
                                  child: child2,
                                  $$slots: { child: true }
                                });
                                $$renderer5.push("<!--]-->");
                              } else {
                                $$renderer5.push("<!--[!-->");
                                $$renderer5.push("<!--]-->");
                              }
                            }
                            $$renderer5.push(` `);
                            if (mainItem.items?.length) {
                              $$renderer5.push("<!--[0-->");
                              {
                                let child2 = function($$renderer6, { props: props2 }) {
                                  if (Sidebar_menu_action) {
                                    $$renderer6.push("<!--[-->");
                                    Sidebar_menu_action($$renderer6, spread_props([
                                      props2,
                                      {
                                        class: "data-[state=open]:rotate-90",
                                        children: ($$renderer7) => {
                                          Chevron_right($$renderer7, {});
                                          $$renderer7.push(`<!----> <span class="sr-only">Toggle</span>`);
                                        },
                                        $$slots: { default: true }
                                      }
                                    ]));
                                    $$renderer6.push("<!--]-->");
                                  } else {
                                    $$renderer6.push("<!--[!-->");
                                    $$renderer6.push("<!--]-->");
                                  }
                                };
                                if (Collapsible_trigger) {
                                  $$renderer5.push("<!--[-->");
                                  Collapsible_trigger($$renderer5, { child: child2, $$slots: { child: true } });
                                  $$renderer5.push("<!--]-->");
                                } else {
                                  $$renderer5.push("<!--[!-->");
                                  $$renderer5.push("<!--]-->");
                                }
                              }
                              $$renderer5.push(` `);
                              if (Collapsible_content) {
                                $$renderer5.push("<!--[-->");
                                Collapsible_content($$renderer5, {
                                  children: ($$renderer6) => {
                                    if (Sidebar_menu_sub) {
                                      $$renderer6.push("<!--[-->");
                                      Sidebar_menu_sub($$renderer6, {
                                        children: ($$renderer7) => {
                                          $$renderer7.push(`<!--[-->`);
                                          const each_array_1 = ensure_array_like(mainItem.items);
                                          for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
                                            let subItem = each_array_1[$$index];
                                            if (Sidebar_menu_sub_item) {
                                              $$renderer7.push("<!--[-->");
                                              Sidebar_menu_sub_item($$renderer7, {
                                                children: ($$renderer8) => {
                                                  if (Sidebar_menu_sub_button) {
                                                    $$renderer8.push("<!--[-->");
                                                    Sidebar_menu_sub_button($$renderer8, {
                                                      href: subItem.url,
                                                      children: ($$renderer9) => {
                                                        $$renderer9.push(`<span>${escape_html(subItem.title)}</span>`);
                                                      },
                                                      $$slots: { default: true }
                                                    });
                                                    $$renderer8.push("<!--]-->");
                                                  } else {
                                                    $$renderer8.push("<!--[!-->");
                                                    $$renderer8.push("<!--]-->");
                                                  }
                                                },
                                                $$slots: { default: true }
                                              });
                                              $$renderer7.push("<!--]-->");
                                            } else {
                                              $$renderer7.push("<!--[!-->");
                                              $$renderer7.push("<!--]-->");
                                            }
                                          }
                                          $$renderer7.push(`<!--]-->`);
                                        },
                                        $$slots: { default: true }
                                      });
                                      $$renderer6.push("<!--]-->");
                                    } else {
                                      $$renderer6.push("<!--[!-->");
                                      $$renderer6.push("<!--]-->");
                                    }
                                  },
                                  $$slots: { default: true }
                                });
                                $$renderer5.push("<!--]-->");
                              } else {
                                $$renderer5.push("<!--[!-->");
                                $$renderer5.push("<!--]-->");
                              }
                            } else {
                              $$renderer5.push("<!--[-1-->");
                            }
                            $$renderer5.push(`<!--]-->`);
                          },
                          $$slots: { default: true }
                        }
                      ]));
                      $$renderer4.push("<!--]-->");
                    } else {
                      $$renderer4.push("<!--[!-->");
                      $$renderer4.push("<!--]-->");
                    }
                  };
                  if (Collapsible) {
                    $$renderer3.push("<!--[-->");
                    Collapsible($$renderer3, { open: mainItem.isActive, child, $$slots: { child: true } });
                    $$renderer3.push("<!--]-->");
                  } else {
                    $$renderer3.push("<!--[!-->");
                    $$renderer3.push("<!--]-->");
                  }
                }
              }
              $$renderer3.push(`<!--]-->`);
            },
            $$slots: { default: true }
          });
          $$renderer2.push("<!--]-->");
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push("<!--]-->");
        }
      },
      $$slots: { default: true }
    });
    $$renderer.push("<!--]-->");
  } else {
    $$renderer.push("<!--[!-->");
    $$renderer.push("<!--]-->");
  }
}
function Dropdown_menu($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { open = false, $$slots, $$events, ...restProps } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Menu) {
        $$renderer3.push("<!--[-->");
        Menu($$renderer3, spread_props([
          restProps,
          {
            get open() {
              return open;
            },
            set open($$value) {
              open = $$value;
              $$settled = false;
            }
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { open });
  });
}
function Dropdown_menu_portal($$renderer, $$props) {
  let { $$slots, $$events, ...restProps } = $$props;
  if (Portal) {
    $$renderer.push("<!--[-->");
    Portal($$renderer, spread_props([restProps]));
    $$renderer.push("<!--]-->");
  } else {
    $$renderer.push("<!--[!-->");
    $$renderer.push("<!--]-->");
  }
}
function Dropdown_menu_content($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      sideOffset = 4,
      align = "start",
      portalProps,
      class: className,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Dropdown_menu_portal($$renderer3, spread_props([
        portalProps,
        {
          children: ($$renderer4) => {
            if (Dropdown_menu_content$1) {
              $$renderer4.push("<!--[-->");
              Dropdown_menu_content$1($$renderer4, spread_props([
                {
                  "data-slot": "dropdown-menu-content",
                  sideOffset,
                  align,
                  class: cn("data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 text-popover-foreground min-w-32 rounded-lg p-1 shadow-md ring-1 duration-100 data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2 z-50 w-(--bits-dropdown-menu-anchor-width) overflow-x-hidden overflow-y-auto outline-none data-closed:overflow-hidden animate-none! relative bg-popover/70 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150 **:data-[slot$=-item]:focus:bg-foreground/10 **:data-[slot$=-item]:data-highlighted:bg-foreground/10 **:data-[slot$=-separator]:bg-foreground/5 **:data-[slot$=-trigger]:focus:bg-foreground/10 **:data-[slot$=-trigger]:aria-expanded:bg-foreground/10! **:data-[variant=destructive]:focus:bg-foreground/10! **:data-[variant=destructive]:text-accent-foreground! **:data-[variant=destructive]:**:text-accent-foreground!", className)
                },
                restProps,
                {
                  get ref() {
                    return ref;
                  },
                  set ref($$value) {
                    ref = $$value;
                    $$settled = false;
                  }
                }
              ]));
              $$renderer4.push("<!--]-->");
            } else {
              $$renderer4.push("<!--[!-->");
              $$renderer4.push("<!--]-->");
            }
          },
          $$slots: { default: true }
        }
      ]));
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Dropdown_menu_group($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { ref = null, $$slots, $$events, ...restProps } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Menu_group) {
        $$renderer3.push("<!--[-->");
        Menu_group($$renderer3, spread_props([
          { "data-slot": "dropdown-menu-group" },
          restProps,
          {
            get ref() {
              return ref;
            },
            set ref($$value) {
              ref = $$value;
              $$settled = false;
            }
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Dropdown_menu_item($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      inset,
      variant = "default",
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Menu_item) {
        $$renderer3.push("<!--[-->");
        Menu_item($$renderer3, spread_props([
          {
            "data-slot": "dropdown-menu-item",
            "data-inset": inset,
            "data-variant": variant,
            class: cn("focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive not-data-[variant=destructive]:focus:**:text-accent-foreground gap-1.5 rounded-md px-1.5 py-1 text-sm data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4 group/dropdown-menu-item relative flex cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0", className)
          },
          restProps,
          {
            get ref() {
              return ref;
            },
            set ref($$value) {
              ref = $$value;
              $$settled = false;
            }
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Dropdown_menu_label($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      inset,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    $$renderer2.push(`<div${attributes({
      "data-slot": "dropdown-menu-label",
      "data-inset": inset,
      class: clsx(cn("text-muted-foreground px-1.5 py-1 text-xs font-medium data-inset:pl-7 data-[inset]:pl-8", className)),
      ...restProps
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { ref });
  });
}
function Dropdown_menu_separator($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Menu_separator) {
        $$renderer3.push("<!--[-->");
        Menu_separator($$renderer3, spread_props([
          {
            "data-slot": "dropdown-menu-separator",
            class: cn("bg-border -mx-1 my-1 h-px", className)
          },
          restProps,
          {
            get ref() {
              return ref;
            },
            set ref($$value) {
              ref = $$value;
              $$settled = false;
            }
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Dropdown_menu_trigger($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { ref = null, $$slots, $$events, ...restProps } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Menu_trigger) {
        $$renderer3.push("<!--[-->");
        Menu_trigger($$renderer3, spread_props([
          { "data-slot": "dropdown-menu-trigger" },
          restProps,
          {
            get ref() {
              return ref;
            },
            set ref($$value) {
              ref = $$value;
              $$settled = false;
            }
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Nav_projects($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      projects
      // This should be `Component` after @lucide/svelte updates types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = $$props;
    const sidebar = useSidebar();
    if (Sidebar_group) {
      $$renderer2.push("<!--[-->");
      Sidebar_group($$renderer2, {
        class: "group-data-[collapsible=icon]:hidden",
        children: ($$renderer3) => {
          if (Sidebar_group_label) {
            $$renderer3.push("<!--[-->");
            Sidebar_group_label($$renderer3, {
              children: ($$renderer4) => {
                $$renderer4.push(`<!---->Projects`);
              },
              $$slots: { default: true }
            });
            $$renderer3.push("<!--]-->");
          } else {
            $$renderer3.push("<!--[!-->");
            $$renderer3.push("<!--]-->");
          }
          $$renderer3.push(` `);
          if (Sidebar_menu) {
            $$renderer3.push("<!--[-->");
            Sidebar_menu($$renderer3, {
              children: ($$renderer4) => {
                $$renderer4.push(`<!--[-->`);
                const each_array = ensure_array_like(projects);
                for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                  let item = each_array[$$index];
                  if (Sidebar_menu_item) {
                    $$renderer4.push("<!--[-->");
                    Sidebar_menu_item($$renderer4, {
                      children: ($$renderer5) => {
                        {
                          let child = function($$renderer6, { props }) {
                            $$renderer6.push(`<a${attributes({ href: item.url, ...props })}>`);
                            if (item.icon) {
                              $$renderer6.push("<!--[-->");
                              item.icon($$renderer6, {});
                              $$renderer6.push("<!--]-->");
                            } else {
                              $$renderer6.push("<!--[!-->");
                              $$renderer6.push("<!--]-->");
                            }
                            $$renderer6.push(` <span>${escape_html(item.name)}</span></a>`);
                          };
                          if (Sidebar_menu_button) {
                            $$renderer5.push("<!--[-->");
                            Sidebar_menu_button($$renderer5, { child, $$slots: { child: true } });
                            $$renderer5.push("<!--]-->");
                          } else {
                            $$renderer5.push("<!--[!-->");
                            $$renderer5.push("<!--]-->");
                          }
                        }
                        $$renderer5.push(` `);
                        if (Dropdown_menu) {
                          $$renderer5.push("<!--[-->");
                          Dropdown_menu($$renderer5, {
                            children: ($$renderer6) => {
                              {
                                let child = function($$renderer7, { props }) {
                                  if (Sidebar_menu_action) {
                                    $$renderer7.push("<!--[-->");
                                    Sidebar_menu_action($$renderer7, spread_props([
                                      { showOnHover: true },
                                      props,
                                      {
                                        children: ($$renderer8) => {
                                          Ellipsis($$renderer8, {});
                                          $$renderer8.push(`<!----> <span class="sr-only">More</span>`);
                                        },
                                        $$slots: { default: true }
                                      }
                                    ]));
                                    $$renderer7.push("<!--]-->");
                                  } else {
                                    $$renderer7.push("<!--[!-->");
                                    $$renderer7.push("<!--]-->");
                                  }
                                };
                                if (Dropdown_menu_trigger) {
                                  $$renderer6.push("<!--[-->");
                                  Dropdown_menu_trigger($$renderer6, { child, $$slots: { child: true } });
                                  $$renderer6.push("<!--]-->");
                                } else {
                                  $$renderer6.push("<!--[!-->");
                                  $$renderer6.push("<!--]-->");
                                }
                              }
                              $$renderer6.push(` `);
                              if (Dropdown_menu_content) {
                                $$renderer6.push("<!--[-->");
                                Dropdown_menu_content($$renderer6, {
                                  class: "w-48",
                                  side: sidebar.isMobile ? "bottom" : "right",
                                  align: sidebar.isMobile ? "end" : "start",
                                  children: ($$renderer7) => {
                                    if (Dropdown_menu_item) {
                                      $$renderer7.push("<!--[-->");
                                      Dropdown_menu_item($$renderer7, {
                                        children: ($$renderer8) => {
                                          Folder($$renderer8, { class: "text-muted-foreground" });
                                          $$renderer8.push(`<!----> <span>View Project</span>`);
                                        },
                                        $$slots: { default: true }
                                      });
                                      $$renderer7.push("<!--]-->");
                                    } else {
                                      $$renderer7.push("<!--[!-->");
                                      $$renderer7.push("<!--]-->");
                                    }
                                    $$renderer7.push(` `);
                                    if (Dropdown_menu_item) {
                                      $$renderer7.push("<!--[-->");
                                      Dropdown_menu_item($$renderer7, {
                                        children: ($$renderer8) => {
                                          Share($$renderer8, { class: "text-muted-foreground" });
                                          $$renderer8.push(`<!----> <span>Share Project</span>`);
                                        },
                                        $$slots: { default: true }
                                      });
                                      $$renderer7.push("<!--]-->");
                                    } else {
                                      $$renderer7.push("<!--[!-->");
                                      $$renderer7.push("<!--]-->");
                                    }
                                    $$renderer7.push(` `);
                                    if (Dropdown_menu_separator) {
                                      $$renderer7.push("<!--[-->");
                                      Dropdown_menu_separator($$renderer7, {});
                                      $$renderer7.push("<!--]-->");
                                    } else {
                                      $$renderer7.push("<!--[!-->");
                                      $$renderer7.push("<!--]-->");
                                    }
                                    $$renderer7.push(` `);
                                    if (Dropdown_menu_item) {
                                      $$renderer7.push("<!--[-->");
                                      Dropdown_menu_item($$renderer7, {
                                        children: ($$renderer8) => {
                                          Trash_2($$renderer8, { class: "text-muted-foreground" });
                                          $$renderer8.push(`<!----> <span>Delete Project</span>`);
                                        },
                                        $$slots: { default: true }
                                      });
                                      $$renderer7.push("<!--]-->");
                                    } else {
                                      $$renderer7.push("<!--[!-->");
                                      $$renderer7.push("<!--]-->");
                                    }
                                  },
                                  $$slots: { default: true }
                                });
                                $$renderer6.push("<!--]-->");
                              } else {
                                $$renderer6.push("<!--[!-->");
                                $$renderer6.push("<!--]-->");
                              }
                            },
                            $$slots: { default: true }
                          });
                          $$renderer5.push("<!--]-->");
                        } else {
                          $$renderer5.push("<!--[!-->");
                          $$renderer5.push("<!--]-->");
                        }
                      },
                      $$slots: { default: true }
                    });
                    $$renderer4.push("<!--]-->");
                  } else {
                    $$renderer4.push("<!--[!-->");
                    $$renderer4.push("<!--]-->");
                  }
                }
                $$renderer4.push(`<!--]--> `);
                if (Sidebar_menu_item) {
                  $$renderer4.push("<!--[-->");
                  Sidebar_menu_item($$renderer4, {
                    children: ($$renderer5) => {
                      if (Sidebar_menu_button) {
                        $$renderer5.push("<!--[-->");
                        Sidebar_menu_button($$renderer5, {
                          children: ($$renderer6) => {
                            Ellipsis($$renderer6, {});
                            $$renderer6.push(`<!----> <span>More</span>`);
                          },
                          $$slots: { default: true }
                        });
                        $$renderer5.push("<!--]-->");
                      } else {
                        $$renderer5.push("<!--[!-->");
                        $$renderer5.push("<!--]-->");
                      }
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
  });
}
function Nav_secondary($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { ref = null, items, $$slots, $$events, ...restProps } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Sidebar_group) {
        $$renderer3.push("<!--[-->");
        Sidebar_group($$renderer3, spread_props([
          restProps,
          {
            get ref() {
              return ref;
            },
            set ref($$value) {
              ref = $$value;
              $$settled = false;
            },
            children: ($$renderer4) => {
              if (Sidebar_group_content) {
                $$renderer4.push("<!--[-->");
                Sidebar_group_content($$renderer4, {
                  children: ($$renderer5) => {
                    if (Sidebar_menu) {
                      $$renderer5.push("<!--[-->");
                      Sidebar_menu($$renderer5, {
                        children: ($$renderer6) => {
                          $$renderer6.push(`<!--[-->`);
                          const each_array = ensure_array_like(items);
                          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                            let item = each_array[$$index];
                            if (Sidebar_menu_item) {
                              $$renderer6.push("<!--[-->");
                              Sidebar_menu_item($$renderer6, {
                                children: ($$renderer7) => {
                                  {
                                    let child = function($$renderer8, { props }) {
                                      $$renderer8.push(`<a${attributes({ href: item.url, ...props })}>`);
                                      if (item.icon) {
                                        $$renderer8.push("<!--[-->");
                                        item.icon($$renderer8, {});
                                        $$renderer8.push("<!--]-->");
                                      } else {
                                        $$renderer8.push("<!--[!-->");
                                        $$renderer8.push("<!--]-->");
                                      }
                                      $$renderer8.push(` <span>${escape_html(item.title)}</span></a>`);
                                    };
                                    if (Sidebar_menu_button) {
                                      $$renderer7.push("<!--[-->");
                                      Sidebar_menu_button($$renderer7, { size: "sm", child, $$slots: { child: true } });
                                      $$renderer7.push("<!--]-->");
                                    } else {
                                      $$renderer7.push("<!--[!-->");
                                      $$renderer7.push("<!--]-->");
                                    }
                                  }
                                },
                                $$slots: { default: true }
                              });
                              $$renderer6.push("<!--]-->");
                            } else {
                              $$renderer6.push("<!--[!-->");
                              $$renderer6.push("<!--]-->");
                            }
                          }
                          $$renderer6.push(`<!--]-->`);
                        },
                        $$slots: { default: true }
                      });
                      $$renderer5.push("<!--]-->");
                    } else {
                      $$renderer5.push("<!--[!-->");
                      $$renderer5.push("<!--]-->");
                    }
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
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Avatar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      loadingStatus = "loading",
      size = "default",
      class: className,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Avatar$1) {
        $$renderer3.push("<!--[-->");
        Avatar$1($$renderer3, spread_props([
          {
            "data-slot": "avatar",
            "data-size": size,
            class: cn("size-8 rounded-full after:rounded-full data-[size=lg]:size-10 data-[size=sm]:size-6 after:border-border group/avatar relative flex shrink-0 select-none after:absolute after:inset-0 after:border after:mix-blend-darken dark:after:mix-blend-lighten", className)
          },
          restProps,
          {
            get ref() {
              return ref;
            },
            set ref($$value) {
              ref = $$value;
              $$settled = false;
            },
            get loadingStatus() {
              return loadingStatus;
            },
            set loadingStatus($$value) {
              loadingStatus = $$value;
              $$settled = false;
            }
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref, loadingStatus });
  });
}
function Avatar_image($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Avatar_image$1) {
        $$renderer3.push("<!--[-->");
        Avatar_image$1($$renderer3, spread_props([
          {
            "data-slot": "avatar-image",
            class: cn("rounded-full aspect-square size-full object-cover", className)
          },
          restProps,
          {
            get ref() {
              return ref;
            },
            set ref($$value) {
              ref = $$value;
              $$settled = false;
            }
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Avatar_fallback($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Avatar_fallback$1) {
        $$renderer3.push("<!--[-->");
        Avatar_fallback$1($$renderer3, spread_props([
          {
            "data-slot": "avatar-fallback",
            class: cn("bg-muted text-muted-foreground rounded-full flex size-full items-center justify-center text-sm group-data-[size=sm]/avatar:text-xs", className)
          },
          restProps,
          {
            get ref() {
              return ref;
            },
            set ref($$value) {
              ref = $$value;
              $$settled = false;
            }
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function Nav_user($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { user } = $$props;
    const sidebar = useSidebar();
    if (Sidebar_menu) {
      $$renderer2.push("<!--[-->");
      Sidebar_menu($$renderer2, {
        children: ($$renderer3) => {
          if (Sidebar_menu_item) {
            $$renderer3.push("<!--[-->");
            Sidebar_menu_item($$renderer3, {
              children: ($$renderer4) => {
                if (Dropdown_menu) {
                  $$renderer4.push("<!--[-->");
                  Dropdown_menu($$renderer4, {
                    children: ($$renderer5) => {
                      {
                        let child = function($$renderer6, { props }) {
                          if (Sidebar_menu_button) {
                            $$renderer6.push("<!--[-->");
                            Sidebar_menu_button($$renderer6, spread_props([
                              props,
                              {
                                size: "lg",
                                class: "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                                children: ($$renderer7) => {
                                  if (Avatar) {
                                    $$renderer7.push("<!--[-->");
                                    Avatar($$renderer7, {
                                      class: "size-8 rounded-lg",
                                      children: ($$renderer8) => {
                                        if (Avatar_image) {
                                          $$renderer8.push("<!--[-->");
                                          Avatar_image($$renderer8, { src: user.avatar, alt: user.name });
                                          $$renderer8.push("<!--]-->");
                                        } else {
                                          $$renderer8.push("<!--[!-->");
                                          $$renderer8.push("<!--]-->");
                                        }
                                        $$renderer8.push(` `);
                                        if (Avatar_fallback) {
                                          $$renderer8.push("<!--[-->");
                                          Avatar_fallback($$renderer8, {
                                            class: "rounded-lg",
                                            children: ($$renderer9) => {
                                              $$renderer9.push(`<!---->CN`);
                                            },
                                            $$slots: { default: true }
                                          });
                                          $$renderer8.push("<!--]-->");
                                        } else {
                                          $$renderer8.push("<!--[!-->");
                                          $$renderer8.push("<!--]-->");
                                        }
                                      },
                                      $$slots: { default: true }
                                    });
                                    $$renderer7.push("<!--]-->");
                                  } else {
                                    $$renderer7.push("<!--[!-->");
                                    $$renderer7.push("<!--]-->");
                                  }
                                  $$renderer7.push(` <div class="grid flex-1 text-start text-sm leading-tight"><span class="truncate font-medium">${escape_html(user.name)}</span> <span class="truncate text-xs">${escape_html(user.email)}</span></div> `);
                                  Chevrons_up_down($$renderer7, { class: "ms-auto size-4" });
                                  $$renderer7.push(`<!---->`);
                                },
                                $$slots: { default: true }
                              }
                            ]));
                            $$renderer6.push("<!--]-->");
                          } else {
                            $$renderer6.push("<!--[!-->");
                            $$renderer6.push("<!--]-->");
                          }
                        };
                        if (Dropdown_menu_trigger) {
                          $$renderer5.push("<!--[-->");
                          Dropdown_menu_trigger($$renderer5, { child, $$slots: { child: true } });
                          $$renderer5.push("<!--]-->");
                        } else {
                          $$renderer5.push("<!--[!-->");
                          $$renderer5.push("<!--]-->");
                        }
                      }
                      $$renderer5.push(` `);
                      if (Dropdown_menu_content) {
                        $$renderer5.push("<!--[-->");
                        Dropdown_menu_content($$renderer5, {
                          class: "w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg",
                          side: sidebar.isMobile ? "bottom" : "right",
                          align: "end",
                          sideOffset: 4,
                          children: ($$renderer6) => {
                            if (Dropdown_menu_label) {
                              $$renderer6.push("<!--[-->");
                              Dropdown_menu_label($$renderer6, {
                                class: "p-0 font-normal",
                                children: ($$renderer7) => {
                                  $$renderer7.push(`<div class="flex items-center gap-2 px-1 py-1.5 text-start text-sm">`);
                                  if (Avatar) {
                                    $$renderer7.push("<!--[-->");
                                    Avatar($$renderer7, {
                                      class: "size-8 rounded-lg",
                                      children: ($$renderer8) => {
                                        if (Avatar_image) {
                                          $$renderer8.push("<!--[-->");
                                          Avatar_image($$renderer8, { src: user.avatar, alt: user.name });
                                          $$renderer8.push("<!--]-->");
                                        } else {
                                          $$renderer8.push("<!--[!-->");
                                          $$renderer8.push("<!--]-->");
                                        }
                                        $$renderer8.push(` `);
                                        if (Avatar_fallback) {
                                          $$renderer8.push("<!--[-->");
                                          Avatar_fallback($$renderer8, {
                                            class: "rounded-lg",
                                            children: ($$renderer9) => {
                                              $$renderer9.push(`<!---->CN`);
                                            },
                                            $$slots: { default: true }
                                          });
                                          $$renderer8.push("<!--]-->");
                                        } else {
                                          $$renderer8.push("<!--[!-->");
                                          $$renderer8.push("<!--]-->");
                                        }
                                      },
                                      $$slots: { default: true }
                                    });
                                    $$renderer7.push("<!--]-->");
                                  } else {
                                    $$renderer7.push("<!--[!-->");
                                    $$renderer7.push("<!--]-->");
                                  }
                                  $$renderer7.push(` <div class="grid flex-1 text-start text-sm leading-tight"><span class="truncate font-medium">${escape_html(user.name)}</span> <span class="truncate text-xs">${escape_html(user.email)}</span></div></div>`);
                                },
                                $$slots: { default: true }
                              });
                              $$renderer6.push("<!--]-->");
                            } else {
                              $$renderer6.push("<!--[!-->");
                              $$renderer6.push("<!--]-->");
                            }
                            $$renderer6.push(` `);
                            if (Dropdown_menu_separator) {
                              $$renderer6.push("<!--[-->");
                              Dropdown_menu_separator($$renderer6, {});
                              $$renderer6.push("<!--]-->");
                            } else {
                              $$renderer6.push("<!--[!-->");
                              $$renderer6.push("<!--]-->");
                            }
                            $$renderer6.push(` `);
                            if (Dropdown_menu_group) {
                              $$renderer6.push("<!--[-->");
                              Dropdown_menu_group($$renderer6, {
                                children: ($$renderer7) => {
                                  if (Dropdown_menu_item) {
                                    $$renderer7.push("<!--[-->");
                                    Dropdown_menu_item($$renderer7, {
                                      children: ($$renderer8) => {
                                        Sparkles($$renderer8, {});
                                        $$renderer8.push(`<!----> Upgrade to Pro`);
                                      },
                                      $$slots: { default: true }
                                    });
                                    $$renderer7.push("<!--]-->");
                                  } else {
                                    $$renderer7.push("<!--[!-->");
                                    $$renderer7.push("<!--]-->");
                                  }
                                },
                                $$slots: { default: true }
                              });
                              $$renderer6.push("<!--]-->");
                            } else {
                              $$renderer6.push("<!--[!-->");
                              $$renderer6.push("<!--]-->");
                            }
                            $$renderer6.push(` `);
                            if (Dropdown_menu_separator) {
                              $$renderer6.push("<!--[-->");
                              Dropdown_menu_separator($$renderer6, {});
                              $$renderer6.push("<!--]-->");
                            } else {
                              $$renderer6.push("<!--[!-->");
                              $$renderer6.push("<!--]-->");
                            }
                            $$renderer6.push(` `);
                            if (Dropdown_menu_group) {
                              $$renderer6.push("<!--[-->");
                              Dropdown_menu_group($$renderer6, {
                                children: ($$renderer7) => {
                                  if (Dropdown_menu_item) {
                                    $$renderer7.push("<!--[-->");
                                    Dropdown_menu_item($$renderer7, {
                                      children: ($$renderer8) => {
                                        Badge_check($$renderer8, {});
                                        $$renderer8.push(`<!----> Account`);
                                      },
                                      $$slots: { default: true }
                                    });
                                    $$renderer7.push("<!--]-->");
                                  } else {
                                    $$renderer7.push("<!--[!-->");
                                    $$renderer7.push("<!--]-->");
                                  }
                                  $$renderer7.push(` `);
                                  if (Dropdown_menu_item) {
                                    $$renderer7.push("<!--[-->");
                                    Dropdown_menu_item($$renderer7, {
                                      children: ($$renderer8) => {
                                        Credit_card($$renderer8, {});
                                        $$renderer8.push(`<!----> Billing`);
                                      },
                                      $$slots: { default: true }
                                    });
                                    $$renderer7.push("<!--]-->");
                                  } else {
                                    $$renderer7.push("<!--[!-->");
                                    $$renderer7.push("<!--]-->");
                                  }
                                  $$renderer7.push(` `);
                                  if (Dropdown_menu_item) {
                                    $$renderer7.push("<!--[-->");
                                    Dropdown_menu_item($$renderer7, {
                                      children: ($$renderer8) => {
                                        Bell($$renderer8, {});
                                        $$renderer8.push(`<!----> Notifications`);
                                      },
                                      $$slots: { default: true }
                                    });
                                    $$renderer7.push("<!--]-->");
                                  } else {
                                    $$renderer7.push("<!--[!-->");
                                    $$renderer7.push("<!--]-->");
                                  }
                                },
                                $$slots: { default: true }
                              });
                              $$renderer6.push("<!--]-->");
                            } else {
                              $$renderer6.push("<!--[!-->");
                              $$renderer6.push("<!--]-->");
                            }
                            $$renderer6.push(` `);
                            if (Dropdown_menu_separator) {
                              $$renderer6.push("<!--[-->");
                              Dropdown_menu_separator($$renderer6, {});
                              $$renderer6.push("<!--]-->");
                            } else {
                              $$renderer6.push("<!--[!-->");
                              $$renderer6.push("<!--]-->");
                            }
                            $$renderer6.push(` `);
                            if (Dropdown_menu_item) {
                              $$renderer6.push("<!--[-->");
                              Dropdown_menu_item($$renderer6, {
                                children: ($$renderer7) => {
                                  Log_out($$renderer7, {});
                                  $$renderer7.push(`<!----> Log out`);
                                },
                                $$slots: { default: true }
                              });
                              $$renderer6.push("<!--]-->");
                            } else {
                              $$renderer6.push("<!--[!-->");
                              $$renderer6.push("<!--]-->");
                            }
                          },
                          $$slots: { default: true }
                        });
                        $$renderer5.push("<!--]-->");
                      } else {
                        $$renderer5.push("<!--[!-->");
                        $$renderer5.push("<!--]-->");
                      }
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
  });
}
const data = {
  user: {
    name: "AristideBH",
    email: "aristide.bruneau@gmail.com",
    avatar: "https://lh3.googleusercontent.com/ogw/AF2bZygWD1VnCuSLoYoJgUw9D81WnItSm2tUzgU2KF3NvbXNIOuV=s32-c-mo"
  },
  navMain: [
    {
      title: "What is SpinPad?",
      url: "#",
      icon: Square_terminal,
      items: [
        { title: "History", url: "#" },
        { title: "Starred", url: "#" },
        { title: "Settings", url: "#" }
      ]
    },
    {
      title: "Hardware",
      url: "#",
      icon: Bot,
      items: [
        { title: "PCB", url: "#" },
        { title: "3D Models", url: "#" },
        { title: "Assembly", url: "#" }
      ]
    },
    {
      title: "Documentation",
      url: "/docs",
      icon: Book_open,
      items: [
        { title: "Introduction", url: "#" },
        { title: "Get Started", url: "#" },
        { title: "Tutorials", url: "#" },
        { title: "Changelog", url: "#" }
      ]
    },
    {
      title: "Editor",
      url: "/editor",
      icon: Settings_2,
      isActive: true,
      items: [
        { title: "Keymap", url: "/editor/keymap" },
        { title: "Profiles", url: "/editor/profiles" },
        { title: "Bluetooth", url: "/editor/ble" },
        { title: "Display", url: "/editor/display" }
      ]
    }
  ],
  navSecondary: [
    { title: "Support", url: "#", icon: Life_buoy },
    { title: "Feedback", url: "#", icon: Send }
  ],
  projects: [
    { name: "Design Engineering", url: "#", icon: Frame },
    { name: "Sales & Marketing", url: "#", icon: Chart_pie },
    { name: "Travel", url: "#", icon: Map$1 }
  ]
};
function App_sidebar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { ref = null, $$slots, $$events, ...restProps } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (Sidebar) {
        $$renderer3.push("<!--[-->");
        Sidebar($$renderer3, spread_props([
          { variant: "inset" },
          restProps,
          {
            get ref() {
              return ref;
            },
            set ref($$value) {
              ref = $$value;
              $$settled = false;
            },
            children: ($$renderer4) => {
              if (Sidebar_header) {
                $$renderer4.push("<!--[-->");
                Sidebar_header($$renderer4, {
                  children: ($$renderer5) => {
                    if (Sidebar_menu) {
                      $$renderer5.push("<!--[-->");
                      Sidebar_menu($$renderer5, {
                        children: ($$renderer6) => {
                          if (Sidebar_menu_item) {
                            $$renderer6.push("<!--[-->");
                            Sidebar_menu_item($$renderer6, {
                              children: ($$renderer7) => {
                                {
                                  let child = function($$renderer8, { props }) {
                                    $$renderer8.push(`<a${attributes({ href: "/", ...props })}><div class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">`);
                                    Command($$renderer8, { class: "size-4" });
                                    $$renderer8.push(`<!----></div> <div class="grid flex-1 text-start text-sm leading-tight"><span class="truncate font-medium">SpinPad</span></div></a>`);
                                  };
                                  if (Sidebar_menu_button) {
                                    $$renderer7.push("<!--[-->");
                                    Sidebar_menu_button($$renderer7, { size: "lg", child, $$slots: { child: true } });
                                    $$renderer7.push("<!--]-->");
                                  } else {
                                    $$renderer7.push("<!--[!-->");
                                    $$renderer7.push("<!--]-->");
                                  }
                                }
                              },
                              $$slots: { default: true }
                            });
                            $$renderer6.push("<!--]-->");
                          } else {
                            $$renderer6.push("<!--[!-->");
                            $$renderer6.push("<!--]-->");
                          }
                        },
                        $$slots: { default: true }
                      });
                      $$renderer5.push("<!--]-->");
                    } else {
                      $$renderer5.push("<!--[!-->");
                      $$renderer5.push("<!--]-->");
                    }
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push("<!--]-->");
              } else {
                $$renderer4.push("<!--[!-->");
                $$renderer4.push("<!--]-->");
              }
              $$renderer4.push(` `);
              if (Sidebar_content) {
                $$renderer4.push("<!--[-->");
                Sidebar_content($$renderer4, {
                  children: ($$renderer5) => {
                    Nav_main($$renderer5, { items: data.navMain });
                    $$renderer5.push(`<!----> `);
                    Nav_projects($$renderer5, { projects: data.projects });
                    $$renderer5.push(`<!----> `);
                    Nav_secondary($$renderer5, { items: data.navSecondary, class: "mt-auto" });
                    $$renderer5.push(`<!---->`);
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push("<!--]-->");
              } else {
                $$renderer4.push("<!--[!-->");
                $$renderer4.push("<!--]-->");
              }
              $$renderer4.push(` `);
              if (Sidebar_footer) {
                $$renderer4.push("<!--[-->");
                Sidebar_footer($$renderer4, {
                  children: ($$renderer5) => {
                    Nav_user($$renderer5, { user: data.user });
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push("<!--]-->");
              } else {
                $$renderer4.push("<!--[!-->");
                $$renderer4.push("<!--]-->");
              }
              $$renderer4.push(` `);
              if (Sidebar_rail) {
                $$renderer4.push("<!--[-->");
                Sidebar_rail($$renderer4, { class: "my-6" });
                $$renderer4.push("<!--]-->");
              } else {
                $$renderer4.push("<!--[!-->");
                $$renderer4.push("<!--]-->");
              }
            },
            $$slots: { default: true }
          }
        ]));
        $$renderer3.push("<!--]-->");
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push("<!--]-->");
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { ref });
  });
}
function StatusCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    async function handleDevMode() {
      devMode.active = !devMode.active;
      await loadConfig();
      configState.loadError = null;
    }
    if (!serial.connected) {
      $$renderer2.push("<!--[0-->");
      Button($$renderer2, {
        variant: "ghost",
        size: "icon",
        onclick: handleDevMode,
        class: "text-muted-foreground hover:text-blue-400 gap-1.5",
        children: ($$renderer3) => {
          Flask_conical($$renderer3, { class: `${devMode.active ? "text-blue-400" : ""} size-4` });
        },
        $$slots: { default: true }
      });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    Badge($$renderer2, {
      variant: "secondary",
      children: ($$renderer3) => {
        if (configState.isLoading) {
          $$renderer3.push("<!--[0-->");
          Spinner($$renderer3, {});
          $$renderer3.push(`<!----> Connecting`);
        } else {
          $$renderer3.push("<!--[-1-->");
          $$renderer3.push(`<div${attr_class("size-1.5 mr-0.5 rounded-full transition-colors", void 0, {
            "bg-emerald-500": serial.connected && !configState.loadError,
            "bg-amber-400": !serial.connected && !devMode.active,
            "bg-destructive": configState.loadError && !devMode.active,
            "bg-blue-400": devMode.active
          })}></div> `);
          if (devMode.active) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`Démo`);
          } else if (configState.loadError) {
            $$renderer3.push("<!--[1-->");
            $$renderer3.push(`Erreur`);
          } else {
            $$renderer3.push("<!--[-1-->");
            $$renderer3.push(`${escape_html(serial.connected ? "Connecté" : "Non connecté")}`);
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]-->`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----> <div class="flex items-center gap-1.5 text-xs text-muted-foreground"></div> <div class="flex flex-col items-center gap-2"><div class="flex w-full flex-wrap gap-2"></div></div>`);
  });
}
function Breadcrumbs($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { children } = $$props;
    Mode_watcher($$renderer2, {});
    $$renderer2.push(`<!----> `);
    if (Sidebar_provider) {
      $$renderer2.push("<!--[-->");
      Sidebar_provider($$renderer2, {
        class: "h-screen",
        children: ($$renderer3) => {
          App_sidebar($$renderer3, {});
          $$renderer3.push(`<!----> `);
          if (Sidebar_inset) {
            $$renderer3.push("<!--[-->");
            Sidebar_inset($$renderer3, {
              class: "overflow-x-hidden overflow-y-auto",
              children: ($$renderer4) => {
                $$renderer4.push(`<header class="flex h-16 shrink-0 border-b items-center gap-2 justify-between sticky top-0 bg-background rounded-t-xl"><div class="flex items-center gap-2 px-6">`);
                if (Sidebar_trigger) {
                  $$renderer4.push("<!--[-->");
                  Sidebar_trigger($$renderer4, { class: "-ms-1" });
                  $$renderer4.push("<!--]-->");
                } else {
                  $$renderer4.push("<!--[!-->");
                  $$renderer4.push("<!--]-->");
                }
                $$renderer4.push(` `);
                Separator($$renderer4, {
                  orientation: "vertical",
                  class: "me-2 data-[orientation=vertical]:h-4"
                });
                $$renderer4.push(`<!----> `);
                Breadcrumbs($$renderer4);
                $$renderer4.push(`<!----></div> <div class="flex items-center gap-2 px-6">`);
                StatusCard($$renderer4);
                $$renderer4.push(`<!----> `);
                Button($$renderer4, {
                  size: "sm",
                  onclick: saveConfig,
                  class: "gap-1.5",
                  disabled: !configState.isDirty,
                  children: ($$renderer5) => {
                    Save($$renderer5, { class: "size-4" });
                    $$renderer5.push(`<!----> Sauvegarder`);
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!----></div></header> <main class="px-6 py-6 max-w-5xl mx-auto w-full items-stretch">`);
                children($$renderer4);
                $$renderer4.push(`<!----></main>`);
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
  });
}
export {
  _layout as default
};
