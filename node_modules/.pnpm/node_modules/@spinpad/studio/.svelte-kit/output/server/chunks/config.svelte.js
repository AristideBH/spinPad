import "clsx";
import { b as action, M as MEDIA_CODES, A as ACTION_TYPES } from "./keycodes.js";
class SerialState {
  connected = false;
  error = null;
}
const serial = new SerialState();
let port = null;
let writer = null;
let reader = null;
let readBuffer = "";
const messageHandlers = /* @__PURE__ */ new Set();
async function connect() {
  if (!("serial" in navigator)) {
    serial.error = "WebSerial non supporté. Utilise Chrome ou Edge.";
    return false;
  }
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    writer = port.writable.getWriter();
    startReading();
    serial.connected = true;
    serial.error = null;
    return true;
  } catch (err) {
    serial.error = `Erreur connexion : ${err.message}`;
    return false;
  }
}
async function disconnect() {
  if (writer) {
    await writer.close();
    writer = null;
  }
  if (reader) {
    reader.cancel();
    reader = null;
  }
  if (port) {
    await port.close();
    port = null;
  }
  serial.connected = false;
}
async function startReading() {
  reader = port.readable.getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      readBuffer += decoder.decode(value);
      const lines = readBuffer.split("\n");
      readBuffer = lines.pop();
      for (const line of lines) {
        if (line.trim()) handleIncomingMessage(line.trim());
      }
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("Erreur lecture serial:", err);
      serial.connected = false;
    }
  } finally {
    reader.releaseLock();
  }
}
function handleIncomingMessage(line) {
  try {
    const msg = JSON.parse(line);
    messageHandlers.forEach((handler) => handler(msg));
  } catch {
    console.warn("Message non-JSON reçu:", line);
  }
}
function onMessage(handler) {
  messageHandlers.add(handler);
  return () => messageHandlers.delete(handler);
}
async function sendRaw(jsonString) {
  if (!writer || !serial.connected) throw new Error("Non connecté");
  const encoder = new TextEncoder();
  await writer.write(encoder.encode(jsonString + "\n"));
}
async function getConfig() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => {
        cleanup();
        reject(new Error("Timeout — pas de réponse du clavier"));
      },
      5e3
    );
    const cleanup = onMessage((msg) => {
      if (msg.version !== void 0 && msg.profiles !== void 0) {
        clearTimeout(timeout);
        cleanup();
        resolve(msg);
      }
    });
    sendRaw(JSON.stringify({ cmd: "get_config" }));
  });
}
async function setConfig(config) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => {
        cleanup();
        reject(new Error("Timeout"));
      },
      5e3
    );
    const cleanup = onMessage((msg) => {
      if (msg.status === "ok") {
        clearTimeout(timeout);
        cleanup();
        resolve(msg);
      }
    });
    sendRaw(JSON.stringify({ cmd: "set_config", payload: config }));
  });
}
async function factoryReset() {
  await sendRaw(JSON.stringify({ cmd: "factory_reset" }));
}
class DevModeState {
  active = false;
}
const devMode = new DevModeState();
const {
  ACTION_TYPE_KC: TYPE_KC,
  ACTION_TYPE_MOD: TYPE_MOD,
  ACTION_TYPE_LAYER_MO: TYPE_MO,
  ACTION_TYPE_LAYER_TG: TYPE_TG,
  ACTION_TYPE_LAYER_TO: TYPE_TO,
  ACTION_TYPE_MEDIA: TYPE_MEDIA
} = ACTION_TYPES;
const {
  MEDIA_VOL_UP,
  MEDIA_VOL_DN,
  MEDIA_MUTE,
  MEDIA_PLAY,
  MEDIA_NEXT,
  MEDIA_PREV,
  MEDIA_SCRL_UP,
  MEDIA_SCRL_DN,
  MEDIA_ZOOM_IN,
  MEDIA_ZOOM_OUT
} = MEDIA_CODES;
const KC = (v) => action(TYPE_KC, v);
const MOD = (v) => action(TYPE_MOD, v);
const MO = (v) => action(TYPE_MO, v);
const TG = (v) => action(TYPE_TG, v);
const TO = (v) => action(TYPE_TO, v);
const LCTRL = MOD(1);
const LSHIFT = MOD(2);
const LALT = MOD(4);
const ESC = KC(41);
const ENTER = KC(40);
const TAB = KC(43);
const BKSP = KC(42);
const SPACE = KC(44);
const DEL = KC(76);
const F1 = KC(58);
const F2 = KC(59);
const F3 = KC(60);
const F4 = KC(61);
const F5 = KC(62);
const F6 = KC(63);
const VOL_UP = action(TYPE_MEDIA, MEDIA_VOL_UP);
const VOL_DN = action(TYPE_MEDIA, MEDIA_VOL_DN);
const MUTE = action(TYPE_MEDIA, MEDIA_MUTE);
const PLAY = action(TYPE_MEDIA, MEDIA_PLAY);
const NEXT = action(TYPE_MEDIA, MEDIA_NEXT);
const PREV = action(TYPE_MEDIA, MEDIA_PREV);
const SCRL_UP = action(TYPE_MEDIA, MEDIA_SCRL_UP);
const SCRL_DN = action(TYPE_MEDIA, MEDIA_SCRL_DN);
const ZOOM_IN = action(TYPE_MEDIA, MEDIA_ZOOM_IN);
const ZOOM_OUT = action(TYPE_MEDIA, MEDIA_ZOOM_OUT);
const MOCK_CONFIG = {
  version: 1,
  active_profile: 0,
  profile_count: 2,
  profiles: [
    // ══════════════════════════════════════════════════════
    //  PROFILE 1 — "Shortcuts"
    //  Demonstrates: MO (hold SW1 for Fn) + TG (toggle SW10 for Media)
    //
    //  Layer 0  Base    → everyday shortcuts + modifiers
    //  Layer 1  Fn      → F-keys, accessible while SW1 is held
    //  Layer 2  Media   → playback/volume, toggled by SW10
    // ══════════════════════════════════════════════════════
    {
      name: "Shortcuts",
      layer_count: 3,
      layers: [
        {
          name: "Base",
          //        SW1     SW8   SW2   SW7   SW9
          //        SW3     SW6   SW10  SW4   SW5
          keys: [
            MO(1),
            ESC,
            BKSP,
            TAB,
            ENTER,
            LCTRL,
            LSHIFT,
            TG(2),
            LALT,
            SPACE
          ],
          encoder: { cw: VOL_UP, ccw: VOL_DN, press: MUTE }
        },
        {
          // Accessed by holding SW1 (MO)
          // SW1 itself is transparent (0) — it stays held
          name: "Fn",
          keys: [
            0,
            DEL,
            F2,
            F3,
            F4,
            F5,
            F6,
            0,
            0,
            0
          ],
          encoder: { cw: ZOOM_IN, ccw: ZOOM_OUT, press: 0 }
        },
        {
          // Accessed by toggling SW10 (TG)
          // TO(0) on SW1 and SW10 lets the user exit back to Base
          name: "Media",
          keys: [
            TO(0),
            PLAY,
            NEXT,
            PREV,
            MUTE,
            SCRL_UP,
            SCRL_DN,
            TO(0),
            VOL_DN,
            VOL_UP
          ],
          encoder: { cw: SCRL_UP, ccw: SCRL_DN, press: PLAY }
        }
      ],
      combo_count: 0,
      combos: []
    },
    // ══════════════════════════════════════════════════════
    //  PROFILE 2 — "Gaming"
    //  Demonstrates: TG to switch between two full layers
    //
    //  Layer 0  WASD    → in-game actions
    //  Layer 1  Menu    → overlay / settings keys, toggle on/off
    // ══════════════════════════════════════════════════════
    {
      name: "Gaming",
      layer_count: 2,
      layers: [
        {
          name: "WASD",
          //        SW1     SW8        SW2        SW7        SW9
          //        SW3     SW6        SW10       SW4        SW5
          keys: [
            TG(1),
            KC(29),
            KC(8),
            KC(9),
            KC(22),
            // TG  Z  E  F  S
            TAB,
            SPACE,
            LSHIFT,
            LCTRL,
            LALT
            // Tab Spc Shift Ctrl Alt
          ],
          encoder: { cw: VOL_UP, ccw: VOL_DN, press: MUTE }
        },
        {
          // TG(1) on SW1 toggles back to WASD layer
          name: "Menu",
          keys: [
            TG(1),
            ESC,
            F1,
            F2,
            F3,
            F4,
            F5,
            F6,
            ENTER,
            0
          ],
          encoder: { cw: SCRL_UP, ccw: SCRL_DN, press: ENTER }
        }
      ],
      combo_count: 0,
      combos: []
    }
  ],
  ble: {
    device_name: "SpinPad",
    active_slot: 0,
    slot_names: ["PC Principal", "MacBook"]
  },
  display: {
    brightness: 180,
    timeout_s: 30,
    show_battery: true,
    show_layer: true,
    show_profile: true,
    show_ble_status: true
  },
  power: {
    sleep_timeout_s: 300,
    battery_critical_pct: 10
  }
};
class ConfigState {
  data = null;
  activeProfileIndex = 0;
  activeLayerIndex = 0;
  isDirty = false;
  isLoading = false;
  loadError = null;
  get activeProfile() {
    return this.data?.profiles?.[this.activeProfileIndex] ?? null;
  }
  get activeLayer() {
    return this.activeProfile?.layers?.[this.activeLayerIndex] ?? null;
  }
}
const configState = new ConfigState();
async function loadConfig() {
  configState.isLoading = true;
  configState.loadError = null;
  try {
    if (devMode.active) {
      await new Promise((r) => setTimeout(r, 300));
      configState.data = structuredClone(MOCK_CONFIG);
      configState.activeProfileIndex = MOCK_CONFIG.active_profile ?? 0;
      configState.isDirty = false;
      return;
    }
    const cfg = await getConfig();
    configState.data = cfg;
    configState.activeProfileIndex = cfg.active_profile ?? 0;
    configState.isDirty = false;
  } catch (err) {
    configState.loadError = err.message;
    console.error("Erreur chargement config :", err);
  } finally {
    configState.isLoading = false;
  }
}
async function saveConfig() {
  configState.isLoading = true;
  try {
    if (devMode.active) {
      await new Promise((r) => setTimeout(r, 200));
      configState.isDirty = false;
      return;
    }
    await setConfig(configState.data);
    configState.isDirty = false;
  } catch (err) {
    configState.loadError = err.message;
    console.error("Erreur sauvegarde :", err);
  } finally {
    configState.isLoading = false;
  }
}
export {
  connect as a,
  disconnect as b,
  configState as c,
  devMode as d,
  serial as e,
  factoryReset as f,
  loadConfig as l,
  saveConfig as s
};
