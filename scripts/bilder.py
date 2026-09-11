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
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageOps

WURZEL = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
QUELLE = os.path.join(WURZEL, 'assets', 'original')
ZIEL = os.path.join(WURZEL, 'assets', 'img')
MANIFEST = os.path.join(WURZEL, 'js', 'bilder.js')

# WebP statt JPEG: bei gleicher Anmutung rund 40 % kleiner, und jeder Browser, der die Seite
# sonst darstellen kann, liest es. AVIF wäre noch einmal kleiner, verschmiert bei dieser
# Qualität aber die feinen Federstriche. Tusche braucht etwas mehr als Fotos und Plakate.
QUALITAET = {'papier': 82, 'foto': 80, 'grafik': 80, 'fertig': 80, 'kacheln': 80}

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
    # Zwölf kleine Blätter, auf schwarzem Holz fotografiert. Das Holz fällt weg: Jedes Blatt
    # wird einzeln freigestellt und in ein gleichmäßiges Raster auf Weiß gesetzt, drei
    # Spalten, vier Reihen, wie sie lagen. Das Raster ist zugleich ein Bildbogen (Sprite):
    # Die Galerie zeigt jedes Blatt als Ausschnitt daraus und lässt sie die Plätze tauschen
    # (js/site.js, Neuordnung).
    dict(name='werk-neuordnung-des-speichers', art='kacheln', spalten=3, zeilen=4, breiten=(480, 800, 1200, 1440)),

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
    # Das letzte Bild der Zeichenanimation im Auftakt. Das Video bleibt darauf stehen; das
    # Standbild braucht es nur, wo das Video nicht läuft (ohne Bewegung, ohne Video).
    # Braucht ffmpeg.
    dict(name='gestaltung-profil-ende', art='fertig', video='gestaltung-profil-zeichnung.mp4', breiten=(432,)),

    dict(name='luke-atelier', art='fertig', breiten=(800, 1200, 1536)),
]


def laden(name):
    pfad = os.path.join(QUELLE, name + '.jpg')
    im = ImageOps.exif_transpose(Image.open(pfad))
    return im.convert('RGB')


def letztes_bild(video):
    """Das letzte Bild eines Videos aus assets/original/, über ffmpeg."""
    with tempfile.TemporaryDirectory() as tmp:
        ziel = os.path.join(tmp, 'ende.png')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-sseof', '-0.1', '-i', os.path.join(QUELLE, video),
                        '-frames:v', '1', ziel], check=True)
        return Image.open(ziel).convert('RGB')


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


def baender(p, mindest):
    """Zusammenhängende Läufe über einer Schwelle, als (anfang, ende)."""
    out, start = [], None
    for i, v in enumerate(list(p) + [0]):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if i - start >= mindest:
                out.append((start, i))
            start = None
    return out


