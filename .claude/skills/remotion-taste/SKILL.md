---
name: remotion-taste
description: Die Geschmacksprüfung für Bewegtbild in diesem Projekt. Sie sorgt dafür, dass ein mit Remotion gebautes Video nicht nach KI-Video aussieht: erst der Design Read, dann drei Regler, dann die Liste der Muster, an denen man generierte Videos sofort erkennt, zuletzt ein Prüflauf an echten Einzelbildern. Nutze diesen Skill bei jedem Video, Clip, Trailer, Teaser, jeder Reel, Story oder Studioschleife in diesem Repository, ebenso wenn ein bestehender Film überarbeitet, verlängert oder in ein anderes Format gebracht wird, und immer dann, wenn jemand sagt, ein Video wirke billig, generisch, langweilig, unfertig oder wie von der KI gemacht. Auch ohne das Wort Remotion. Vor der ersten Zeile Videocode lesen, und noch einmal vor der Abgabe.
---

# Remotion, Geschmacksprüfung

Drei Skills greifen ineinander:

| Skill | Antwortet auf |
| --- | --- |
| `remotion-motion-graphics` | Wie baut man das technisch? Federn, Staffelung, Ken Burns, Körnung. |
| `werkschau-video` | Was gilt für Luke? Palette, Schriften, Dateien, Formate. |
| **dieser Skill** | Ist es gut? Und woran merkt man, dass es das nicht ist? |

Remotion ist nie das Problem. Code kann das Modell. Was fehlt, ist Urteil: wann etwas
stehen bleiben darf, wann eine Farbe zu viel ist, wann eine Bewegung nur Bewegung ist.

## 1. Design Read, ein Satz, vor dem ersten Code

Bevor irgendetwas gebaut wird, wird die Aufgabe in einem Satz gelesen:

> **„Ich lese das als: \<Sorte Film> für \<Publikum>, in \<Sprache>, mit \<Regler>.“**

Beispiele aus diesem Projekt:

- „Ich lese das als: Ausstellungsteaser für Galeriebesucher und Instagram, in der
  Tuschesprache der Website, mit Varianz 8, Bewegung 5, Dichte 2.“
- „Ich lese das als: Studioschleife für Leute im Wartebereich, ohne Ton, ruhig, endlos,
  mit Varianz 5, Bewegung 3, Dichte 2.“
- „Ich lese das als: Terminankündigung für die Story, 15 Sekunden, eine Aussage, ein
  Datum, mit Varianz 6, Bewegung 6, Dichte 1.“

Der Satz wird ausgesprochen, nicht gedacht. Er verhindert den häufigsten Fehler: sofort in
eine Standardästhetik zu springen, statt die Aufgabe zu lesen. Ist die Aufgabe wirklich
mehrdeutig, wird **eine** Frage gestellt, nicht drei.

## 2. Drei Regler

| Regler | 1 | 10 | Was er steuert |
| --- | --- | --- | --- |
| **Varianz** | strenge Symmetrie | freie Komposition | Achsen, Ränder, Asymmetrie |
| **Bewegung** | Standbild | dauernd in Fahrt | Amplitude, Tempo, Parallaxe |
| **Dichte** | Galerie, viel Luft | vollgepackt | Elemente pro Bild, Zeilen, Text |

**Voreinstellung für dieses Projekt: 8 / 5 / 2.** Viel Luft, wenig gleichzeitig, klare
Asymmetrie, ruhige Bewegung. Die Zeichnungen sind laut genug.

Warum Bewegung nur 5: Tusche fällt, sie springt nicht. Federn ohne Überschwingen,
keine Wackler, keine Rotationen zum Spaß. Wer den Regler höher dreht, muss sagen warum.

Ab Varianz 5 ist die zentrierte Bildmitte tabu, außer beim Schlussbild einer Ankündigung.
Dort ist die Mitte richtig, weil die Nachricht selbst die Gestaltung ist.

## 3. Woran man generierte Videos erkennt

Das sind die Muster, die ein Modell von allein produziert. Jedes einzelne ist hier
verboten, solange es nicht ausdrücklich verlangt wird.

**Bewegung**
- Lineare Interpolation. Jedes `interpolate` bekommt eine Kurve und `clamp` auf beiden Seiten.
- Reines Aufblenden. Ein Eintritt bewegt zwei bis drei Eigenschaften zusammen.
- Alles zugleich. Listen, Zeilen, Kacheln kommen versetzt, drei bis sechs Bilder Abstand.
- Kein Austritt. Was hereinkommt, geht auch wieder, und zwar schneller als es kam.
- Dauerbewegung. Ohne Stillstand wirkt alles billig. Mindestens drei Momente, in denen
  nichts passiert, mindestens eine halbe Sekunde lang.
