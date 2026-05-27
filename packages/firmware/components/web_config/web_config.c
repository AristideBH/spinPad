// ═══════════════════════════════════════════════════════════════
//  web_config.c — Studio Mode : WiFi AP + serveur HTTP + SPIFFS
// ═══════════════════════════════════════════════════════════════

#include "web_config.h"
#include "config_store.h"
#include "display.h"
#include "led_engine.h"
#include "device_status.h"

#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "esp_http_server.h"
#include "esp_spiffs.h"
#include "esp_log.h"
#include "esp_phy_init.h"

#include "freertos/FreeRTOS.h"
#include "freertos/timers.h"

#include "nvs_flash.h"
#include "nvs.h"

#include <string.h>
#include <stdio.h>
#include <sys/stat.h>

static const char *TAG = "WEB_CONFIG";

// ─────────────────────────────────────────────────────────────
//  BACKUP CONFIG (NVS) — protection contre corruption/perte
//
//  À l'entrée en Studio Mode, la config courante est sauvegardée
//  dans un namespace NVS séparé "kb_backup".
//  À la sortie propre, le backup est supprimé.
//  Si un Studio Mode précédent n'a pas été quitté proprement
//  (coupure de courant, crash...), le backup est restauré
//  automatiquement à l'entrée du prochain Studio Mode.
// ─────────────────────────────────────────────────────────────

#define BACKUP_NVS_NAMESPACE    "kb_backup"
#define BACKUP_NVS_KEY          "cfg_json"
#define BACKUP_JSON_MAX_SIZE    8192

static esp_err_t _backup_config(void)
{
    char *buf = malloc(BACKUP_JSON_MAX_SIZE);
    if (!buf) return ESP_ERR_NO_MEM;

    esp_err_t err = config_store_to_json(buf, BACKUP_JSON_MAX_SIZE);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Impossible de sérialiser la config pour backup");
        free(buf);
        return err;
    }

    nvs_handle_t nvs;
    err = nvs_open(BACKUP_NVS_NAMESPACE, NVS_READWRITE, &nvs);
    if (err == ESP_OK) {
        err = nvs_set_str(nvs, BACKUP_NVS_KEY, buf);
        if (err == ESP_OK) nvs_commit(nvs);
        nvs_close(nvs);
    }

    free(buf);
    if (err == ESP_OK) {
        ESP_LOGI(TAG, "Backup config sauvegardé en NVS (%s/%s)", BACKUP_NVS_NAMESPACE, BACKUP_NVS_KEY);
    } else {
        ESP_LOGW(TAG, "Échec sauvegarde backup config : %s", esp_err_to_name(err));
    }
    return err;
}

static void _delete_backup(void)
{
    nvs_handle_t nvs;
    if (nvs_open(BACKUP_NVS_NAMESPACE, NVS_READWRITE, &nvs) == ESP_OK) {
        nvs_erase_key(nvs, BACKUP_NVS_KEY);
        nvs_commit(nvs);
        nvs_close(nvs);
        ESP_LOGI(TAG, "Backup config supprimé (sortie propre Studio Mode)");
    }
}

static esp_err_t _restore_backup(void)
{
    nvs_handle_t nvs;
    esp_err_t err = nvs_open(BACKUP_NVS_NAMESPACE, NVS_READONLY, &nvs);
    if (err != ESP_OK) return ESP_ERR_NOT_FOUND;

    size_t len = BACKUP_JSON_MAX_SIZE;
    char *buf = malloc(len);
    if (!buf) { nvs_close(nvs); return ESP_ERR_NO_MEM; }

    err = nvs_get_str(nvs, BACKUP_NVS_KEY, buf, &len);
    nvs_close(nvs);

    if (err == ESP_OK) {
        err = config_store_update_from_json(buf);
        if (err == ESP_OK) {
            config_store_save();
            ESP_LOGW(TAG, "⚠ Config restaurée depuis le backup (Studio Mode interrompu)");
        } else {
            ESP_LOGE(TAG, "Échec restauration backup — config potentiellement corrompue");
        }
    }

    free(buf);
    return err;
}

