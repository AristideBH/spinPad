cmake_minimum_required(VERSION 3.16)

# Project name
set(PROJECT_NAME "spinpad")

# ── Board variant ────────────────────────────────────────────────
# Select the hardware variant : idf.py -DBOARD_VARIANT=spinpad-v1 build
# Default : spinpad-v1 (the only board existing for now)
if(NOT DEFINED BOARD_VARIANT)
    set(BOARD_VARIANT "spinpad-v1")
endif()

set(BOARD_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../hardware/boards/${BOARD_VARIANT}")
if(NOT EXISTS "${BOARD_DIR}/kb_config.h")
    message(FATAL_ERROR "Board variant '${BOARD_VARIANT}' not found : ${BOARD_DIR}/kb_config.h")
endif()

message(STATUS "Board variant : ${BOARD_VARIANT} (${BOARD_DIR})")

# Make kb_config.h accessible globally
list(APPEND EXTRA_COMPONENT_DIRS)
include_directories("${BOARD_DIR}")

# ── ESP-IDF ──────────────────────────────────────────────────────
if(NOT DEFINED ENV{IDF_PATH} OR "$ENV{IDF_PATH}" STREQUAL "")
    message(FATAL_ERROR "IDF_PATH is not defined. Run 'source export.sh' from ESP-IDF.")
endif()
include($ENV{IDF_PATH}/tools/cmake/project.cmake)

# ── Firmware version + git build hash ────────────────────────────
set(KB_FW_VERSION_MAJOR 1)
set(KB_FW_VERSION_MINOR 0)
set(KB_FW_VERSION_PATCH 0)
set(KB_FW_VERSION "${KB_FW_VERSION_MAJOR}.${KB_FW_VERSION_MINOR}.${KB_FW_VERSION_PATCH}")

# Git short hash + dirty marker (injected into device_status)
execute_process(
    COMMAND git describe --always --dirty=+ --abbrev=7
    WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/../.."
    OUTPUT_VARIABLE KB_FW_BUILD
    OUTPUT_STRIP_TRAILING_WHITESPACE
    ERROR_QUIET
    RESULT_VARIABLE _git_result
)
if(NOT _git_result EQUAL 0 OR "${KB_FW_BUILD}" STREQUAL "")
    set(KB_FW_BUILD "unknown")
endif()

if(KB_FW_BUILD MATCHES "\\+$")
    set(KB_FW_BUILD_DIRTY 1)
else()
    set(KB_FW_BUILD_DIRTY 0)
endif()

message(STATUS "Firmware version : ${KB_FW_VERSION} (build ${KB_FW_BUILD}, dirty=${KB_FW_BUILD_DIRTY})")

configure_file(
    "${CMAKE_CURRENT_SOURCE_DIR}/main/fw_version.h.in"
    "${CMAKE_BINARY_DIR}/generated/fw_version.h"
    @ONLY
)
include_directories("${CMAKE_BINARY_DIR}/generated")

project(${PROJECT_NAME})
