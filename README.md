# Luke WTF — Werkschau

Website für Luke WTF, Tätowierer und Zeichner bei Bluthandwerk, Köln-Ehrenfeld.
Portiert aus dem Claude-Design-Prototyp „Werkschau für Luke WTF Köln“ als statische Seite ohne Build-Schritt.

## Lokal ansehen

Die Seite braucht einen kleinen Webserver (die Videos brauchen Range-Anfragen, und `file://` kennt keine), zum Beispiel:

```
npx serve .
# oder
python3 -m http.server 8080
```

Dann `http://localhost:3000` beziehungsweise `http://localhost:8080` öffnen.

## Aufbau

```
index.html            Startseite (Auftakt, Sequenz, Aktuell, Werke, Handschrift, Flash, Grafik, Anfrage, Studio)
impressum.html        Impressum (Platzhalter, vor Veröffentlichung ausfüllen)
datenschutz.html      Datenschutzerklärung (Platzhalter, vor Veröffentlichung prüfen)
css/site.css          Alle Stile, drei Richtungen über .app[data-richtung]
js/works.js           Werkdaten, Flash-Blätter, Filterlisten, Konfiguration
js/site.js            Seitenlogik: Galerie, Filter, Werkansicht, Formular, Übergänge
js/bewegung.js        Grundlage aller Bewegung: Motion, Stärke, Tempo je Richtung, Enthüllen, Parallaxe, Zeiger
js/auftakt.js         Der Auftakt: ein Blatt in der Ecke der Seite, Zeichenvideo, Schnitt, Standbild
js/blattfolge.js      Die Blattfolge: ein Blatt nach dem anderen; das Scrollen wählt, die Zeit wechselt
js/abschnitte.js      Kleine Bewegungen je Abschnitt: Aktuell, Handschrift, Studio
js/tropfspur.js       Die Tropfspur: Blut, kein Faden — hängt am Strang, bleibt stehen, wo sie lief, staut, wo man verweilt
vendor/motion/        Motion 13.2.0, lokal gehostet (siehe HERKUNFT.md)
scripts/pruefen.mjs   Prüft die Seite mit Playwright: Zusicherungen, leere Konsole, Bilder je Abschnitt
skizze.html           Entwurf: ein Weltzustand fährt fliegende Blätter, Sprite und Tränen
js/weltzustand.js     Der Weltzustand — eine Schleife, ein Zustand, alle lesen daraus
js/skizze.js          Die drei Systeme der Skizze
css/skizze.css        Stile nur für die Skizze
docs/                 Der Claude-Design-Prompt zu diesem Entwurf
vendor/htmx/          htmx 4.0.0 und hx-live, lokal (nur für die Anzeige der Skizze)
assets/fonts/         Alegreya, Alegreya Sans, Big Shoulders als woff2 (latin, latin-ext) plus fonts.css
assets/img/           Werkbilder, Atelierfoto, Poster, Favicon
assets/original/      Jede Aufnahme, wie sie kam, unbearbeitet (wird nicht ausgeliefert)
assets/video/         Zeichenanimationen (H.264, ohne Ton)
NOTES.md              Offene Punkte aus dem Prototyp
video/                Der Film zur Werkschau, gebaut mit Remotion (eigene README)
.claude/skills/       Skills: werkschau-video und remotion-motion-graphics
scripts/make-gifs.sh  Erzeugt GIF-Fassungen der Zeichenanimationen
```

## Bilder und Videos austauschen

Werke stehen in `js/works.js` unter `LUKE.WERKE`. Ein Eintrag braucht `src`, `w` und `h`; ohne `src` wird er
übergangen. Erzeugte Tuschzeichnungen als Platzhalter gibt es nicht mehr — auch nicht im Hintergrund, auch nicht
in der Sequenz. Auf der Seite steht nur, was es gibt.

Die Seite richtet sich nach den Daten. Gibt es nur einen Träger, verschwinden die Reiter „Haut / Papier / Alles"
und der Abschnitt bekommt stattdessen eine gewöhnliche Überschrift. Ein Filter erscheint nur, wenn es darin mehr als
eine Möglichkeit gibt. Ist `LUKE.FLASH` leer, verschwindet der Abschnitt „Flash" samt Eintrag in der Navigation. Ein
Kapitel der 3D-Sequenz erscheint nur, wenn es dafür Aufnahmen gibt; bleibt keines übrig, entfällt der ganze
Abschnitt. Nichts davon muss von Hand geschaltet werden — Einträge ergänzen genügt.

Nicht jedes Blatt auf der Seite ist ein Werk. Drei tragen die Gestaltung, ohne im Verzeichnis zu stehen:
das Profil mit dem roten Strang (Auftaktvideo, Tiefenebenen, Sprite), das Auge mit der Signatur (Abschnitt
„Handschrift“) und die kniende Figur (Kopf der Seite). Sie liegen unter `LUKE.GESTALTUNG` und heißen
`assets/img/gestaltung-*`, damit die Rolle am Dateinamen ablesbar ist. Wer eines davon ausstellen will,
verschiebt den Eintrag nach `LUKE.WERKE` und gibt ihm eine Nummer.

