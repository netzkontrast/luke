#!/usr/bin/env bash
# Kodiert die Videos der Seite aus den Originalen in assets/original/.
#
# Das Auftaktvideo (das Profil entsteht) läuft einmal durch und wird nicht gespult; es
# braucht darum keine dichten Schlüsselbilder. Die erste Quelle ist AV1: bei gleicher
# Anmutung wie das H.264 (PSNR 37,2 gegen 38,8 dB über alle Bilder, mit dem Auge in der
# dichten Schraffur kaum zu unterscheiden) knapp 1 MB statt 1,8 MB. Eine Bildfolge wäre hier
# größer, nicht kleiner: Alle Striche bewegen sich in jedem Bild, 145 Bilder als WebP sind
# 4 MB. Das Korn wird nicht nachgebildet (film-grain): Das glättete die Schraffur sichtbar.
#
# Browser ohne AV1 (ältere iPhones und Macs) nehmen die WebM (VP9) oder die MP4 (H.264), die
# unverändert bleiben. index.html nennt AV1 zuerst, mit Codec-Angabe, damit ein Browser die
# Datei überspringt, statt sie zu laden und daran zu scheitern.
#
# Die Handschrift ist kein Video mehr, sondern eine Bildfolge (scripts/bilder.py).
#
# Aufruf: scripts/videos.sh   (braucht ffmpeg mit libsvtav1)
set -euo pipefail
cd "$(dirname "$0")/.."
FFMPEG="${FFMPEG:-ffmpeg}"

"$FFMPEG" -v error -y -i assets/original/gestaltung-profil-zeichnung.mp4 -an -map_metadata -1 \
  -c:v libsvtav1 -crf 38 -preset 3 -g 240 -svtav1-params tune=0:enable-qm=1 -pix_fmt yuv420p \
  -movflags +faststart assets/video/gestaltung-profil-zeichnung-av1.mp4

ls -l assets/video/gestaltung-profil-zeichnung-av1.mp4
