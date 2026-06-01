// ═══════════════════════════════════════════════════════════════
//  config_store.c — Persistence JSON ↔ NVS
//
//  cJSON est inclus dans ESP-IDF (composant "json").
//  C'est une lib légère pour parser/générer du JSON en C.
//
//  Analogie JS :
//    cJSON_Parse(str)          ≈  JSON.parse(str)
//    cJSON_GetObjectItem(o,k)  ≈  obj[key]
//    cJSON_GetNumberValue(i)   ≈  Number(item)
//    cJSON_PrintUnformatted(o) ≈  JSON.stringify(obj)
// ═══════════════════════════════════════════════════════════════

#include "config_store.h"
#include "keymap.h"
#include "nvs_flash.h"
#include "nvs.h"
#include "cJSON.h"
#include "esp_log.h"
#include "mbedtls/base64.h"
#include <string.h>
#include <stdlib.h>

static const char *TAG = "CONFIG";

// Namespace NVS (comme un "préfixe" de clé)
#define NVS_NAMESPACE   "kb_config"
// Clé sous laquelle on stocke le JSON complet
#define NVS_KEY_JSON    "cfg_json"

// Config en RAM — une seule instance globale
static kb_config_t g_config;
// Flag : config chargée ?
static bool g_initialized = false;

// ─────────────────────────────────────────────────────────────
//  Keycodes supplémentaires pour les profils par défaut
//  (non définis dans keymap.h — encodés directement)
// ─────────────────────────────────────────────────────────────
#define KC_F6        ACTION(ACTION_TYPE_KC, 0x3F)
#define KC_RIGHT     ACTION(ACTION_TYPE_KC, 0x4F)
#define KC_LEFT      ACTION(ACTION_TYPE_KC, 0x50)
#define KC_DOWN      ACTION(ACTION_TYPE_KC, 0x51)
#define KC_UP        ACTION(ACTION_TYPE_KC, 0x52)
#define KC_HOME      ACTION(ACTION_TYPE_KC, 0x4A)
#define KC_END       ACTION(ACTION_TYPE_KC, 0x4D)
#define KC_PGUP      ACTION(ACTION_TYPE_KC, 0x4B)
#define KC_PGDN      ACTION(ACTION_TYPE_KC, 0x4E)
#define KC_STOP      ACTION(ACTION_TYPE_MEDIA, 0x07)
#define KC_BRT_UP    ACTION(ACTION_TYPE_MEDIA, 0x22)
#define KC_BRT_DN    ACTION(ACTION_TYPE_MEDIA, 0x23)
#define KC_APP_CALC  ACTION(ACTION_TYPE_MEDIA, 0x30)
#define KC_APP_BROW  ACTION(ACTION_TYPE_MEDIA, 0x32)
#define KC_APP_FILE  ACTION(ACTION_TYPE_MEDIA, 0x34)
#define KC_SCRSHOT   ACTION(ACTION_TYPE_MEDIA, 0x38)
#define KC_MACRO0    ACTION(ACTION_TYPE_MACRO, 0x00)
#define KC_MACRO1    ACTION(ACTION_TYPE_MACRO, 0x01)

// Remplir un layer : nom, 10 keycodes, et les 3 actions d'encodeur.
static void set_layer(kb_layer_t *l, const char *name,
                      const uint16_t keys[CONFIG_NUM_KEYS],
                      uint16_t cw, uint16_t ccw, uint16_t press)
{
    strncpy(l->name, name, CONFIG_NAME_MAX_LEN - 1);
    for (int k = 0; k < CONFIG_NUM_KEYS; k++) l->keys[k] = keys[k];
    l->encoder_cw    = cw;
    l->encoder_ccw   = ccw;
    l->encoder_press = press;
}

