// ═══════════════════════════════════════════════════════════════
//  ble_hid.c — BLE HID multi-device via NimBLE
//
//  Architecture multi-device :
//    - 2 "bond slots" stockés en NVS (via CONFIG_BT_NIMBLE_NVS_PERSIST)
//    - SW11 → ble_hid_switch_device() : déconnecte, bascule slot, reconnecte
//    - SW16+SW17 long press → ble_hid_enter_pairing_mode() :
//        clear le bond du slot actif, advertising général
//
//  États BLE :
//    IDLE → advertising → connected → (SW11) → disconnecting → advertising...
//    (SW16+SW17) → pairing_mode → advertising → connected...
// ═══════════════════════════════════════════════════════════════

#include "ble_hid.h"
#include "kb_config.h"
#include "config_store.h"
#include "battery.h"

// Headers NimBLE (inclus dans ESP-IDF via composant "bt")
#include "nimble/nimble_port.h"
#include "nimble/nimble_port_freertos.h"
#include "host/ble_hs.h"
#include "host/ble_store.h"
#include "services/gap/ble_svc_gap.h"
#include "services/gatt/ble_svc_gatt.h"
#include "services/hid/ble_svc_hid.h"
#include "services/bas/ble_svc_bas.h"

#include "nvs_flash.h"
#include "nvs.h"
#include "esp_log.h"
#include <string.h>

static const char *TAG = "BLE_HID";

// ─────────────────────────────────────────────────────────────
//  ÉTAT INTERNE
// ─────────────────────────────────────────────────────────────

typedef enum {
    BLE_STATE_IDLE,
    BLE_STATE_ADVERTISING,
    BLE_STATE_CONNECTED,
    BLE_STATE_PAIRING,
    BLE_STATE_SWITCHING,
} ble_state_t;

static ble_state_t g_ble_state  = BLE_STATE_IDLE;
static uint16_t    g_conn_handle = BLE_HS_CONN_HANDLE_NONE;  // Handle de la connexion active
static uint8_t     g_active_slot = 0;  // 0 = PC, 1 = HA
static bool        g_bas_inited  = false;  // BAS service initialisé (batterie présente)

// Adresses des peers bondés (chargées depuis NVS)
// ble_addr_t = adresse BLE 6 bytes + type
static ble_addr_t  g_bonded_addrs[BLE_NUM_DEVICE_SLOTS];
static bool        g_slot_bonded[BLE_NUM_DEVICE_SLOTS] = {false, false};

// NVS keys pour stocker les adresses bondées par slot
#define NVS_BLE_NS          "kb_ble"
#define NVS_BLE_SLOT_KEY(s) (s == 0 ? "slot0_addr" : "slot1_addr")

// ─────────────────────────────────────────────────────────────
//  DESCRIPTEUR HID (même structure que USB, mais pour BLE)
// ─────────────────────────────────────────────────────────────

static const uint8_t ble_hid_report_descriptor[] __attribute__((unused)) = {
    // Keyboard report (ID 1)
    0x05, 0x01,  // Usage Page (Generic Desktop)
    0x09, 0x06,  // Usage (Keyboard)
    0xA1, 0x01,  // Collection (Application)
    0x85, 0x01,  //   Report ID (1)
    0x05, 0x07,  //   Usage Page (Key Codes)
    0x19, 0xE0,  //   Usage Minimum (Left Control)
    0x29, 0xE7,  //   Usage Maximum (Right GUI)
    0x15, 0x00,  //   Logical Minimum (0)
    0x25, 0x01,  //   Logical Maximum (1)
    0x75, 0x01,  //   Report Size (1)
    0x95, 0x08,  //   Report Count (8) — 8 bits de modifiers
    0x81, 0x02,  //   Input (Data, Variable, Absolute)
    0x95, 0x01,  //   Report Count (1)
    0x75, 0x08,  //   Report Size (8) — 1 byte réservé
    0x81, 0x01,  //   Input (Constant)
    0x95, 0x06,  //   Report Count (6) — 6 keycodes
    0x75, 0x08,  //   Report Size (8)
    0x15, 0x00,  //   Logical Minimum (0)
    0x25, 0x65,  //   Logical Maximum (101)
    0x05, 0x07,  //   Usage Page (Key Codes)
    0x19, 0x00,  //   Usage Minimum (0)
    0x29, 0x65,  //   Usage Maximum (101)
    0x81, 0x00,  //   Input (Data, Array)
    0xC0,        // End Collection

    // Consumer report (ID 2)
    0x05, 0x0C,  // Usage Page (Consumer)
    0x09, 0x01,  // Usage (Consumer Control)
    0xA1, 0x01,  // Collection (Application)
    0x85, 0x02,  //   Report ID (2)
    0x15, 0x00,  //   Logical Minimum (0)
    0x26, 0xFF, 0x03, // Logical Maximum (1023)
    0x19, 0x00,  //   Usage Minimum (0)
    0x2A, 0xFF, 0x03, // Usage Maximum (1023)
    0x75, 0x10,  //   Report Size (16)
    0x95, 0x01,  //   Report Count (1)
    0x81, 0x00,  //   Input (Data, Array)
    0xC0,        // End Collection
};

