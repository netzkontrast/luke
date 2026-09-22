# Offene Punkte (aus den Umsetzungsnotizen des Prototyps)

Vor Veröffentlichung klären beziehungsweise erledigen. Die Fragen, die nur Luke beantworten kann,
stehen gesammelt und zum Weiterleiten in `docs/fragen-an-luke.md`.

- [ ] **Veröffentlichen — die Seite geht zu Strato, nicht zu Vercel** (entschieden am 22. September 2026). Die
      Datenschutzerklärung nennt seitdem die STRATO GmbH als Hoster. Zu tun: Webspace einrichten und die Dateien
      hochladen, die in der README unter „Veröffentlichen“ stehen. Impressum und Datenschutzerklärung sind
      ausgefüllt und stehen dem nicht mehr im Weg; eine rechtliche Durchsicht bleibt Sache des Verantwortlichen.

- [ ] **Auftragsverarbeitungsvertrag mit Strato.** Wer eine Seite hosten lässt, lässt IP-Adressen durch fremde
      Hände gehen; Art. 28 DSGVO verlangt dafür einen Vertrag. Strato stellt ihn im Kundenkonto bereit, er muss
      nur abgeschlossen werden. Auf der Seite steht dazu nichts — er gehört nicht in die Erklärung, sondern in
      die Unterlagen.

- [ ] **Cache-Kopfzeilen für Strato.** `vercel.json` regelt Cache-Control und die Sicherheits-Kopfzeilen; auf
      einem Apache-Webspace liest das niemand. Ohne eine `.htaccess` mit denselben Regeln gehen die Schriften
      (ein Jahr, `immutable`) und die Bilder (eine Woche) ohne Cache-Vorgabe raus, und jeder Besuch lädt sie neu.
      Die Datei `vercel.json` bleibt liegen: Die Vorschau an den Pull Requests nutzt sie weiter.

- [ ] **Vercel-Anbindung klären.** Am Repository hängt weiter das Vercel-Projekt `luke` (Team `lukewtf`), das zu
      jedem Pull Request eine Vorschau baut. Als Vorschau ist das nützlich; als zweite, halb vergessene
      Auslieferung derselben Seite ist es eine Stelle, an der die Werkschau ungewollt öffentlich werden kann.
      Derzeit steht sie unter Zugriffsschutz — ein Abruf landet auf Vercels Anmeldung. Ob eine eigene Domain
      darauf zeigt, war von hier aus nicht einzusehen (die Vercel-API verweigert den Zugriff auf das Team).

- [ ] **Grafik: zwei Lücken bleiben.** Vom 22. September ist beantwortet: „NOX“ gehört zum NOX-Podcast von Kiya
      Noir und Luke (2025); die Jahre der drei Marken lauten Spleen 2026, Wortmarke „Noir“ 2022, Signet
      „Kollektiv Noir“ 2023; mitgenannt werden muss niemand, alles ist von ihm allein. Offen bleiben der Name der
      Band zu „Requiem: Zerfall“ (das Logo ist nicht zu lesen) und die Jahre der beiden Cover — Lukes Antwort 11
      beantwortete die Jahresfrage statt der Bandfrage, seine „12. 2026“ lässt sich keiner Arbeit sicher zuordnen.
      Beides steht in `docs/fragen-an-luke.md`. Auch die Zuordnung der drei Jahre zu den drei Marken ist
      erschlossen, nicht gesagt: Er schrieb „Spleen 2026, Noir 2022 und Kolektiv 2023“.
- [ ] **Signet Kollektiv Noir als Vektor.** Die Datei hat 7441 × 8268 Bildpunkte, ist aber hochgerechnet und
      unscharf. Für die Seite reicht es; eine SVG- oder PDF-Fassung vom Kollektiv wäre besser.

- [ ] **Kontaktkarte und Lukes Schlusssatz.** Sein Text endet mit einer Einladung („Wenn du ein Werk oder
      Tätowierung … suchst, bist du bei mir richtig“); die Karte darunter nennt als Anlass nur Ausstellungen,
      Arbeiten auf Papier und Grafik. Der Weg ist derselbe (Direktnachricht an @lukewtf), die Aufzählung ist es
      nicht. Ob die Karte das Tätowieren mitnennen soll, entscheidet Luke — ungefragt erweitert die Seite ihren
      Zweck nicht.

- [ ] **Instagram: welcher Account?** Die Seite verlinkt an drei Stellen @lukewtf (Kontaktkarte, Fuß, Film). Auf
      die Frage nach dem Namen im Kopf antwortete Luke am 22. September: „Ja bitte L.M. Klvser lassen, lukewtf is
      reines Tattoo Ding.“ Wenn der Account rein fürs Tätowieren ist, zeigt die Werkschau auf den falschen; ein
      zweiter Account @lmklvser ist aus dem Instagram-Beitrag zu Werk I und II bekannt und laut seiner Antwort 9
      ebenfalls er. Gesagt hat er dazu nichts, darum bleibt @lukewtf vorerst stehen.

- [ ] **Richtung festlegen**: A, B oder C (siehe README, Bedienfeld mit Shift + B). Standard ist A.

Bereits umgesetzt:

- [x] **Lukes Antworten eingearbeitet** (22. September 2026). Impressum und Datenschutzerklärung tragen Namen
      (Lukas M. Klüser), E-Mail (lukewtf@web.de) und Datum; ein Abschnitt zur Umsatzsteuer steht nicht mehr da,
      weil es keine Nummer gibt und § 5 DDG sie nur dann verlangt. Die Anschrift bleibt die des Studios — diesen
      Teil der Frage hat Luke nicht beantwortet, entschieden wurde es ohne ihn. Alle Werke stehen auf „Tusche,
      Acryl und digitale Medien“, die Maße sind raus (es gibt keine), „We Riot Gallery“ mit zwei l. Die
      Vercel-Angaben in der Datenschutzerklärung sind aus Vercels eigener Dokumentation belegt: zertifiziert unter
      dem EU-US Data Privacy Framework, Protokolle je nach Tarif eine Stunde bis drei Tage einsehbar. Geprüft ist
      damit Vercels eigene Auskunft, nicht die amtliche DPF-Liste.

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

