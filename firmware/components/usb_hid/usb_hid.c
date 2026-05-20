// ═══════════════════════════════════════════════════════════════
//  usb_hid.c — USB HID via TinyUSB
//
//  TinyUSB gère tout le protocole USB bas niveau.
//  On l'utilise en mode "HID composite" :
//    - Interface 0 : Keyboard (touches + modifiers)
//    - Interface 1 : Consumer Control (médias)
//    - Interface 2 : CDC Serial (pour envoyer/recevoir la config JSON)
//
//  Le CDC Serial est la clé pour WebSerial dans l'app SvelteKit :
//  le navigateur voit un port série virtuel sur le câble USB.
// ═══════════════════════════════════════════════════════════════

#include "usb_hid.h"
#include "config_store.h"
#include "keymap.h"

#include "tinyusb.h"
#include "tusb_cdc_acm.h"   // CDC = Communication Device Class (port série)
#include "esp_log.h"
#include <string.h>
#include <stdlib.h>

static const char *TAG = "USB_HID";

// ─────────────────────────────────────────────────────────────
//  DESCRIPTEURS HID
//
//  Un descripteur HID = métadonnées qui décrivent au système
//  d'exploitation quel type de périphérique on est et
//  quels rapports on envoie.
//
//  HID_REPORT_DESC_KEYBOARD() et HID_REPORT_DESC_CONSUMER()
//  sont des macros TinyUSB qui génèrent ces descripteurs.
// ─────────────────────────────────────────────────────────────

// IDs des rapports HID (doit correspondre aux envois plus bas)
#define REPORT_ID_KEYBOARD  1
#define REPORT_ID_CONSUMER  2

// Descripteur composite : clavier + consumer
static const uint8_t hid_report_descriptor[] = {
    TUD_HID_REPORT_DESC_KEYBOARD(HID_REPORT_ID(REPORT_ID_KEYBOARD)),
    TUD_HID_REPORT_DESC_CONSUMER(HID_REPORT_ID(REPORT_ID_CONSUMER)),
};

// Configuration TinyUSB
static const tinyusb_config_t tusb_cfg = {
    .device_descriptor        = NULL,  // Utilise le descripteur par défaut ESP-IDF
    .string_descriptor        = NULL,  // Idem
    .external_phy             = false,
    .configuration_descriptor = NULL,
};

// Config CDC (port série virtuel pour WebSerial)
static const tinyusb_config_cdcacm_t cdc_cfg = {
    .usb_dev  = TINYUSB_USBDEV_0,
    .cdc_port = TINYUSB_CDC_ACM_0,
    .rx_unread_buf_sz = 512,
    .callback_rx      = NULL,  // Sera défini après l'init
    .callback_rx_wanted_char = NULL,
    .callback_line_state_changed = NULL,
    .callback_line_coding_changed = NULL,
};

// ─────────────────────────────────────────────────────────────
//  ÉTAT INTERNE
// ─────────────────────────────────────────────────────────────

static bool g_mounted = false;  // USB connecté et prêt ?

// Rapport clavier courant
// Structure HID : [modifier, reserved, key1, key2, key3, key4, key5, key6]
static uint8_t g_keyboard_report[8] = {0};

// Buffer de réception CDC (config JSON entrant depuis SvelteKit)
static uint8_t g_cdc_rx_buf[CONFIG_JSON_MAX_SIZE];
static size_t  g_cdc_rx_len = 0;

// ─────────────────────────────────────────────────────────────
//  CALLBACKS TinyUSB
//  Ces fonctions sont appelées automatiquement par TinyUSB
//  selon les événements USB.
// ─────────────────────────────────────────────────────────────

// Appelé quand l'hôte USB monte le périphérique (câble + driver prêt)
void tud_mount_cb(void)
{
    g_mounted = true;
    ESP_LOGI(TAG, "USB monté");
}

// Appelé quand le câble est débranché
void tud_umount_cb(void)
{
    g_mounted = false;
    ESP_LOGI(TAG, "USB démonté");
}

// Appelé quand des données arrivent sur le port CDC (depuis SvelteKit)
static void cdc_rx_callback(int itf, cdcacm_event_t *event)
{
    if (event->type != CDC_EVENT_RX) return;

    // Lire les octets disponibles
    size_t rx_size = 0;
    tinyusb_cdcacm_read(itf, g_cdc_rx_buf + g_cdc_rx_len,
                        sizeof(g_cdc_rx_buf) - g_cdc_rx_len - 1, &rx_size);
    g_cdc_rx_len += rx_size;

    // Chercher la fin du JSON (marqueur '\0' ou '\n')
    // L'app SvelteKit termine chaque commande avec '\n'
    if (g_cdc_rx_len > 0 && g_cdc_rx_buf[g_cdc_rx_len - 1] == '\n') {
        g_cdc_rx_buf[g_cdc_rx_len] = '\0';
        usb_hid_process_config_packet(g_cdc_rx_buf, g_cdc_rx_len);
        g_cdc_rx_len = 0;
    }
}

// ─────────────────────────────────────────────────────────────
//  FONCTIONS PUBLIQUES
// ─────────────────────────────────────────────────────────────

