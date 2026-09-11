/* Werkdaten, Grafik, Flash-Blätter und Konfiguration für lukewtf.
   Bilder werden hier nur beim Namen genannt. Maße und Breiten stehen in js/bilder.js, das
   scripts/bilder.py aus den Originalen in assets/original/ erzeugt; LUKE.bild() macht aus
   einem Namen src und srcset. Videos liegen unter assets/video/. */
window.LUKE = window.LUKE || {};

LUKE.CONFIG = {
  name: 'Luke WTF',
  instagram: 'https://instagram.com/lukewtf',
  handle: '@lukewtf',
  adresse: 'Vogelsangerstraße 84, 50823 Köln-Ehrenfeld',
  telefon: '0221 29496764',
  telefonHref: 'tel:+4922129496764',

  /* Anfrageformular. Genau eine der beiden Optionen füllen:
     formEndpoint: URL eines Formulardienstes (z. B. Formspree, Netlify Forms), das Formular wird per POST gesendet.
     formEmail:    E-Mail-Adresse, das Formular öffnet das Mailprogramm mit vorausgefülltem Text.
     Beides leer:  der Anfragetext wird zum Kopieren angezeigt (für DM an Instagram). */
  formEndpoint: '',
  formEmail: '',

  /* Der Streifen „Aktuell“ wird nach diesem Datum automatisch ausgeblendet (einschließlich). */
  ausstellung: { bis: '2026-09-27' },

  /* Vorspann der Galerie, wenn es nur einen Träger gibt: Der Satz über den wechselnden
     Grund wäre dann eine Behauptung ohne Beleg. Der Normalfall steht im Markup und muss
     hier nicht doppelt stehen. */
  werkeVorspannEinTraeger: 'Arbeiten auf Papier. Tusche und Farbe, jedes Blatt ein Original.'
};

/* Filterlisten in Anzeigereihenfolge. Ein Filter erscheint nur, wenn unter den vorhandenen
   Werken mehr als eine Möglichkeit vorkommt. */
LUKE.FILTER = {
  orte: ['Arm', 'Bein', 'Brust', 'Rücken', 'Hand'],
  motive: ['Botanik', 'Tier', 'Figur', 'Schrift'],
  serien: ['Befreiung der Körperlichkeit'],
  jahre: [2026]
};

/* Ein Bild beim Namen, so wie scripts/bilder.py es abgelegt hat: { name, src, srcset, w, h }.
   src ist die Fassung um 800 Pixel, für Browser, die srcset nicht lesen. Unbekannte Namen
   geben null, damit ein Tippfehler ein fehlendes Blatt ergibt und kein kaputtes. */
LUKE.bild = function (name) {
  const b = (LUKE.BILDER || {})[name];
  if (!b) return null;
  const datei = breite => `assets/img/${name}-${breite}.webp`;
  const mittel = b.breiten.find(x => x >= 800) || b.breiten[b.breiten.length - 1];
  return { name, src: datei(mittel), srcset: b.breiten.map(x => `${datei(x)} ${x}w`).join(', '), w: b.w, h: b.h };
};

/* Felder eines Werks:
   id, nr, t (Titel), tr ('haut' | 'papier'), jahr
   bilder   Namen der Bilder, in der Reihenfolge der Hängung. Ein Werk aus mehreren Blättern
            nennt alle; auf der Seite stehen sie dann nebeneinander, gleich hoch.
   Papier:  serie (optional), technik, masse, gezeigt (optional: wo es ausgestellt ist)
   Haut:    ort, ortKey (Filter), motiv, sitzungen, zustand
   grund:   'foto' für Aufnahmen mit dunklem Hintergrund, die nicht mit multiply auf die
            Seite gelegt werden dürfen
   Ein Werk ohne Bild wird übergangen: Auf dieser Seite steht nur, was es gibt.

   Titel und Reihenfolge folgen den Dateinamen, unter denen Luke die Aufnahmen geschickt hat
   („Befreiung der Körperlichkeit Werk I Bild 1“ …, „ansichten“, „neuordnung des speichers“).
   Nicht alles, was auf der Seite zu sehen ist, ist ein Werk; siehe LUKE.GESTALTUNG unten. */