- [x] **Werkschau statt Studioseite.** Anfrage und Ablauf, Flash, der Träger „Haut“ mit Reitern, Filtern und
      Waschung, die Teamliste, Telefon, Termine und der Podcast im Fuß sind raus. „Studio“ heißt jetzt „Atelier“:
      das Foto und Kontakt über Instagram. Kein Formular mehr, also auch keins in der Datenschutzerklärung.

- [x] **Blutspur aus PR #2** übernommen: Canvas, Tabelle je Abschnitt, Stauung, Spritzer, trocknet vor dem Atelier.
- [x] **Auftakt:** Das Video bleibt mit seinem letzten Bild stehen; die kniende Figur legt sich daneben (ab 1100 px)
      oder liegt blass im Hintergrund.
- [x] **Handschrift als Bildfolge** statt gespultem Video: läuft auf jedem Gerät. Danach blickt das Auge dem Zeiger
      nach; dasselbe Auge sitzt in der Kopfleiste. Der Name ist die Signatur.
- [x] **Neuordnung des Speichers** ohne Holz, die Blätter tauschen die Plätze.
- [x] **Film, Werk I** (11. September 2026). Die zweite Szene zeigte das Profil mit dem roten Strang unter der
      Beschriftung von Werk I, mit Ausstellungszeile. Jetzt stehen dort die drei Blätter von Werk I als Reihe, gleich
      hoch, wie in der Hängung der Seite; sie legen sich nacheinander ab, die Beschriftung kommt zuletzt („Tusche auf
      Papier, drei Blätter, 2026“). Das Profil bleibt Material des Auftakts und heißt im Film nicht mehr Werk I.

- [x] **Kopfleiste auf dem Telefon.** Name und vier Einträge brauchten 427 px, „Atelier“ stand auf jedem Telefon
      halb unter dem Verlauf. Jetzt passt die Leiste ab 360 px in eine Zeile; darunter scrollt sie wie vorher.
- [x] **Handschrift in der Kopfleiste.** Die Einträge stehen links, rechts schreibt sich nach dem Laden die
      Handschrift (Linie, Signatur, Auge), dann folgt das Auge dem Zeiger. Die Leiste ist auf dem Schreibtisch dafür
      rund 100 px hoch (Zeichnung 315 × 80), auf dem Telefon bleibt sie schmal. Im Abschnitt Handschrift steht die
      Zeichnung jetzt als Standbild. Sprungziele rechnen mit der höheren Leiste.
- [x] **Blattfolge kürzer.** 48 svh je Blatt (Telefon 44) statt 70 (60): Die Bühne nahm über zwei Fünftel der
      Seite ein, bevor ein Werk mit Titel zu sehen war. Das Tempo gibt weiter die Zeit vor.
- [x] **Prüfung läuft auch unter Windows.** `scripts/pruefen.mjs` nimmt `playwright-core` und das installierte
      Chrome oder Edge (Aufruf im Kopf der Datei). Drei Prüfungen des Auges warteten eine feste Zeit und fielen im
      vollen Lauf gelegentlich durch; sie warten jetzt, bis das Auge hinsieht oder sich umsieht. Alle 49 in Ordnung.
- [x] **Ankündigung zur Vernissage.** `video/`, Komposition `Vernissage`, 15 s, 9:16: die beiden Werke
      untereinander (je Werk eine `Haengung`), dann die Tafel mit Ausstellung, Ort, Vernissage, Enddatum und
      @lukewtf. Rot steht nie zweimal im Bild: Der Faden kommt erst, wenn die Blätter fort sind. Termine und Ort stehen
      jetzt in `LUKE.CONFIG.ausstellung` (js/works.js); Abspann und Ankündigung lesen von dort. Ob sie so raus darf,
      fragt `docs/fragen-an-luke.md`.

Beim nächsten Durchgang anzusehen:

- Das Auftaktvideo war mit 1,7 MB (VP9) beziehungsweise 1,8 MB (H.264) der größte Posten beim Laden. Jetzt steht AV1
  vorn: 0,99 MB bei kaum sichtbarem Unterschied (PSNR 37,2 gegen 38,8 dB beim H.264; `scripts/videos.sh`). Eine
  Bildfolge statt des Videos wurde gemessen und verworfen: Die Zeichnung verwandelt sich, alle Striche bewegen sich
  in jedem Bild, 145 Bilder als WebP wären 4 MB. Das Korn per AV1 nachzubilden (film-grain) spart noch einmal ein
  Viertel, glättet aber die dichte Schraffur sichtbar — eine Entscheidung für Luke, nicht für ein Skript.
- Nach dem Schnitt hängt die Tropfspur rund 7 % der Blatthöhe unter der Tusche der knienden Figur in der Luft: Der
  Strang des Videos tritt an der Unterkante aus, die Figur endet höher. Wollte man das schließen, müsste das Standbild
  unten beschnitten werden (Datei), nicht die Spur verschoben.
- Film, Auftakt: Hinter dem Zeichenvideo steht ein Kasten, heller als das Papier (Einzelbilder 100 und 145, in beiden
  Formaten). multiply kann nur abdunkeln, also greift es dort nicht; bei `OffthreadVideo` in `BlattVideo` nachsehen.
  Im Querformat läuft außerdem der rote Faden durch „Luke WTF“ und die Unterzeile.