esp_err_t usb_hid_init(void)
{
    // Initialiser TinyUSB
    ESP_ERROR_CHECK(tinyusb_driver_install(&tusb_cfg));

    // Initialiser le CDC (port série virtuel)
    ESP_ERROR_CHECK(tusb_cdc_acm_init(&cdc_cfg));
    ESP_ERROR_CHECK(tinyusb_cdcacm_register_callback(
        TINYUSB_CDC_ACM_0,
        CDC_EVENT_RX,
        cdc_rx_callback
    ));

    ESP_LOGI(TAG, "USB HID + CDC initialisés");
    return ESP_OK;
}

void usb_hid_key_press(uint8_t keycode, uint8_t modifier)
{
    if (!g_mounted) return;

    // Trouver un slot libre dans le rapport (6 touches simultanées max en HID)
    g_keyboard_report[0] = modifier;  // Byte 0 = modifier
    for (int i = 2; i < 8; i++) {     // Bytes 2-7 = jusqu'à 6 keycodes
        if (g_keyboard_report[i] == 0) {
            g_keyboard_report[i] = keycode;
            break;
        }
    }

    // Envoyer le rapport à l'hôte USB
    tud_hid_n_report(0, REPORT_ID_KEYBOARD, g_keyboard_report, sizeof(g_keyboard_report));
}

void usb_hid_key_release(uint8_t keycode)
{
    if (!g_mounted) return;

    // Retirer le keycode du rapport
    for (int i = 2; i < 8; i++) {
        if (g_keyboard_report[i] == keycode) {
            g_keyboard_report[i] = 0;
            break;
        }
    }

    // Envoyer le rapport mis à jour
    tud_hid_n_report(0, REPORT_ID_KEYBOARD, g_keyboard_report, sizeof(g_keyboard_report));
}

void usb_hid_consumer_press(uint16_t usage)
{
    if (!g_mounted) return;
    // Rapport consumer = 2 bytes (usage code 16 bits)
    uint8_t report[2] = { (uint8_t)(usage & 0xFF), (uint8_t)(usage >> 8) };
    tud_hid_n_report(0, REPORT_ID_CONSUMER, report, sizeof(report));
}

void usb_hid_consumer_release(void)
{
    if (!g_mounted) return;
    uint8_t report[2] = {0, 0};
    tud_hid_n_report(0, REPORT_ID_CONSUMER, report, sizeof(report));
}

void usb_hid_process_config_packet(const uint8_t *data, size_t len)
{
    // Protocole simple : le JSON commence par une commande
    // {"cmd":"set_config", "payload": {...}} → mettre à jour la config
    // {"cmd":"get_config"}                  → renvoyer la config JSON
    // {"cmd":"factory_reset"}               → reset

    const char *str = (const char *)data;

    if (strstr(str, "\"get_config\"")) {
        // Envoyer la config actuelle en JSON via CDC
        char *buf = malloc(CONFIG_JSON_MAX_SIZE);
        if (buf) {
            config_store_to_json(buf, CONFIG_JSON_MAX_SIZE);
            tinyusb_cdcacm_write_queue(TINYUSB_CDC_ACM_0, (uint8_t *)buf, strlen(buf));
            tinyusb_cdcacm_write_flush(TINYUSB_CDC_ACM_0, 0);
            free(buf);
        }
    } else if (strstr(str, "\"set_config\"")) {
        // Trouver le payload JSON et mettre à jour
        const char *payload_start = strstr(str, "\"payload\":");
        if (payload_start) {
            payload_start += 10;  // Sauter "payload":
            config_store_update_from_json(payload_start);
            keymap_reload_from_config();
            // Confirmer
            const char *ok = "{\"status\":\"ok\"}\n";
            tinyusb_cdcacm_write_queue(TINYUSB_CDC_ACM_0, (uint8_t *)ok, strlen(ok));
            tinyusb_cdcacm_write_flush(TINYUSB_CDC_ACM_0, 0);
        }
    } else if (strstr(str, "\"factory_reset\"")) {
        config_store_factory_reset();
        keymap_reload_from_config();
        const char *ok = "{\"status\":\"ok\",\"msg\":\"factory_reset\"}\n";
        tinyusb_cdcacm_write_queue(TINYUSB_CDC_ACM_0, (uint8_t *)ok, strlen(ok));
        tinyusb_cdcacm_write_flush(TINYUSB_CDC_ACM_0, 0);
    }
}

bool usb_hid_is_mounted(void) { return g_mounted; }

// Callback requis par TinyUSB quand l'hôte demande le descripteur HID
uint8_t const *tud_hid_descriptor_report_cb(uint8_t instance)
{
    (void)instance;
    return hid_report_descriptor;
}

// Callback requis par TinyUSB pour les requêtes GET_REPORT
uint16_t tud_hid_get_report_cb(uint8_t instance, uint8_t report_id,
                                hid_report_type_t report_type,
                                uint8_t *buffer, uint16_t reqlen)
{
    (void)instance; (void)report_id; (void)report_type; (void)buffer; (void)reqlen;
    return 0;
}

// Callback requis par TinyUSB pour les requêtes SET_REPORT (output reports)
void tud_hid_set_report_cb(uint8_t instance, uint8_t report_id,
                            hid_report_type_t report_type,
                            const uint8_t *buffer, uint16_t bufsize)
{
    (void)instance; (void)report_id; (void)report_type; (void)buffer; (void)bufsize;
    // On pourrait gérer les LEDs clavier (NumLock, CapsLock) ici
}
