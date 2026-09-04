# Claude-Design-Prompt: Werkschau Luke WTF, gefahren von einem Weltzustand

Zum Einfügen in Claude Design. Alles unter „Der Auftrag" ist der Prompt; darüber steht,
wozu er da ist, und darunter, was beim Umsetzen zu beachten war.

Stand: 4. September 2026. Gehört zu `netzkontrast/luke`, Branch
`claude/kunstprojekt-webseite-48q1ps`. Die gebaute Skizze liegt als `skizze.html`
daneben und zeigt, dass die Architektur trägt.

---

## Der Auftrag

Baue die Werkschau eines Tätowierers und Zeichners als eine Seite, die von **einem
einzigen Zustand** gefahren wird. Nicht mehrere Module, die jeweils selbst nachsehen, wo
gescrollt wurde — ein Zustand, aus dem alle lesen.

### Wer

Luke WTF, Tätowierer und Zeichner, Bluthandwerk, Köln-Ehrenfeld, seit 2012. Arbeiten auf
Haut und auf Papier. Tusche, Schwarz und ein Rot. Die Zeichnungen sind Figuren unter
Zwang: Stränge, Schlingen, gebeugte Körper. Kein Horror, keine Effekthascherei — die
Blätter sind ernst, und die Seite muss das aushalten, ohne es zu illustrieren.

Wichtig für die Bildauswahl: Ausgestellt werden sechs Papierarbeiten — vier Blätter der
Serie „Befreiung der Körperlichkeit“, dazu zwei Köpfe. Drei weitere Blätter tragen die
Gestaltung, ohne im Verzeichnis zu stehen: ein Profil mit rotem Strang (Zeichenanimation,
Tiefenebenen, Sprite), ein Auge mit Signatur (der Abschnitt zur Handschrift) und eine
kniende Figur (der Kopf der Seite). Diese Trennung ist keine Kleinigkeit: Was ausgestellt
wird und was die Seite trägt, sind zwei verschiedene Fragen.

### Der Weltzustand

Eine Schleife liest einmal pro Bild die Seite und rechnet daraus:

```
y          Scrollposition
p          Fortschritt der Seite, 0 bis 1
v          geglättete Geschwindigkeit
zug        Betrag davon, 0 bis 1 — wie hastig gelesen wird
zeiger     Zeigerposition, jeweils -0,5 bis 0,5
i, id      der Abschnitt, in dem die Fenstermitte gerade steht
lokal      Fortschritt in diesem Abschnitt, 0 bis 1
stufe      grobe Lage des Abschnitts, 0 ruhig bis 3 offen
fassung    1 beisammen, 0 auseinander — interpoliert zwischen den Abschnitten
blut       1 − fassung
```

Dahinter steht eine Tabelle, eine Zeile je Abschnitt:

```
auftakt   stufe 0   fassung 1.00
zug       stufe 1   fassung 0.86
werke     stufe 1   fassung 0.72
schnitt   stufe 2   fassung 0.48
fall      stufe 3   fassung 0.18
ruhe      stufe 1   fassung 0.64
```

`fassung` ist das dramaturgische Maß der Seite: Oben ist sie beisammen, unten nicht mehr.
Zwischen zwei Abschnitten wird interpoliert, damit nichts springt. **Wer einen Abschnitt
einfügt, ändert diese Tabelle und sonst nichts.**

Niemand außer der Schleife fasst `scrollY` an. Jedes System meldet sich an und bekommt den
Zustand gereicht. Das ist die eigentliche Vorgabe: nicht ein bestimmter Effekt, sondern
die eine Quelle.

### Die drei Systeme

**1. Blätter fliegen durch die Szene.** Fünf Zeichnungen auf fünf Bahnen, hinter dem Text.
Jede Bahn hat Tempo und Vorlauf; die Stelle darauf kommt allein aus `p`. Beim
Zurückscrollen fliegen sie rückwärts — es ist ein Stapel, durch den man blättert, keine
Schleife, die nebenher läuft. Sie sind Hintergrund: deckend genug, um da zu sein,
durchsichtig genug, dass der Text lesbar bleibt.

**2. Die Zeichnung entsteht.** Ein Sprite mit 48 Bildern aus der Zeichenanimation, 8
Spalten mal 6 Zeilen. Welches Bild steht, entscheidet `p`. Wer schnell scrollt, zeichnet
schnell; wer zurückgeht, nimmt die Tusche wieder mit. Fünf Ebenen desselben Sprites in
verschiedener Tiefe geben die Parallaxe: hinten blass und träge, vorn deutlich.