LUKE.WERKE = [
  { id: 'w1', nr: 'I', t: 'Befreiung der Körperlichkeit, Werk I', tr: 'papier', serie: 'Befreiung der Körperlichkeit', jahr: 2026,
    technik: 'Tusche auf Papier', masse: 'Maße folgen', gezeigt: 'Gruppenausstellung „Red“, Stage Gallery, Köln, 2026',
    bilder: ['werk-befreiung-1-bild-1', 'werk-befreiung-1-bild-2', 'werk-befreiung-1-bild-3'] },
  { id: 'w2', nr: 'II', t: 'Befreiung der Körperlichkeit, Werk II', tr: 'papier', serie: 'Befreiung der Körperlichkeit', jahr: 2026,
    technik: 'Tusche auf Papier', masse: 'Maße folgen', gezeigt: 'Gruppenausstellung „Red“, Stage Gallery, Köln, 2026',
    bilder: ['werk-befreiung-2-bild-1', 'werk-befreiung-2-bild-2', 'werk-befreiung-2-bild-3'] },
  /* Kein Tusche-, sondern ein Farbblatt: breiter Pinsel, dunkles Rot, cremefarbenes Papier.
     Der Papierton ist beim Aufbereiten auf Weiß gezogen, damit multiply auch hier trägt. */
  { id: 'w3', nr: 'III', t: 'Ansichten', tr: 'papier', jahr: 2026, technik: 'Farbe auf Papier', masse: 'Maße folgen',
    bilder: ['werk-ansichten'] },
  /* Zwölf kleine Blätter, auf schwarzem Holz ausgelegt und dort fotografiert. Das Bild
     behält seinen dunklen Grund: `grund: 'foto'` nimmt es von der multiply-Behandlung aus
     und hält es aus der Blattfolge heraus. */
  { id: 'w4', nr: 'IV', t: 'Neuordnung des Speichers', tr: 'papier', jahr: 2026, technik: 'Tusche auf Papier, zwölf Blätter', masse: 'Maße folgen', grund: 'foto',
    bilder: ['werk-neuordnung-des-speichers'] }
];

/* Die Bilder eines Werks (oder einer Grafik), aufgelöst. */
LUKE.blaetter = w => ((w && (w.bilder || (w.bild ? [w.bild] : []))) || []).map(LUKE.bild).filter(Boolean);

/* Wer Blätter zeigt, fragt hier — und schreibt die Regel nicht noch einmal auf.

   Eine Aufnahme darf nur dann mit multiply auf den Papiergrund und nur dann durch die
   Bewegungen fliegen, wenn ihr Grund hell ist. Ein Foto auf schwarzem Holz (`grund: 'foto'`)
   wäre dort ein schwarzes Rechteck. Diese Regel stand zwischenzeitlich in vier Modulen,
   und die vierte Fassung hatte den Träger schon vergessen. */
LUKE.istTuschblatt = w => !!w && w.tr === 'papier' && w.grund !== 'foto';
/* Alle hellen Blätter, einzeln, in der Reihenfolge der Werke: { src, srcset, w, h, werk,
   teil, teile }. Ein Werk aus drei Blättern gibt drei Einträge. */
LUKE.helleBlaetter = tr => (LUKE.WERKE || [])
  .filter(w => w.grund !== 'foto' && (!tr || w.tr === tr))
  .flatMap(w => {
    const alle = LUKE.blaetter(w);
    return alle.map((b, i) => Object.assign({}, b, { werk: w, teil: i + 1, teile: alle.length }));
  });

/* Gestaltung. Drei Blätter, die die Seite tragen, ohne im Verzeichnis zu stehen:
   Sie sind das Material der Bewegung, nicht der Gegenstand der Ausstellung. Luke hat sie
   unter „Beiwerk“ geschickt.

   profil     Kopf im Profil mit rotem Strang. Läuft als Zeichenanimation im Auftakt und
              liefert die 48 Bilder des Sprites.
   signatur   Auge am Ende einer langen Linie, mit Signatur. Quer. Trägt den Abschnitt
              „Handschrift", scrollgeführt.
   kniend     Kniende Figur. Das Blatt, das im Kopf der Seite steht.

   Wer eines davon doch ausstellen will, verschiebt es nach LUKE.WERKE und gibt ihm eine
   Nummer. Die Dateien heißen absichtlich nicht werk-*, damit die Rolle am Namen ablesbar
   bleibt. */
