# Luke WTF — Werkschau

Werkschau für Luke WTF, Zeichner in Köln-Ehrenfeld: Arbeiten auf Papier und Grafik. Die Seite zeigt das Werk;
was zum Tätowieren gehörte (Anfrage, Ablauf, Flash, Arbeiten auf Haut, das Team des Studios), ist raus.
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
index.html            Startseite (Auftakt, Blattfolge, Aktuell, Werke, Handschrift, Grafik, Atelier)
impressum.html        Impressum (Platzhalter, vor Veröffentlichung ausfüllen)
datenschutz.html      Datenschutzerklärung (Platzhalter, vor Veröffentlichung prüfen)
css/site.css          Alle Stile, drei Richtungen über .app[data-richtung]
js/works.js           Werkdaten, Grafik, Filterlisten, Konfiguration
js/bilder.js          Maße und Breiten jedes Bildes, erzeugt von scripts/bilder.py (nicht von Hand ändern)
js/site.js            Seitenlogik: Hängung der Werke, Plakatwand, Werkansicht, Übergänge
js/bewegung.js        Grundlage aller Bewegung: Motion, Stärke, Tempo je Richtung, Enthüllen, Parallaxe, Zeiger
js/auftakt.js         Der Auftakt: ein Blatt in der Ecke der Seite, Zeichenvideo, Schnitt, Standbild
js/blattfolge.js      Die Blattfolge: ein Blatt nach dem anderen; das Scrollen wählt, die Zeit wechselt
js/abschnitte.js      Kleine Bewegungen je Abschnitt: Aktuell, Handschrift, Atelier
js/tropfspur.js       Die Tropfspur aus PR #2: Canvas mit multiply, läuft dem Lesen nach und nie zurück, staut, spritzt, trocknet vor dem Atelier
js/weltzustand.js     Der Weltzustand — eine Schleife, ein Zustand; auf der Werkschau liest ihn die Tropfspur (Tabelle LUKE.ABSCHNITTE in index.html)
vendor/motion/        Motion 13.2.0, lokal gehostet (siehe HERKUNFT.md)
scripts/pruefen.mjs   Prüft die Seite mit Playwright: Zusicherungen, leere Konsole, Bilder je Abschnitt
scripts/bilder.py     Leitet alle Bilder aus assets/original/ ab: Zuschnitt, Papier auf Weiß, WebP je Breite
skizze.html           Entwurf: ein Weltzustand fährt fliegende Blätter, Sprite und Tränen
js/skizze.js          Die drei Systeme der Skizze
css/skizze.css        Stile nur für die Skizze
docs/                 Der Claude-Design-Prompt zu diesem Entwurf
vendor/htmx/          htmx 4.0.0 und hx-live, lokal (nur für die Anzeige der Skizze)
assets/fonts/         Alegreya, Alegreya Sans, Big Shoulders als woff2 (latin, latin-ext) plus fonts.css
assets/img/           Abgeleitete Bilder als <name>-<breite>.webp, dazu Poster, Sprite, Favicon, og-bild.jpg
assets/original/      Jede Aufnahme, wie sie kam, mit sprechendem Namen (wird nicht ausgeliefert, siehe LIESMICH.md)
assets/video/         Zeichenanimationen (H.264, ohne Ton)
NOTES.md              Offene Punkte aus dem Prototyp
video/                Der Film zur Werkschau, gebaut mit Remotion (eigene README)
.claude/skills/       Skills: werkschau-video und remotion-motion-graphics
scripts/make-gifs.sh  Erzeugt GIF-Fassungen der Zeichenanimationen
```

## Bilder und Videos austauschen

Jedes Bild beginnt als Original unter `assets/original/`, so wie Luke es geschickt hat, nur mit
sprechendem Namen (die Zuordnung zu den Dateinamen vom Telefon steht in `assets/original/LIESMICH.md`).
`scripts/bilder.py` leitet daraus ab, was ausgeliefert wird:

```
python scripts/bilder.py            # alles neu (braucht Pillow mit WebP und numpy)
python scripts/bilder.py befreiung  # nur Bilder, deren Name das Wort enthält
```

Das Skript schneidet zu, zieht bei Papierarbeiten den Papierton auf Weiß, rechnet jedes Bild in zwei bis vier
Breiten und schreibt `assets/img/<name>-<breite>.webp`. Dazu `js/bilder.js` mit Maßen und Breiten; die Seite
baut `srcset` daraus. In `js/works.js` stehen Bilder darum nur beim Namen. Ein neues Bild: Original ablegen,
in `BILDER` im Skript eintragen, Skript laufen lassen, Namen in `js/works.js` verwenden.

Werke stehen in `js/works.js` unter `LUKE.WERKE`. Ein Werk nennt seine Bilder in `bilder`, in der Reihenfolge
der Hängung; ohne Bild wird es übergangen. Besteht es aus mehreren Blättern — wie „Befreiung der
Körperlichkeit“, Werk I und Werk II, je drei —, stehen die Blätter in der Galerie nebeneinander und gleich
hoch, die Werkansicht blättert Blatt für Blatt, und die Blattfolge zieht jedes einzeln vorbei. Erzeugte
Tuschzeichnungen als Platzhalter gibt es nicht mehr. Auf der Seite steht nur, was es gibt.

Die Seite richtet sich nach den Daten. Ein Filter nach Serie oder Jahr erscheint nur, wenn es darin mehr als eine
Möglichkeit gibt (heute: eine Serie, ein Jahr, also keiner). Ist `LUKE.GRAFIK` leer, verschwindet der Abschnitt
„Grafik" samt Eintrag in der Navigation; gibt es keine hellen Blätter, entfällt die Blattfolge. Nichts davon muss von
Hand geschaltet werden — Einträge ergänzen genügt.

Nicht jedes Blatt auf der Seite ist ein Werk. Drei tragen die Gestaltung, ohne im Verzeichnis zu stehen:
das Profil mit dem roten Strang (Auftaktvideo, Sprite), das Auge mit der Signatur (Abschnitt „Handschrift“) und
die kniende Figur (Kopf der Seite). Luke hat sie als „Beiwerk“ geschickt. Sie liegen unter `LUKE.GESTALTUNG`
und heißen `gestaltung-*`, damit die Rolle am Dateinamen ablesbar ist. Wer eines davon ausstellen will,
verschiebt den Eintrag nach `LUKE.WERKE` und gibt ihm eine Nummer.

Beispiel für einen Werkeintrag:

```js
{ id: 'w5', nr: 'V', t: 'Befreiung der Körperlichkeit, Werk III', serie: 'Befreiung der Körperlichkeit', jahr: 2026,
  technik: 'Tusche auf Papier', masse: 'Maße folgen',
  bilder: ['werk-befreiung-3-bild-1', 'werk-befreiung-3-bild-2', 'werk-befreiung-3-bild-3'] }
