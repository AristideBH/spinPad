cmake_minimum_required(VERSION 3.16)

# Nom du projet
set(PROJECT_NAME "spinpad")

# ── Board variant ────────────────────────────────────────────────
# Sélectionner la variante hardware : idf.py -DBOARD_VARIANT=spinpad-v1 build
# Par défaut : spinpad-v1 (la seule board existante pour l'instant)
if(NOT DEFINED BOARD_VARIANT)
    set(BOARD_VARIANT "spinpad-v1")
endif()

set(BOARD_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../hardware/boards/${BOARD_VARIANT}")
if(NOT EXISTS "${BOARD_DIR}/kb_config.h")
    message(FATAL_ERROR "Board variant '${BOARD_VARIANT}' introuvable : ${BOARD_DIR}/kb_config.h")
endif()

message(STATUS "Board variant : ${BOARD_VARIANT} (${BOARD_DIR})")

# Rendre kb_config.h accessible globalement
list(APPEND EXTRA_COMPONENT_DIRS)
include_directories("${BOARD_DIR}")

# ── ESP-IDF ──────────────────────────────────────────────────────
if(NOT DEFINED ENV{IDF_PATH} OR "$ENV{IDF_PATH}" STREQUAL "")
    message(FATAL_ERROR "IDF_PATH n'est pas défini. Lance 'source export.sh' de l'ESP-IDF.")
endif()
include($ENV{IDF_PATH}/tools/cmake/project.cmake)

project(${PROJECT_NAME})
