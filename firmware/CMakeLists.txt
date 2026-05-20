cmake_minimum_required(VERSION 3.16)

# Nom du projet — change-le si tu veux
set(PROJECT_NAME "custom_keyboard")

# Chemin vers ESP-IDF (normalement géré par idf.py, pas besoin de toucher)
if(NOT DEFINED ENV{IDF_PATH} OR "$ENV{IDF_PATH}" STREQUAL "")
    message(FATAL_ERROR "Environment variable IDF_PATH is not set. Please source the ESP-IDF export script or set IDF_PATH before configuring.")
endif()
include($ENV{IDF_PATH}/tools/cmake/project.cmake)

project(${PROJECT_NAME})