Beispiel für einen Werkeintrag:

```js
{ id: 'w7', nr: 'VII', t: 'Schwarzdorn', tr: 'haut', ort: 'Unterarm', ortKey: 'Arm', motiv: 'Botanik', jahr: 2025,
  sitzungen: 2, zustand: 'abgeheilt',
  src: 'assets/img/werk-7-schwarzdorn-1200.jpg',
  srcset: 'assets/img/werk-7-schwarzdorn-800.jpg 800w, assets/img/werk-7-schwarzdorn-1200.jpg 1200w',
  w: 1200, h: 1500 }
```

Empfohlene Größen: 800, 1200 und Originalbreite als JPG, Seitenverhältnis frei (die Galerie richtet sich danach).
Flash-Blätter (`LUKE.FLASH`) nehmen ebenfalls ein `src`.

### Aufnahmen von Papierarbeiten vorbereiten

Ein Blatt mit `tr: 'papier'` wird mit `mix-blend-mode: multiply` auf die Seite gelegt: Das Papier verschwindet,
die Zeichnung steht frei auf Weiß. Damit das aufgeht, muss die Aufnahme zugeschnitten und der Papierton auf
reines Weiß gezogen sein. Für die Blätter III bis VI lief dafür (mit ffmpeg):

```
crop=<Papierbreite>:<Höhe>:<x>:0,
colorlevels=rimin=0.02:gimin=0.02:bimin=0.02:rimax=<R>:gimax=<G>:bimax=<B>,
scale=<Breite>:<Höhe>:flags=lanczos,setsar=1
```

`R`, `G`, `B` sind der gemessene Papierton geteilt durch 255 (hier rund 0,92). `setsar=1` und `-map_metadata -1`
sind wichtig: Ohne sie schreibt ffmpeg eine Pixelseitenverhältnis-Korrektur in den JFIF-Kopf.

Eine Aufnahme, die ihren dunklen Hintergrund behalten soll, bekommt stattdessen `grund: 'foto'`. Sie wird dann
nicht multipliziert und bleibt aus der Blättersequenz heraus. Beispiel: Werk VI, die zwölf Köpfe auf schwarzem Holz.

### Grafik

Plakate, Cover und Signets stehen getrennt in `LUKE.GRAFIK`. Sie sind keine Werke im Sinne der Galerie: Sie haben
einen Auftraggeber und einen Anlass statt Träger, Serie und Maße, und sie behalten immer ihren dunklen Grund.

```js
{ id: 'gr2', t: 'nebelgrau', art: 'Plakat', fuer: 'Kollektiv Noir und Tränentrinker', jahr: 2026,
  notiz: '21. Februar 2026, 23 Uhr, Live Music Hall, Köln',
  src: 'assets/img/grafik-2-nebelgrau-900.jpg',
  srcset: 'assets/img/grafik-2-nebelgrau-480.jpg 480w, assets/img/grafik-2-nebelgrau-900.jpg 900w, assets/img/grafik-2-nebelgrau-1400.jpg 1400w',
  w: 1400, h: 1980 }
```

`fuer` und `notiz` dürfen fehlen, dann entfallen die Zeilen. Jede Karte behält ihr eigenes Format, ein Plakat wird
also nicht auf quadratisch gestutzt. Die Werkansicht ist dieselbe wie bei den Werken; geblättert wird innerhalb der
Grafiken, nicht quer durch beides.

- Der Auftakt zeigt ein Blatt in der Ecke der Seite: oben an der Leiste, rechts an der Kante, auf jeder Breite
  (`js/auftakt.js`, `css/site.css`: `.hero-fig`). Zu sehen ist `assets/video/gestaltung-profil-zeichnung.webm`
  (Safari: `.mp4`), einmal abgespielt; stehen bleibt danach `gestaltung-kniend-*.jpg`. Das sind zwei verschiedene
  Blätter, und so soll es auch gelesen werden: Eine Arbeit entsteht, eine andere steht. Dazwischen liegt eine knappe
  Leerstelle, damit der Übergang als Schnitt liest und nicht als Verwandlung. Die grauen Tiefenebenen einer früheren
  Fassung sind raus: Ihre Hüllen waren eigene Stapelkontexte, `multiply` griff darin nicht, und über dem Video lag eine
  blasse Kopie der Zeichnung samt Kante. Das Blatt folgt auch dem Zeiger nicht mehr — die Tropfspur hängt am Strang.
  `gestaltung-profil-zeichnung-alt.mp4` ist die frühere, längere Fassung der Animation (August), derzeit nicht eingebunden.
