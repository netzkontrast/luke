/* Werkdaten, Flash-Blätter und Konfiguration für lukewtf.
   Bilder liegen unter assets/img/, Videos unter assets/video/.
   Ein Werk ohne `src` bekommt automatisch eine generierte Tuschzeichnung als Platzhalter. */
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
  ausstellung: { bis: '2026-09-27' }
};

/* Filterlisten in Anzeigereihenfolge. */
LUKE.FILTER = {
  orte: ['Arm', 'Bein', 'Brust', 'Rücken', 'Hand'],
  motive: ['Botanik', 'Tier', 'Figur', 'Schrift'],
  serien: ['Befreiung der Körperlichkeit', 'Köpfe'],
  /* Nur Jahre, in denen es Papierarbeiten gibt. Sonst führt ein Reiter ins Leere.
     Kommen ältere Blätter dazu, gehören sie hier wieder hin. */
  jahre: [2026]
};

/* Felder:
   id, nr, t (Titel), tr ('haut' | 'papier'), jahr
   Papier: serie, technik, masse
   Haut:   ort, ortKey (Filter), motiv, sitzungen, zustand
   Bild:   src, srcset (optional), w, h (Pixelmaße), video (optional, Zeichenanimation)
           grund: 'foto' für Aufnahmen mit dunklem Hintergrund, die nicht mit multiply
           auf die Seite gelegt werden dürfen
   Platzhalter: vbW, vbH (Seitenverhältnis), seed (Zufallsstartwert), red (roter Strang) */
/* Nicht alles, was auf der Seite zu sehen ist, ist ein Werk. Das Profil mit dem roten
   Strang, das Auge mit der Signatur und die kniende Figur tragen die Gestaltung: Sie stehen
   im Kopf der Seite, im Auftaktvideo, in der Handschrift und im Sprite. Im Werkverzeichnis
   stehen sie nicht — dort steht, was ausgestellt wird. Siehe LUKE.GESTALTUNG weiter unten. */