// ─────────────────────────────────────────────────────────────
//  CONFIG PAR DÉFAUT
//  Appliquée quand aucune config n'existe en NVS
//
//  4 profils riches (miroir de mock/keyboard-config.ts) : un
//  nouveau board démarre directement avec des layouts utiles et
//  de quoi exercer toute l'UI de config.
//  Ordre des touches : [SW1, SW8, SW2, SW7, SW9, SW3, SW6, SW10, SW4, SW5]
// ─────────────────────────────────────────────────────────────
static void apply_defaults(void)
{
    // memset met tout à zéro (équivalent à initialiser toutes les valeurs à 0/false)
    memset(&g_config, 0, sizeof(kb_config_t));

    g_config.version        = CONFIG_FORMAT_VERSION;
    g_config.profile_count  = 4;
    g_config.active_profile = 0;

    kb_profile_t *p;

    // ══════════════════════════════════════════════════════════
    //  PROFIL 1 — "Productivity" : Base + Fn (MO) + Nav (TG)
    // ══════════════════════════════════════════════════════════
    p = &g_config.profiles[0];
    strncpy(p->name, "Productivity", CONFIG_NAME_MAX_LEN - 1);
    p->layer_count = 3;
    set_layer(&p->layers[0], "Base", (const uint16_t[]){
        MO(1),     KC_C,      KC_V,      KC_X,      KC_Z,
        MOD_LCTRL, MOD_LSHIFT, TG(2),    MOD_LGUI,  KC_SPACE,
    }, KC_VOLU, KC_VOLD, KC_MUTE);
    set_layer(&p->layers[1], "Fn", (const uint16_t[]){
        KC_NONE,   KC_F1,     KC_F2,     KC_F3,     KC_F4,
        KC_F5,     KC_F6,     KC_SCRSHOT, KC_APP_FILE, KC_APP_BROW,
    }, KC_BRT_UP, KC_BRT_DN, KC_NONE);
    set_layer(&p->layers[2], "Nav", (const uint16_t[]){
        TO(0),     KC_UP,     KC_PGUP,   KC_HOME,   KC_END,
        KC_LEFT,   KC_DOWN,   KC_RIGHT,  KC_PGDN,   KC_ENTER,
    }, KC_SCRL_D, KC_SCRL_U, KC_ENTER);
    p->combo_count = 0;

    // ══════════════════════════════════════════════════════════
    //  PROFIL 2 — "Creative" : Base + Tools (MO)
    // ══════════════════════════════════════════════════════════
    p = &g_config.profiles[1];
    strncpy(p->name, "Creative", CONFIG_NAME_MAX_LEN - 1);
    p->layer_count = 2;
    set_layer(&p->layers[0], "Base", (const uint16_t[]){
        MO(1),     KC_Z,      KC_Y,      KC_C,      KC_V,
        MOD_LCTRL, MOD_LSHIFT, MOD_LALT, KC_S,      KC_SPACE,
    }, KC_ZOOM_IN, KC_ZOOM_OUT, KC_NONE);
    set_layer(&p->layers[1], "Tools", (const uint16_t[]){
        KC_NONE,   KC_W,      KC_E,      KC_R,      KC_T,
        KC_F,      KC_D,      KC_N,      KC_A,      KC_DEL,
    }, KC_SCRL_U, KC_SCRL_D, KC_NONE);
    p->combo_count = 0;

    // ══════════════════════════════════════════════════════════
    //  PROFIL 3 — "Media" : Base + Stream (TG)
    // ══════════════════════════════════════════════════════════
    p = &g_config.profiles[2];
    strncpy(p->name, "Media", CONFIG_NAME_MAX_LEN - 1);
    p->layer_count = 2;
    set_layer(&p->layers[0], "Base", (const uint16_t[]){
        KC_PLAY,   KC_PREV,   KC_NEXT,   KC_STOP,   KC_MUTE,
        KC_VOLD,   KC_VOLU,   TG(1),     KC_SCRL_D, KC_SCRL_U,
    }, KC_VOLU, KC_VOLD, KC_PLAY);
    set_layer(&p->layers[1], "Stream", (const uint16_t[]){
        TO(0),     KC_MUTE,   KC_MACRO0, KC_MACRO1, KC_APP_BROW,
        KC_APP_CALC, KC_BRT_DN, KC_BRT_UP, KC_SCRSHOT, KC_PLAY,
    }, KC_SCRL_U, KC_SCRL_D, KC_MUTE);
    p->combo_count = 0;

    // ══════════════════════════════════════════════════════════
    //  PROFIL 4 — "Gaming" : WASD + Menu (TG)
    // ══════════════════════════════════════════════════════════
    p = &g_config.profiles[3];
    strncpy(p->name, "Gaming", CONFIG_NAME_MAX_LEN - 1);
    p->layer_count = 2;
    set_layer(&p->layers[0], "WASD", (const uint16_t[]){
        TG(1),     KC_W,      KC_A,      KC_S,      KC_D,
        KC_TAB,    KC_SPACE,  MOD_LSHIFT, MOD_LCTRL, MOD_LALT,
    }, KC_VOLU, KC_VOLD, KC_MUTE);
    set_layer(&p->layers[1], "Menu", (const uint16_t[]){
        TG(1),     KC_ESC,    KC_F1,     KC_F2,     KC_F3,
        KC_F4,     KC_F5,     KC_F6,     KC_ENTER,  KC_NONE,
    }, KC_SCRL_U, KC_SCRL_D, KC_ENTER);
    p->combo_count = 0;

    // ── Macros globales de démo (référencées par Media/Stream) ──
    g_config.macro_count = 2;
    // Macro 0 : "Salut" → tape H A L U T
    strncpy(g_config.macros[0].name, "Salut", MACRO_NAME_MAX_LEN - 1);
    {
        const uint16_t letters[] = { 0x0B, 0x04, 0x0F, 0x18, 0x17 }; // H A L U T
        kb_macro_t *m = &g_config.macros[0];
        m->step_count = 0;
        for (size_t i = 0; i < sizeof(letters) / sizeof(letters[0]); i++) {
            m->steps[m->step_count++] = (kb_macro_step_t){ MACRO_STEP_KEY_DOWN, letters[i] };
            m->steps[m->step_count++] = (kb_macro_step_t){ MACRO_STEP_KEY_UP,   letters[i] };
        }
    }
    // Macro 1 : "Entrée x2" → Enter, pause 100ms, Enter
    strncpy(g_config.macros[1].name, "Entree x2", MACRO_NAME_MAX_LEN - 1);
    {
        kb_macro_t *m = &g_config.macros[1];
        m->step_count = 0;
        m->steps[m->step_count++] = (kb_macro_step_t){ MACRO_STEP_KEY_DOWN, 0x28 };
        m->steps[m->step_count++] = (kb_macro_step_t){ MACRO_STEP_KEY_UP,   0x28 };
        m->steps[m->step_count++] = (kb_macro_step_t){ MACRO_STEP_DELAY_MS, 100 };
        m->steps[m->step_count++] = (kb_macro_step_t){ MACRO_STEP_KEY_DOWN, 0x28 };
        m->steps[m->step_count++] = (kb_macro_step_t){ MACRO_STEP_KEY_UP,   0x28 };
    }

    // ── Orientation ────────────────────────────────────────
    g_config.orientation = ORIENTATION_0;

    // ── BLE ────────────────────────────────────────────────
    strncpy(g_config.ble.device_name, "SpinPad", CONFIG_NAME_MAX_LEN - 1);
    strncpy(g_config.ble.slot_names[0], "PC", CONFIG_NAME_MAX_LEN - 1);
    strncpy(g_config.ble.slot_names[1], "HomeAssistant", CONFIG_NAME_MAX_LEN - 1);
    g_config.ble.active_slot = 0;

    // ── Écran ──────────────────────────────────────────────
    g_config.display.brightness  = 180;
    g_config.display.timeout_s   = 30;
    g_config.display.widget_count = 4;
    g_config.display.widgets[0] = (kb_widget_t){ WIDGET_BLE_STATUS, true,  0, 0, "" };
    g_config.display.widgets[1] = (kb_widget_t){ WIDGET_LAYER,      true,  1, 0, "" };
    g_config.display.widgets[2] = (kb_widget_t){ WIDGET_PROFILE,    true,  2, 0, "" };
    g_config.display.widgets[3] = (kb_widget_t){ WIDGET_BATTERY,    true,  3, 0, "" };

    // ── Encodeur ───────────────────────────────────────────
    g_config.encoder.sensitivity = 1;   // 1 événement par détent

    // ── Extension LED ──────────────────────────────────────
    g_config.led_extension.enabled     = false;
    g_config.led_extension.count       = 10;
    g_config.led_extension.mode        = LED_EXT_MODE_MIRROR;
    g_config.led_extension.r           = 60;
    g_config.led_extension.g           = 60;
    g_config.led_extension.b           = 80;
    g_config.led_extension.brightness  = 128;
    g_config.led_extension.max_power_mw = 500;  // 500mW max par défaut (sécurité USB)

    // ── Power ──────────────────────────────────────────────
    g_config.power.sleep_timeout_s      = 300;   // 5 minutes
    g_config.power.battery_critical_pct = 10;
    strncpy(g_config.power.battery_present, "auto", sizeof(g_config.power.battery_present) - 1);
    g_config.power.debounce_press_scans   = 3;
    g_config.power.debounce_release_scans = 5;

    ESP_LOGI(TAG, "Config par défaut appliquée");
}