**3. Die Seite weint.** Aus dem Auge der Zeichnung im Auftakt laufen Tränen aus Blut die
Seite hinunter. Ihre Länge ist der Lesefortschritt, ihre Zahl die Fassung: oben eine,
unten sechs. Sie sind Flächen mit wechselnder Breite, keine Striche — oben dick, unten
dünn, unterwegs Stauungen. Am unteren Ende hängt ein Tropfen, der mit dem Tempo wächst.
Spritzer bleiben liegen, wo eine Träne war.

### Wie es aussieht

- Grund reinweiß. Kein Papierton, keine Körnung.
- Tusche schwarz (#141412), Grau #4A4945, Linien #DCDCDA, Rot #D1232A und #7E141A.
- Schrift: Alegreya für den Lauftext, Alegreya Sans für Anzeige und Zahlen.
  Grundgröße 18 px, Zeilenabstand 1,65.
- Zeichnungen liegen mit `mix-blend-mode: multiply` auf der Seite. Das Papier verschwindet,
  die Zeichnung steht frei. Damit das trägt, muss der Papierton der Aufnahme vorher auf
  reines Weiß gezogen sein.
- Rot gehört den Tränen. Kein zweites Rot im selben Blickfeld.

### Bewegung

Bewegung kommt aus dem Material, nicht aus dem Effektkasten: Tusche, die entsteht; eine
Linie, die weiterläuft; ein Blatt, das auffliegt. Keine linearen Kurven, kein reines
Aufblenden, nichts, was gleichzeitig hereinkommt, keine Dauerbewegung ohne Ruhe, kein
Leuchten, keine Verläufe.

Bei `prefers-reduced-motion` und bei abgeschalteter Bewegung steht alles still, aber
nichts verschwindet: Der Endzustand wird gezeigt, nicht die Reise dorthin.

### Grenzen

- Kein Bauschritt. Statisches HTML, CSS und JavaScript, das man im Browser aufmachen kann.
- Nichts von Drittanbietern zur Laufzeit. Schriften, Bibliotheken und Bilder liegen im
  Projekt. Die Datenschutzerklärung verspricht das.
- Bewegt wird nur `transform` und `opacity`. Alles andere zwingt zum Neu-Layouten.
- Der Text ist die Hauptsache. Was ihn schlechter lesbar macht, fliegt raus.
- Auf dem Telefon zuerst prüfen. Was dort ruckelt, fliegt raus.

---

## Was beim Bauen dazukam

**htmx 4 fährt die Anzeige, nicht die Bewegung.** htmx 4.0.0 ist am 28. August 2026
erschienen. Sein Kern spricht mit einem Server; diese Seite hat keinen. Brauchbar ist die
Erweiterung `hx-live`: reaktive Ausdrücke im Markup, die auf DOM-Mutationen neu rechnen.
Der Weltzustand schreibt deshalb zehnmal die Sekunde ein paar gerundete Werte als
`data-welt-*` auf `<html>`, und die Anzeige unten liest sie deklarativ:

```html
<span :text="document.documentElement.dataset.weltName"></span>
<span :style="'width:' + document.documentElement.dataset.weltP + '%'"></span>
```

Für die Bewegung taugt das nicht: `hx-live` rechnet auf Mutationen, nicht im Bildtakt, und
warnt selbst, sobald seine Ausdrücke über 16 ms brauchen. Die Trennung ist also nicht
Geschmack, sondern die Bruchlinie des Werkzeugs — Zahlen zum Lesen deklarativ, 60 Bilder
je Sekunde in einer Schleife.

**Der Sprite statt des Videos.** 48 Bilder, 283 kB, gegen 1,8 MB Video. Ein Sprite lässt
sich bildgenau ansteuern; ein Video muss man spulen und hoffen, und ohne dichte
Schlüsselbilder und einen Server mit Range-Anfragen steht es beim Scrubben still.

**Die Tränen als Canvas.** Eine Träne ist eine Linie, sechs Tränen mit Tropfen, Spritzern
und wechselnder Breite sind hundert. Als SVG wären das hundert Knoten, die der Browser bei
jedem Bild anfasst.

**Gezeichnet wird in Seitenkoordinaten**, nicht im Fenster: Die Spuren gehören zur Seite.
Scrollt man zurück, stehen die Spritzer noch da, wo sie waren.

**Die Vorlage.** Das Muster kommt aus dem Schwesterprojekt „Kapitel 0 — Kohärenzprotokoll"
(the-agency-system): Dort steht eine Tabelle mit einem Kohärenzwert je Abschnitt, und
alles Sichtbare — Farbe, Glitch-Stufe, Partikelverhalten — wird daraus abgeleitet, statt
für sich zu animieren. Hier heißt der Wert `fassung`.
