---
description: Holt die nächste Stufe Bewegung für die Seite, Abschnitt für Abschnitt, nach der Geschmacksprüfung
argument-hint: [Abschnitt oder Anzahl, z. B. "Flash und Anfrage" oder "die nächsten drei"]
---

Ziel: $ARGUMENTS

Bring die Bewegung auf der Seite eine Stufe weiter. Nicht alles auf einmal, sondern die
nächsten Abschnitte, die es nötig haben.

Lies zuerst `.claude/skills/remotion-taste/SKILL.md`. Was dort über generierte Videos steht,
gilt hier für die Seite genauso: keine linearen Kurven, kein reines Aufblenden, nichts, was
gleichzeitig hereinkommt, keine Dauerbewegung ohne Ruhe, kein Leuchten, keine Verläufe.

Dann so vorgehen:

1. **Bestand aufnehmen.** Geh die Abschnitte von `index.html` der Reihe nach durch:
   Auftakt, Sequenz, Aktuell, Werke, Handschrift, Flash, Anfrage, Studio, Fuß. Notiere für
   jeden in einem Satz, was sich dort heute bewegt und was daran schwach ist. Ein Abschnitt,
   in dem nur `.rv` einblendet, ist ein Kandidat; ein Abschnitt, der schon eine eigene Idee
   hat, bleibt in Ruhe.

2. **Drei Vorschläge, nicht dreißig.** Wähl die drei Abschnitte mit dem größten Abstand
   zwischen Anspruch und Zustand. Beschreib je Abschnitt in zwei Sätzen, was passieren soll
   und warum es zu diesem Inhalt passt. Bewegung muss aus dem Material kommen: Tusche, die
   entsteht, eine Linie, die weiterläuft, ein Blatt, das aufliegt. Nicht aus dem Effektkasten.

3. **Umsetzen.** Vanilla, kein neues Fremdpaket. Was in `js/motion.js` schon läuft, wird
   mitbenutzt: Der Renderloop ist da, `LUKE.motion.on(fn)` hängt eine Funktion hinein.
   Zustände gehören in `css/site.css` neben die bestehenden, damit die drei Richtungen A, B
   und C weiter funktionieren.

4. **Schranken einhalten.**
   - Bei `prefers-reduced-motion` und bei `data-bewegung="aus"` bleibt alles stehen.
   - Kein zusätzliches Rot. Rot ist die Tropfspur und der Strang in den Zeichnungen.
   - Nichts, was den Text beim Lesen verschiebt.
   - Auf dem Telefon zuerst prüfen: Was dort ruckelt, fliegt raus.

5. **Nachsehen.** Mit Playwright Bilder von jedem geänderten Abschnitt ziehen, in 1440 und
   in 390 Pixel Breite, und sie ansehen. Konsole muss leer sein. Erst danach abgeben.

6. **Berichten.** Pro Abschnitt eine Zeile: was jetzt passiert, und was du bewusst gelassen
   hast.

Sind keine Abschnitte genannt, nimm die nächsten drei, die noch keine eigene Bewegung haben.