// ─────────────────────────────────────────────────────────────
//  PARSING JSON → STRUCT
//
//  Pattern récurrent en cJSON :
//    cJSON *item = cJSON_GetObjectItem(parent, "key");
//    if (cJSON_IsString(item)) { strncpy(dest, item->valuestring, max); }
//    if (cJSON_IsNumber(item)) { dest = (uint8_t)item->valuedouble; }
//    if (cJSON_IsBool(item))   { dest = cJSON_IsTrue(item); }
// ─────────────────────────────────────────────────────────────
static esp_err_t parse_json_to_config(const char *json_str)
{
    // Parser le JSON — retourne NULL si JSON invalide
    cJSON *root = cJSON_Parse(json_str);
    if (!root) {
        ESP_LOGE(TAG, "JSON invalide : %s", cJSON_GetErrorPtr());
        return ESP_ERR_INVALID_ARG;
    }

    // ── Version ─────────────────────────────────────────────
    cJSON *version = cJSON_GetObjectItem(root, "version");
    if (cJSON_IsNumber(version)) {
        g_config.version = (uint8_t)version->valuedouble;
    }

    // ── BLE ─────────────────────────────────────────────────
    cJSON *ble = cJSON_GetObjectItem(root, "ble");
    if (cJSON_IsObject(ble)) {
        cJSON *name = cJSON_GetObjectItem(ble, "device_name");
        if (cJSON_IsString(name)) {
            strncpy(g_config.ble.device_name, name->valuestring, CONFIG_NAME_MAX_LEN - 1);
        }
        cJSON *slot_names = cJSON_GetObjectItem(ble, "slot_names");
        if (cJSON_IsArray(slot_names)) {
            for (int i = 0; i < 2 && i < cJSON_GetArraySize(slot_names); i++) {
                cJSON *sn = cJSON_GetArrayItem(slot_names, i);
                if (cJSON_IsString(sn)) {
                    strncpy(g_config.ble.slot_names[i], sn->valuestring, CONFIG_NAME_MAX_LEN - 1);
                }
            }
        }
        cJSON *active_slot = cJSON_GetObjectItem(ble, "active_slot");
        if (cJSON_IsNumber(active_slot)) {
            g_config.ble.active_slot = (uint8_t)active_slot->valuedouble;
        }
    }

    // ── Display ─────────────────────────────────────────────
    cJSON *disp = cJSON_GetObjectItem(root, "display");
    if (cJSON_IsObject(disp)) {
        cJSON *br = cJSON_GetObjectItem(disp, "brightness");
        if (cJSON_IsNumber(br)) g_config.display.brightness = (uint8_t)br->valuedouble;

        cJSON *to = cJSON_GetObjectItem(disp, "timeout_s");
        if (cJSON_IsNumber(to)) g_config.display.timeout_s = (uint16_t)to->valuedouble;

        cJSON *widgets = cJSON_GetObjectItem(disp, "widgets");
        if (cJSON_IsArray(widgets)) {
            int wcount = cJSON_GetArraySize(widgets);
            if (wcount > DISPLAY_MAX_WIDGETS) wcount = DISPLAY_MAX_WIDGETS;
            g_config.display.widget_count = (uint8_t)wcount;
            for (int wi = 0; wi < wcount; wi++) {
                cJSON *w = cJSON_GetArrayItem(widgets, wi);
                kb_widget_t *kw = &g_config.display.widgets[wi];
                cJSON *wtype = cJSON_GetObjectItem(w, "type");
                if (cJSON_IsNumber(wtype)) kw->type = (kb_widget_type_t)(int)wtype->valuedouble;
                cJSON *wen = cJSON_GetObjectItem(w, "enabled");
                if (cJSON_IsBool(wen)) kw->enabled = cJSON_IsTrue(wen);
                cJSON *wrow = cJSON_GetObjectItem(w, "row");
                if (cJSON_IsNumber(wrow)) kw->row = (uint8_t)wrow->valuedouble;
                cJSON *wcol = cJSON_GetObjectItem(w, "col");
                if (cJSON_IsNumber(wcol)) kw->col = (uint8_t)wcol->valuedouble;
                cJSON *wtxt = cJSON_GetObjectItem(w, "custom_text");
                if (cJSON_IsString(wtxt)) {
                    strncpy(kw->custom_text, wtxt->valuestring, WIDGET_MAX_CUSTOM_LEN - 1);
                    kw->custom_text[WIDGET_MAX_CUSTOM_LEN - 1] = '\0';
                }
            }
        }
    }

    // ── Power ───────────────────────────────────────────────
    cJSON *power = cJSON_GetObjectItem(root, "power");
    if (cJSON_IsObject(power)) {
        cJSON *st = cJSON_GetObjectItem(power, "sleep_timeout_s");
        if (cJSON_IsNumber(st)) g_config.power.sleep_timeout_s = (uint32_t)st->valuedouble;

        cJSON *bc = cJSON_GetObjectItem(power, "battery_critical_pct");
        if (cJSON_IsNumber(bc)) g_config.power.battery_critical_pct = (uint8_t)bc->valuedouble;

        cJSON *bp = cJSON_GetObjectItem(power, "battery_present");
        if (cJSON_IsString(bp) && bp->valuestring) {
            // Accepter uniquement "auto" / "yes" / "no"
            const char *v = bp->valuestring;
            if (strcmp(v, "auto") == 0 || strcmp(v, "yes") == 0 || strcmp(v, "no") == 0) {
                strncpy(g_config.power.battery_present, v, sizeof(g_config.power.battery_present) - 1);
                g_config.power.battery_present[sizeof(g_config.power.battery_present) - 1] = '\0';
            }
        }
        cJSON *dps = cJSON_GetObjectItem(power, "debounce_press_scans");
        if (cJSON_IsNumber(dps) && dps->valuedouble >= 1 && dps->valuedouble <= 20)
            g_config.power.debounce_press_scans = (uint8_t)dps->valuedouble;
        cJSON *drs = cJSON_GetObjectItem(power, "debounce_release_scans");
        if (cJSON_IsNumber(drs) && drs->valuedouble >= 1 && drs->valuedouble <= 20)
            g_config.power.debounce_release_scans = (uint8_t)drs->valuedouble;
    }

    // ── Profils ─────────────────────────────────────────────
    cJSON *profiles = cJSON_GetObjectItem(root, "profiles");
    if (cJSON_IsArray(profiles)) {
        int profile_count = cJSON_GetArraySize(profiles);
        if (profile_count > CONFIG_MAX_PROFILES) profile_count = CONFIG_MAX_PROFILES;
        g_config.profile_count = (uint8_t)profile_count;

        for (int p = 0; p < profile_count; p++) {
            cJSON *prof = cJSON_GetArrayItem(profiles, p);
            kb_profile_t *kp = &g_config.profiles[p];

            cJSON *pname = cJSON_GetObjectItem(prof, "name");
            if (cJSON_IsString(pname)) {
                strncpy(kp->name, pname->valuestring, CONFIG_NAME_MAX_LEN - 1);
            }

            // ── Icône du profil (base64 → 72 octets 1bpp) ──
            memset(kp->icon, 0, PROFILE_ICON_BYTES);
            cJSON *picon = cJSON_GetObjectItem(prof, "icon");
            if (cJSON_IsString(picon) && picon->valuestring[0]) {
                size_t olen = 0;
                // Décodage tolérant : on ignore une icône mal formée.
                mbedtls_base64_decode(kp->icon, PROFILE_ICON_BYTES, &olen,
                                      (const unsigned char *)picon->valuestring,
                                      strlen(picon->valuestring));
            }

            // ── Layers du profil ──────────────────────────
            cJSON *layers = cJSON_GetObjectItem(prof, "layers");
            if (cJSON_IsArray(layers)) {
                int lcount = cJSON_GetArraySize(layers);
                if (lcount > CONFIG_MAX_LAYERS) lcount = CONFIG_MAX_LAYERS;
                kp->layer_count = (uint8_t)lcount;

                for (int l = 0; l < lcount; l++) {
                    cJSON *layer = cJSON_GetArrayItem(layers, l);
                    kb_layer_t *kl = &kp->layers[l];

                    cJSON *lname = cJSON_GetObjectItem(layer, "name");
                    if (cJSON_IsString(lname)) {
                        strncpy(kl->name, lname->valuestring, CONFIG_NAME_MAX_LEN - 1);
                    }

                    // Tableau de keycodes
                    cJSON *keys = cJSON_GetObjectItem(layer, "keys");
                    if (cJSON_IsArray(keys)) {
                        for (int k = 0; k < CONFIG_NUM_KEYS && k < cJSON_GetArraySize(keys); k++) {
                            cJSON *kc = cJSON_GetArrayItem(keys, k);
                            if (cJSON_IsNumber(kc)) {
                                kl->keys[k] = (uint16_t)kc->valuedouble;
                            }
                        }
                    }

                    // Encoder
                    cJSON *enc = cJSON_GetObjectItem(layer, "encoder");
                    if (cJSON_IsObject(enc)) {
                        cJSON *cw = cJSON_GetObjectItem(enc, "cw");
                        if (cJSON_IsNumber(cw)) kl->encoder_cw = (uint16_t)cw->valuedouble;
                        cJSON *ccw = cJSON_GetObjectItem(enc, "ccw");
                        if (cJSON_IsNumber(ccw)) kl->encoder_ccw = (uint16_t)ccw->valuedouble;
                        cJSON *press = cJSON_GetObjectItem(enc, "press");
                        if (cJSON_IsNumber(press)) kl->encoder_press = (uint16_t)press->valuedouble;
                    }
                }
            }

            // ── Combos du profil ──────────────────────────
            cJSON *combos = cJSON_GetObjectItem(prof, "combos");
            if (cJSON_IsArray(combos)) {
                int ccount = cJSON_GetArraySize(combos);
                if (ccount > CONFIG_MAX_COMBOS) ccount = CONFIG_MAX_COMBOS;
                kp->combo_count = (uint8_t)ccount;

                for (int c = 0; c < ccount; c++) {
                    cJSON *combo = cJSON_GetArrayItem(combos, c);
                    kb_combo_t *kc = &kp->combos[c];
                    kc->active = true;

                    cJSON *ckeys = cJSON_GetObjectItem(combo, "keys");
                    if (cJSON_IsArray(ckeys)) {
                        kc->key_count = 0;
                        for (int ki = 0; ki < KEYMAP_COMBO_MAX_KEYS && ki < cJSON_GetArraySize(ckeys); ki++) {
                            cJSON *ck = cJSON_GetArrayItem(ckeys, ki);
                            if (cJSON_IsNumber(ck)) {
                                kc->keys[kc->key_count++] = (uint8_t)ck->valuedouble;
                            }
                        }
                    }

                    cJSON *action = cJSON_GetObjectItem(combo, "action");
                    if (cJSON_IsNumber(action)) kc->action = (uint16_t)action->valuedouble;

                    cJSON *window = cJSON_GetObjectItem(combo, "window_ms");
                    if (cJSON_IsNumber(window)) kc->window_ms = (uint16_t)window->valuedouble;
                }
            }

        }
    }

    // ── Macros globales (niveau racine, partagées par tous les profils) ──
    cJSON *macros = cJSON_GetObjectItem(root, "macros");
    if (cJSON_IsArray(macros)) {
        int mcount = cJSON_GetArraySize(macros);
        if (mcount > MACRO_COUNT) mcount = MACRO_COUNT;
        g_config.macro_count = (uint8_t)mcount;

        for (int mi = 0; mi < mcount; mi++) {
            cJSON *macro = cJSON_GetArrayItem(macros, mi);
            kb_macro_t *km = &g_config.macros[mi];
            km->step_count = 0;
            km->name[0] = '\0';

            if (!cJSON_IsObject(macro)) continue;

            cJSON *name = cJSON_GetObjectItem(macro, "name");
            if (cJSON_IsString(name) && name->valuestring) {
                strncpy(km->name, name->valuestring, MACRO_NAME_MAX_LEN - 1);
                km->name[MACRO_NAME_MAX_LEN - 1] = '\0';
            }

            cJSON *steps = cJSON_GetObjectItem(macro, "steps");
            if (!cJSON_IsArray(steps)) continue;
            int scount = cJSON_GetArraySize(steps);
            if (scount > MACRO_MAX_STEPS) scount = MACRO_MAX_STEPS;

            for (int si = 0; si < scount; si++) {
                cJSON *step = cJSON_GetArrayItem(steps, si);
                kb_macro_step_t *ks = &km->steps[km->step_count];
                cJSON *stype = cJSON_GetObjectItem(step, "type");
                if (!cJSON_IsNumber(stype)) continue;
                ks->type = (kb_macro_step_type_t)(int)stype->valuedouble;
                if (ks->type == MACRO_STEP_DELAY_MS) {
                    cJSON *delay = cJSON_GetObjectItem(step, "delay");
                    if (cJSON_IsNumber(delay)) {
                        uint16_t d = (uint16_t)delay->valuedouble;
                        ks->keycode_or_delay = d > 1000 ? 1000 : d;
                    }
                } else {
                    cJSON *kc = cJSON_GetObjectItem(step, "keycode");
                    if (cJSON_IsNumber(kc)) ks->keycode_or_delay = (uint16_t)kc->valuedouble;
                }
                km->step_count++;
            }
        }
    }

    // active_profile
    cJSON *ap = cJSON_GetObjectItem(root, "active_profile");
    if (cJSON_IsNumber(ap)) {
        g_config.active_profile = (uint8_t)ap->valuedouble;
    }

    // ── Orientation ─────────────────────────────────────────
    cJSON *orient = cJSON_GetObjectItem(root, "orientation");
    if (cJSON_IsNumber(orient)) {
        uint8_t o = (uint8_t)orient->valuedouble;
        if (o <= ORIENTATION_270) g_config.orientation = (kb_orientation_t)o;
    }

    // ── Encodeur ────────────────────────────────────────────
    cJSON *enc_cfg = cJSON_GetObjectItem(root, "encoder");
    if (cJSON_IsObject(enc_cfg)) {
        cJSON *sens = cJSON_GetObjectItem(enc_cfg, "sensitivity");
        if (cJSON_IsNumber(sens)) {
            uint8_t s = (uint8_t)sens->valuedouble;
            g_config.encoder.sensitivity = (s >= 1 && s <= 4) ? s : 1;
        }
    }

    // ── Extension LED ────────────────────────────────────────
    cJSON *led_ext = cJSON_GetObjectItem(root, "led_extension");
    if (cJSON_IsObject(led_ext)) {
        cJSON *en = cJSON_GetObjectItem(led_ext, "enabled");
        if (cJSON_IsBool(en)) g_config.led_extension.enabled = cJSON_IsTrue(en);

        cJSON *cnt = cJSON_GetObjectItem(led_ext, "count");
        if (cJSON_IsNumber(cnt)) {
            uint8_t c = (uint8_t)cnt->valuedouble;
            g_config.led_extension.count = (c >= 1 && c <= 50) ? c : 10;
        }

        cJSON *mode = cJSON_GetObjectItem(led_ext, "mode");
        if (cJSON_IsNumber(mode)) {
            uint8_t m = (uint8_t)mode->valuedouble;
            if (m <= LED_EXT_MODE_HYPERION) g_config.led_extension.mode = (kb_led_ext_mode_t)m;
        }

        cJSON *r = cJSON_GetObjectItem(led_ext, "r");
        if (cJSON_IsNumber(r)) g_config.led_extension.r = (uint8_t)r->valuedouble;
        cJSON *g = cJSON_GetObjectItem(led_ext, "g");
        if (cJSON_IsNumber(g)) g_config.led_extension.g = (uint8_t)g->valuedouble;
        cJSON *b = cJSON_GetObjectItem(led_ext, "b");
        if (cJSON_IsNumber(b)) g_config.led_extension.b = (uint8_t)b->valuedouble;

        cJSON *br = cJSON_GetObjectItem(led_ext, "brightness");
        if (cJSON_IsNumber(br)) g_config.led_extension.brightness = (uint8_t)br->valuedouble;

        cJSON *mp = cJSON_GetObjectItem(led_ext, "max_power_mw");
        if (cJSON_IsNumber(mp)) g_config.led_extension.max_power_mw = (uint16_t)mp->valuedouble;
    }

    // Libérer la mémoire allouée par cJSON
    cJSON_Delete(root);
    ESP_LOGI(TAG, "JSON parsé avec succès");
    return ESP_OK;
}

