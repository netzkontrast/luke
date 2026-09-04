---
name: werkschau-video
description: Baut Bewegtbild für die Werkschau von Luke WTF (Tätowierer und Zeichner, Bluthandwerk Köln) mit Remotion — in der Bildsprache der Website in diesem Repository. Nutze diesen Skill, sobald jemand ein Video, einen Clip, einen Trailer, eine Reel, eine Story, ein Teaser, eine Vernissage-Ankündigung, eine Loop für den Bildschirm im Studio, ein Ausstellungs- oder Werkvideo für Luke, die Werkschau, „Befreiung der Körperlichkeit" oder Bluthandwerk will, auch wenn Remotion gar nicht erwähnt wird und auch dann, wenn nur von „was Bewegtem", „Animation" oder „Instagram-Post" die Rede ist. Ebenso, wenn ein bestehendes Video hier angepasst, verlängert, neu vertont oder in ein anderes Format gebracht werden soll. Vor jeder Zeile Videocode zuerst lesen.
---

# Werkschau-Video

Bewegtbild für Luke WTF. Das Handwerk für Remotion steht im Nachbarskill
`remotion-motion-graphics` (Federn, Staffelung, Ken Burns, Körnung, Verifikation) —
lies ihn zuerst, er gilt hier vollständig. Dieser Skill sagt, **wie es nach Luke
aussieht**, und nennt die Dateien, die schon da sind.

Die Bildsprache stammt aus `css/site.css` und `index.html`. Ändert sich dort etwas,
gilt die Website, nicht dieser Text.

## Die eine Regel, die alles trägt: Tusche auf Papier

Lukes Arbeiten sind schwarze Tusche und ein Rot auf **weißem** Papier. Der Film spielt
auf demselben Papier. Deshalb wird jedes Werkbild und jedes Zeichenvideo mit
`mixBlendMode: "multiply"` auf den Papiergrund gelegt:

```tsx
<Img src={staticFile("img/werk-1-profil-1200.jpg")} style={{ mixBlendMode: "multiply" }} />
<OffthreadVideo src={staticFile("video/werk-1-profil-zeichnung.mp4")} style={{ mixBlendMode: "multiply" }} />
```

Das Weiß des Papiers verschwindet, nur Tusche und Rot bleiben stehen. Ohne multiply
klebt ein weißer Kasten auf hellgrauem Grund — daran erkennt man sofort, dass es
falsch gemacht wurde. Prüf das auf jedem extrahierten Einzelbild.

Zwei Folgen daraus:

- **Kein Farbverlaufs-Hintergrund.** Der allgemeine Skill verbietet flache Hintergründe
  und schlägt Mesh-Verläufe vor. Hier wäre das falsch: Der Grund ist Papier, seine
  Textur ist die Körnung, nicht buntes Licht. Nimm eine ganz leichte Waschung in
  `--fnt` und die Körnung, sonst nichts.
- **Farbgradierung nur als Papierton**, nicht als Farbstich. Eine dünne Lage
  `--bg2` mit `soft-light` bei 0.10 reicht.

## Palette

Aus `css/site.css`, Richtung A (Werkverzeichnis) — der Standard:

| Rolle | Wert | Verwendung |
| --- | --- | --- |
| Papier | `#E8E8E6` | Grund |
| Papier hell | `#F1F1EF` | Flächen, Blattkanten |
| Tusche | `#0D0D0D` | Schrift, Linien |
| Gedämpft | `#63625E` | Beitexte, Datum, Maße |
| Fast weg | `#C9C9C7` | Waschungen, Trennlinien |
| **Rot** | `#D1232A` | **die einzige Farbe** |
| Dunkelrot | `#7E141A` | Tiefe im Rot, sparsam |

Rot ist die Heldenfarbe und liegt in einem Bild auf **einem** Element — meistens auf
dem roten Faden. Kein Leuchten, kein `boxShadow`. Tusche glüht nicht.

Für Nachtstimmung gibt es Richtung B: Grund `#1B1712`, Tusche `#EBE5D8`, gedämpft
`#A69C8C`, Rot `#A8232B`. Dann kippt multiply zu `screen`, weil die Zeichnungen auf
hellem Papier liegen. Nur nehmen, wenn ausdrücklich gewünscht.

## Schriften

Liegen als woff2 unter `assets/fonts/`, nichts nachladen, kein Google-Fonts-Aufruf:

- **Alegreya Sans** 300 für Überschriften (`--fd`, `--wtd: 300`), 400/500 für Fließtext.
  Große Zeilen mager setzen, `letterSpacing: "-0.01em"`, `lineHeight: 0.95`.
- **Alegreya** (Serife) für Zitate und Werktitel in Kursiv.
- Big Shoulders nur für Richtung C, hier fast nie.

Einbinden über `@font-face` mit `staticFile`, in `src/fonts.css` oder per
`<style>`-Tag im Root. Warte mit dem Rendern nicht auf `document.fonts` — Remotion
lädt die Schrift vor dem ersten Bild, wenn die Datei in `public/` liegt und
`delayRender` sie umschließt.

## Der rote Faden

Auf der Website läuft links eine rote Linie mit, die den Scrollfortschritt zeigt. Im
Film ist sie das Rückgrat der Bewegung: Sie zieht sich durch, verbindet Szenen und ist
in jeder Szene an einer anderen Stelle. Nutze sie als Schnittmotiv — die Linie wächst,
der Schnitt fällt auf ihr Ankommen. In den Zeichnungen selbst ist derselbe rote Strang
das Motiv; wenn Linie und Strang aufeinandertreffen, hat der Film seinen Höhepunkt.