// ─────────────────────────────────────────────────────────────
//  GESTION DES BONDS EN NVS
//  On stocke l'adresse BLE de chaque peer pour pouvoir se
//  reconnecter sans redemander un pairing complet.
// ─────────────────────────────────────────────────────────────

static void load_bonded_addresses(void)
{
    nvs_handle_t nvs;
    if (nvs_open(NVS_BLE_NS, NVS_READONLY, &nvs) != ESP_OK) return;

    for (int s = 0; s < BLE_NUM_DEVICE_SLOTS; s++) {
        size_t len = sizeof(ble_addr_t);
        if (nvs_get_blob(nvs, NVS_BLE_SLOT_KEY(s), &g_bonded_addrs[s], &len) == ESP_OK) {
            g_slot_bonded[s] = true;
            ESP_LOGI(TAG, "Slot %d bondé chargé", s);
        }
    }
    nvs_close(nvs);
}

static void save_bonded_address(uint8_t slot, const ble_addr_t *addr)
{
    nvs_handle_t nvs;
    if (nvs_open(NVS_BLE_NS, NVS_READWRITE, &nvs) != ESP_OK) return;
    nvs_set_blob(nvs, NVS_BLE_SLOT_KEY(slot), addr, sizeof(ble_addr_t));
    nvs_commit(nvs);
    nvs_close(nvs);
    g_bonded_addrs[slot] = *addr;
    g_slot_bonded[slot]  = true;
    ESP_LOGI(TAG, "Slot %d bondé sauvegardé", slot);
}

static void clear_bonded_address(uint8_t slot)
{
    nvs_handle_t nvs;
    if (nvs_open(NVS_BLE_NS, NVS_READWRITE, &nvs) != ESP_OK) return;
    nvs_erase_key(nvs, NVS_BLE_SLOT_KEY(slot));
    nvs_commit(nvs);
    nvs_close(nvs);
    g_slot_bonded[slot] = false;
    // Effacer aussi le bond NimBLE
    ble_store_clear();
    ESP_LOGI(TAG, "Slot %d bond effacé", slot);
}

// ─────────────────────────────────────────────────────────────
//  ADVERTISING
// ─────────────────────────────────────────────────────────────

static int gap_event_handler(struct ble_gap_event *event, void *arg);

static void start_advertising(bool directed)
{
    // Paramètres d'advertising
    struct ble_gap_adv_params adv_params = {0};

    if (directed && g_slot_bonded[g_active_slot]) {
        // Directed advertising : cibler directement le peer bondé
        // (connexion plus rapide, mais seulement si l'adresse est connue)
        adv_params.conn_mode = BLE_GAP_CONN_MODE_DIR;
        adv_params.disc_mode = BLE_GAP_DISC_MODE_NON;
        ESP_LOGI(TAG, "Advertising dirigé vers slot %d", g_active_slot);
        // Démarrer l'advertising dirigé vers le peer stocké
        ble_gap_adv_start(BLE_OWN_ADDR_PUBLIC, &g_bonded_addrs[g_active_slot],
                          BLE_HS_FOREVER, &adv_params, gap_event_handler, NULL);
    } else {
        // General advertising : visible par tous
        adv_params.conn_mode = BLE_GAP_CONN_MODE_UND;
        adv_params.disc_mode = BLE_GAP_DISC_MODE_GEN;
        adv_params.itvl_min  = BLE_GAP_ADV_FAST_INTERVAL1_MIN;
        adv_params.itvl_max  = BLE_GAP_ADV_FAST_INTERVAL1_MAX;

        // Données d'advertising (nom + apparence HID)
        const kb_config_t *cfg = config_store_get();
        ble_svc_gap_device_name_set(cfg->ble.device_name);

        struct ble_hs_adv_fields fields = {0};
        fields.flags                 = BLE_HS_ADV_F_DISC_GEN | BLE_HS_ADV_F_BREDR_UNSUP;
        fields.name                  = (uint8_t *)cfg->ble.device_name;
        fields.name_len              = strlen(cfg->ble.device_name);
        fields.name_is_complete      = 1;
        // Apparence = HID Keyboard (0x03C1, Bluetooth spec assigned number)
        fields.appearance            = 0x03C1;
        fields.appearance_is_present = 1;

        ble_gap_adv_set_fields(&fields);
        ble_gap_adv_start(BLE_OWN_ADDR_PUBLIC, NULL, BLE_HS_FOREVER, &adv_params, gap_event_handler, NULL);
        ESP_LOGI(TAG, "Advertising général démarré");
    }

    g_ble_state = (directed) ? BLE_STATE_ADVERTISING : BLE_STATE_PAIRING;
}

