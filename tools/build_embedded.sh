#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  build_embedded.sh — Build Studio + génère l'image SPIFFS
#
#  Usage :
#    ./tools/build_embedded.sh             # Build + image SPIFFS
#    ./tools/build_embedded.sh --flash     # Build + image + flash auto
#
#  Prérequis :
#    - pnpm, Node.js
#    - ESP-IDF activé (source ~/esp/esp-idf/export.sh)
#    - esptool.py disponible si --flash est utilisé
#
#  Sortie :
#    packages/studio/build-embedded/   — app SvelteKit buildée
#    packages/firmware/spiffs_image.bin — image SPIFFS pour l'ESP32
# ═══════════════════════════════════════════════════════════════

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STUDIO_DIR="$REPO_ROOT/packages/studio"
FIRMWARE_DIR="$REPO_ROOT/packages/firmware"
BUILD_OUT="$STUDIO_DIR/build-embedded"
SPIFFS_IMAGE="$FIRMWARE_DIR/spiffs_image.bin"
SPIFFS_SIZE=983040  # 0x0F0000 = 960 KB
SPIFFS_OFFSET=0x310000

# ── Couleurs ──────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[build_embedded]${NC} $*"; }
warn()  { echo -e "${YELLOW}[build_embedded]${NC} $*"; }
error() { echo -e "${RED}[build_embedded]${NC} $*" >&2; exit 1; }

# ── 1. Build Studio en mode embarqué ─────────────────────────
info "Build Studio (VITE_TRANSPORT=http)..."
cd "$STUDIO_DIR"
pnpm build:embedded
cd "$REPO_ROOT"

if [ ! -d "$BUILD_OUT" ]; then
    error "Répertoire de build introuvable : $BUILD_OUT"
fi
info "Build terminé → $BUILD_OUT"

# ── 2. Vérifier que spiffsgen.py est disponible ───────────────
if [ -z "$IDF_PATH" ]; then
    error "IDF_PATH non défini. Lance 'source \$IDF_PATH/export.sh' d'abord."
fi

SPIFFSGEN="$IDF_PATH/components/spiffs/spiffsgen.py"
if [ ! -f "$SPIFFSGEN" ]; then
    error "spiffsgen.py introuvable : $SPIFFSGEN"
fi

# ── 3. Générer l'image SPIFFS ─────────────────────────────────
info "Génération image SPIFFS (${SPIFFS_SIZE} bytes)..."
python "$SPIFFSGEN" \
    --page-size 256 \
    --obj-name-len 64 \
    "$SPIFFS_SIZE" \
    "$BUILD_OUT" \
    "$SPIFFS_IMAGE"

SIZE=$(stat -c%s "$SPIFFS_IMAGE" 2>/dev/null || stat -f%z "$SPIFFS_IMAGE")
info "Image SPIFFS générée : $SPIFFS_IMAGE ($SIZE bytes)"

# ── 4. Récapitulatif ──────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Studio Mode prêt à flasher !${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "  Flash manuel :"
echo "  esptool.py --chip esp32s3 -p <PORT> write_flash \\"
echo "    $SPIFFS_OFFSET $SPIFFS_IMAGE"
echo ""
echo "  Flash avec idf.py (rebuild complet) :"
echo "  cd packages/firmware && idf.py -p <PORT> flash monitor"
echo ""

# ── 5. Flash automatique (optionnel) ─────────────────────────
if [ "$1" = "--flash" ]; then
    if [ -z "$IDF_PORT" ]; then
        warn "IDF_PORT non défini. Utilise : IDF_PORT=/dev/ttyUSB0 ./tools/build_embedded.sh --flash"
        exit 0
    fi
    info "Flash de l'image SPIFFS sur $IDF_PORT..."
    python -m esptool --chip esp32s3 -p "$IDF_PORT" \
        write_flash "$SPIFFS_OFFSET" "$SPIFFS_IMAGE"
    info "Flash terminé !"
fi
