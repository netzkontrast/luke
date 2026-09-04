#!/usr/bin/env bash
# Kopiert die Bilder, Videos und Schriften aus ../assets nach public/.
# Die Dateien liegen bewusst nur einmal im Repository, nämlich unter ../assets.
# public/ ist eine abgeleitete Kopie und steht in .gitignore.
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p public/img public/video public/fonts

cp ../assets/img/werk-1-profil-1900.jpg \
   ../assets/img/werk-2-auge-1800.jpg \
   ../assets/img/luke-atelier-1536.jpg \
   public/img/

cp ../assets/video/werk-1-profil-zeichnung.mp4 \
   ../assets/video/werk-2-auge-signatur.mp4 \
   public/video/

cp ../assets/fonts/alegreya-sans-300-latin.woff2 \
   ../assets/fonts/alegreya-sans-400-latin.woff2 \
   ../assets/fonts/alegreya-sans-500-latin.woff2 \
   ../assets/fonts/alegreya-400-500-latin.woff2 \
   ../assets/fonts/alegreya-italic-400-latin.woff2 \
   public/fonts/

echo "public/ ist auf dem Stand von ../assets"