static bool _backup_exists(void)
{
    nvs_handle_t nvs;
    if (nvs_open(BACKUP_NVS_NAMESPACE, NVS_READONLY, &nvs) != ESP_OK) return false;
    size_t len = 0;
    bool exists = (nvs_get_str(nvs, BACKUP_NVS_KEY, NULL, &len) == ESP_OK && len > 0);
    nvs_close(nvs);
    return exists;
}

// ─────────────────────────────────────────────────────────────
//  ÉTAT INTERNE
// ─────────────────────────────────────────────────────────────

static bool             g_running      = false;
static httpd_handle_t   g_server       = NULL;
static TimerHandle_t    g_idle_timer   = NULL;
static bool             g_netif_init   = false;   // esp_netif initialisé une seule fois
static bool             g_event_loop   = false;   // event loop créé une seule fois
static bool             g_spiffs_mounted = false;

// ─────────────────────────────────────────────────────────────
//  TIMER D'INACTIVITÉ
// ─────────────────────────────────────────────────────────────

static void idle_timeout_cb(TimerHandle_t timer)
{
    ESP_LOGI(TAG, "Timeout inactivité → arrêt Studio Mode");
    web_config_stop();
}

static void reset_idle_timer(void)
{
    if (g_idle_timer) {
        xTimerReset(g_idle_timer, 0);
    }
}

// ─────────────────────────────────────────────────────────────
//  HELPERS — SERVIR DES FICHIERS STATIQUES DEPUIS SPIFFS
// ─────────────────────────────────────────────────────────────

static const char *mime_type(const char *path)
{
    const char *ext = strrchr(path, '.');
    if (!ext) return "application/octet-stream";
    if (strcmp(ext, ".html") == 0) return "text/html; charset=utf-8";
    if (strcmp(ext, ".js")   == 0) return "application/javascript";
    if (strcmp(ext, ".css")  == 0) return "text/css";
    if (strcmp(ext, ".json") == 0) return "application/json";
    if (strcmp(ext, ".svg")  == 0) return "image/svg+xml";
    if (strcmp(ext, ".png")  == 0) return "image/png";
    if (strcmp(ext, ".ico")  == 0) return "image/x-icon";
    if (strcmp(ext, ".woff2")== 0) return "font/woff2";
    return "application/octet-stream";
}

static void set_cors_headers(httpd_req_t *req)
{
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin",  "*");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Headers", "Content-Type");
}

// Envoyer un fichier depuis SPIFFS
static esp_err_t serve_file(httpd_req_t *req, const char *spiffs_path)
{
    struct stat st;
    if (stat(spiffs_path, &st) != 0) {
        // Fichier non trouvé → fallback vers index.html (SPA routing)
        return serve_file(req, "/spiffs/index.html");
    }

    FILE *f = fopen(spiffs_path, "r");
    if (!f) {
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Cannot open file");
        return ESP_FAIL;
    }

    httpd_resp_set_type(req, mime_type(spiffs_path));
    // Cache long pour les assets immutables (_app/immutable/*)
    if (strstr(spiffs_path, "immutable") || strstr(spiffs_path, "_app")) {
        httpd_resp_set_hdr(req, "Cache-Control", "public, max-age=31536000, immutable");
    } else {
        httpd_resp_set_hdr(req, "Cache-Control", "no-cache");
    }

    char buf[512];
    size_t n;
    while ((n = fread(buf, 1, sizeof(buf), f)) > 0) {
        httpd_resp_send_chunk(req, buf, n);
    }
    fclose(f);
    httpd_resp_send_chunk(req, NULL, 0);  // Fin du chunked transfer
    return ESP_OK;
}

// ─────────────────────────────────────────────────────────────
//  HANDLERS REST
// ─────────────────────────────────────────────────────────────

