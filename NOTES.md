# Offene Punkte (aus den Umsetzungsnotizen des Prototyps)

Vor Veröffentlichung klären beziehungsweise erledigen:

- [ ] **Impressum** nach § 5 DDG ausfüllen (`impressum.html`): Name, Anschrift, E-Mail, ggf. USt-IdNr.
- [ ] **Datenschutzerklärung** prüfen und ergänzen (`datenschutz.html`): Hoster, Formularweg, Speicherdauer, Datum.
- [ ] **Urheberschaft Werk I / Werk II** klären (Beitrag laut Instagram geteilt mit @lmklvser). Die Zuordnung der beiden
      hochgeladenen Zeichnungen (Profil mit rotem Strang = Werk I, Auge mit Signatur = Werk II) ist eine Annahme.
- [ ] **Einwilligung** der tätowierten Personen schriftlich einholen, bevor Werkfotos (Haut) eingesetzt werden.
- [ ] **Echte Werkfotos** für die Platzhalter III bis XII und die Flash-Blätter einsetzen (siehe README).
- [ ] **Maße** der Papierarbeiten eintragen (`masse: 'Maße folgen'`).
- [ ] **Öffnungszeiten und Anfahrt** im Studio-Block ergänzen („Anfahrt: Angabe folgt“).
- [ ] **Formularversand** festlegen (`formEndpoint` oder `formEmail` in `js/works.js`); bis dahin zeigt die Seite den
      Anfragetext zum Kopieren für die Instagram-DM.
- [ ] **Team-Profile** (Kiya Noir, Jonas Dreyer, Kate Velvet, Stefan Gepting): „Profil folgt“.
- [ ] **Richtung festlegen**: A, B oder C (siehe README, Bedienfeld mit Shift + B). Standard ist A.

Bereits umgesetzt:

- [x] Schriften lokal gehostet (kein Google-Fonts-Aufruf, vgl. LG München I, 2022).
- [x] Keine Instagram-Einbettung, nur Links.
- [x] Streifen „Aktuell“ blendet sich nach dem 27. 9. 2026 automatisch aus.
- [x] three.js lokal aus `vendor/`, CDN nur als Rückfallebene.
- [x] Reduzierte Bewegung (Systemeinstellung) wird respektiert.
- [x] Werkansicht mit Tastatur bedienbar (Escape, Pfeiltasten, Fokusfalle).