```

### Aufnahmen von Papierarbeiten

Ein Blatt mit `tr: 'papier'` wird mit `mix-blend-mode: multiply` auf die Seite gelegt: Das Papier verschwindet,
die Zeichnung steht frei auf Weiß. Damit das aufgeht, muss die Aufnahme zugeschnitten und der Papierton überall auf
reines Weiß gezogen sein, auch in den Ecken, wo das Licht schwächer war. `scripts/bilder.py` (`art='papier'`) sucht
dafür die Kante des Blatts auf dem dunklen Grund, in zwölf Streifen, damit ein schräg liegendes Blatt keinen Keil
vom Grund behält; legt je Farbkanal eine flache Fläche durch die Papierpixel und teilt das Bild dadurch; und setzt
Schwarz- und Weißpunkt knapp innerhalb. Wo die Kante zu blass ist („Ansichten“: cremefarbenes Papier auf
hellgrauem Grund), steht ein fester Ausschnitt im Skript.

Eine Aufnahme, die ihren dunklen Hintergrund behalten soll, bekommt stattdessen `grund: 'foto'`. Sie wird dann
nicht multipliziert und bleibt aus der Blattfolge heraus. Beispiel: „Neuordnung des Speichers“, die zwölf Blätter
auf schwarzem Holz.

### Grafik

Plakate, Flyer, Cover und Signets stehen getrennt in `LUKE.GRAFIK`, elf Arbeiten. Sie sind keine Werke im Sinne
der Galerie: Sie haben einen Auftraggeber und einen Anlass statt Serie und Maße, und sie behalten immer ihren
Grund. Gehängt werden sie wie an einer Plakatwand, in bündigen Reihen gleicher Höhe.

```js
{ id: 'gr2', t: 'Noir', art: 'Flyer für die Clubnacht', fuer: 'Kollektiv Noir', jahr: 2026,
  notiz: '19. September 2026, 23 Uhr, MTC', bild: 'grafik-flyer-noir-2026-09-19' }
