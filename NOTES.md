# Offene Punkte (aus den Umsetzungsnotizen des Prototyps)

Vor Veröffentlichung klären beziehungsweise erledigen:

- [ ] **Impressum** nach § 5 DDG ausfüllen (`impressum.html`): Name, Anschrift, E-Mail, ggf. USt-IdNr.
- [ ] **Datenschutzerklärung** prüfen und ergänzen (`datenschutz.html`): Hoster, Formularweg, Speicherdauer, Datum.
- [ ] **Urheberschaft Werk I / Werk II** klären (Beitrag laut Instagram geteilt mit @lmklvser). Die Zuordnung der beiden
      hochgeladenen Zeichnungen (Profil mit rotem Strang = Werk I, Auge mit Signatur = Werk II) ist eine Annahme.
- [ ] **Titel, Reihenfolge und Jahr der Werke III bis VII** bestätigen. Die vier Blätter mit Strang laufen als
      „Befreiung der Körperlichkeit, Werk III“ bis „Werk VI“ weiter, das Blatt mit den zwölf Köpfen heißt vorläufig
      „Zwölf Köpfe“ und liegt unter „Tuschstudien“. Alle fünf stehen auf 2026. Reihenfolge, Titel und Jahr sind gesetzt,
      nicht gewusst; Änderungen gehören in `js/works.js`, danach `node video/scripts/werke-uebernehmen.mjs`.
- [ ] **Grafik: Auftraggeber und Jahre bestätigen.** Eingetragen ist, was auf den Blättern steht. Offen: der Name
      der Band zu „Requiem: Zerfall“ (das Logo ist nicht zu lesen), die Jahre von Signet und Clubnacht, und ob bei
      den Auftragsarbeiten jemand mitgenannt werden muss.
- [ ] **Podcast verlinken.** Der Fuß nennt „Bluthandwerk — Nicht noch ein Tattoo-Podcast!“, im Abschnitt Grafik steht
      das Titelbild. Sobald es eine Adresse gibt, gehört sie an beide Stellen.
- [ ] **Einwilligung** der tätowierten Personen schriftlich einholen, bevor Werkfotos (Haut) eingesetzt werden.
- [ ] **Echte Werkfotos** für die Platzhalter VIII bis XIV (Arbeiten auf Haut) und die Flash-Blätter einsetzen
      (siehe README). Auf Papier gibt es keine Platzhalter mehr.
- [ ] **Maße** der Papierarbeiten eintragen (`masse: 'Maße folgen'`).
- [ ] **Öffnungszeiten und Anfahrt** im Studio-Block ergänzen („Anfahrt: Angabe folgt“).
- [ ] **Formularversand** festlegen (`formEndpoint` oder `formEmail` in `js/works.js`); bis dahin zeigt die Seite den
      Anfragetext zum Kopieren für die Instagram-DM.
- [ ] **Team-Profile** (Kiya Noir, Jonas Dreyer, Kate Velvet, Stefan Gepting): „Profil folgt“.
- [ ] **Ton für den Film** entscheiden: derzeit stumm. Wenn Ton, dann Raumton aus dem Atelier
      und Stiftgeräusche, kein Standard-Whoosh.
- [ ] **Richtung festlegen**: A, B oder C (siehe README, Bedienfeld mit Shift + B). Standard ist A.

Bereits umgesetzt:

- [x] Schriften lokal gehostet (kein Google-Fonts-Aufruf, vgl. LG München I, 2022).
- [x] Keine Instagram-Einbettung, nur Links.
- [x] Streifen „Aktuell“ blendet sich nach dem 27. 9. 2026 automatisch aus.
- [x] three.js lokal aus `vendor/`, CDN nur als Rückfallebene.
- [x] Reduzierte Bewegung (Systemeinstellung) wird respektiert.
- [x] Werkansicht mit Tastatur bedienbar (Escape, Pfeiltasten, Fokusfalle).
- [x] Film zur Werkschau unter `video/`, in 16:9 und 9:16, mit denselben Werkdaten wie die Seite.
- [x] Sieben Papierarbeiten liegen als Aufnahme vor: Werk I bis VI und die zwölf Köpfe.
- [x] Abschnitt Grafik mit fünf Auftragsarbeiten: Podcast-Titelbild, Plakat, zwei Signets, ein Albumcover.

Beim nächsten Durchgang anzusehen:

- Zwischen Kapitel 1 und 2 sowie zwischen 2 und 3 steht die Blättersequenz (`js/werk-sequenz.js`) kurz leer:
  Die Gruppen liegen 18 Einheiten auseinander, sichtbar ist ein Fenster von ±7,5. Wer langsam scrollt, sieht
  dort nur den roten Faden auf Weiß. Entweder die Fenster verbreitern oder die Gruppen enger legen.
- Sechs Papierblätter im Hochformat untereinander machen die Galerie auf dem Schreibtisch lang. Ein zweites
  Raster für die Serie wäre eine Überlegung wert, sobald Fotos der Hautarbeiten dazukommen.