- Das Blatt im Kopf hat links ein breites leeres Drittel. Standbild und Live-Auftakt schneiden es rechtsbündig weg
  (`object-fit: cover`, `object-position: 100% 50%`); die Datei selbst bleibt unbeschnitten. Die Breite des Kastens
  folgt aus seiner Höhe (78 vh, auf dem Telefon 52 vh), darum rechnet `sizes` in vh.
- Was nicht gleich gebraucht wird, lädt später: Das Signaturvideo der Handschrift erst, wenn der Abschnitt ein Fenster
  weit heranrückt; die Blätter 2 bis 5 der Blattfolge erst, wenn der Leser sich ihnen nähert. Beim Start lädt so gut
  ein Megabyte weniger (Telefon: gut zwei), und das Auftaktvideo hat die Leitung für sich.
- Vorschaubild für soziale Netzwerke: `assets/img/og-bild.jpg`, 1200 × 630, dieselbe Zeichnung auf Weiß.
- Sprite für die Skizze: `assets/img/zeichnung-sprite.webp`, 48 Bilder der Zeichenanimation, 8 × 6 Kacheln zu
  160 × 260, 283 kB. Neu bauen mit ffmpeg:
  `ffmpeg -i assets/video/gestaltung-profil-zeichnung.mp4 -vf "fps=48/6.04,scale=160:-2" -frames:v 48 f-%03d.png`
  und danach `ffmpeg -framerate 8 -i f-%03d.png -frames:v 48 -filter_complex "tile=8x6:color=white,format=rgb24" -c:v libwebp -quality 68 …`
- Handschrift: `assets/video/gestaltung-signatur.mp4` startet beim Scrollen und bleibt auf dem letzten Bild (Signatur) stehen.
- Studio: `assets/img/luke-atelier-*.jpg`.

## Konfiguration (`js/works.js`, `LUKE.CONFIG`)

- `formEndpoint`: URL eines Formulardienstes (Formspree, Netlify Forms o. ä.). Dann wird das Formular per POST gesendet.
- `formEmail`: alternativ eine E-Mail-Adresse, das Formular öffnet das Mailprogramm mit vorausgefülltem Text.
- Beides leer: der Anfragetext wird zum Kopieren angezeigt, mit Link zur Instagram-DM.
- `ausstellung.bis`: Datum, ab dem der Streifen „Aktuell“ automatisch verschwindet.

## Richtungen und Bedienfeld

Der Prototyp hatte drei Gestaltungsrichtungen. Alle drei sind enthalten, Standard ist A (Werkverzeichnis).

- Bedienfeld einblenden: `Shift + B` oder `index.html?proto`
- Richtung direkt aufrufen: `index.html?richtung=b` (oder `c`)
- Weitere URL-Parameter: `layout=mauerwerk|buendig|schiene`, `bewegung=aus|dezent|voll`

Bei aktivierter Systemeinstellung „reduzierte Bewegung“ starten alle Animationen ausgeschaltet.

## Bewegung

Alles, was sich auf der Seite bewegt, ist mit [Motion](https://motion.dev) gebaut, das lokal unter
`vendor/motion/` liegt. `js/bewegung.js` ist die eine Stelle für Stärke, Tempo und Kurven je
Richtung; die Abschnitte fragen dort. Eintritte kommen beim Sichtbarwerden (`.rv`), scrollgebundene
Bewegung läuft über `ScrollTimeline`, wo der Browser sie kann. Bei „reduzierte Bewegung“ und mit
`?bewegung=aus` steht alles im Endzustand. Der Entwurf dazu:
`docs/superpowers/specs/2026-09-09-seite-mit-motion-design.md`, mit dem Nachtrag vom 10. September am Ende.

Zwei Dinge folgen nicht dem Scrollweg, sondern der Zeit: In der Blattfolge wählt das Scrollen das Blatt, gewechselt
wird aber erst, wenn das stehende Blatt seine Sekunde hatte (`MINDESTENS` in `js/blattfolge.js`) — mit dem Schwung
eines Wischens flogen vorher drei Blätter in einer Sekunde vorbei. Und die Tropfspur staut, wo der Leser verweilt:
Der Tropfen schwillt an, und wer weiterliest, lässt eine Verdickung zurück.

Prüfen, mit Playwright:

    NODE_PATH=/opt/node22/lib/node_modules node scripts/pruefen.mjs --bilder

Das lädt die Seite in Chromium, scrollt sie durch, prüft Zusicherungen, verlangt eine leere
Konsole und legt Bilder je Abschnitt (1440 und 390 Pixel breit) unter `pruefung/` ab.

## Bewegtbild

Unter `video/` liegt der Film zur Werkschau: dieselben Farben, Schriften und Arbeiten,
gebaut mit Remotion, in 16:9 für die Schleife im Studio und in 9:16 für Story und Reel.
Wie er gebaut und gerendert wird, steht in `video/README.md`.

## Veröffentlichen

Es ist eine reine statische Seite. Das Repository kann direkt auf GitHub Pages, Netlify, Vercel oder einem
beliebigen Webspace liegen; es gibt nichts zu bauen.
