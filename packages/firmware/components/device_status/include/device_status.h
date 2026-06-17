#pragma once
// ═══════════════════════════════════════════════════════════════
//  device_status.h — Device telemetry (battery, connection, fw)
//
//  A single source of truth for both transports:
//   - USB serial      : cmd "device_status"
//   - HTTP Studio Mode: GET /api/status
//
//  Output format : see packages/shared/src/constants/
//                  device-status-schema.ts
//
//  To add a section (e.g. "sensors") : extend
//  device_status_build() by adding a new cJSON object.
// ═══════════════════════════════════════════════════════════════

#include <stddef.h>
#include <stdbool.h>
#include "esp_err.h"
#include "cJSON.h"

// Builds the complete cJSON object. Ownership transferred to the caller
// (free with cJSON_Delete). NULL if allocation fails.
cJSON *device_status_build(void);

// Helper : serializes into a provided buffer. Automatically appends
// a final '\n' if line_terminated=true (useful for CDC serial).
// Returns ESP_ERR_NO_MEM if the buffer is too small.
esp_err_t device_status_to_json(char *buf, size_t buf_size,
                                size_t *written, bool line_terminated);