def kacheln(im, spalten, zeilen, zelle=(480, 460), einzug=10):
    """Stellt Blätter frei, die in einem Raster auf dunklem Grund liegen, und setzt sie in
    gleich große Zellen auf Weiß. Ein Blatt ist hell (Papier) oder rot (Farbe); das Holz ist
    beides nicht. Die Kante jedes Blatts wird aus seiner eigenen Zelle gelesen: eine Spalte
    gehört dazu, wenn gut ein Drittel von ihr Blatt ist — Tusche darin zählt dann nicht."""
    a = np.asarray(im, dtype=np.float32)
    lum = a.mean(axis=2)
    blatt = (lum > 70) | ((a[..., 0] > 80) & (a[..., 0] > a[..., 1] + 25))
    sp = baender(blatt.mean(axis=0) > 0.05, 40)
    ze = baender(blatt.mean(axis=1) > 0.05, 40)
    assert len(sp) == spalten and len(ze) == zeilen, (sp, ze)
    zb, zh = zelle
    bogen = Image.new('RGB', (zb * spalten, zh * zeilen), (255, 255, 255))
    for r, (y0, y1) in enumerate(ze):
        for c, (x0, x1) in enumerate(sp):
            m = blatt[y0:y1, x0:x1]
            xs = np.nonzero(m.mean(axis=0) > 0.35)[0]
            ys = np.nonzero(m.mean(axis=1) > 0.35)[0]
            kasten = (x0 + xs[0] + einzug, y0 + ys[0] + einzug, x0 + xs[-1] + 1 - einzug, y0 + ys[-1] + 1 - einzug)
            stueck = im.crop(kasten)
            # In die Zelle, mit Luft ringsum, ohne zu verzerren.
            f = min((zb - 44) / stueck.width, (zh - 44) / stueck.height)
            stueck = stueck.resize((round(stueck.width * f), round(stueck.height * f)), Image.LANCZOS)
            bogen.paste(stueck, (c * zb + (zb - stueck.width) // 2, r * zh + (zh - stueck.height) // 2))
    return bogen


def bearbeiten(e):
    if e['art'] == 'kacheln':
        return kacheln(laden(e['name']), e['spalten'], e['zeilen'])
    im = letztes_bild(e['video']) if e.get('video') else laden(e['name'])
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


# Die Handschrift: das Auge mit der Signatur, aus dem Video als Bildfolge. Ein Video, das
# beim Scrollen gespult wird, zeigt auf dem iPhone nichts (ohne Abspielen lädt es keine
# Bilder) und stockt auf schwächeren Geräten; einzelne Bilder auf einem Canvas laufen
# überall gleich. Die Folge endet mit offenem Auge (Bild 289 von 361), die fünf Bilder
# danach schließen es: Daraus wird das Blinzeln. Für das Auge, das dem Zeiger folgt, gibt
# es dazu das letzte Bild ohne Iris und die Iris allein; Mittelpunkt, Radius und die Öffnung
# zwischen den Lidern stehen hier, einmal, von Hand an der Zeichnung abgenommen.
SIGNATUR = dict(
    video='gestaltung-signatur.mp4', ziel='signatur',
    folge=36, bis=289, blinzeln=(301, 313, 325, 337, 349), qualitaet=72,
    # Die Folge noch einmal kleiner für die Kopfleiste: Dort steht die Zeichnung bis 315 Pixel
    # breit, doppelt so viele reichen für scharfe Bildschirme.
    kopf=640,
    # Die Signatur allein, als Name der Seite (Kopf und Kopfleiste). Die große Aufnahme
    # gestaltung-signatur.jpg hat keine; es gibt sie nur im Video, rund 300 × 75 Pixel groß.
    # Damit sie groß scharf steht, werden die Bilder gemittelt, in denen sie ruht (das nimmt
    # das Rauschen der Kompression), vierfach hochgerechnet und die Kanten wieder hart
    # gezogen: schwarze Tusche auf durchsichtigem Grund, die sich verhält wie eine Vektorgrafik.
    # Rechts ragen graue Schraffuren des Auges hinein; was dort nicht fast schwarz ist, fällt weg.
    handschrift=dict(kasten=(444, 171, 748, 251), mittel=range(240, 300, 4), faktor=4, schraffur_ab=696),
    auge=dict(x=863, y=139, r=37, oeffnung=[
        (806, 154), (820, 140), (835, 128), (850, 121), (870, 118), (892, 121), (912, 127), (930, 135),
        (946, 143), (958, 151), (944, 158), (925, 164), (905, 169), (885, 173), (865, 175), (845, 173),
        (828, 167), (815, 160)]),
)


def signatur_folge():
    """Schreibt assets/img/signatur/: folge-01 … folge-36 und dieselben klein als kopf-01 …
    kopf-36, blinzeln-1 … blinzeln-5, auge-leer, iris, handschrift. Gibt die Angaben fürs
    Manifest zurück."""
    from PIL import ImageDraw
    S = SIGNATUR
    ziel = os.path.join(ZIEL, S['ziel'])
    os.makedirs(ziel, exist_ok=True)
    for alt in os.listdir(ziel):
        os.remove(os.path.join(ziel, alt))
    summe = 0

    def ablegen(im, name):
        nonlocal summe
        pfad = os.path.join(ziel, name + '.webp')
        im.save(pfad, 'WEBP', quality=S['qualitaet'], method=6)
        summe += os.path.getsize(pfad)

    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(QUELLE, S['video']),
                        os.path.join(tmp, 'f%03d.png')], check=True)

        def bild(i):
            return Image.open(os.path.join(tmp, f'f{i:03d}.png')).convert('RGB')

        n, bis = S['folge'], S['bis']
        for k in range(n):
            im = bild(round(1 + k * (bis - 1) / (n - 1)))
            ablegen(im, f'folge-{k + 1:02d}')
            ablegen(im.resize((S['kopf'], round(im.height * S['kopf'] / im.width)), Image.LANCZOS), f'kopf-{k + 1:02d}')
        for k, i in enumerate(S['blinzeln']):
            ablegen(bild(i), f'blinzeln-{k + 1}')
        letztes = bild(bis)
        hs = S['handschrift']
        stapel = np.mean([np.asarray(bild(i).crop(hs['kasten']).convert('L'), dtype=np.float32) for i in hs['mittel']], axis=0)

    # Das offene Auge zerlegt: der Grund ohne Iris, und die Iris allein. Mit multiply
    # übereinander ergeben sie wieder das letzte Bild der Folge.
    w, h = letztes.size
    a = S['auge']
    yy, xx = np.mgrid[0:h, 0:w]
    abstand = np.hypot(xx - a['x'], yy - a['y'])
    maske = Image.new('L', (w, h), 0)
    ImageDraw.Draw(maske).polygon(a['oeffnung'], fill=255)
    oeffnung = np.asarray(maske) > 0
    # Der Grund: Wo die Iris in der Öffnung lag, steht der Augapfel, hell wie das Papier.
    grund = np.asarray(letztes, dtype=np.float32).copy()
    # Bis r + 2 deckt die Iris voll (siehe unten); genau so weit wird ausgefüllt. Wäre die
    # Fläche größer, bliebe in der Mitte ein heller Ring stehen, wäre sie kleiner, eine
    # dunkle Sichel, sobald die Iris wandert.
    grund[oeffnung & (abstand <= a['r'] + 2)] = (238, 233, 232)
    ablegen(Image.fromarray(grund.astype(np.uint8)), 'auge-leer')
    # Die Iris: ein Ausschnitt um den Mittelpunkt, zum Rand hin weich in Weiß ausgeblendet,
    # damit multiply außerhalb nichts tut.
    rand = 6
    x0, y0 = a['x'] - a['r'] - rand, a['y'] - a['r'] - rand
    seite = 2 * (a['r'] + rand)
    aus = np.asarray(letztes, dtype=np.float32)[y0:y0 + seite, x0:x0 + seite]
    d = abstand[y0:y0 + seite, x0:x0 + seite]
    alpha = np.clip((a['r'] + 4 - d) / 2, 0, 1)[..., None]
    ablegen(Image.fromarray((aus * alpha + 255 * (1 - alpha)).astype(np.uint8)), 'iris')
    # Die Handschrift: hochgerechnet, dann aus der Helligkeit die Deckkraft, steil, damit die
    # Kanten nach dem Hochrechnen wieder hart sind.
    k = hs['faktor']
    hoch = Image.fromarray(stapel.astype(np.uint8)).resize((stapel.shape[1] * k, stapel.shape[0] * k), Image.LANCZOS)
    lum = np.asarray(hoch, dtype=np.float32)
    deck = np.clip((150 - lum) / 70, 0, 1)
    ab = (hs['schraffur_ab'] - hs['kasten'][0]) * k
    deck[:, ab:] = np.where(lum[:, ab:] < 95, deck[:, ab:], 0)
    # Oben rechts liegen noch die Striche des Auges; die Signatur läuft dort unten aus.
    deck[:(212 - hs['kasten'][1]) * k, ab:] = 0
    # Ganz oben streift noch die lange Linie den Ausschnitt.
    deck[:16, :] = 0
    rgba = np.zeros(lum.shape + (4,), dtype=np.uint8)
    rgba[..., 3] = (deck * 255).astype(np.uint8)
    ys, xs = np.nonzero(deck > 0.05)
    rgba = rgba[max(0, ys.min() - 6):ys.max() + 7, max(0, xs.min() - 6):xs.max() + 7]
    pfad = os.path.join(ziel, 'handschrift.webp')
    Image.fromarray(rgba, 'RGBA').save(pfad, 'WEBP', quality=90, method=6)
    summe += os.path.getsize(pfad)
    hs_b, hs_h = rgba.shape[1], rgba.shape[0]
    print(f"{'signatur/ (Bildfolge)':<40} {w:>5} × {h:<5} {n} + {len(S['blinzeln'])} Bilder, zusammen {summe // 1024}k")
    return dict(w=w, h=h, pfad=f"assets/img/{S['ziel']}/", folge=n, kopf=S['kopf'], blinzeln=len(S['blinzeln']),
                handschrift=dict(w=hs_b, h=hs_h),
                auge=dict(x=a['x'], y=a['y'], r=a['r'], rand=rand, oeffnung=[list(q) for q in a['oeffnung']]))