// ─────────────────────────────────────────────────────────────
//  FONCTIONS PUBLIQUES
// ─────────────────────────────────────────────────────────────

esp_err_t config_store_init(void)
{
    apply_defaults();  // Toujours partir des defaults

    // Ouvrir le namespace NVS en lecture seule
    nvs_handle_t nvs;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READONLY, &nvs);
    if (err == ESP_ERR_NVS_NOT_FOUND) {
        // Pas encore de config sauvegardée → garder les defaults
        ESP_LOGI(TAG, "Pas de config en NVS, utilisation des défauts");
        g_initialized = true;
        return ESP_OK;
    }
    if (err != ESP_OK) return err;

    // Lire la taille du JSON stocké
    size_t json_size = 0;
    err = nvs_get_str(nvs, NVS_KEY_JSON, NULL, &json_size);
    if (err != ESP_OK || json_size == 0) {
        nvs_close(nvs);
        g_initialized = true;
        return ESP_OK;
    }

    // Allouer et lire le JSON
    // malloc en C = allouer de la mémoire dynamiquement (comme new en JS)
    char *json_buf = malloc(json_size);
    if (!json_buf) {
        nvs_close(nvs);
        return ESP_ERR_NO_MEM;
    }

    err = nvs_get_str(nvs, NVS_KEY_JSON, json_buf, &json_size);
    nvs_close(nvs);

    if (err == ESP_OK) {
        parse_json_to_config(json_buf);
    }

    free(json_buf);  // Libérer la mémoire (comme GC manuel)
    g_initialized = true;
    return ESP_OK;
}

