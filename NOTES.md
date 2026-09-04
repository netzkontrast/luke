# Offene Punkte (aus den Umsetzungsnotizen des Prototyps)

Vor Veröffentlichung klären beziehungsweise erledigen:

- [ ] **Impressum** nach § 5 DDG ausfüllen (`impressum.html`): Name, Anschrift, E-Mail, ggf. USt-IdNr.
- [ ] **Datenschutzerklärung** prüfen und ergänzen (`datenschutz.html`): Hoster, Formularweg, Speicherdauer, Datum.
- [ ] **Urheberschaft Werk I / Werk II** klären (Beitrag laut Instagram geteilt mit @lmklvser). Die Zuordnung der beiden
      hochgeladenen Zeichnungen (Profil mit rotem Strang = Werk I, Auge mit Signatur = Werk II) ist eine Annahme.
- [ ] **Titel, Reihenfolge und Jahr der Papierarbeiten bestätigen.** Die vier Blätter mit Strang laufen als
      „Befreiung der Körperlichkeit, Werk I“ bis „Werk IV“, das Farbblatt als „Kopf“, das Blatt mit den zwölf Köpfen
      als „Zwölf Köpfe“; die beiden letzten bilden die Serie „Köpfe“. Alle stehen auf 2026. Reihenfolge, Titel, Serie
      und Jahr sind gesetzt, nicht gewusst; Änderungen gehören in `js/works.js`, danach
      `node video/scripts/werke-uebernehmen.mjs`.
- [ ] **Technik von „Kopf“ prüfen.** Eingetragen ist „Farbe auf Papier“, weil sich Acryl und Gouache auf dem Foto nicht
      unterscheiden lassen. Wenn es feststeht, genauer eintragen.
- [ ] **Auflösung von „Kopf“.** Die Vorlage kam mit 896 × 1195 Bildpunkten, nach dem Zuschnitt bleiben 828 × 1130. Das
      reicht für die Galerie, nicht für Druck. Bei Gelegenheit eine größere Aufnahme nachreichen.
- [ ] **Grafik: Auftraggeber und Jahre bestätigen.** Eingetragen ist, was auf den Blättern steht. Offen: der Name
      der Band zu „Requiem: Zerfall“ (das Logo ist nicht zu lesen), die Jahre von Signet und Clubnacht, und ob bei
      den Auftragsarbeiten jemand mitgenannt werden muss.
- [ ] **Podcast verlinken.** Der Fuß nennt „Bluthandwerk — Nicht noch ein Tattoo-Podcast!“, im Abschnitt Grafik steht
      das Titelbild. Sobald es eine Adresse gibt, gehört sie an beide Stellen.
- [ ] **Einwilligung** der tätowierten Personen schriftlich einholen, bevor Werkfotos (Haut) eingesetzt werden.
- [ ] **Hautarbeiten und Flash fehlen ganz.** Die erfundenen Platzhalter sind raus: Die Seite zeigt nur noch, was es
      gibt. Damit sind auch die Reiter „Haut / Papier / Alles", die Filter nach Körperstelle und Motiv und der ganze
      Abschnitt „Flash" verschwunden — nicht gelöscht, sondern ausgeblendet. Sobald Einträge mit `src` in
      `LUKE.WERKE` (`tr: 'haut'`) oder in `LUKE.FLASH` stehen, kommt alles von selbst zurück, samt Kapitel in der
      Sequenz und Eintrag in der Navigation. Nichts davon muss von Hand wieder eingeschaltet werden.
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
- [x] Sechs Papierarbeiten im Verzeichnis: vier Blätter der Serie „Befreiung der Körperlichkeit“, „Kopf“ und
      „Zwölf Köpfe“.
- [x] Drei Blätter tragen die Gestaltung, ohne im Verzeichnis zu stehen: das Profil mit dem roten Strang, das
      Auge mit der Signatur und die kniende Figur. Sie liegen unter `LUKE.GESTALTUNG` und heißen `gestaltung-*`,
      damit die Rolle am Dateinamen ablesbar ist.
- [x] Abschnitt Grafik mit fünf Auftragsarbeiten: Podcast-Titelbild, Plakat, zwei Signets, ein Albumcover.
- [x] Keine erfundenen Inhalte mehr auf der Seite. Reiter, Filter, Sequenzkapitel und Abschnitte richten sich nach den
      Daten: Was leer ist, erscheint nicht.
- [x] Auch die Erzeuger sind raus. Aus dem Prototyp kamen drei: erzeugte Tuschzeichnungen für Werke und Flash
      (`js/site.js`), Tuschtexturen für die Sequenz (`js/werk-sequenz.js`) und dieselben für die Hintergrundbühne
      (`js/motion.js`). Die Bühne zeigt jetzt echte Blätter, die Sequenz auch. Rund achtzig Zeilen weniger.
- [x] Das Zeichen der Seite (`assets/img/favicon.svg`) ist neu: schwarze Tusche, roter Strang, weißer Grund. Das alte
      stammte aus dem Prototyp und trug noch dessen Papierton.
- [x] Der Seitenkopf zeigt die kniende Figur. Das Video zeigt weiter, wie das Profil entsteht: Das sind zwei Blätter,
      dazwischen liegt eine knappe Leerstelle, damit es als Schnitt gelesen wird und nicht als Verwandlung. Beide sind
      Gestaltung, keine Werke.

- [x] Die Tropfspur neu: Sie setzt dort an, wo der rote Strang im Auftakt das Blatt verlässt, läuft als Fläche
      mit wechselnder Breite statt als Strich, folgt dem Lesen mit Verzögerung, staut sich, wo man steht, und
      trocknet vor dem Formular (auf dem Telefon an der Kante von „Aktuell“). Der Zickzackfaden der Sequenz und
      die roten Punkte der Hintergrundbühne sind raus: ein Rot auf der Seite. Die Spur liest vom Weltzustand.

Beim nächsten Durchgang anzusehen:

- Der Weltzustand fährt auf der Seite die Tropfspur und die Kamera der Sequenz. `js/motion.js` liest die
  Scrollposition weiter selbst, weil seine Schleife das sanfte Radscrollen fährt und dabei selbst schreibt, was
  der Weltzustand danach liest; die Parallaxe, das Einblenden und das Signaturvideo hängen an dieser Schleife.
  Der nächste Schritt wäre, auch sie auf `LUKE.welt` zu setzen, ohne die Glättung zu verlieren.

- Zwischen Kapitel 1 und 2 sowie zwischen 2 und 3 steht die Blättersequenz (`js/werk-sequenz.js`) kurz leer:
  Die Gruppen liegen 18 Einheiten auseinander, sichtbar ist ein Fenster von ±7,5. Wer langsam scrollt, sieht
  dort nur den roten Faden auf Weiß. Entweder die Fenster verbreitern oder die Gruppen enger legen.
- Sechs Papierblätter im Hochformat untereinander machen die Galerie auf dem Schreibtisch lang. Ein zweites
  Raster für die Serie wäre eine Überlegung wert, sobald Fotos der Hautarbeiten dazukommen.