def manifest_schreiben(eintraege, signatur=None):
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
    if signatur:
        text += ("/* Die Handschrift als Bildfolge (scripts/bilder.py, SIGNATUR); js/auge.js zeichnet\n"
                 "   sie in der Kopfleiste. */\n"
                 f"LUKE.SIGNATUR = {json.dumps(signatur, separators=(', ', ': '))};\n")
    with open(MANIFEST, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)


def manifest_lesen():
    """Beim Teillauf bleiben die übrigen Einträge, wie sie sind."""
    if not os.path.exists(MANIFEST):
        return {}, None
    import re
    d = {}
    text = open(MANIFEST, encoding='utf-8').read()
    for m in re.finditer(r"'([^']+)': \{ w: (\d+), h: (\d+), breiten: \[([\d, ]+)\] \}", text):
        d[m.group(1)] = dict(w=int(m.group(2)), h=int(m.group(3)), breiten=[int(x) for x in m.group(4).split(',')])
    m = re.search(r"LUKE\.SIGNATUR = (\{.*\});", text)
    return d, (json.loads(m.group(1)) if m else None)


def main():
    filter_wort = sys.argv[1] if len(sys.argv) > 1 else ''
    os.makedirs(ZIEL, exist_ok=True)
    bekannt = {e['name'] for e in BILDER}
    alt, signatur = manifest_lesen() if filter_wort else ({}, None)
    manifest = {n: d for n, d in alt.items() if n in bekannt}
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
    if not filter_wort or filter_wort in 'signatur':
        signatur = signatur_folge()
    manifest_schreiben(manifest, signatur)
    print(f'zusammen {summe // 1024} kB, Manifest: {os.path.relpath(MANIFEST, WURZEL)}')


if __name__ == '__main__':
    main()