LUKE.WERKE = [
  { id: 'w1', nr: 'I', t: 'Befreiung der Körperlichkeit, Werk I', tr: 'papier', serie: 'Befreiung der Körperlichkeit', jahr: 2026, technik: 'Tusche auf Papier', masse: 'Maße folgen', red: true,
    src: 'assets/img/werk-1-strang-728.jpg',
    srcset: 'assets/img/werk-1-strang-480.jpg 480w, assets/img/werk-1-strang-728.jpg 728w',
    w: 728, h: 1350 },
  { id: 'w2', nr: 'II', t: 'Befreiung der Körperlichkeit, Werk II', tr: 'papier', serie: 'Befreiung der Körperlichkeit', jahr: 2026, technik: 'Tusche auf Papier', masse: 'Maße folgen', red: true,
    src: 'assets/img/werk-2-beugung-822.jpg',
    srcset: 'assets/img/werk-2-beugung-480.jpg 480w, assets/img/werk-2-beugung-822.jpg 822w',
    w: 822, h: 1350 },
  { id: 'w3', nr: 'III', t: 'Befreiung der Körperlichkeit, Werk III', tr: 'papier', serie: 'Befreiung der Körperlichkeit', jahr: 2026, technik: 'Tusche auf Papier', masse: 'Maße folgen', red: true,
    src: 'assets/img/werk-3-fall-720.jpg',
    srcset: 'assets/img/werk-3-fall-480.jpg 480w, assets/img/werk-3-fall-720.jpg 720w',
    w: 720, h: 1350 },
  { id: 'w4', nr: 'IV', t: 'Befreiung der Körperlichkeit, Werk IV', tr: 'papier', serie: 'Befreiung der Körperlichkeit', jahr: 2026, technik: 'Tusche auf Papier', masse: 'Maße folgen', red: true,
    src: 'assets/img/werk-4-schlinge-808.jpg',
    srcset: 'assets/img/werk-4-schlinge-480.jpg 480w, assets/img/werk-4-schlinge-808.jpg 808w',
    w: 808, h: 1350 },
  /* Kein Tusche-, sondern ein Farbblatt: breiter Pinsel, dunkles Rot, cremefarbenes Papier.
     Der Papierton ist beim Aufbereiten auf Weiß gezogen, damit multiply auch hier trägt. */
  { id: 'w5', nr: 'V', t: 'Kopf', tr: 'papier', serie: 'Köpfe', jahr: 2026, technik: 'Farbe auf Papier', masse: 'Maße folgen',
    src: 'assets/img/werk-5-kopf-828.jpg',
    srcset: 'assets/img/werk-5-kopf-480.jpg 480w, assets/img/werk-5-kopf-828.jpg 828w',
    w: 828, h: 1130 },
  /* Zwölf kleine Blätter, auf schwarzem Holz ausgelegt und dort fotografiert. Das Bild
     behält seinen dunklen Grund: `grund: 'foto'` nimmt es von der multiply-Behandlung aus
     und hält es aus der Blättersequenz heraus. */
  { id: 'w6', nr: 'VI', t: 'Zwölf Köpfe', tr: 'papier', serie: 'Köpfe', jahr: 2026, technik: 'Tusche auf Papier, zwölf Blätter', masse: 'Maße folgen', grund: 'foto',
    src: 'assets/img/werk-6-koepfe-800.jpg',
    srcset: 'assets/img/werk-6-koepfe-480.jpg 480w, assets/img/werk-6-koepfe-800.jpg 800w, assets/img/werk-6-koepfe-1600.jpg 1600w',
    w: 1600, h: 1790 },
  { id: 'w7', nr: 'VII', t: 'Schwarzdorn', tr: 'haut', ort: 'Unterarm', ortKey: 'Arm', motiv: 'Botanik', jahr: 2025, sitzungen: 2, zustand: 'abgeheilt', vbW: 400, vbH: 500, seed: 61 },
  { id: 'w8', nr: 'VIII', t: 'Zugvogel', tr: 'haut', ort: 'Schulter', ortKey: 'Arm', motiv: 'Tier', jahr: 2025, sitzungen: 1, zustand: 'frisch', vbW: 400, vbH: 500, seed: 67 },
  { id: 'w9', nr: 'IX', t: 'Doppelprofil', tr: 'haut', ort: 'Rücken', ortKey: 'Rücken', motiv: 'Figur', jahr: 2024, sitzungen: 4, zustand: 'abgeheilt', vbW: 600, vbH: 400, seed: 71 },
  { id: 'w10', nr: 'X', t: 'Nachtfalter', tr: 'haut', ort: 'Brust', ortKey: 'Brust', motiv: 'Tier', jahr: 2024, sitzungen: 2, zustand: 'abgeheilt', vbW: 400, vbH: 500, seed: 79 },
  { id: 'w11', nr: 'XI', t: 'Distelzweig', tr: 'haut', ort: 'Wade', ortKey: 'Bein', motiv: 'Botanik', jahr: 2023, sitzungen: 2, zustand: 'abgeheilt', vbW: 400, vbH: 600, seed: 83 },
  { id: 'w12', nr: 'XII', t: 'Bannerschrift', tr: 'haut', ort: 'Handrücken', ortKey: 'Hand', motiv: 'Schrift', jahr: 2023, sitzungen: 1, zustand: 'abgeheilt', vbW: 400, vbH: 500, seed: 89 },
  { id: 'w13', nr: 'XIII', t: 'Schwalbenpaar', tr: 'haut', ort: 'Oberschenkel', ortKey: 'Bein', motiv: 'Tier', jahr: 2022, sitzungen: 1, zustand: 'abgeheilt', vbW: 400, vbH: 500, seed: 97 }
];

/* Gestaltung. Drei Blätter, die die Seite tragen, ohne im Verzeichnis zu stehen:
   Sie sind das Material der Bewegung, nicht der Gegenstand der Ausstellung.

   profil     Kopf im Profil mit rotem Strang. Läuft als Zeichenanimation im Auftakt,
              liefert die Tiefenebenen des Live-Auftakts und die 48 Bilder des Sprites.
   signatur   Auge am Ende einer langen Linie, mit Signatur. Quer. Trägt den Abschnitt
              „Handschrift", scrollgeführt.
   kniend     Kniende Figur. Das Blatt, das im Kopf der Seite steht.

   Wer eines davon doch ausstellen will, verschiebt es nach LUKE.WERKE und gibt ihm eine
   Nummer. Die Dateien heißen absichtlich nicht werk-*, damit die Rolle am Namen ablesbar
   bleibt. */
LUKE.GESTALTUNG = {
  profil: {
    t: 'Profil mit rotem Strang', technik: 'Tusche auf Papier', jahr: 2026,
    src: 'assets/img/gestaltung-profil-1200.jpg',
    srcset: 'assets/img/gestaltung-profil-800.jpg 800w, assets/img/gestaltung-profil-1200.jpg 1200w, assets/img/gestaltung-profil-1900.jpg 1900w',
    w: 1900, h: 3085,
    video: 'assets/video/gestaltung-profil-zeichnung.mp4',
    sprite: { src: 'assets/img/zeichnung-sprite.webp', spalten: 8, zeilen: 6, bilder: 48 }
  },
  signatur: {
    t: 'Auge mit Signatur', technik: 'Tusche auf Papier', jahr: 2026,
    src: 'assets/img/gestaltung-signatur-1200.jpg',
    srcset: 'assets/img/gestaltung-signatur-1200.jpg 1200w, assets/img/gestaltung-signatur-1800.jpg 1800w',
    w: 1800, h: 480,
    video: 'assets/video/gestaltung-signatur.mp4'
  },
  kniend: {
    t: 'Kniende Figur', technik: 'Tusche auf Papier', jahr: 2026,
    src: 'assets/img/gestaltung-kniend-1200.jpg',
    srcset: 'assets/img/gestaltung-kniend-800.jpg 800w, assets/img/gestaltung-kniend-1200.jpg 1200w, assets/img/gestaltung-kniend-1900.jpg 1900w',
    w: 1900, h: 2536
  }
};

