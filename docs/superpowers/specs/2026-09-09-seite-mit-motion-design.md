# Die Seite mit Motion — Entwurf

Stand: 9. September 2026. Branch `claude/page-redesign-motion-703drb`.
Gegenstand ist `index.html` mit allem, was sich darauf bewegt. `skizze.html`, die
Rechtsseiten und der Film unter `video/` bleiben unberührt.

Auftrag: eine neue, hochwertige und geschmackvolle Fassung der Seite, bei der **alle**
Bewegung mit [Motion](https://motion.dev) gebaut ist. Die Geschmacksprüfung aus
`.claude/skills/remotion-taste/SKILL.md` gilt für die Seite wie für den Film: keine
linearen Kurven bei zeitgesteuerter Bewegung, kein reines Aufblenden, nichts, was
gleichzeitig hereinkommt, keine Dauerbewegung ohne Ruhe, kein Leuchten, keine Verläufe.

## 1. Design Read

> Ich lese das als: Werkschau-Website für Galeriebesucher und Leute, die eine Anfrage
> stellen wollen, in der Tuschesprache der bestehenden Seite, mit Varianz 8, Bewegung 4,
> Dichte 2.

Bewegung 4 statt der 5 des Films: Auf einer Seite liest man, im Film sieht man zu. Alles,
was sich bewegt, muss aus dem Material kommen — Tusche, die entsteht; eine Linie, die
weiterläuft; ein Blatt, das aufliegt — und es muss aufhören, bevor gelesen wird.

## 2. Bestand

Was heute je Abschnitt läuft, und was daran schwach ist.

| Abschnitt | Heute | Schwäche |
| --- | --- | --- |
| Auftakt | Zeichenvideo läuft einmal, Schnitt auf das Standbild. Dazu nachgeladen ein Remotion-Player (503 kB React) mit fünf Tiefenebenen, die dem Zeiger folgen und von allein driften. Titel nur mit Parallaxe. | Ein halbes Megabyte React für eine Parallaxe. Eigenbewegung ohne Anlass. Der Titel kommt ohne Eintritt. |
| Sequenz | three.js-Kamerafahrt durch schwebende Blätter mit Nebel, die dauernd schwanken; ein roter Faden als Linie. | Dauerbewegung ohne Ruhe. Blätter überlappen und wiederholen sich. Ein zweites Rot neben der Tropfspur. 675 kB three.js, WebGL-Warnungen in der Konsole. |
| Hintergrundbühne | Zwölf Blätter und 140 rote Punkte treiben hinter der ganzen Seite (`js/motion.js`). | Eine endlose Schleife, die nichts erzählt. Die Punkte sind ein drittes Rot. |
| Sanftes Scrollen | Das Mausrad wird abgefangen und geglättet. | Scroll-Hijacking, fühlt sich fremd an; Tastatur und Touch verhalten sich anders als das Rad. |
| Aktuell | Nur `.rv`-Einblenden. | Ein Streifen mit zwei Linien, der nichts mit den Linien macht. |
| Werke | `.rv`-Wischen je Blatt, FLIP beim Filtern, Waschung beim Trägerwechsel, Werkansicht mit FLIP. | Gute Ideen, mit WAAPI und CSS-Transitionen gebaut; das Wischen passt zu Text, nicht zu einem Blatt. |
| Handschrift | Das Signaturvideo folgt dem Scrollen. Text nur `.rv`. | Die Idee trägt; sie bleibt. |
| Flash | Leer, ausgeblendet. | — |
| Grafik | Nur `.rv`. | Plakate wischen wie Text herein. |
| Anfrage | Nur `.rv`, gestaffelt. | — |
| Studio | Nur `.rv`, Foto mit Parallaxe. | Die Linien der Teamliste stehen einfach da. |
| Tropfspur | Rote Spur ab dem Strang im Auftakt, folgt dem Lesen. | Gute Idee — aber sie läuft mitten durch den Text der Handschrift, über das Formular und über das Atelierfoto. |
| Fuß | Nichts. | Nichts, und das bleibt so. |

## 3. Entscheidungen

1. **Motion 13.2.0 ist die einzige Bewegungsbibliothek.** Sie liegt lokal unter
   `vendor/motion/` (UMD-Bündel, `window.Motion`, 140 kB, 47 kB gezippt) mit
   `HERKUNFT.md` und Lizenz. Kein CDN zur Laufzeit: Die Datenschutzerklärung verspricht,
   dass die Seite nichts von Dritten nachlädt.
2. **Raus:** three.js (Bühne und Sequenz), der Remotion-Player im Auftakt, das Abfangen
   des Mausrads. Das sind rund 1,2 MB Skript weniger, und die Seite scrollt nativ.
   Gelöscht werden `js/motion.js`, `js/werk-sequenz.js`, `assets/js/auftakt-player.js`
   und `vendor/three.module.min.js`. Der Quelltext des Players bleibt unter `video/`
   liegen, er ist Teil des Films.
3. **Die drei Richtungen A, B und C bleiben.** Farben und Schriften stehen weiter in
   `css/site.css`; das Tempo je Richtung steht in einer Tabelle in `js/bewegung.js`.
   Das Bedienfeld (Shift + B) funktioniert weiter.
4. **Ein Zustand.** Zeigerposition und Scrollfortschritt sind Motion-Werte
   (`motionValue`, `springValue`) in `LUKE.bewegung`; alles Abgeleitete kommt über
   `transformValue`. Niemand außer `js/bewegung.js` hört auf `pointermove`.
5. **Bewegt wird nur `transform`, `opacity`, `clip-path` und CSS-Variablen, die darin
   landen.** Scrollgebundene Bewegung läuft über `scroll()`; wo der Browser
   `ScrollTimeline` kann, läuft sie ohne JavaScript im Bildtakt. Bei scrollgebundener
   Bewegung ist `ease: "linear"` richtig — die Kurve ist dort der Daumen des Lesers.
   Gemessen beim Bauen: Getrennte Transform-Werte (`y`, `rotate`, `scale`) fährt Motion
   scrollgebunden in JavaScript und hält dabei keine Zwischenstufe; scrollgebundene
   Bewegung mit mehreren Stufen wird deshalb als **ein `transform`-String je Keyframe**
   geschrieben, dann läuft sie wie `opacity` nativ auf der `ScrollTimeline`.
6. **Kurven ohne Überschwingen.** A: `[.3,.1,.2,1]`, B: `[.16,1,.3,1]`, Federn mit
   `bounce: 0`. Richtung C behält ihr Überschwingen `[.34,1.3,.5,1]`, das ist ihr
   Charakter (Werkstatt). Austritte sind kürzer als Eintritte.
7. **Rot bleibt bei der Tropfspur und den Strängen in den Zeichnungen.** Kein roter
   Faden in der Sequenz, keine roten Punkte, keine rote Betonung auf Hover.
8. **Die Tropfspur weicht dem Text aus.** Sie setzt weiter am Strang an, findet aber
   innerhalb der Sequenz den rechten Rand und läuft dort weiter — auf dem Schreibtisch im
   rechten Seitenrand, auf dem Telefon an der rechten Kante. Der Text ist die Hauptsache.
9. **Die Galerie bekommt ab 1100 px drei Spalten** (Richtung A). Sechs Hochformate in
   zwei Spalten machen die Seite lang (siehe NOTES); groß zeigt die Blattfolge die Blätter
   ohnehin, das Verzeichnis ist zum Ordnen da.

## 4. Architektur

### Dateien und Ladereihenfolge

```
vendor/motion/motion-13.2.0.min.js   Motion, UMD, window.Motion
vendor/motion/HERKUNFT.md, LICENSE   Herkunft, Prüfsumme, MIT-Lizenz
js/works.js         Daten (unverändert)
js/bewegung.js      Grundlage: Motion-Zugang, Stärke, Tempo je Richtung, Enthüllen,
                    Strich, Parallaxe, Zeiger, Hover/Press-Helfer        (neu)
js/auftakt.js       Der Auftakt: Ebenen, Video, Schnitt, Titel            (neu)
js/blattfolge.js    Die Sequenz: ein Blatt nach dem anderen, scrollgeführt (neu)
js/site.js          Seitenlogik: Galerie, Werkansicht, Grafik, Flash, Formular,
                    Bedienfeld — Übergänge jetzt mit Motion               (umgebaut)
js/abschnitte.js    Kleine Bewegungen je Abschnitt: Aktuell, Handschrift, Studio (neu)
js/tropfspur.js     Die rote Spur, jetzt über Motion angetrieben           (umgebaut)
```

Reihenfolge im `<body>`: works → motion → bewegung → auftakt → blattfolge → site →
abschnitte → tropfspur (`defer`). Alle Skripte sind klassische IIFEs auf `window.LUKE`,
wie bisher. Kein Bauschritt.

Im `<head>` steht ein Einzeiler, der `data-js="an"` auf `<html>` setzt, wenn Bewegung
möglich ist (kein `prefers-reduced-motion`, kein `?bewegung=aus`). Nur dann versteckt das
Stylesheet die `.rv`-Elemente vor dem Enthüllen. Fehlt JavaScript oder Motion, ist alles
sichtbar.

### `LUKE.bewegung` (js/bewegung.js)

```js
LUKE.bewegung = {
  M,                       // window.Motion, oder null
  m(),                     // Stärke: 0 (aus, reduced motion), 0.55 (dezent), 1 (voll)
  richtung(),              // 'a' | 'b' | 'c'
  tempo(),                 // { dauer, kurz, kurve, versatz, feder } der Richtung
  eintritt(el),            // Keyframes des Eintritts für dieses Element in dieser Richtung
  enthuellen(root),        // meldet .rv unter root beim Sichtbarwerden an (idempotent)
  sofort(el),              // zeigt ein Element ohne Bewegung im Endzustand
  strich(el, opts),        // --strich 0 → 1, eine Linie, die weiterläuft
  parallaxe(root),         // [data-depth] scrollgebunden verschieben
  zeiger: { x, y },        // springValue, je -0,5 bis 0,5, Mitte null (nur feine Zeiger)
  heben(els, { um }),      // Hover/Fokus hebt an, Press drückt leicht; bei m() 0 nichts
  feder: { ruhig, gesetzt }
};
```

Tempo je Richtung (Sekunden, Kurven als Bézier-Arrays):

| | dauer | kurz | kurve | versatz | feder |
| --- | --- | --- | --- | --- | --- |
| A | 0.9 | 0.45 | `[.3,.1,.2,1]` | 0.08 | `{ stiffness: 170, damping: 26 }` |
| B | 1.3 | 0.6 | `[.16,1,.3,1]` | 0.11 | `{ stiffness: 120, damping: 24 }` |
| C | 0.5 | 0.28 | `[.34,1.3,.5,1]` | 0.05 | `{ stiffness: 260, damping: 18 }` |

Alle Dauern werden mit `m()` multipliziert; bei 0 wird nicht animiert, sondern der
Endzustand gesetzt.

**Eintritt je Richtung** (zwei bis drei Eigenschaften zusammen):

- A, Text: `opacity 0→1` und `clipPath 'inset(-2% 100% -2% -40px)' → 'inset(-2% -2% -2% -40px)'`
  (die Tusche wird von links aufgezogen; links über den Rand hinaus, damit Listenziffern
  nicht abgeschnitten werden).
- A, Blatt (`.g-item`, `.sheet`): `opacity 0→1`, `y 26→0`, `rotate dreh→0` mit `dreh`
  aus `--dreh` (−1.1°, 0.8°, 1.4° im Wechsel). Ein Blatt legt sich ab und richtet sich gerade.
- A, Druck (`.gr-item`): `opacity 0→1`, `y 36→0`. Plakate liegen nicht schief.
- B: `opacity 0→1`, `y 22→0`, `scale .985→1`, `filter blur(9px) brightness(.55) → blur(0px) brightness(1)`.
- C: `opacity 0→1`, `y −12→0`, `rotate −1.1→0`, `scale 1.015→1`.

**Enthüllen:** je Element ein `inView(el, …, { amount: 'some', margin: '0px 0px -8% 0px' })`,
das nach dem ersten Eintritt abgemeldet wird. „Some“ (jeder schneidende Pixel) statt eines
Flächenanteils: Das entspricht dem alten Auslösepunkt (Oberkante unter 92 % der Fensterhöhe)
und ist unabhängig davon, wie viel von einem Blatt die Wischschiene gerade zeigt. Was im selben Augenblick sichtbar wird,
kommt gestaffelt: `delay = min(reihe, 4) * versatz`, Reihe wird zurückgesetzt, wenn
zwischen zwei Eintritten mehr als 120 ms liegen. Einmal enthüllt bleibt enthüllt.

**Strich:** Eine Linie wächst von links. CSS zeichnet die Linie als Pseudo-Element mit
`transform: scaleX(var(--strich, 1)); transform-origin: 0 50%`; Motion animiert die
Variable `--strich` von 0 auf 1. Ohne JavaScript steht die Linie ganz. Verwendet für die
rote Linie unter `h2.hd` (Richtung A), die Linien des Streifens „Aktuell“ und die Linien
der Teamliste.

**Parallaxe:** `[data-depth]` wird über `scroll(animate(el, { y: [amp, -amp] }, { ease: 'linear' }), { target: el, offset: ['start end', 'end start'] })`
verschoben, `amp = depth * innerHeight * 0.5 * m()`. Bei Größenänderung neu aufgebaut.
Nur auf Figuren und dem Titel des Auftakts, nie auf Lauftext.

**Zeiger:** `pointermove` schreibt in zwei `motionValue`, daraus zwei `springValue`
(`stiffness 60, damping 20`). Auf groben Zeigern (`pointer: coarse`) bleiben sie null.

**Heben:** `hover(el)` hebt das Bildfeld um `um` Pixel (Feder `gesetzt`), `press(el)`
drückt es auf `scale .985`; beides kehrt beim Verlassen zurück. `focus-visible` hebt wie
Hover. Nichts davon bei `m() === 0`.

## 5. Die Abschnitte

### Auftakt (js/auftakt.js)

Die Figur `.hero-fig` bekommt vier Ebenen, von hinten nach vorn, jede mit `data-tiefe`:

| Ebene | Inhalt | Tiefe | Deckkraft | Maßstab |
| --- | --- | --- | --- | --- |
| 1 | `gestaltung-profil-1200.jpg`, grau, Ausschnitt 38 % 30 % | 0.14 | 0.10 | 1.55 |
| 2 | dasselbe Blatt, Ausschnitt 68 % 62 %, um −4 % versetzt | 0.30 | 0.16 | 1.22 |
| 3 | das Motiv: Zeichenvideo, darüber das Standbild (kniende Figur, cover, rechtsbündig) | 0.48 | 1 | 1.045 → 1 |
| 4 | dasselbe Blatt, Ausschnitt 82 % 88 %, grau | 0.95 | 0.09 | 2.1 |

Die grauen Ebenen sind Tiefe, kein Motiv (`filter: grayscale(1)` im Stylesheet; ihr Rot
würde sonst als blasser Fleck neben der Tropfspur stehen). Alle Ebenen liegen mit
`multiply` auf dem Papier (Richtung A und C).

Ablauf, Sekunden ab Start:

| Zeit | Was |
| --- | --- |
| 0.00 | Titel `h1`: `opacity 0→1`, `y 18→0`, 1.1 s, Kurve B. Motiv-Ebene beginnt `scale 1.045→1` über 9.4 s, Kurve `[.83,0,.17,1]`. |
| 0.15 | Ebenen 1, 2, 4: `opacity 0 → Ziel`, 1.6 s. |
| 0.30 | Unterzeile `p`: `opacity 0→1`, `y 14→0`, 1.0 s. |
| 0.35 | Video: `opacity 0→1`, 0.5 s, und `play()`. |
| Ende des Videos (~6.05) | Video: `opacity 1→0`, 0.5 s. |
| + 0.35 | Leerstelle. Der Übergang liest als Schnitt, nicht als Verwandlung. |
| danach | Standbild: `opacity 0→1`, `y 10→0`, 0.9 s. Dann Ruhe. |

Danach folgt jede Ebene dem Zeiger (`x = zeiger.x * 96 * tiefe`, `y = zeiger.y * 62 * tiefe`)
und dem Scrollen (`y += p * −140 * tiefe`, `p` = Fortschritt der Figur von `start start`
bis `end start`), beides über `transformValue` und `styleEffect`. Keine Eigenbewegung.

Ohne Bewegung (`m() === 0`), bei `saveData`/2g, ohne Video oder bei einem Videofehler:
Video versteckt, Standbild sofort, Ebenen still an ihrem Platz. Die vier Sekunden Frist
und der Remotion-Player entfallen. `data-tilt` entfällt (die Ebenen sind die Neigung),
`data-depth` am `.hero-draw` entfällt, am `.hero-text` bleibt es.

### Blattfolge (#sequenz, js/blattfolge.js)

Ersetzt `<werk-sequenz>`. Eine klebende Bühne (`position: sticky`, `100svh`) und ein
Abschnitt, der so hoch ist, wie die Folge lang ist. Ein Blatt nach dem anderen kommt von
unten herauf, bleibt stehen, geht nach oben hinaus; dann kommt das nächste. Niemals zwei
zugleich. Eine Bewegung pro Einstellung.

Daten wie bisher: Kapitel `haut`, `papier`, `flash` mit denselben Titeln und Unterzeilen
wie in `js/werk-sequenz.js`; gezeigt wird nur, wofür es Aufnahmen gibt
(`LUKE.helleAufnahmen(key)`, für Flash `LUKE.FLASH` mit `src`). Gibt es kein Kapitel,
verschwindet der Abschnitt. Der Knopf „Ansehen“ löst wie bisher `sequenz-select` mit dem
Kapitelschlüssel aus; `js/site.js` scrollt dann zu den Werken.

Aufbau (von JavaScript gebaut):

```
section#sequenz > .bf[data-stand=voll|still]
  .bf-buehne                     sticky, 100svh, overflow hidden
    .bf-kapitel × Kapitel        unten links: Titel (wie h2.hd, groß), Unterzeile, Knopf
    .bf-blatt × Blatt            figure mit img.ink-img, mittig rechts (Telefon: mittig)
    .bf-schrift × Blatt          Werknummer und Titel, Technik, Jahr — unter dem Blatt
    .bf-hinweis                  „Scrollen“ mit Strich, nur am Anfang
```

Höhe des Abschnitts: `N · 70svh + 100svh` (Telefon ≤ 700 px: `N · 60svh + 100svh`,
dezent: `N · 55svh + 100svh`), `N` = Zahl der Blätter, mindestens `200svh`. Das Blatt
steht auf dem Schreibtisch 72svh hoch, auf dem Telefon 46svh — gemessen: Bei 56svh
überlappte es den Kapitelblock oben um 23 px, bei 46svh bleiben 19 px Luft. Der
Fortschritt `p` läuft von `start start` bis `end end` des Abschnitts. Blatt `i` hat das
Fenster `[i/N, (i+1)/N]` mit Breite `w = 1/N`, alles scrollgebunden mit `ease: "linear"`
und `times`:

| Eigenschaft | 0 | i/N | i/N + .30w | i/N + .78w | (i+1)/N | 1 |
| --- | --- | --- | --- | --- | --- | --- |
| `y` | 70 vh | 70 vh | 0 | 0 | −60 vh | −60 vh |
| `rotate` | dreh | dreh | 0 | 0 | 0 | 0 |
| `scale` | .92 | .92 | 1 | 1 | 1.04 | 1.04 |
| `opacity` | 0 | 0 | 1 | 1 | 0 | 0 |

`dreh` im Wechsel −5°, 4°, −3°, 5°, −4°; `y`, `rotate` und `scale` stehen als ein
`transform`-String je Keyframe (siehe Entscheidung 5). Der Austritt (22 % des Fensters)
ist kürzer als der Eintritt (30 %). Zwischen Austritt und nächstem Eintritt liegt ein leerer Augenblick:
ein Schnitt. **Das letzte Blatt geht nicht hinaus**, es bleibt stehen, und die Bühne
scrollt mit ihm davon. Pixelwerte werden aus `innerHeight` gerechnet und bei
Größenänderung neu aufgebaut.

Beschriftung `.bf-schrift` je Blatt: `opacity 0→1` zwischen `i/N + .20w` und `i/N + .34w`,
`y 8→0`; hinaus zwischen `i/N + .78w` und `i/N + .88w`. Die letzte bleibt.
Kapitel `.bf-kapitel`: sichtbar über die Fenster seiner Blätter, Überblendung 0.1w; das
erste Kapitel steht schon bei `p = 0`, das letzte bleibt. Ein einzelnes Kapitel steht die
ganze Zeit. Hinweis: `opacity 1→0` zwischen 0 und 0.06.

Stand `still` (Bedienfeld „3D-Sequenz: still“ oder `m() === 0`): keine Bühne, sondern eine
ruhige Reihe — Kapiteltitel, dann die Blätter nebeneinander (Telefon: untereinander) mit
Beschriftung, natürliche Höhe, keine Scrollbindungen. Stand `aus`: Abschnitt versteckt
(`.app[data-sequenz="aus"] #sequenz`, bleibt). Der Stand folgt den Attributen der `.app`
(MutationObserver wie bisher).

Kein roter Faden, kein Nebel, kein Schwanken, kein Zeiger.

### Aktuell

Der Streifen hat oben und unten je eine Linie. Beide sind Pseudo-Elemente mit
`--strich` und wachsen von links (1.1 s, Kurve A), 0.35 s später kommen die drei Texte
gestaffelt (Eintritt der Richtung, Versatz `tempo().versatz`). Eine Linie, die
weiterläuft — der Streifen ist ein Vermerk am Rand der Seite.

### Werke

- **Reiter:** Die Linie unter den Reitern (`.tr-schiene`) gleitet mit Motion statt mit
  einer CSS-Transition: Die Breite wird sofort gesetzt, bewegt werden `x` und ein
  `scaleX` von der alten zur neuen Breite (Feder `gesetzt`) — nur `transform`.
- **Blätter:** Eintritt „Blatt“ (A) bzw. Richtung; Staffelung nach Spalte
  (`delay = (index % cols) * versatz`). `--dreh` steht im Stylesheet je `nth-child`.
- **Heben:** Hover und Fokus heben das Bildfeld `.g-ph` um 4 px, Press drückt auf
  `scale .985`. Richtung C behält zusätzlich ihre CSS-Hover-Drehung auf `.tin`; deshalb
  liegt das Heben auf `.g-ph`, nicht auf `.tin`.
- **Filtern:** Was verschwindet, geht zuerst (`opacity → 0`, `scale → .98`, `kurz · .5`),
  dann wird neu gezeichnet, dann FLIP mit Feder `gesetzt` für alles, was seinen Platz
  wechselt; Neues kommt `opacity 0→1`, `y 16→0`, Versatz 0.05. Klickt jemand weiter,
  bevor der Austritt zu Ende ist, zeichnet nur der letzte Lauf; während der Waschung
  beim Trägerwechsel nimmt die Galerie keinen zweiten Wechsel an.
- **Trägerwechsel:** Die Waschung `#gwash` bleibt je Richtung wie bisher (A `scaleY`,
  B `opacity`, C `scaleX`), gebaut mit `animate`, danach kommen die Blätter gestaffelt.
- **Layoutwechsel** (Mauerwerk, Bündig, Schiene): FLIP wie beim Filtern.
- **Spalten:** Richtung A ab 1100 px drei Spalten.

### Werkansicht

- **Öffnen:** Hintergrund `opacity 0→1` (`kurz`). Die Bildfläche fliegt vom Blatt in der
  Galerie an ihren Platz: FLIP mit `x`, `y`, `scale` ab dem gemessenen Rechteck,
  `transformOrigin: 'top left'`, Feder `gesetzt`. Titel, Zeilen und Knöpfe kommen 0.15 s
  später mit `opacity 0→1`, `y 12→0`, Versatz 0.05.
- **Schließen:** umgekehrt und kürzer: Zeilen hinaus (`kurz · .5`), Bild zurück ans Blatt
  (`kurz`), Hintergrund hinaus (`kurz`); der Dialog wird erst nach dem letzten `finished`
  entfernt. Fokus kehrt wie bisher zum Blatt zurück.
- **Blättern:** altes Bild `opacity → 0`, `x → −14 · Richtung` (0.18 s); Wechsel; neues
  Bild `opacity 0→1`, `x 14 · Richtung → 0` (0.35 s). Zeilen blenden über.
- Ohne Bewegung: sofortiger Wechsel, wie bisher.

### Handschrift

Überschrift und Absätze mit dem Eintritt der Richtung, gestaffelt. Das Signaturvideo folgt
dem Scrollen über `scroll((p) => …, { target: .band-fig, offset: ['start 0.92', 'end 0.2'] })`
— dieselbe Abbildung wie bisher (von „taucht unten auf“ bis „ist oben durch“), geschrieben
wird `currentTime` nur bei einem Unterschied über 0.04 s. Die Figur behält ihre Parallaxe
(`data-depth`). Ohne Bewegung steht das Poster, das ist die Signatur.

### Flash

Bleibt leer und versteckt, bis es Blätter gibt. Kommen sie, gilt der Eintritt „Blatt“ mit
`--dreh` wie heute im Stylesheet.

### Grafik

Eintritt „Druck“: `opacity 0→1`, `y 36→0`, Staffelung nach Spalte (Versatz 0.1). Keine
Drehung — Plakate liegen nicht schief. Heben um 3 px auf `.gr-ph`.

### Anfrage

Die Schritte kommen gestaffelt (Versatz 0.1) mit dem Eintritt der Richtung. Das Formular
ist **ein** Element (`#af-form` bekommt `.rv`): `opacity 0→1`, `y 16→0`. Fehlerhinweis:
`opacity 0→1`, `x −8→0` (`kurz`); Bestätigung `#af-done`: `opacity 0→1`, `y 12→0`.
Kein Schütteln — Tusche fällt, sie springt nicht.

### Studio

Das Foto wird beim Scrollen ganz langsam größer: `scale 1→1.06` über `['start end', 'end start']`,
linear, Figur mit `overflow: hidden`; dazu bleibt `data-depth`. Die Teamliste: jede Zeile
mit dem Eintritt der Richtung (Versatz 0.08), ihre Linie ist ein `--strich`, der 0.1 s
nach der Zeile beginnt (0.7 s). Die Karte kommt als ein Element.

### Fuß

Nichts. Nach dem Studio ist Ruhe.

### Tropfspur (js/tropfspur.js)

Bleibt SVG in Seitenkoordinaten, bleibt Tropfen, Spritzer und `stroke-dashoffset`. Neu:

- **Weg:** Ansatz weiter bei `STRANG_X/Y` der `.hero-fig`. Von dort führt eine S-Kurve
  über `min(hoehe · 0.12, 1.2 · innerHeight)` Pixel an den rechten Rand — ab 900 px
  Breite `min(wrapRechts + 56, innerWidth − 24)` (`wrapRechts` = rechte Kante der `.wrap`),
  darunter `innerWidth − 8` mit einem Viertel der Wanderung (die Randspalte ist dort nur
  16 px breit; mit ±14 px schnitt die Linie rechtsbündige Zeilen). Ab dort läuft die
  wandernde Linie wie bisher senkrecht weiter; der Halter bleibt innerhalb des Fensters. Der Halter deckt beide x-Werte ab (`left = min(x0, x1) − 110`, Breite
  `|x1 − x0| + 220`).
- **Antrieb:** `scroll((p, info) => stand.set(…))` mit derselben Abbildung wie bisher
  (`(scrollY − oben · 0.35) / (max − oben · 0.35 + 1)`), `stand` ein `motionValue`;
  `spur = springValue(stand, { stiffness: 120, damping: 28 })`, und `spur.on('change', zeichnen)`.
  Die Spur läuft dem Lesen also einen Hauch nach — wie Flüssigkeit.
- Aus bei `data-rot="aus"`, bei `m() === 0` und ohne Auftakt, wie bisher.

### Navigation und Bedienfeld

Unverändert. Die Navigation bewegt sich nicht; auf dem Telefon bleibt der Verlauf am
rechten Rand als Hinweis, dass es weitergeht. Das Bedienfeld schaltet weiter Richtung,
Layout, Bewegung, Dichte, Rotspur, Sequenz (voll / still / aus) und Korn. „Bewegung“
wirkt sofort auf alles, was noch kommt; was schon enthüllt ist, bleibt.

Richtung B behält ihren Lichtkegel: `--mx`/`--my` werden aus `zeiger` gerechnet und über
`styleEffect` auf die `.app` geschrieben. Die Spalten- und Farbregeln der Richtungen im
Stylesheet bleiben, wie sie sind.

## 6. Schranken

- Bei `prefers-reduced-motion` und bei `data-bewegung="aus"` steht alles: Eintritte im
  Endzustand, Blattfolge als Reihe, Tropfspur aus, Auftakt als Standbild, kein Heben.
  Nichts verschwindet, was Inhalt ist.
- `data-bewegung="dezent"`: alle Dauern mal 0.55, Blattfolge kürzer, Parallaxe halb.
- Kein zusätzliches Rot. Rot sind die Tropfspur und die Stränge in den Zeichnungen.
- Nichts, was den Text beim Lesen verschiebt. Parallaxe nur auf Figuren und dem Titel des
  Auftakts. Eintritte enden, bevor gelesen wird.
- Bewegt wird nur `transform`, `opacity`, `clip-path` und CSS-Variablen dafür. Kein
  `filter` außer dem bestehenden Eintritt von Richtung B, kein `box-shadow` in Bewegung.
- Nichts von Dritten zur Laufzeit. Motion liegt unter `vendor/`.
- Die Konsole bleibt leer: keine Fehler, keine Warnungen.
- Auf dem Telefon zuerst prüfen. Was dort ruckelt, fliegt raus.
- Kein Gedankenstrich als Zierde in neuen Texten; die bestehenden Texte bleiben.
- Keine Emoji, keine erfundenen Inhalte: Titel, Nummern, Technik und Jahre kommen aus
  `js/works.js`.

## 7. Prüfung

`scripts/bilder-pruefen.mjs` (Playwright, kleiner Server im Prozess) lädt die Seite,
scrollt sie einmal durch, zieht je Abschnitt ein Bild in 1440 und in 390 Pixel Breite,
dazu Bilder aus der Blattfolge an drei Stellen, und schreibt alle Konsolenmeldungen mit.
Ein zweiter Lauf mit `prefers-reduced-motion: reduce` und einer mit `?richtung=b` und
`?richtung=c`. Die Bilder werden angesehen, nicht beschrieben. Abgegeben wird erst, wenn
die Konsole leer ist und jedes Bild geprüft wurde.

Was in den Bildern zu prüfen ist: Kein weißer Kasten hinter einer Zeichnung
(`multiply` vergessen). Rot an einer Stelle. Text vollständig lesbar, nichts abgeschnitten
(vor allem am Ende eines `clip-path`-Eintritts). Die Tropfspur läuft nicht durch Text,
Formular oder Foto. Blattfolge: ein Blatt zur Zeit, Beschriftung passt zum Blatt.

## 8. Beim Bauen gelernt

- Nach dem Ende einer Motion-Animation schreibt Motion die Endwerte im Renderschritt des
  folgenden Bildes noch einmal als Inline-Stil. Wer danach aufräumen will, tut es zwei
  Renderschritte später (`frame.postRender` zweimal), nicht im `then` — und wartet, bis
  jede Animation auf demselben Element fertig ist.
- `styleEffect` verlangt für jeden Schlüssel einen Motion-Wert, keine nackte Zahl.
- Die Zeilen der Prüfung, die Elemente in der Wischschiene betreffen, lassen aus, was
  waagerecht außerhalb des Fensters steht: Das wird erst beim Wischen gesehen.
- Die Adresse (`?bewegung=`, `?richtung=`) wird in `js/bewegung.js` auf `.app` aufgelöst,
  bevor ein anderes Skript die Stärke liest. Ein Modul, das `m()` beim Laden liest, sähe
  sonst den Vorgabewert des Markups; der Auftakt lief so mit `?bewegung=aus` in voller
  Stärke.
- Das Standbild des Auftakts setzt die Tiefen-Ebenen auf ihre `--deck`, nicht auf 1;
  sonst decken drei Kopien der Zeichnung die Figur zu. Die Prüfung misst das jetzt bei
  reduzierter Bewegung und mit `?bewegung=aus`.
- Wer ein Element in Bewegung hebt, darf dessen ruhende Drehung nicht in `transform`
  haben. Die Kippung der Plakate in Richtung C liegt deshalb in der Eigenschaft `rotate`,
  die neben `transform` steht und von Motion nicht überschrieben wird.
- `parallaxe()` baut die Bindungen nur neu, wenn ein neues Element dazukam; der
  Beobachter am Body ruft sie bei jeder Einfügung.

## 9. Bewusst gelassen

- Der Fuß und die Navigation bewegen sich nicht.
- Kein „aktiver Abschnitt“ in der Navigation, keine Fortschrittsanzeige außer der Spur.
- Flash bleibt leer, `skizze.html` und `js/weltzustand.js` bleiben funktional unberührt
  (in `weltzustand.js` ist nur ein Kommentar berichtigt, der gelöschte Dateien nannte),
  ebenso der Film unter `video/` samt `SeitenAuftakt.tsx` (dort weiter Teil des Films).
- Keine Klanggestaltung.
- Kein Wechsel der Schriften, Farben oder Texte. Die Richtungen B und C bekommen ihre
  Bewegung übersetzt, aber keine neue Idee; A ist der Standard und wird zuerst geprüft.
