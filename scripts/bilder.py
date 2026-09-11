#!/usr/bin/env python3
"""Die Bilder der Seite, abgeleitet aus den Originalen.

Liest jede Aufnahme aus assets/original/ (so, wie sie vom Auftraggeber kam), schneidet zu,
zieht Papier auf Weiß, rechnet kleiner und schreibt nach assets/img/<name>-<breite>.webp.
Dazu js/bilder.js mit Maßen und Breiten jedes Bildes: Die Seite baut srcset daraus und muss
keine Pixelzahl von Hand kennen.

Aufruf (braucht Pillow mit WebP und numpy):

    python scripts/bilder.py            alles neu
    python scripts/bilder.py ansichten  nur Bilder, deren Name das Wort enthält

Wer ein Bild austauscht, legt das neue Original unter demselben Namen ab und lässt das Skript
laufen. Wer eines dazunimmt, trägt es unten in BILDER ein.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageOps

WURZEL = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
QUELLE = os.path.join(WURZEL, 'assets', 'original')
ZIEL = os.path.join(WURZEL, 'assets', 'img')
MANIFEST = os.path.join(WURZEL, 'js', 'bilder.js')

# WebP statt JPEG: bei gleicher Anmutung rund 40 % kleiner, und jeder Browser, der die Seite
# sonst darstellen kann, liest es. AVIF wäre noch einmal kleiner, verschmiert bei dieser
# Qualität aber die feinen Federstriche. Tusche braucht etwas mehr als Fotos und Plakate.
QUALITAET = {'papier': 82, 'foto': 80, 'grafik': 80, 'fertig': 80}

# art:
#   papier   Blatt auf hellem Papier, fotografiert. Der Rand wird gefunden und weggeschnitten,
#            ungleichmäßiges Licht ausgeglichen und der Papierton auf reines Weiß gezogen,
#            damit das Blatt mit multiply frei auf der Seite steht.
#   foto     Aufnahme, die ihren Grund behält. Zugeschnitten auf das Motiv, sonst unverändert.
#   grafik   Plakat, Signet, Cover. Nur zugeschnitten, wo die Datei Leerraum um das Motiv hat.
#   fertig   Schon so, wie es sein soll; nur kleiner gerechnet.
# zuschnitt: 'papier' (Rand finden), 'motiv' (hellen Inhalt auf dunklem Grund finden),
#            'dunkel' (dunklen Inhalt auf hellem Grund finden) oder (links, oben, rechts, unten).
BILDER = [
    # Befreiung der Körperlichkeit, Werk I und Werk II, je drei Blätter.
    dict(name='werk-befreiung-1-bild-1', art='papier', zuschnitt='papier', breiten=(480, 800)),
    dict(name='werk-befreiung-1-bild-2', art='papier', zuschnitt='papier', breiten=(480, 800)),
    dict(name='werk-befreiung-1-bild-3', art='papier', zuschnitt='papier', breiten=(480, 800)),
    dict(name='werk-befreiung-2-bild-1', art='papier', zuschnitt='papier', breiten=(480, 800)),
    dict(name='werk-befreiung-2-bild-2', art='papier', zuschnitt='papier', breiten=(480, 800)),
    dict(name='werk-befreiung-2-bild-3', art='papier', zuschnitt='papier', breiten=(480, 800)),
    # Farbe auf cremefarbenem Papier, das auf hellgrauem Grund liegt. Der Rand ist zu blass,
    # um ihn sicher zu finden; der Ausschnitt ist darum fest.
    dict(name='werk-ansichten', art='papier', zuschnitt=(34, 32, 862, 1162), breiten=(480, 828)),
    # Zwölf kleine Blätter auf schwarzem Holz. Der Grund bleibt, nur weniger davon.
    dict(name='werk-neuordnung-des-speichers', art='foto', zuschnitt='motiv', rand=0.08, breiten=(480, 800, 1200, 1600)),

    # Grafik
    dict(name='grafik-cover-bluthandwerk', art='grafik', zuschnitt='motiv', rand=0.03, breiten=(480, 900, 1400)),
    dict(name='grafik-cover-requiem-zerfall', art='grafik', breiten=(480, 900, 1400)),
    dict(name='grafik-plakat-nebelgrau-2026-02-21', art='grafik', breiten=(480, 900, 1400)),
    dict(name='grafik-plakat-nebelgrau-2026-12-05', art='grafik', breiten=(480, 900, 1400)),
    dict(name='grafik-flyer-noir-2026-04-18', art='grafik', zuschnitt=(0, 4, 950, 950), breiten=(480, 946)),
    dict(name='grafik-flyer-noir-2026-07-25', art='grafik', breiten=(480, 900, 1400)),
    dict(name='grafik-flyer-noir-2026-09-19', art='grafik', breiten=(480, 900, 1400)),
    dict(name='grafik-signet-kollektiv-noir', art='grafik', breiten=(480, 900, 1400)),
    dict(name='grafik-signet-nox', art='grafik', zuschnitt='dunkel', rand=0.12, breiten=(480, 900, 1400)),
    dict(name='grafik-signet-spleen', art='grafik', breiten=(480, 844)),
    dict(name='grafik-wortmarke-noir', art='grafik', breiten=(480, 900, 1228)),

    # Gestaltung: tragen die Seite, stehen nicht im Verzeichnis (siehe js/works.js).
    dict(name='gestaltung-kniend', art='fertig', breiten=(800, 1200, 1900)),
    dict(name='gestaltung-profil', art='fertig', breiten=(800, 1200, 1900)),
    dict(name='gestaltung-signatur', art='fertig', breiten=(1200, 1800)),

    dict(name='luke-atelier', art='fertig', breiten=(800, 1200, 1536)),
]


def laden(name):
    pfad = os.path.join(QUELLE, name + '.jpg')
    im = ImageOps.exif_transpose(Image.open(pfad))
    return im.convert('RGB')


def lauf(maske):
    """Längster zusammenhängender Lauf von True, als (anfang, ende) mit ende exklusiv."""
    beste, start = (0, 0), None
    for i, m in enumerate(list(maske) + [False]):
        if m and start is None:
            start = i
        elif not m and start is not None:
            if i - start > beste[1] - beste[0]:
                beste = (start, i)
            start = None
    return beste


def papier_finden(im, einzug=12):
    """Das Blatt liegt auf dunklem Grund. Eine Spalte gehört zum Papier, wenn wenigstens ein
    Zehntel von ihr hell ist. Der Mittelwert täte es nicht: Wo die Figur dicht getuscht ist,
    drückt sie ihn so weit, dass das Blatt in zwei Hälften zerfiele."""
    g = np.asarray(im.convert('L'), dtype=np.float32)
    x0, x1 = lauf(np.percentile(g, 90, axis=0) > 150)
    y0, y1 = lauf(np.percentile(g[:, x0:x1], 90, axis=1) > 150)
    # Kaum ein Blatt liegt ganz gerade. In zwölf waagerechten Streifen wird die Kante je für
    # sich gesucht; es gilt die innerste, sonst bliebe oben rechts ein Keil vom dunklen Grund.
    for streifen in np.array_split(g[y0:y1], 12):
        hell = np.nonzero(np.percentile(streifen, 90, axis=0) > 150)[0]
        if hell.size:
            x0, x1 = max(x0, hell[0]), min(x1, hell[-1] + 1)
    # Der Übergang zum Grund ist ein paar Pixel breit und ein wenig beschattet.
    ein_y0 = einzug if y0 > 0 else 0
    ein_y1 = einzug if y1 < g.shape[0] else 0
    return (x0 + einzug, y0 + ein_y0, x1 - einzug, y1 - ein_y1)


def inhalt_finden(im, hell, rand):
    """Umriss des Motivs: helle Pixel auf dunklem Grund (hell=True) oder umgekehrt, mit Rand
    als Anteil der größeren Seite. Einzelne Staubkörner zählen nicht."""
    g = np.asarray(im.convert('L'), dtype=np.float32)
    m = g > 128 if hell else g < 128
    spalten = np.where(m.mean(axis=0) > 0.004)[0]
    zeilen = np.where(m.mean(axis=1) > 0.004)[0]
    x0, x1, y0, y1 = spalten[0], spalten[-1] + 1, zeilen[0], zeilen[-1] + 1
    r = int(round(max(x1 - x0, y1 - y0) * rand))
    return (max(0, x0 - r), max(0, y0 - r), min(im.width, x1 + r), min(im.height, y1 + r))


def papier_weiss(im):
    """Zieht den Papierton auf Weiß. Das Licht fällt selten gleichmäßig; ein einziger
    Weißpunkt ließe eine Ecke grau, und multiply machte daraus ein sichtbares Rechteck.
    Deshalb wird je Farbkanal eine flache Fläche zweiten Grades durch die Papierpixel gelegt
    und das Bild durch sie geteilt. Tusche und Farbe zählen dabei nicht mit."""
    a = np.asarray(im, dtype=np.float32) / 255.0
    h, w, _ = a.shape
    hell = a.mean(axis=2)
    satt = a.max(axis=2) - a.min(axis=2)
    ton = np.median(hell[hell > np.percentile(hell, 40)])
    papier = (hell > ton * 0.93) & (satt < 0.08)
    ys, xs = np.nonzero(papier[::6, ::6])
    ys, xs = ys * 6, xs * 6
    u, v = xs / w - 0.5, ys / h - 0.5
    A = np.stack([np.ones_like(u), u, v, u * u, u * v, v * v], axis=1)
    gy, gx = np.mgrid[0:h, 0:w].astype(np.float32)
    gu, gv = gx / w - 0.5, gy / h - 0.5
    raster = np.stack([np.ones_like(gu), gu, gv, gu * gu, gu * gv, gv * gv], axis=2)
    aus = np.empty_like(a)
    for k in range(3):
        koeff, *_ = np.linalg.lstsq(A, a[ys, xs, k], rcond=None)
        flaeche = np.clip(raster @ koeff, 0.3, 1.0)
        aus[..., k] = a[..., k] / flaeche
    # Schwarzpunkt knapp über null, Weißpunkt knapp unter dem Papier: Die Faser des Papiers
    # verschwindet, die blassesten Lasuren bleiben.
    aus = np.clip((aus - 0.02) / (0.955 - 0.02), 0.0, 1.0)
    return Image.fromarray((aus * 255.0 + 0.5).astype(np.uint8))


def bearbeiten(e):
    im = laden(e['name'])
    z = e.get('zuschnitt')
    if z == 'papier':
        im = im.crop(papier_finden(im))
    elif z == 'motiv':
        im = im.crop(inhalt_finden(im, True, e.get('rand', 0.04)))
    elif z == 'dunkel':
        im = im.crop(inhalt_finden(im, False, e.get('rand', 0.04)))
    elif z:
        im = im.crop(z)
    if e['art'] == 'papier':
        im = papier_weiss(im)
    return im


def schreiben(e, im):
    name = e['name']
    for alt in os.listdir(ZIEL):
        if alt.startswith(name + '-') and alt[len(name) + 1:].split('.')[0].isdigit():
            os.remove(os.path.join(ZIEL, alt))
    # Keine Breite über dem Original; das Original selbst ist die größte.
    breiten = sorted({min(b, im.width) for b in e['breiten']})
    groessen, hoehe = {}, im.height
    for b in breiten:
        hoehe = round(im.height * b / im.width)
        klein = im if b == im.width else im.resize((b, hoehe), Image.LANCZOS)
        pfad = os.path.join(ZIEL, f'{name}-{b}.webp')
        klein.save(pfad, 'WEBP', quality=QUALITAET[e['art']], method=6)
        groessen[b] = os.path.getsize(pfad)
    return breiten, groessen, hoehe


def manifest_schreiben(eintraege):
    zeilen = ',\n'.join(
        f"  '{n}': {{ w: {d['w']}, h: {d['h']}, breiten: [{', '.join(map(str, d['breiten']))}] }}"
        for n, d in eintraege.items())
    text = (
        "/* Erzeugt von scripts/bilder.py. Nicht von Hand ändern: Das Skript liest die Originale\n"
        "   aus assets/original/ und schreibt die Bilder nach assets/img/<name>-<breite>.webp.\n"
        "   w und h sind die Pixelmaße der größten Fassung. LUKE.bild() in js/works.js macht\n"
        "   daraus src und srcset. */\n"
        "window.LUKE = window.LUKE || {};\n"
        f"LUKE.BILDER = {{\n{zeilen}\n}};\n")
    with open(MANIFEST, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)


def manifest_lesen():
    """Beim Teillauf bleiben die übrigen Einträge, wie sie sind."""
    if not os.path.exists(MANIFEST):
        return {}
    import re
    d = {}
    for m in re.finditer(r"'([^']+)': \{ w: (\d+), h: (\d+), breiten: \[([\d, ]+)\] \}", open(MANIFEST, encoding='utf-8').read()):
        d[m.group(1)] = dict(w=int(m.group(2)), h=int(m.group(3)), breiten=[int(x) for x in m.group(4).split(',')])
    return d


def main():
    filter_wort = sys.argv[1] if len(sys.argv) > 1 else ''
    os.makedirs(ZIEL, exist_ok=True)
    bekannt = {e['name'] for e in BILDER}
    manifest = {n: d for n, d in manifest_lesen().items() if n in bekannt} if filter_wort else {}
    summe = 0
    for e in BILDER:
        if filter_wort and filter_wort not in e['name']:
            continue
        im = bearbeiten(e)
        breiten, groessen, hoehe = schreiben(e, im)
        manifest[e['name']] = dict(w=breiten[-1], h=hoehe, breiten=breiten)
        summe += sum(groessen.values())
        print(f"{e['name']:<40} {im.width:>5} × {im.height:<5} "
              + ' '.join(f'{b}:{groessen[b] // 1024}k' for b in breiten))
    # Reihenfolge wie in BILDER, damit der Unterschied im Manifest lesbar bleibt.
    reihe = {e['name']: i for i, e in enumerate(BILDER)}
    manifest = dict(sorted(manifest.items(), key=lambda kv: reihe.get(kv[0], 999)))
    manifest_schreiben(manifest)
    print(f'zusammen {summe // 1024} kB, Manifest: {os.path.relpath(MANIFEST, WURZEL)}')


if __name__ == '__main__':
    main()
