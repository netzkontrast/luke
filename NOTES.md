# Offene Punkte (aus den Umsetzungsnotizen des Prototyps)

Vor Veröffentlichung klären beziehungsweise erledigen:

- [ ] **Impressum** nach § 5 DDG ausfüllen (`impressum.html`): Name, Anschrift, E-Mail, ggf. USt-IdNr.
- [ ] **Datenschutzerklärung** prüfen und ergänzen (`datenschutz.html`): Hoster, Formularweg, Speicherdauer, Datum.
- [ ] **Urheberschaft Werk I / Werk II** klären (Beitrag laut Instagram geteilt mit @lmklvser). Welche Blätter Werk I
      und Werk II sind, steht seit den Originalen fest: je drei Blätter mit Strang, benannt von Luke. Das Profil mit
      dem roten Strang und das Auge mit der Signatur hat er als „Beiwerk“ geschickt, sie sind keine Werke.
- [ ] **Jahr der Papierarbeiten bestätigen.** Titel und Reihenfolge kommen jetzt von Luke (Dateinamen der
      Originale): „Befreiung der Körperlichkeit“, Werk I und Werk II mit je Bild 1 bis 3, dazu „Ansichten“ und
      „Neuordnung des Speichers“. Gesetzt, nicht gewusst, sind noch: das Jahr (überall 2026), die Werknummern III und
      IV für die beiden Einzelblätter und die Reihenfolge dieser beiden. Änderungen gehören in `js/works.js`, danach
      `node video/scripts/werke-uebernehmen.mjs`.
- [ ] **Technik von „Ansichten“ prüfen.** Eingetragen ist „Farbe auf Papier“, weil sich Acryl und Gouache auf dem Foto nicht
      unterscheiden lassen. Wenn es feststeht, genauer eintragen.
- [ ] **Auflösung von „Ansichten“.** Die Vorlage kam mit 896 × 1195 Bildpunkten, nach dem Zuschnitt bleiben 828 × 1130. Das
      reicht für die Galerie, nicht für Druck. Bei Gelegenheit eine größere Aufnahme nachreichen.
- [ ] **Grafik: Auftraggeber und Jahre bestätigen.** Eingetragen ist, was auf den Blättern steht. Die Jahre der
      Plakate und Flyer sind erschlossen (jeder Termin fällt 2026 auf einen Samstag); bei Signets und Covern steht
      keins mehr, auch nicht die früher gesetzten 2025 und 2026. Offen: für wen „NOX“ ist, der Name der Band zu
      „Requiem: Zerfall“ (das Logo ist nicht zu lesen), die Jahre der Signets und Cover, und ob bei den
      Auftragsarbeiten jemand mitgenannt werden muss.
- [ ] **Signet Kollektiv Noir als Vektor.** Die Datei hat 7441 × 8268 Bildpunkte, ist aber hochgerechnet und
      unscharf. Für die Seite reicht es; eine SVG- oder PDF-Fassung vom Kollektiv wäre besser.
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
- [x] Motion 13 lokal aus `vendor/motion/`, keine Bibliothek vom CDN.
- [x] Reduzierte Bewegung (Systemeinstellung) wird respektiert.
- [x] Werkansicht mit Tastatur bedienbar (Escape, Pfeiltasten, Fokusfalle).
- [x] Film zur Werkschau unter `video/`, in 16:9 und 9:16, mit denselben Werkdaten wie die Seite.
- [x] Vier Papierarbeiten im Verzeichnis, zehn Blätter: „Befreiung der Körperlichkeit“, Werk I und Werk II zu je
      drei Blättern, „Ansichten“ und „Neuordnung des Speichers“.
- [x] Drei Blätter tragen die Gestaltung, ohne im Verzeichnis zu stehen: das Profil mit dem roten Strang, das
      Auge mit der Signatur und die kniende Figur. Sie liegen unter `LUKE.GESTALTUNG` und heißen `gestaltung-*`,
      damit die Rolle am Dateinamen ablesbar ist.
- [x] Abschnitt Grafik mit elf Auftragsarbeiten: zwei Plakate, drei Flyer, Podcast-Titelbild, Albumcover, drei
      Signets und eine Wortmarke.
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

- [x] **Originale vom Auftraggeber übernommen** (11. September 2026). Alle 26 Dateien liegen unter
      `assets/original/` mit sprechendem Namen; die Zuordnung zu Lukes Dateinamen steht in
      `assets/original/LIESMICH.md`. Neu dazu: Werk I Bild 3, Werk II Bild 2 und sechs Grafiken (zwei Signets, ein
      Plakat, drei Flyer). Der Ordner `scoureimages/` ist darin aufgegangen.
- [x] **Bilder aus einem Skript.** `scripts/bilder.py` leitet alles aus den Originalen ab und schreibt WebP in zwei
      bis vier Breiten, dazu `js/bilder.js` mit den Maßen. Die Papierarbeiten werden dabei zugeschnitten und
      gleichmäßig auf Weiß gezogen, auch in den Ecken. `assets/img/` ist trotz acht Bildern mehr von 5,9 auf 4,5 MB
      geschrumpft; das Standbild im Kopf der Seite von 178 auf 82 kB.
- [x] **Werke als Hängung.** Werk I und Werk II stehen als Reihen aus drei gleich hohen Blättern, alle Werke in
      derselben Höhe. Die Werkansicht blättert Blatt für Blatt und zeigt die Blätter des Werks als Leiste; die
      Blattfolge zieht sieben Blätter vorbei, jedes mit „Bild x von 3“. Die Layout-Umschaltung im Bedienfeld
      (Mauerwerk, Bündig, Schiene) ist raus.
- [x] **Grafik als Plakatwand.** Elf Arbeiten in bündigen Reihen gleicher Höhe; die Karte nennt Titel, Gattung und
      Jahr, der Rest steht in der Werkansicht.

Beim nächsten Durchgang anzusehen:

- Ein zweites Raster für die Serie wäre eine Überlegung wert, sobald Fotos der Hautarbeiten dazukommen.
- Das Auftaktvideo ist mit 1,7 MB (VP9) beziehungsweise 1,8 MB (H.264) der größte Posten beim Laden. Ein
  Neukodieren aus `assets/original/` brachte bei gleicher Auflösung kaum etwas (H.264 CRF 24: 1,37 MB, VP9 CRF 34:
  sogar größer): Die Zeichenanimation hat viel feines Korn. Kleiner würde sie nur mit einem Neu-Render ohne Korn aus
  Remotion oder mit sichtbarem Qualitätsverlust — beides eine Entscheidung für Luke, nicht für ein Skript.
- Nach dem Schnitt hängt die Tropfspur rund 7 % der Blatthöhe unter der Tusche der knienden Figur in der Luft: Der
  Strang des Videos tritt an der Unterkante aus, die Figur endet höher. Wollte man das schließen, müsste das Standbild
  unten beschnitten werden (Datei), nicht die Spur verschoben.