- Endlos kreisende Schleifen im Hintergrund, die nichts erzählen.

**Farbe und Fläche**
- Verlaufsflächen als Hintergrund, besonders Violett und Blau. Hier ist der Grund Papier.
- Leuchten und Schlagschatten. Tusche glüht nicht.
- Mehr als eine Farbe. Rot ist die einzige, und pro Bild trägt sie ein Element.
- Vignetten, die nach Fotostudio aussehen.

**Schrift**
- Riesige fette Überschriften, die nur laut sind. Hierarchie kommt über Schnitt und Farbe.
- Systemschrift für die Hauptzeile.
- Gedankenstriche auf dem Bild. Kein `—`, kein `–`. Punkt, Komma, Zeilenumbruch oder
  Haarlinie. Auf der Website steht der Gedankenstrich, im Bild nicht: Dort liest er sich
  als Füllzeichen.
- Nummerierte Rubriken als Zierde („01 / Werke“). Werknummern aus dem Verzeichnis sind
  etwas anderes, die sind echt.
- Zähler, die auf runde Wunschzahlen laufen.

**Aufbau**
- Drei gleich große Kacheln nebeneinander.
- Erfundene Zahlen, erfundene Namen, erfundene Werke. Es gibt ein Werkverzeichnis in
  `js/works.js`, daraus wird zitiert.
- Emoji als Symbole.
- Standard-Whoosh unter jedem Schnitt. Zu diesen Zeichnungen gehört Stille oder
  Raumton, sonst nichts.

## 4. Was gute Bewegung hier ausmacht

- **Das Material führt.** Die stärksten Bilder im Film sind die Zeichenvideos: Man sieht
  eine Zeichnung entstehen. Kein Effekt schlägt das. Erst das Material schneiden, dann
  überlegen, ob noch Bewegung fehlt.
- **Eine Bewegung pro Schnitt.** Wenn der rote Faden wächst, bewegt sich sonst nichts.
- **Halten.** Nach jeder Bewegung stehen lassen, 15 bis 20 Bilder. Der Kontrast zwischen
  Fahrt und Stillstand ist das, was teuer aussieht.
- **Ränder respektieren.** Bei 9:16 bleibt Wichtiges in den mittleren 75 Prozent der Höhe.
  Nichts berührt den Bildrand, außer es fällt bewusst randabfallend an.
- **Ein Gedanke pro Einstellung.** Wer zwei Aussagen gleichzeitig zeigt, zeigt keine.

## 5. Prüflauf, mit Augen

Kein Film wird abgegeben, ohne dass Einzelbilder angesehen wurden. Beschreiben zählt nicht.

```bash
cd video
CH=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
for f in 40 200 430 600 720 920; do
  npx remotion still src/index.ts Werkschau out/pruef_$f.png --frame $f --overwrite \
    --browser-executable=$CH
done
```

Mindestens ein Bild pro Szene, dazu ein Bild aus jeder Überblendung. Bei zwei Formaten
beide prüfen: Was im Querformat sitzt, kollidiert im Hochformat oft mit der Schrift.

Ein Diagnosetrick, wenn eine Zeichnung nicht richtig auf dem Papier sitzt: In `theme.ts`
das Papier vorübergehend auf `#808080` setzen und ein Einzelbild rendern. Bleibt die Fläche
der Zeichnung grau, greift `multiply`; erscheint ein weißer Kasten, fehlt es.

## 6. Liste vor der Abgabe

- [ ] Der Design Read ist ausgesprochen und die Regler stehen begründet.
- [ ] Keine lineare Kurve, jedes `interpolate` beidseitig geklemmt.
- [ ] Eintritte mit zwei bis drei Eigenschaften, gestaffelt, mit Austritt.
- [ ] Mindestens drei Momente Stillstand.
- [ ] Jedes Standbild hat Ken Burns, keine Zeichnung wird dabei angeschnitten.
- [ ] Zeichnungen liegen mit `multiply` auf dem Papier, kein weißer Kasten.
- [ ] Rot an genau einer Stelle pro Bild.
- [ ] Kein Verlauf, kein Leuchten, keine Vignette nach Studiolicht.
- [ ] Schrift mager, lokal geladen, kein Systemfallback.
- [ ] Kein Gedankenstrich auf dem Bild.
- [ ] Alle Titel und Jahre stammen aus `js/works.js`.
- [ ] Bei 9:16: nichts Wichtiges in den äußeren Bändern.
- [ ] Einzelbilder aus beiden Formaten gerendert und angesehen, Fehler behoben,
      danach erneut gerendert und erneut angesehen.
- [ ] Dateigröße geprüft. Wird sie groß, zuerst die Körnung ansehen, nicht die Auflösung.

Wenn eine Zeile nicht abgehakt werden kann, wird sie genannt, nicht übergangen.
