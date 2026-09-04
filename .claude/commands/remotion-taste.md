---
description: Bewegtbild für dieses Projekt bauen oder prüfen, mit der Geschmacksprüfung für Remotion
argument-hint: [Anlass, Format und Länge, z. B. "15s Story zur Vernissage" oder "prüfe den bestehenden Film"]
---

Anliegen: $ARGUMENTS

Arbeite die Geschmacksprüfung für Bewegtbild in diesem Repository ab. Lies dazu zuerst
diese drei Skills, in dieser Reihenfolge:

1. `.claude/skills/remotion-taste/SKILL.md` — das Urteil: Design Read, Regler, die Muster
   generierter Videos, die Liste vor der Abgabe.
2. `.claude/skills/werkschau-video/SKILL.md` — was für Luke gilt: Palette, Schriften, die
   multiply-Regel, der rote Faden, die vorhandenen Dateien, Formate.
3. `.claude/skills/remotion-motion-graphics/SKILL.md` — das Handwerk, samt
   `references/motion-patterns.md` für die Bausteine.

Dann:

- Sprich den Design Read in einem Satz aus und nenne die drei Regler mit Begründung.
- Ist kein Anliegen angegeben, prüfe den bestehenden Film unter `video/` gegen die Liste
  vor der Abgabe und melde, was nicht stimmt.
- Baust du etwas Neues, arbeite in `video/`. Werkdaten kommen über
  `node scripts/werke-uebernehmen.mjs` aus `js/works.js`, Bilder und Videos über
  `npm run assets` aus `assets/`. Nichts davon von Hand kopieren.
- Rendere Einzelbilder, sieh sie dir an, behebe was du siehst, rendere erneut. Erst danach
  den ganzen Film.
- Zum Schluss die Liste vor der Abgabe durchgehen und offene Punkte benennen.