/* Flash-Blätter. `src` (optional) für ein echtes Foto des Blatts, sonst Platzhalter. status: 'verfügbar' | 'vergeben' */
LUKE.FLASH = [
  { n: 1, format: 'A5', motiv: 'Schwalbe mit Banner', status: 'verfügbar', seed: 101 },
  { n: 2, format: 'A5', motiv: 'Distel und Dolch', status: 'vergeben', seed: 103 },
  { n: 3, format: 'A4', motiv: 'Falter, offen', status: 'verfügbar', seed: 107 },
  { n: 4, format: 'A5', motiv: 'Rose, schwarz', status: 'verfügbar', seed: 109 },
  { n: 5, format: 'A4', motiv: 'Zwei Hände, haltend', status: 'vergeben', seed: 113 },
  { n: 6, format: 'A5', motiv: 'Anker mit Tau', status: 'verfügbar', seed: 127 }
];

/* Grafik. Auftragsarbeiten neben dem Tätowieren: Plakate, Cover, Signets. Anders als die
   Werke haben sie einen Anlass und einen Auftraggeber, deshalb eigene Felder statt Träger,
   Serie und Maße. Sie behalten immer ihren dunklen Grund, werden also nicht multipliziert.
   Felder: id, t (Titel), art (Gattung), fuer (für wen), jahr, notiz (Anlass, optional),
           src, srcset, w, h */
LUKE.GRAFIK = [
  { id: 'gr1', t: 'Bluthandwerk', art: 'Titelbild für den Podcast', fuer: 'mit Kiya Noir', jahr: 2026,
    notiz: '„Nicht noch ein Tattoo-Podcast!“',
    src: 'assets/img/grafik-1-bluthandwerk-900.jpg',
    srcset: 'assets/img/grafik-1-bluthandwerk-480.jpg 480w, assets/img/grafik-1-bluthandwerk-900.jpg 900w, assets/img/grafik-1-bluthandwerk-1400.jpg 1400w',
    w: 1400, h: 1402 },
  { id: 'gr2', t: 'nebelgrau', art: 'Plakat', fuer: 'Kollektiv Noir und Tränentrinker', jahr: 2026,
    notiz: '21. Februar 2026, 23 Uhr, Live Music Hall, Köln',
    src: 'assets/img/grafik-2-nebelgrau-900.jpg',
    srcset: 'assets/img/grafik-2-nebelgrau-480.jpg 480w, assets/img/grafik-2-nebelgrau-900.jpg 900w, assets/img/grafik-2-nebelgrau-1400.jpg 1400w',
    w: 1400, h: 1980 },
  { id: 'gr3', t: 'Kollektiv Noir', art: 'Signet', fuer: 'Kollektiv Noir', jahr: 2025,
    notiz: 'Dark Electro, Post-Punk, Synthie, Shoegaze, Wave',
    src: 'assets/img/grafik-4-kollektiv-900.jpg',
    srcset: 'assets/img/grafik-4-kollektiv-480.jpg 480w, assets/img/grafik-4-kollektiv-900.jpg 900w, assets/img/grafik-4-kollektiv-1228.jpg 1228w',
    w: 1228, h: 898 },
  { id: 'gr4', t: 'Spleen', art: 'Signet für eine Clubnacht', fuer: 'Kollektiv Noir', jahr: 2025,
    notiz: 'Dark Electro, Synth, Coldwave, EBM, Minimal',
    src: 'assets/img/grafik-3-spleen-844.jpg',
    srcset: 'assets/img/grafik-3-spleen-480.jpg 480w, assets/img/grafik-3-spleen-844.jpg 844w',
    w: 844, h: 844 },
  { id: 'gr5', t: 'Requiem: Zerfall', art: 'Albumcover', fuer: '', jahr: 2025,
    src: 'assets/img/grafik-5-requiem-900.jpg',
    srcset: 'assets/img/grafik-5-requiem-480.jpg 480w, assets/img/grafik-5-requiem-900.jpg 900w, assets/img/grafik-5-requiem-1400.jpg 1400w',
    w: 1400, h: 1400 }
];
