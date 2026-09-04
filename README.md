# Luke WTF — Werkschau

Website für Luke WTF, Tätowierer und Zeichner bei Bluthandwerk, Köln-Ehrenfeld.
Portiert aus dem Claude-Design-Prototyp „Werkschau für Luke WTF Köln“ als statische Seite ohne Build-Schritt.

## Lokal ansehen

Die Seite braucht einen kleinen Webserver (wegen der Modul-Ladung von three.js), zum Beispiel:

```
npx serve .
# oder
python3 -m http.server 8080
```

Dann `http://localhost:3000` beziehungsweise `http://localhost:8080` öffnen.

## Aufbau

```
index.html            Startseite (Auftakt, Sequenz, Aktuell, Werke, Handschrift, Flash, Anfrage, Studio)
impressum.html        Impressum (Platzhalter, vor Veröffentlichung ausfüllen)
datenschutz.html      Datenschutzerklärung (Platzhalter, vor Veröffentlichung prüfen)
css/site.css          Alle Stile, drei Richtungen über .app[data-richtung]
js/works.js           Werkdaten, Flash-Blätter, Filterlisten, Konfiguration
js/site.js            Seitenlogik: Galerie, Filter, Werkansicht, Formular, Übergänge
js/werk-sequenz.js    <werk-sequenz>, scrollgetriebene 3D-Sequenz (three.js)
js/motion.js          Sanftes Scrollen, Parallaxe, Hintergrundbühne (three.js)
js/tropfspur.js       Die rote Spur, die aus Werk I austritt und mit dem Lesen mitläuft
vendor/               three.js 0.161.0, lokal gehostet
assets/fonts/         Alegreya, Alegreya Sans, Big Shoulders als woff2 (latin, latin-ext) plus fonts.css
assets/img/           Werkbilder, Atelierfoto, Poster, Favicon
assets/original/      Die Aufnahmen der Papierarbeiten, unbearbeitet (wird nicht ausgeliefert)
assets/video/         Zeichenanimationen (H.264, ohne Ton)
NOTES.md              Offene Punkte aus dem Prototyp
video/                Der Film zur Werkschau, gebaut mit Remotion (eigene README)
.claude/skills/       Skills: werkschau-video und remotion-motion-graphics
scripts/make-gifs.sh  Erzeugt GIF-Fassungen der Zeichenanimationen
```

## Bilder und Videos austauschen

Werke stehen in `js/works.js` unter `LUKE.WERKE`. Ein Eintrag mit `src`, `w`, `h` zeigt ein echtes Bild,
ohne `src` wird eine generierte Tuschzeichnung als Platzhalter angezeigt. Beispiel:

```js
{ id: 'w8', nr: 'VIII', t: 'Schwarzdorn', tr: 'haut', ort: 'Unterarm', ortKey: 'Arm', motiv: 'Botanik', jahr: 2025,
  sitzungen: 2, zustand: 'abgeheilt',
  src: 'assets/img/werk-8-schwarzdorn-1200.jpg',
  srcset: 'assets/img/werk-8-schwarzdorn-800.jpg 800w, assets/img/werk-8-schwarzdorn-1200.jpg 1200w',
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
nicht multipliziert und bleibt aus der Blättersequenz heraus. Beispiel: Werk VII, die zwölf Köpfe auf schwarzem Holz.

- Auftakt: `assets/video/werk-1-profil-zeichnung.mp4` wird einmal abgespielt und blendet dann auf `werk-1-profil-*.jpg` über.
  `werk-1-profil-zeichnung-alt.mp4` ist die frühere Fassung der Animation (August), derzeit nicht eingebunden.
- Handschrift: `assets/video/werk-2-auge-signatur.mp4` startet beim Scrollen und bleibt auf dem letzten Bild (Signatur) stehen.
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

## Bewegtbild

Unter `video/` liegt der Film zur Werkschau: dieselben Farben, Schriften und Arbeiten,
gebaut mit Remotion, in 16:9 für die Schleife im Studio und in 9:16 für Story und Reel.
Wie er gebaut und gerendert wird, steht in `video/README.md`.

## Veröffentlichen

Es ist eine reine statische Seite. Das Repository kann direkt auf GitHub Pages, Netlify, Vercel oder einem
beliebigen Webspace liegen; es gibt nichts zu bauen.
