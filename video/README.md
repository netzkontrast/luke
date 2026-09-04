# Werkschau, Bewegtbild

Der Film zur Website, gebaut mit [Remotion](https://remotion.dev): React rendert Bild für Bild,
das Ergebnis ist ein MP4. Dieselben Farben, dieselben Schriften und dieselben Arbeiten wie
`index.html` eine Ebene höher.

## Was der Film zeigt

Sechs Szenen, zusammen rund 32 Sekunden:

| Szene | Inhalt |
| --- | --- |
| Auftakt | Name und die Zeichnung von Werk I, die vor der Kamera entsteht |
| Werk I | Das fertige Blatt mit Beschriftung |
| Handschrift | Der Satz des Projekts über der Auge-Zeichnung mit Lukes Signatur |
| Verzeichnis | Die Arbeiten auf Papier als Verzeichnis, mit den Titeln aus `js/works.js` |
| Atelier | Luke bei der Arbeit, Adresse und Terminhinweis |
| Abspann | Die Ausstellung Red, Ort, Termine, Instagram |

Zwei Formate aus denselben Szenen:

- `Werkschau`, 1920 mal 1080, für die Schleife im Studio und für die Website
- `WerkschauHoch`, 1080 mal 1920, für Story und Reel

Die Szenen fragen über `src/layout.ts` nach der Bildform und ordnen sich entsprechend an.

## Ansehen und ändern

```
cd video
npm install
npm run studio
```

`npm run studio` und `npm run render` kopieren vorher die Bilder, Videos und Schriften aus
`../assets` nach `public/`. Die Dateien liegen nur einmal im Repository, nämlich unter
`../assets`; `public/` ist eine abgeleitete Kopie und steht in `.gitignore`. Wer die
Remotion-Befehle direkt aufruft, macht den Schritt einmal von Hand:

```
npm run assets
```

Der Remotion-Studio öffnet sich im Browser, links stehen beide Kompositionen. Änderungen an
`src/` sind sofort sichtbar.

## Rendern

In dieser Umgebung lädt Remotion kein eigenes Chromium herunter, deshalb muss der Pfad mit:

```
CH=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
npx remotion render src/index.ts Werkschau     out/werkschau.mp4      --codec h264 --crf 17 --browser-executable=$CH
npx remotion render src/index.ts WerkschauHoch out/werkschau-hoch.mp4 --codec h264 --crf 17 --browser-executable=$CH
```

Auf einem Rechner mit eigenem Chrome reichen `npm run render` und `npm run render:hoch`.

Einzelbilder zur Kontrolle, ohne den ganzen Film neu zu rendern:

```
npx remotion still src/index.ts Werkschau out/pruef.png --frame 430 --overwrite --browser-executable=$CH
```

## Aufbau

```
src/theme.ts            Farben, Kurven, Federn und der Takt der Szenen. Einzige Quelle.
src/layout.ts           Fragt die Bildform ab und liefert Ränder und Schriftgrößen.
src/fonts.ts            Lädt die woff2-Dateien, bevor das erste Bild gerendert wird.
src/werke.ts            Erzeugt aus js/works.js, nicht von Hand ändern.
src/components/         Papier und Körnung, roter Faden, Schriftbausteine, Blätter.
src/scenes/             Die sechs Szenen.
src/Werkschau.tsx       Setzt die Szenen mit Überblendung zusammen.
src/Root.tsx            Meldet beide Kompositionen an.
public/                 Abgeleitete Kopien aus ../assets, nicht im Repository.
scripts/assets-uebernehmen.sh   Füllt public/ aus ../assets.
scripts/werke-uebernehmen.mjs   Überträgt das Werkverzeichnis aus js/works.js.
```

## Werkdaten ändern

Titel, Jahre und Techniken stehen in `js/works.js` im Wurzelverzeichnis. Nach einer Änderung:

```
node scripts/werke-uebernehmen.mjs
```

Das schreibt `src/werke.ts` neu. So zeigen Website und Film immer dasselbe Verzeichnis.

## Neue Bilder oder Videos

Nach `public/img/` beziehungsweise `public/video/` legen und in der Szene über `staticFile()`
referenzieren. Wichtig: Zeichnungen bekommen `mixBlendMode: "multiply"`, damit das weiße
Papier im Papiergrund verschwindet und nur Tusche und Rot stehen bleiben. Die Bausteine in
`src/components/Blatt.tsx` machen das bereits richtig, `BlattBild` und `BlattVideo` für
Zeichnungen, `Foto` für Fotografien.

## Gestaltungsregeln

Stehen im Skill `werkschau-video` unter `.claude/skills/`. Kurz: Papier statt Verlauf, Rot nur
an einer Stelle im Bild, Alegreya Sans mager, kein Leuchten, keine Gedankenstriche in der
Bildschirmschrift. Das allgemeine Handwerk für Remotion steht daneben im Skill
`remotion-motion-graphics`.

## GIF-Fassung

Für Stellen ohne Videowiedergabe:

```
cd ..
scripts/make-gifs.sh video/out/werkschau.mp4
```