```

`fuer`, `jahr` und `notiz` dürfen fehlen, dann entfallen die Zeilen. Ein Jahr steht nur, wo es sich belegen lässt
(auf Plakaten und Flyern steht das Datum); bei Signets und Covern steht keins. Jede Karte behält ihr eigenes Format, ein Plakat wird
also nicht auf quadratisch gestutzt. Die Werkansicht ist dieselbe wie bei den Werken; geblättert wird innerhalb der
Grafiken, nicht quer durch beides.

- Der Auftakt zeigt ein Blatt in der Ecke der Seite: oben an der Leiste, rechts an der Kante, auf jeder Breite
  (`js/auftakt.js`, `css/site.css`: `.hero-fig`). Zu sehen ist `assets/video/gestaltung-profil-zeichnung.webm`
  (Safari: `.mp4`), einmal abgespielt; stehen bleibt danach `gestaltung-kniend-*.webp`. Das sind zwei verschiedene
  Blätter, und so soll es auch gelesen werden: Eine Arbeit entsteht, eine andere steht. Dazwischen liegt eine knappe
  Leerstelle, damit der Übergang als Schnitt liest und nicht als Verwandlung. Die grauen Tiefenebenen einer früheren
  Fassung sind raus: Ihre Hüllen waren eigene Stapelkontexte, `multiply` griff darin nicht, und über dem Video lag eine
  blasse Kopie der Zeichnung samt Kante. Das Blatt folgt auch dem Zeiger nicht mehr — die Tropfspur hängt am Strang.
  `gestaltung-profil-zeichnung-alt.mp4` ist die frühere, längere Fassung der Animation (August), derzeit nicht eingebunden.
- Das Blatt im Kopf hat links ein breites leeres Drittel. Standbild und Live-Auftakt schneiden es rechtsbündig weg
  (`object-fit: cover`, `object-position: 100% 50%`); die Datei selbst bleibt unbeschnitten. Die Breite des Kastens
  folgt aus seiner Höhe (78 vh, auf dem Telefon 52 vh), darum rechnet `sizes` in vh.
- Was nicht gleich gebraucht wird, lädt später: Das Signaturvideo der Handschrift erst, wenn der Abschnitt ein Fenster
  weit heranrückt; die Blätter 2 bis 7 der Blattfolge erst, wenn der Leser sich ihnen nähert. Beim Start lädt so gut
  ein Megabyte weniger (Telefon: gut zwei), und das Auftaktvideo hat die Leitung für sich.
- Vorschaubild für soziale Netzwerke: `assets/img/og-bild.jpg`, 1200 × 630, dieselbe Zeichnung auf Weiß.
- Sprite für die Skizze: `assets/img/zeichnung-sprite.webp`, 48 Bilder der Zeichenanimation, 8 × 6 Kacheln zu
  160 × 260, 283 kB. Neu bauen mit ffmpeg:
  `ffmpeg -i assets/video/gestaltung-profil-zeichnung.mp4 -vf "fps=48/6.04,scale=160:-2" -frames:v 48 f-%03d.png`
  und danach `ffmpeg -framerate 8 -i f-%03d.png -frames:v 48 -filter_complex "tile=8x6:color=white,format=rgb24" -c:v libwebp -quality 68 …`
- Handschrift: `assets/video/gestaltung-signatur.mp4` startet beim Scrollen und bleibt auf dem letzten Bild (Signatur) stehen.
- Atelier: `assets/img/luke-atelier-*.webp`.

## Konfiguration (`js/works.js`, `LUKE.CONFIG`)

- `instagram`, `handle`: der Kontaktweg; die Seite hat kein Formular.
- `ausstellung.bis`: Datum, ab dem der Streifen „Aktuell“ automatisch verschwindet.

## Richtungen und Bedienfeld

Der Prototyp hatte drei Gestaltungsrichtungen. Alle drei sind enthalten, Standard ist A (Werkverzeichnis).

- Bedienfeld einblenden: `Shift + B` oder `index.html?proto`
- Richtung direkt aufrufen: `index.html?richtung=b` (oder `c`)
- Weiterer URL-Parameter: `bewegung=aus|dezent|voll`

Die Umschaltung des Galerie-Layouts (Mauerwerk, Bündig, Schiene) ist raus: Seit ein Werk aus mehreren
Blättern bestehen kann, richtet sich die Hängung nach den Werken selbst.

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