const kb_config_t *config_store_get(void)
{
    return &g_config;
}

esp_err_t config_store_update_from_json(const char *json_str)
{
    esp_err_t err = parse_json_to_config(json_str);
    if (err != ESP_OK) return err;
    return config_store_save();
}

esp_err_t config_store_save(void)
{
    // Sérialiser en JSON
    char *json_buf = malloc(CONFIG_JSON_MAX_SIZE);
    if (!json_buf) return ESP_ERR_NO_MEM;

    esp_err_t err = config_store_to_json(json_buf, CONFIG_JSON_MAX_SIZE);
    if (err != ESP_OK) { free(json_buf); return err; }

    // Écrire en NVS
    nvs_handle_t nvs;
    err = nvs_open(NVS_NAMESPACE, NVS_READWRITE, &nvs);
    if (err != ESP_OK) { free(json_buf); return err; }

    err = nvs_set_str(nvs, NVS_KEY_JSON, json_buf);
    if (err == ESP_OK) err = nvs_commit(nvs);

    nvs_close(nvs);
    free(json_buf);

    ESP_LOGI(TAG, "Config sauvegardée en NVS");
    return err;
}

esp_err_t config_store_to_json(char *buffer, size_t buffer_size)
{
    // Construire le JSON depuis la struct
    cJSON *root = cJSON_CreateObject();

    cJSON_AddNumberToObject(root, "version",        g_config.version);
    cJSON_AddNumberToObject(root, "active_profile", g_config.active_profile);
    cJSON_AddNumberToObject(root, "orientation",    (int)g_config.orientation);

    // Encoder
    cJSON *enc_out = cJSON_AddObjectToObject(root, "encoder");
    cJSON_AddNumberToObject(enc_out, "sensitivity", g_config.encoder.sensitivity);

    // LED extension
    cJSON *led_ext_out = cJSON_AddObjectToObject(root, "led_extension");
    cJSON_AddBoolToObject  (led_ext_out, "enabled",    g_config.led_extension.enabled);
    cJSON_AddNumberToObject(led_ext_out, "count",      g_config.led_extension.count);
    cJSON_AddNumberToObject(led_ext_out, "mode",       (int)g_config.led_extension.mode);
    cJSON_AddNumberToObject(led_ext_out, "r",          g_config.led_extension.r);
    cJSON_AddNumberToObject(led_ext_out, "g",          g_config.led_extension.g);
    cJSON_AddNumberToObject(led_ext_out, "b",          g_config.led_extension.b);
    cJSON_AddNumberToObject(led_ext_out, "brightness",   g_config.led_extension.brightness);
    cJSON_AddNumberToObject(led_ext_out, "max_power_mw", g_config.led_extension.max_power_mw);

    // BLE
    cJSON *ble = cJSON_AddObjectToObject(root, "ble");
    cJSON_AddStringToObject(ble, "device_name", g_config.ble.device_name);
    cJSON *slot_names = cJSON_AddArrayToObject(ble, "slot_names");
    cJSON_AddItemToArray(slot_names, cJSON_CreateString(g_config.ble.slot_names[0]));
    cJSON_AddItemToArray(slot_names, cJSON_CreateString(g_config.ble.slot_names[1]));
    cJSON_AddNumberToObject(ble, "active_slot", g_config.ble.active_slot);

    // Display
    cJSON *disp = cJSON_AddObjectToObject(root, "display");
    cJSON_AddNumberToObject(disp, "brightness", g_config.display.brightness);
    cJSON_AddNumberToObject(disp, "timeout_s",  g_config.display.timeout_s);
    cJSON *widgets_out = cJSON_AddArrayToObject(disp, "widgets");
    for (int wi = 0; wi < g_config.display.widget_count; wi++) {
        kb_widget_t *kw = &g_config.display.widgets[wi];
        cJSON *w = cJSON_CreateObject();
        cJSON_AddNumberToObject(w, "type",    (int)kw->type);
        cJSON_AddBoolToObject  (w, "enabled", kw->enabled);
        cJSON_AddNumberToObject(w, "row",     kw->row);
        cJSON_AddNumberToObject(w, "col",     kw->col);
        if (kw->type == WIDGET_CUSTOM_TEXT) {
            cJSON_AddStringToObject(w, "custom_text", kw->custom_text);
        }
        cJSON_AddItemToArray(widgets_out, w);
    }

    // Power
    cJSON *power = cJSON_AddObjectToObject(root, "power");
    cJSON_AddNumberToObject(power, "sleep_timeout_s",       g_config.power.sleep_timeout_s);
    cJSON_AddNumberToObject(power, "battery_critical_pct",  g_config.power.battery_critical_pct);
    cJSON_AddStringToObject(power, "battery_present",
        g_config.power.battery_present[0] ? g_config.power.battery_present : "auto");
    cJSON_AddNumberToObject(power, "debounce_press_scans",   g_config.power.debounce_press_scans);
    cJSON_AddNumberToObject(power, "debounce_release_scans", g_config.power.debounce_release_scans);

    // Profils
    cJSON *profiles = cJSON_AddArrayToObject(root, "profiles");
    for (int p = 0; p < g_config.profile_count; p++) {
        kb_profile_t *kp = &g_config.profiles[p];
        cJSON *prof = cJSON_CreateObject();
        cJSON_AddStringToObject(prof, "name", kp->name);

        // Icône → base64 (uniquement si non vide, pour économiser de la place)
        bool icon_set = false;
        for (int bi = 0; bi < PROFILE_ICON_BYTES; bi++) {
            if (kp->icon[bi]) { icon_set = true; break; }
        }
        if (icon_set) {
            unsigned char icon_b64[128];  // 72 o → 96 chars + marge
            size_t b64_len = 0;
            if (mbedtls_base64_encode(icon_b64, sizeof(icon_b64), &b64_len,
                                      kp->icon, PROFILE_ICON_BYTES) == 0) {
                cJSON_AddStringToObject(prof, "icon", (const char *)icon_b64);
            }
        }

        cJSON *layers = cJSON_AddArrayToObject(prof, "layers");
        for (int l = 0; l < kp->layer_count; l++) {
            kb_layer_t *kl = &kp->layers[l];
            cJSON *layer = cJSON_CreateObject();
            cJSON_AddStringToObject(layer, "name", kl->name);

            cJSON *keys = cJSON_CreateArray();
            for (int k = 0; k < CONFIG_NUM_KEYS; k++) {
                cJSON_AddItemToArray(keys, cJSON_CreateNumber(kl->keys[k]));
            }
            cJSON_AddItemToObject(layer, "keys", keys);

            cJSON *enc = cJSON_AddObjectToObject(layer, "encoder");
            cJSON_AddNumberToObject(enc, "cw",    kl->encoder_cw);
            cJSON_AddNumberToObject(enc, "ccw",   kl->encoder_ccw);
            cJSON_AddNumberToObject(enc, "press", kl->encoder_press);

            cJSON_AddItemToArray(layers, layer);
        }

        cJSON *combos = cJSON_AddArrayToObject(prof, "combos");
        for (int c = 0; c < kp->combo_count; c++) {
            kb_combo_t *kc = &kp->combos[c];
            cJSON *combo = cJSON_CreateObject();
            cJSON *ckeys = cJSON_CreateArray();
            for (int ki = 0; ki < kc->key_count; ki++) {
                cJSON_AddItemToArray(ckeys, cJSON_CreateNumber(kc->keys[ki]));
            }
            cJSON_AddItemToObject(combo, "keys", ckeys);
            cJSON_AddNumberToObject(combo, "action",    kc->action);
            cJSON_AddNumberToObject(combo, "window_ms", kc->window_ms);
            cJSON_AddItemToArray(combos, combo);
        }

        cJSON_AddItemToArray(profiles, prof);
    }

    // ── Macros globales (niveau racine) ───────────────────────
    cJSON *macros_out = cJSON_AddArrayToObject(root, "macros");
    for (int mi = 0; mi < MACRO_COUNT; mi++) {
        kb_macro_t *km = &g_config.macros[mi];
        cJSON *macro_obj = cJSON_CreateObject();
        cJSON_AddStringToObject(macro_obj, "name", km->name);
        cJSON *steps_arr = cJSON_AddArrayToObject(macro_obj, "steps");
        for (int si = 0; si < km->step_count; si++) {
            kb_macro_step_t *ks = &km->steps[si];
            cJSON *step = cJSON_CreateObject();
            cJSON_AddNumberToObject(step, "type", (int)ks->type);
            if (ks->type == MACRO_STEP_DELAY_MS) {
                cJSON_AddNumberToObject(step, "delay", ks->keycode_or_delay);
            } else {
                cJSON_AddNumberToObject(step, "keycode", ks->keycode_or_delay);
            }
            cJSON_AddItemToArray(steps_arr, step);
        }
        cJSON_AddItemToArray(macros_out, macro_obj);
    }

    // Sérialiser en string (non formatté pour économiser de la place)
    char *json_str = cJSON_PrintUnformatted(root);
    cJSON_Delete(root);

    if (!json_str) return ESP_ERR_NO_MEM;

    size_t len = strlen(json_str);
    if (len >= buffer_size) {
        free(json_str);
        return ESP_ERR_NO_MEM;
    }
    strncpy(buffer, json_str, buffer_size);
    free(json_str);

    return ESP_OK;
}

esp_err_t config_store_factory_reset(void)
{
    apply_defaults();
    // Effacer la clé en NVS
    nvs_handle_t nvs;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READWRITE, &nvs);
    if (err == ESP_OK) {
        nvs_erase_key(nvs, NVS_KEY_JSON);
        nvs_commit(nvs);
        nvs_close(nvs);
    }
    ESP_LOGI(TAG, "Factory reset effectué");
    return ESP_OK;
}
