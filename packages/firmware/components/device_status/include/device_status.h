#pragma once
// ═══════════════════════════════════════════════════════════════
//  device_status.h — Télémétrie device (batterie, connexion, fw)
//
//  Une seule source de vérité pour les deux transports :
//   - USB serial      : cmd "device_status"
//   - HTTP Studio Mode: GET /api/status
//
//  Format de sortie : voir packages/shared/src/constants/
//                     device-status-schema.ts
//
//  Pour ajouter une section (ex. "sensors") : étendre
//  device_status_build() en ajoutant un nouveau cJSON object.
// ═══════════════════════════════════════════════════════════════

#include <stddef.h>
#include <stdbool.h>
#include "esp_err.h"
#include "cJSON.h"

// Construit l'objet cJSON complet. Ownership transféré à l'appelant
// (libère avec cJSON_Delete). NULL si allocation échoue.
cJSON *device_status_build(void);

// Helper : sérialise dans un buffer fourni. Append automatiquement
// un '\n' final si line_terminated=true (utile pour CDC serial).
// Retourne ESP_ERR_NO_MEM si le buffer est trop petit.
esp_err_t device_status_to_json(char *buf, size_t buf_size,
                                size_t *written, bool line_terminated);