// ─────────────────────────────────────────────────────────────
//  CALLBACKS GAP (connexion/déconnexion)
// ─────────────────────────────────────────────────────────────

static int gap_event_handler(struct ble_gap_event *event, void *arg)
{
    switch (event->type) {

    case BLE_GAP_EVENT_CONNECT:
        if (event->connect.status == 0) {
            // Connexion réussie
            g_conn_handle = event->connect.conn_handle;
            g_ble_state   = BLE_STATE_CONNECTED;

            // Sauvegarder l'adresse du peer si on était en mode pairing
            struct ble_gap_conn_desc desc;
            if (ble_gap_conn_find(g_conn_handle, &desc) == 0) {
                save_bonded_address(g_active_slot, &desc.peer_id_addr);
            }
            ESP_LOGI(TAG, "Connecté — slot %d", g_active_slot);
        } else {
            // Échec de connexion → relancer l'advertising
            ESP_LOGW(TAG, "Échec connexion : %d", event->connect.status);
            start_advertising(false);
        }
        break;

    case BLE_GAP_EVENT_DISCONNECT:
        g_conn_handle = BLE_HS_CONN_HANDLE_NONE;
        g_ble_state   = BLE_STATE_IDLE;
        ESP_LOGI(TAG, "Déconnecté — raison %d", event->disconnect.reason);

        // Si c'était un switch de device, relancer l'advertising sur le nouveau slot
        // Sinon, relancer normalement
        start_advertising(g_slot_bonded[g_active_slot]);
        break;

    case BLE_GAP_EVENT_REPEAT_PAIRING: {
        // L'hôte veut re-pairer (ex: clés changées)
        struct ble_gap_conn_desc desc;
        if (ble_gap_conn_find(event->repeat_pairing.conn_handle, &desc) == 0) {
            ble_store_util_delete_peer(&desc.peer_id_addr);
        }
        return BLE_GAP_REPEAT_PAIRING_RETRY;
    }

    default:
        break;
    }
    return 0;
}

// ─────────────────────────────────────────────────────────────
//  ENVOI DES RAPPORTS HID
// ─────────────────────────────────────────────────────────────

static uint8_t g_ble_keyboard_report[8] = {0};

// Attribut handle du rapport HID (obtenu lors de l'init du service HID)
static uint16_t g_kb_report_handle = 0;
static uint16_t g_consumer_report_handle = 0;

void ble_hid_key_press(uint8_t keycode, uint8_t modifier)
{
    if (g_ble_state != BLE_STATE_CONNECTED) return;

    g_ble_keyboard_report[0] = modifier;
    for (int i = 2; i < 8; i++) {
        if (g_ble_keyboard_report[i] == 0) {
            g_ble_keyboard_report[i] = keycode;
            break;
        }
    }

    // Envoyer la notification HID via GATT
    struct os_mbuf *om = ble_hs_mbuf_from_flat(g_ble_keyboard_report, 8);
    if (om) ble_gatts_notify_custom(g_conn_handle, g_kb_report_handle, om);
}

void ble_hid_key_release(uint8_t keycode)
{
    if (g_ble_state != BLE_STATE_CONNECTED) return;

    for (int i = 2; i < 8; i++) {
        if (g_ble_keyboard_report[i] == keycode) {
            g_ble_keyboard_report[i] = 0;
            break;
        }
    }

    struct os_mbuf *om = ble_hs_mbuf_from_flat(g_ble_keyboard_report, 8);
    if (om) ble_gatts_notify_custom(g_conn_handle, g_kb_report_handle, om);
}

void ble_hid_consumer_press(uint16_t usage)
{
    if (g_ble_state != BLE_STATE_CONNECTED) return;
    uint8_t report[2] = { (uint8_t)(usage & 0xFF), (uint8_t)(usage >> 8) };
    struct os_mbuf *om = ble_hs_mbuf_from_flat(report, 2);
    if (om) ble_gatts_notify_custom(g_conn_handle, g_consumer_report_handle, om);
}

void ble_hid_consumer_release(void)
{
    if (g_ble_state != BLE_STATE_CONNECTED) return;
    uint8_t report[2] = {0, 0};
    struct os_mbuf *om = ble_hs_mbuf_from_flat(report, 2);
    if (om) ble_gatts_notify_custom(g_conn_handle, g_consumer_report_handle, om);
}

// ─────────────────────────────────────────────────────────────
//  SWITCH DE DEVICE ET PAIRING
// ─────────────────────────────────────────────────────────────