LUKE.GESTALTUNG = {
  profil: {
    t: 'Profil mit rotem Strang', technik: 'Tusche auf Papier', jahr: 2026, bild: 'gestaltung-profil',
    video: 'assets/video/gestaltung-profil-zeichnung.mp4',
    sprite: { src: 'assets/img/zeichnung-sprite.webp', spalten: 8, zeilen: 6, bilder: 48 }
  },
  signatur: {
    t: 'Auge mit Signatur', technik: 'Tusche auf Papier', jahr: 2026, bild: 'gestaltung-signatur',
    video: 'assets/video/gestaltung-signatur.mp4'
  },
  kniend: { t: 'Kniende Figur', technik: 'Tusche auf Papier', jahr: 2026, bild: 'gestaltung-kniend' }
};

/* Flash-Blätter. Leer, bis es Aufnahmen gibt: Der Abschnitt „Flash" blendet sich dann
   von selbst aus, samt Eintrag in der Navigation. Ein Eintrag braucht `n`, `format`,
   `motiv`, `status` ('verfügbar' | 'vergeben'), optional `preis` und `src`. */
LUKE.FLASH = [];

/* Grafik. Auftragsarbeiten neben dem Tätowieren: Plakate, Flyer, Cover, Signets. Anders als
   die Werke haben sie einen Anlass und einen Auftraggeber, deshalb eigene Felder statt
   Träger, Serie und Maße. Sie behalten immer ihren Grund, werden also nicht multipliziert.
   Felder: id, t (Titel), art (Gattung), fuer (für wen, optional), jahr (optional),
           notiz (Anlass, optional), bild
   Ein Jahr steht nur, wo es sich belegen lässt: Die Termine auf Plakaten und Flyern fallen
   2026 alle auf einen Samstag, in keinem Nachbarjahr. Bei Signets und Covern steht keins. */
LUKE.GRAFIK = [
  { id: 'gr1', t: 'nebelgrau', art: 'Plakat', fuer: 'Kollektiv Noir und Tränentrinker', jahr: 2026,
    notiz: '5. Dezember 2026, Live Music Hall, Köln', bild: 'grafik-plakat-nebelgrau-2026-12-05' },
  { id: 'gr2', t: 'Noir', art: 'Flyer für die Clubnacht', fuer: 'Kollektiv Noir', jahr: 2026,
    notiz: '19. September 2026, 23 Uhr, MTC', bild: 'grafik-flyer-noir-2026-09-19' },
  { id: 'gr3', t: 'Noir', art: 'Flyer für die Clubnacht', fuer: 'Kollektiv Noir', jahr: 2026,
    notiz: '25. Juli 2026, 23 Uhr, MTC', bild: 'grafik-flyer-noir-2026-07-25' },
  { id: 'gr4', t: 'Drei Jahre Noir', art: 'Flyer für die Clubnacht', fuer: 'Kollektiv Noir', jahr: 2026,
    notiz: '18. April 2026, 23 Uhr, MTC', bild: 'grafik-flyer-noir-2026-04-18' },
  { id: 'gr5', t: 'nebelgrau', art: 'Plakat', fuer: 'Kollektiv Noir und Tränentrinker', jahr: 2026,
    notiz: '21. Februar 2026, 23 Uhr, Live Music Hall, Köln', bild: 'grafik-plakat-nebelgrau-2026-02-21' },
  { id: 'gr6', t: 'Bluthandwerk', art: 'Titelbild für den Podcast', fuer: 'mit Kiya Noir',
    notiz: '„Nicht noch ein Tattoo-Podcast!“', bild: 'grafik-cover-bluthandwerk' },
  { id: 'gr7', t: 'Requiem: Zerfall', art: 'Albumcover', bild: 'grafik-cover-requiem-zerfall' },
  { id: 'gr8', t: 'Kollektiv Noir', art: 'Signet', fuer: 'Kollektiv Noir', bild: 'grafik-signet-kollektiv-noir' },
  { id: 'gr9', t: 'Kollektiv Noir', art: 'Wortmarke', fuer: 'Kollektiv Noir',
    notiz: 'Dark Electro, Post-Punk, Synthie, Shoegaze, Wave', bild: 'grafik-wortmarke-noir' },
  { id: 'gr10', t: 'Spleen', art: 'Signet für eine Clubnacht', fuer: 'Kollektiv Noir',
    notiz: 'Dark Electro, Synth, Coldwave, EBM, Minimal', bild: 'grafik-signet-spleen' },
  { id: 'gr11', t: 'NOX', art: 'Signet', bild: 'grafik-signet-nox' }
];