// GET /api/config → retourne la config JSON complète
static esp_err_t handle_get_config(httpd_req_t *req)
{
    reset_idle_timer();
    set_cors_headers(req);

    char *buf = malloc(CONFIG_JSON_MAX_SIZE);
    if (!buf) {
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Out of memory");
        return ESP_FAIL;
    }

    esp_err_t err = config_store_to_json(buf, CONFIG_JSON_MAX_SIZE);
    if (err != ESP_OK) {
        free(buf);
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Config serialization failed");
        return ESP_FAIL;
    }

    httpd_resp_set_type(req, "application/json");
    httpd_resp_sendstr(req, buf);
    free(buf);
    return ESP_OK;
}

// POST /api/config — body = JSON config complet
static esp_err_t handle_post_config(httpd_req_t *req)
{
    reset_idle_timer();
    set_cors_headers(req);

    int content_len = req->content_len;
    if (content_len <= 0 || content_len >= CONFIG_JSON_MAX_SIZE) {
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid content length");
        return ESP_FAIL;
    }

    char *buf = malloc(content_len + 1);
    if (!buf) {
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Out of memory");
        return ESP_FAIL;
    }

    int received = httpd_req_recv(req, buf, content_len);
    if (received <= 0) {
        free(buf);
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Failed to receive body");
        return ESP_FAIL;
    }
    buf[received] = '\0';

    esp_err_t err = config_store_update_from_json(buf);
    free(buf);

    if (err == ESP_OK) {
        config_store_save();
        // Recharger le keymap avec la nouvelle config
        extern void keymap_reload_from_config(void);
        keymap_reload_from_config();
        // Recharger les LEDs (luminosité peut avoir changé dans la config)
        led_engine_apply_config();
        httpd_resp_set_type(req, "application/json");
        httpd_resp_sendstr(req, "{\"ok\":true}");
    } else {
        httpd_resp_set_type(req, "application/json");
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "{\"ok\":false,\"error\":\"Invalid config JSON\"}");
    }
    return ESP_OK;
}

// GET /api/status — télémétrie live (batterie, connexion, fw)
static esp_err_t handle_get_status(httpd_req_t *req)
{
    reset_idle_timer();
    set_cors_headers(req);

    char buf[512];
    size_t n = 0;
    if (device_status_to_json(buf, sizeof(buf), &n, false) != ESP_OK) {
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "device_status build failed");
        return ESP_FAIL;
    }

    httpd_resp_set_type(req, "application/json");
    httpd_resp_send(req, buf, n);
    return ESP_OK;
}

// POST /api/factory_reset
static esp_err_t handle_factory_reset(httpd_req_t *req)
{
    reset_idle_timer();
    set_cors_headers(req);

    ESP_LOGW(TAG, "Factory reset demandé via Studio Mode");
    config_store_factory_reset();
    config_store_save();

    extern void keymap_reload_from_config(void);
    keymap_reload_from_config();
    led_engine_apply_config();

    httpd_resp_set_type(req, "application/json");
    httpd_resp_sendstr(req, "{\"ok\":true}");
    return ESP_OK;
}

// OPTIONS * — Preflight CORS
static esp_err_t handle_options(httpd_req_t *req)
{
    set_cors_headers(req);
    httpd_resp_send(req, NULL, 0);
    return ESP_OK;
}

// GET /* — Servir les fichiers statiques depuis SPIFFS
static esp_err_t handle_static(httpd_req_t *req)
{
    reset_idle_timer();
    set_cors_headers(req);

    // Construire le chemin SPIFFS
    char path[128];
    const char *uri = req->uri;

    // Racine → index.html
    if (strcmp(uri, "/") == 0) {
        snprintf(path, sizeof(path), "/spiffs/index.html");
    } else {
        snprintf(path, sizeof(path), "/spiffs%s", uri);
    }

    return serve_file(req, path);
}

// ─────────────────────────────────────────────────────────────
//  DÉMARRAGE DU SERVEUR HTTP
// ─────────────────────────────────────────────────────────────