void ble_hid_switch_device(void)
{
    // Basculer entre slot 0 et slot 1
    uint8_t new_slot = (g_active_slot == 0) ? 1 : 0;
    ESP_LOGI(TAG, "Switch slot %d → %d", g_active_slot, new_slot);

    g_active_slot = new_slot;
    g_ble_state = BLE_STATE_SWITCHING;

    // Sauvegarder le slot actif dans la config
    // (pour se souvenir après un reboot)
    // On accède directement à la config (hack acceptable ici)
    const kb_config_t *cfg = config_store_get();
    ((kb_config_t *)cfg)->ble.active_slot = new_slot;
    config_store_save();

    // Déconnecter si connecté → le callback de disconnect relancera l'advertising
    if (g_conn_handle != BLE_HS_CONN_HANDLE_NONE) {
        ble_gap_terminate(g_conn_handle, BLE_ERR_REM_USER_CONN_TERM);
    } else {
        // Pas connecté : arrêter l'advertising actuel et relancer sur le nouveau slot
        ble_gap_adv_stop();
        start_advertising(g_slot_bonded[g_active_slot]);
    }
}

void ble_hid_enter_pairing_mode(void)
{
    ESP_LOGI(TAG, "Entrée en mode pairing — slot %d", g_active_slot);

    // Déconnecter si connecté
    if (g_conn_handle != BLE_HS_CONN_HANDLE_NONE) {
        ble_gap_terminate(g_conn_handle, BLE_ERR_REM_USER_CONN_TERM);
    } else {
        ble_gap_adv_stop();
    }

    // Effacer le bond existant pour ce slot
    clear_bonded_address(g_active_slot);

    // Lancer l'advertising général (visible par tous)
    start_advertising(false);
}

// ─────────────────────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────────────────────

// Callback NimBLE : appelé quand le stack BLE est prêt
static void ble_hs_on_reset(int reason)
{
    ESP_LOGE(TAG, "BLE reset : %d", reason);
}

static void ble_hs_on_sync(void)
{
    ESP_LOGI(TAG, "BLE sync — démarrage advertising");
    // Charger le slot actif depuis la config
    const kb_config_t *cfg = config_store_get();
    g_active_slot = cfg->ble.active_slot;
    // Tenter de se connecter au peer bondé du slot actif
    start_advertising(g_slot_bonded[g_active_slot]);
}

// Tâche FreeRTOS pour le stack NimBLE
static void nimble_host_task(void *param)
{
    nimble_port_run();  // Bloque tant que BLE tourne
    nimble_port_freertos_deinit();
}

esp_err_t ble_hid_init(void)
{
    // Charger les bonds sauvegardés
    load_bonded_addresses();

    // Initialiser le port NimBLE
    nimble_port_init();

    // Configurer les callbacks du host BLE
    ble_hs_cfg.reset_cb  = ble_hs_on_reset;
    ble_hs_cfg.sync_cb   = ble_hs_on_sync;
    ble_hs_cfg.store_status_cb = ble_store_util_status_rr;
    // Sécurité : demander le chiffrement + bonding
    ble_hs_cfg.sm_bonding = 1;
    ble_hs_cfg.sm_mitm    = 0;  // 0 = sans PIN (plus simple)
    ble_hs_cfg.sm_sc      = 1;  // Secure Connections

    // Initialiser les services GATT
    ble_svc_gap_init();
    ble_svc_gatt_init();
    // Note : ble_svc_hid_init() est à configurer selon la version d'IDF
    // avec le descripteur HID défini plus haut

    // Battery Service (BAS) — uniquement si la batterie est présente.
    // Le host OS verra ainsi l'indicateur batterie quand pertinent,
    // et rien du tout pour les variantes USB-only.
    if (battery_is_present()) {
        ble_svc_bas_init();
        g_bas_inited = true;
        // Pousser la valeur courante au plus tôt
        ble_svc_bas_battery_level_set(battery_get_percent());
        ESP_LOGI(TAG, "BAS service init (batterie %d%%)", battery_get_percent());
    } else {
        ESP_LOGI(TAG, "BAS service skip (batterie absente)");
    }

    // Lancer la tâche NimBLE dans FreeRTOS
    nimble_port_freertos_init(nimble_host_task);

    ESP_LOGI(TAG, "BLE HID initialisé — %d slots", BLE_NUM_DEVICE_SLOTS);
    return ESP_OK;
}

bool ble_hid_is_connected(void)
{
    return g_ble_state == BLE_STATE_CONNECTED;
}

uint8_t ble_hid_get_active_slot(void)
{
    return g_active_slot;
}

void ble_hid_publish_battery(uint8_t percent)
{
    if (!g_bas_inited) return;
    if (percent > 100) percent = 100;
    ble_svc_bas_battery_level_set(percent);
}
