#!/usr/bin/env bash
# Erzeugt GIF-Animationen aus den Videos in assets/video. Ergebnis: assets/gif/.
#
# Wofür: Die Seite selbst spielt MP4 ab (viel kleiner und schärfer). Die GIFs sind für Stellen
# gedacht, an denen kein Video geht — Instagram-Story-Sticker, E-Mail-Signatur, Presseanhang,
# Chat. GIF kann nur 256 Farben pro Bild, deshalb sind die Dateien trotz Optimierung mehrere MB.
#
# Ablauf pro Datei (Zwei-Pass mit eigener Farbpalette):
#   1. leichtes Entrauschen und Weißabgleich, damit der Papiergrund ruhig bleibt und
#      aufeinanderfolgende Bilder sich möglichst wenig unterscheiden (kleinere Datei),
#   2. palettegen erzeugt eine Palette aus dem gesamten Clip (stats_mode=diff gewichtet
#      die bewegten Flächen, also die Tusche),
#   3. paletteuse mit diff_mode=rectangle schreibt nur die geänderten Rechtecke.
#   tpad hält das letzte Bild an, bevor die Schleife neu beginnt — die fertige Zeichnung
#   soll stehen bleiben.
#
# Aufruf:
#   scripts/make-gifs.sh                  alle Videos mit den Standardwerten
#   scripts/make-gifs.sh video.mp4 ...    einzelne Dateien
#   KLEIN=1 scripts/make-gifs.sh          sparsame Fassung (halbe Größe, weniger Farben)
#
# Stellschrauben (Umgebungsvariablen):
#   FFMPEG   Pfad zu ffmpeg, falls nicht im Suchpfad
#   BREITE   Bildbreite in Pixeln (Standard 400, quer 800)
#   FPS      Bilder pro Sekunde (Standard 12)
#   FARBEN   Palettengröße, 32 bis 256 (Standard 64)
#   HALT     Sekunden Standbild am Ende (Standard 2)
set -euo pipefail
cd "$(dirname "$0")/.."

FF="${FFMPEG:-$(command -v ffmpeg || true)}"
if [ -z "$FF" ] || [ ! -x "$FF" ]; then
  # Rückfallebene: das ffmpeg aus dem Python-Paket imageio-ffmpeg, falls installiert
  FF="$(python3 -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())' 2>/dev/null || true)"
fi
if [ -z "$FF" ] || [ ! -x "$FF" ]; then
  echo "ffmpeg nicht gefunden. Installieren (brew install ffmpeg / apt install ffmpeg)" >&2
  echo "oder FFMPEG=/pfad/zu/ffmpeg setzen." >&2
  exit 1
fi

if [ "${KLEIN:-0}" = "1" ]; then
  FPS="${FPS:-10}"; FARBEN="${FARBEN:-48}"; SKALA=0.5
else
  FPS="${FPS:-12}"; FARBEN="${FARBEN:-64}"; SKALA=1
fi
HALT="${HALT:-2}"

# Entrauschen plus Weißabgleich: Werte über 240 werden zu reinem Weiß, damit der
# Papiergrund zwischen den Bildern nicht flimmert. Die Tusche selbst bleibt unangetastet.
RUHE="hqdn3d=4:3:6:5,lutrgb=r='if(gt(val,240),255,val)':g='if(gt(val,240),255,val)':b='if(gt(val,240),255,val)'"

make_gif() {
  local in="$1" breite="$2"
  [ -f "$in" ] || { echo "übersprungen (nicht gefunden): $in" >&2; return 0; }
  breite=$(awk -v b="$breite" -v s="$SKALA" 'BEGIN{printf "%d", int(b*s/2)*2}')
  local name out pal filter
  name="$(basename "${in%.*}")"
  out="assets/gif/${name}.gif"
  pal="$(mktemp -t palette.XXXXXX.png)"
  filter="fps=${FPS},${RUHE},tpad=stop_mode=clone:stop_duration=${HALT},scale=${breite}:-1:flags=lanczos"
  "$FF" -y -hide_banner -loglevel error -i "$in" \
    -vf "${filter},palettegen=max_colors=${FARBEN}:stats_mode=diff" "$pal"
  "$FF" -y -hide_banner -loglevel error -i "$in" -i "$pal" \
    -lavfi "${filter} [x]; [x][1:v] paletteuse=dither=none:diff_mode=rectangle" \
    -loop 0 "$out"
  rm -f "$pal"
  printf '%-44s %6s  %spx  %sfps  %s Farben\n' "$out" "$(du -h "$out" | cut -f1)" "$breite" "$FPS" "$FARBEN"
}

mkdir -p assets/gif

if [ $# -gt 0 ]; then
  for f in "$@"; do make_gif "$f" "${BREITE:-400}"; done
  exit 0
fi

# Standardlauf. Hochformat schmaler, Querformat breiter — die Pixel sollen dorthin, wo Linien sind.
make_gif assets/video/gestaltung-profil-zeichnung.mp4 "${BREITE:-400}"
make_gif assets/video/gestaltung-signatur.mp4    "${BREITE:-800}"
echo
echo "Die frühere Fassung der Profil-Animation ist nicht im Standardlauf:"
echo "  scripts/make-gifs.sh assets/video/gestaltung-profil-zeichnung-alt.mp4"