static esp_err_t start_http_server(void)
{
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.max_uri_handlers = 8;
    config.uri_match_fn     = httpd_uri_match_wildcard;
    config.stack_size       = 8192;

    if (httpd_start(&g_server, &config) != ESP_OK) {
        ESP_LOGE(TAG, "Échec démarrage serveur HTTP");
        return ESP_FAIL;
    }

    // ── Endpoints REST ────────────────────────────────────────
    httpd_uri_t get_config_uri = {
        .uri = "/api/config", .method = HTTP_GET,
        .handler = handle_get_config, .user_ctx = NULL
    };
    httpd_register_uri_handler(g_server, &get_config_uri);

    httpd_uri_t post_config_uri = {
        .uri = "/api/config", .method = HTTP_POST,
        .handler = handle_post_config, .user_ctx = NULL
    };
    httpd_register_uri_handler(g_server, &post_config_uri);

    httpd_uri_t post_reset_uri = {
        .uri = "/api/factory_reset", .method = HTTP_POST,
        .handler = handle_factory_reset, .user_ctx = NULL
    };
    httpd_register_uri_handler(g_server, &post_reset_uri);

    httpd_uri_t get_status_uri = {
        .uri = "/api/status", .method = HTTP_GET,
        .handler = handle_get_status, .user_ctx = NULL
    };
    httpd_register_uri_handler(g_server, &get_status_uri);

    httpd_uri_t options_uri = {
        .uri = "/*", .method = HTTP_OPTIONS,
        .handler = handle_options, .user_ctx = NULL
    };
    httpd_register_uri_handler(g_server, &options_uri);

    // ── Fichiers statiques (wildcard, doit être en dernier) ───
    httpd_uri_t static_uri = {
        .uri = "/*", .method = HTTP_GET,
        .handler = handle_static, .user_ctx = NULL
    };
    httpd_register_uri_handler(g_server, &static_uri);

    ESP_LOGI(TAG, "Serveur HTTP démarré sur http://%s/", WEB_CONFIG_AP_IP);
    return ESP_OK;
}

// ─────────────────────────────────────────────────────────────
//  API PUBLIQUE
// ─────────────────────────────────────────────────────────────

esp_err_t web_config_init(void)
{
    if (!g_netif_init) {
        ESP_ERROR_CHECK(esp_netif_init());
        g_netif_init = true;
    }
    if (!g_event_loop) {
        ESP_ERROR_CHECK(esp_event_loop_create_default());
        g_event_loop = true;
    }
    ESP_LOGI(TAG, "web_config pré-initialisé");
    return ESP_OK;
}