## Ton

Die Zeichnungen sind still entstanden. Kein Wumms, kein Riser. Wenn Ton dazukommt:
Papier, Stiftgeräusche, Raumton aus dem Atelier, sehr leise. Lieber stumm liefern als
mit Standard-Whoosh — der allgemeine Skill drängt auf Sounddesign, das gilt hier nur,
wenn Luke Ton ausdrücklich will.

## Vorhandene Dateien

Kopiere sie nach `video/public/`, referenziere mit `staticFile()`:

**Zeichnungen** (Tusche auf Papier, für multiply)
- `assets/img/werk-1-profil-1900.jpg` — 1900×3085, Profil mit rotem Strang. Werk I.
  Kleinere Fassungen `-1200`, `-800`.
- `assets/img/werk-2-auge-1800.jpg` — 1800×480, Auge am Ende einer langen Linie, mit
  Signatur. Werk II. Quer, gut für Bauchbinden und Abspann.

**Zeichenanimationen** (das Entstehen, bestes Material für Schnitte)
- `assets/video/werk-1-profil-zeichnung.mp4` — 6,0 s, 432×704, Werk I baut sich auf.
  `.webm` daneben, `-alt.mp4` ist eine frühere, längere Fassung (8,6 s).
- `assets/video/werk-2-auge-signatur.mp4` — 15,0 s, 1072×272, Auge und Signatur.
  Das Ende ist die Signatur — dorthin gehört der Abspann.

**Porträt**
- `assets/img/luke-atelier-1536.jpg` — 1536×2048, Luke mit Pinsel und Palette im
  Atelier, Schwarzweiß, hartes Lampenlicht. Kein multiply, das ist eine Fotografie.
  Ken Burns langsam, Kontrast leicht anheben, damit es zur Tusche passt.

Werkdaten (Titel, Jahr, Technik, Maße) stehen in `js/works.js` unter `LUKE.WERKE` —
Titel im Film von dort übernehmen, nicht neu erfinden.

## Formate

- **9:16, 1080×1920** für Story und Reel. Standard für Ankündigungen.
- **16:9, 1920×1080** für die Schleife im Studio und für die Website.
- 30 fps. Länge: Ankündigung 15 s, Werkschau 30–40 s, Studioschleife 60 s und nahtlos.

Bei 9:16 die Zeichnungen nicht beschneiden: Werk I ist hochkant und passt, Werk II ist
sehr breit und braucht eine eigene Einstellung, in der die Linie horizontal durchs Bild
fährt.

## Ablauf

1. Format, Länge und Anlass klären. Gibt es einen Termin (Vernissage, Ausstellungsende),
   steht er als letzte Tafel.
2. `video/` ist das Projekt. Assets nach `video/public/`, Komposition in
   `video/src/Root.tsx` anmelden.
3. Szenen aus den Mustern in `remotion-motion-graphics/references/motion-patterns.md`
   bauen, mit den Regeln von oben.
4. Rendern. In dieser Umgebung lädt Remotion kein Chromium herunter, der Pfad muss mit:

```bash
cd video
npx remotion render src/index.ts Werkschau out/werkschau.mp4 \
  --codec h264 --crf 17 \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
```

5. Prüfen, und zwar mit Augen. Einzelbilder ziehen und ansehen:

```bash
for f in 20 60 120 200 300; do
  npx remotion still src/index.ts Werkschau out/pruef_$f.png --frame $f --overwrite \
    --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
done
```

Worauf es hier besonders ankommt, zusätzlich zur Liste im allgemeinen Skill:
- Liegt wirklich kein weißer Kasten hinter einer Zeichnung? (multiply vergessen)
- Ist Rot nur an einer Stelle im Bild?
- Steht die Schrift mager genug, oder ist versehentlich Systemfett eingesprungen?
- Bleibt Papier Papier — keine Verläufe, keine Vignette, die nach Studiolicht aussieht.

6. Für Instagram-Stories und Presse eine GIF-Fassung: `scripts/make-gifs.sh` im
   Wurzelverzeichnis nimmt jede Videodatei entgegen und legt sie nach `assets/gif/`.

## Dateigröße: die Körnung im Auge behalten

Papier plus Körnung sieht ruhig aus, ist für den Encoder aber teuer. Wandert die Körnung in
jedem Bild, muss jedes Pixel neu kodiert werden, und aus 32 Sekunden werden schnell 30 MB.
Deshalb springt sie in `Papier.tsx` nur jedes dritte Bild weiter; man sieht keinen
Unterschied, die Datei wird um ein Vielfaches kleiner. Beim Rendern reicht `--crf 19`: Bei
so wenig Farbe im Bild ist der Unterschied zu `--crf 17` nicht zu sehen.

Wenn eine Datei trotzdem zu groß wird, zuerst die Körnung prüfen, nicht die Auflösung
senken. Die Zeichnungen leben von den feinen Linien.

## Wenn ein bestehendes Video angepasst wird

`video/src/` ganz lesen, `src/theme.ts` ist die einzige Quelle für Farben und Kurven.
Erst Verstöße gegen die Regeln oben aufräumen, dann die neue Anforderung bauen. Nie
eine Farbe direkt in eine Szene schreiben.
