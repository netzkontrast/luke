#!/usr/bin/env bash
# Kopiert die Bilder, Videos und Schriften aus ../assets nach public/.
# Die Dateien liegen bewusst nur einmal im Repository, nämlich unter ../assets.
# public/ ist eine abgeleitete Kopie und steht in .gitignore.
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p public/img public/video public/fonts

# Die großen Fassungen kommen aus den Originalen (die Seite liefert Bilder nur als WebP aus,
# erzeugt von scripts/bilder.py), die mittleren aus assets/img/, so wie die Seite sie zeigt.
cp ../assets/original/gestaltung-profil.jpg \
   ../assets/original/gestaltung-signatur.jpg \
   ../assets/original/luke-atelier.jpg \
   ../assets/img/gestaltung-profil-1200.webp \
   ../assets/img/gestaltung-kniend-1200.webp \
   public/img/

cp ../assets/video/gestaltung-profil-zeichnung.mp4 \
   ../assets/video/gestaltung-profil-zeichnung.webm \
   ../assets/video/gestaltung-signatur.mp4 \
   public/video/

cp ../assets/fonts/alegreya-sans-300-latin.woff2 \
   ../assets/fonts/alegreya-sans-400-latin.woff2 \
   ../assets/fonts/alegreya-sans-500-latin.woff2 \
   ../assets/fonts/alegreya-400-500-latin.woff2 \
   ../assets/fonts/alegreya-italic-400-latin.woff2 \
   public/fonts/

echo "public/ ist auf dem Stand von ../assets"