esp_err_t web_config_start(void)
{
    if (g_running) {
        ESP_LOGW(TAG, "Studio Mode déjà actif");
        return ESP_OK;
    }

    ESP_LOGI(TAG, "Démarrage Studio Mode...");

    // ── 0. Backup / restauration config ──────────────────────
    // Si un backup existe, cela signifie que le précédent Studio Mode a été
    // interrompu sans sortie propre (coupure, crash...). On restaure d'abord.
    if (_backup_exists()) {
        ESP_LOGW(TAG, "Backup détecté — Studio Mode précédent interrompu. Restauration...");
        _restore_backup();
    }
    // Sauvegarder la config actuelle comme point de restauration
    _backup_config();

    // ── 1. WiFi AP ────────────────────────────────────────────
    esp_netif_create_default_wifi_ap();

    wifi_init_config_t wifi_init_cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&wifi_init_cfg));

    // Limiter la puissance TX à 10 dBm (contrainte hardware)
    ESP_ERROR_CHECK(esp_wifi_set_max_tx_power(WEB_CONFIG_WIFI_TX_POWER_DBM));

    wifi_config_t ap_config = {
        .ap = {
            .ssid            = WEB_CONFIG_AP_SSID,
            .ssid_len        = strlen(WEB_CONFIG_AP_SSID),
            .channel         = WEB_CONFIG_AP_CHANNEL,
            .password        = WEB_CONFIG_AP_PASS,
            .max_connection  = WEB_CONFIG_AP_MAX_CONNECTIONS,
            .authmode        = WIFI_AUTH_OPEN,
        },
    };

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_AP));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_AP, &ap_config));
    ESP_ERROR_CHECK(esp_wifi_start());
    esp_wifi_set_ps(WIFI_PS_MIN_MODEM);  // Économie énergie entre les requêtes HTTP

    ESP_LOGI(TAG, "WiFi AP démarré — SSID: %s, IP: %s",
             WEB_CONFIG_AP_SSID, WEB_CONFIG_AP_IP);

    // ── 2. Monter SPIFFS ──────────────────────────────────────
    esp_vfs_spiffs_conf_t spiffs_conf = {
        .base_path              = "/spiffs",
        .partition_label        = "spiffs",
        .max_files              = 12,
        .format_if_mount_failed = false,
    };
    esp_err_t spiffs_err = esp_vfs_spiffs_register(&spiffs_conf);
    if (spiffs_err != ESP_OK) {
        ESP_LOGW(TAG, "SPIFFS non monté (err=%d) — Studio sans fichiers statiques", spiffs_err);
        // On continue quand même (API REST fonctionnelle sans UI)
    } else {
        g_spiffs_mounted = true;
        size_t total = 0, used = 0;
        esp_spiffs_info("spiffs", &total, &used);
        ESP_LOGI(TAG, "SPIFFS monté — %d/%d bytes utilisés", (int)used, (int)total);
    }

    // ── 3. Démarrer le serveur HTTP ───────────────────────────
    esp_err_t http_err = start_http_server();
    if (http_err != ESP_OK) {
        ESP_LOGE(TAG, "Échec démarrage HTTP — annulation Studio Mode");
        esp_wifi_stop();
        esp_wifi_deinit();
        if (g_spiffs_mounted) {
            esp_vfs_spiffs_unregister("spiffs");
            g_spiffs_mounted = false;
        }
        return http_err;
    }

    // ── 4. Timer de timeout ───────────────────────────────────
    g_idle_timer = xTimerCreate(
        "web_idle",
        pdMS_TO_TICKS(WEB_CONFIG_IDLE_TIMEOUT_MS),
        pdFALSE,    // Ne se répète pas
        NULL,
        idle_timeout_cb
    );
    if (g_idle_timer) xTimerStart(g_idle_timer, 0);

    // ── 5. Mettre à jour l'écran OLED ────────────────────────
    display_show_studio_mode(WEB_CONFIG_AP_SSID, WEB_CONFIG_AP_IP);

    // ── 6. Dimmer les LEDs touches (~20% puissance RF) ────────
    led_engine_set_brightness_global(WEB_CONFIG_LED_DIM_BRIGHTNESS);

    g_running = true;
    ESP_LOGI(TAG, "Studio Mode actif — http://%s/", WEB_CONFIG_AP_IP);
    return ESP_OK;
}

esp_err_t web_config_stop(void)
{
    if (!g_running) return ESP_OK;

    ESP_LOGI(TAG, "Arrêt Studio Mode...");

    // ── 1. Arrêter le timer ───────────────────────────────────
    if (g_idle_timer) {
        xTimerStop(g_idle_timer, 0);
        xTimerDelete(g_idle_timer, 0);
        g_idle_timer = NULL;
    }

    // ── 2. Arrêter le serveur HTTP ────────────────────────────
    if (g_server) {
        httpd_stop(g_server);
        g_server = NULL;
    }

    // ── 3. Arrêter le WiFi ────────────────────────────────────
    esp_wifi_stop();
    esp_wifi_deinit();
    ESP_LOGI(TAG, "WiFi AP arrêté");

    // ── 4. Démonter SPIFFS ────────────────────────────────────
    if (g_spiffs_mounted) {
        esp_vfs_spiffs_unregister("spiffs");
        g_spiffs_mounted = false;
    }

    // ── 5. Restaurer l'écran OLED ─────────────────────────────
    display_show_status();  // Retour à l'écran de statut normal

    // ── 6. Restaurer la luminosité LED ────────────────────────
    led_engine_apply_config();  // Relit brightness depuis config_store

    // ── 7. Supprimer le backup (sortie propre) ────────────────
    _delete_backup();

    g_running = false;
    ESP_LOGI(TAG, "Studio Mode arrêté");
    return ESP_OK;
}

bool web_config_is_running(void)
{
    return g_running;
}
