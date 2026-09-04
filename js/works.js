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
  serien: ['Befreiung der Körperlichkeit', 'Tuschstudien'],
  jahre: [2026, 2025, 2024]
};

/* Felder:
   id, nr, t (Titel), tr ('haut' | 'papier'), jahr
   Papier: serie, technik, masse
   Haut:   ort, ortKey (Filter), motiv, sitzungen, zustand
   Bild:   src, srcset (optional), w, h (Pixelmaße), video (optional, Zeichenanimation)
   Platzhalter: vbW, vbH (Seitenverhältnis), seed (Zufallsstartwert), red (roter Strang) */
LUKE.WERKE = [
  { id: 'w1', nr: 'I', t: 'Befreiung der Körperlichkeit, Werk I', tr: 'papier', serie: 'Befreiung der Körperlichkeit', jahr: 2026, technik: 'Tusche auf Papier', masse: 'Maße folgen', red: true, vbW: 400, vbH: 500, seed: 11,
    src: 'assets/img/werk-1-profil-1200.jpg',
    srcset: 'assets/img/werk-1-profil-800.jpg 800w, assets/img/werk-1-profil-1200.jpg 1200w, assets/img/werk-1-profil-1900.jpg 1900w',
    w: 1900, h: 3085,
    video: 'assets/video/werk-1-profil-zeichnung.mp4' },
  { id: 'w2', nr: 'II', t: 'Befreiung der Körperlichkeit, Werk II', tr: 'papier', serie: 'Befreiung der Körperlichkeit', jahr: 2026, technik: 'Tusche auf Papier', masse: 'Maße folgen', red: true, vbW: 400, vbH: 500, seed: 23,
    src: 'assets/img/werk-2-auge-1200.jpg',
    srcset: 'assets/img/werk-2-auge-1200.jpg 1200w, assets/img/werk-2-auge-1800.jpg 1800w',
    w: 1800, h: 480,
    video: 'assets/video/werk-2-auge-signatur.mp4' },
  { id: 'w3', nr: 'III', t: 'Tuschstudie, Profil', tr: 'papier', serie: 'Tuschstudien', jahr: 2025, technik: 'Tusche auf Papier', masse: '42 × 59,4 cm', vbW: 400, vbH: 600, seed: 37 },
  { id: 'w4', nr: 'IV', t: 'Tuschstudie, Rückenlinie', tr: 'papier', serie: 'Tuschstudien', jahr: 2025, technik: 'Tusche auf Papier', masse: '29,7 × 42 cm', vbW: 400, vbH: 500, seed: 41 },
  { id: 'w5', nr: 'V', t: 'Tuschstudie, zwei Hände', tr: 'papier', serie: 'Tuschstudien', jahr: 2024, technik: 'Tusche und Bleistift auf Papier', masse: '29,7 × 42 cm', vbW: 400, vbH: 500, seed: 53 },
  { id: 'w6', nr: 'VI', t: 'Schwarzdorn', tr: 'haut', ort: 'Unterarm', ortKey: 'Arm', motiv: 'Botanik', jahr: 2025, sitzungen: 2, zustand: 'abgeheilt', vbW: 400, vbH: 500, seed: 61 },
  { id: 'w7', nr: 'VII', t: 'Zugvogel', tr: 'haut', ort: 'Schulter', ortKey: 'Arm', motiv: 'Tier', jahr: 2025, sitzungen: 1, zustand: 'frisch', vbW: 400, vbH: 500, seed: 67 },
  { id: 'w8', nr: 'VIII', t: 'Doppelprofil', tr: 'haut', ort: 'Rücken', ortKey: 'Rücken', motiv: 'Figur', jahr: 2024, sitzungen: 4, zustand: 'abgeheilt', vbW: 600, vbH: 400, seed: 71 },
  { id: 'w9', nr: 'IX', t: 'Nachtfalter', tr: 'haut', ort: 'Brust', ortKey: 'Brust', motiv: 'Tier', jahr: 2024, sitzungen: 2, zustand: 'abgeheilt', vbW: 400, vbH: 500, seed: 79 },
  { id: 'w10', nr: 'X', t: 'Distelzweig', tr: 'haut', ort: 'Wade', ortKey: 'Bein', motiv: 'Botanik', jahr: 2023, sitzungen: 2, zustand: 'abgeheilt', vbW: 400, vbH: 600, seed: 83 },
  { id: 'w11', nr: 'XI', t: 'Bannerschrift', tr: 'haut', ort: 'Handrücken', ortKey: 'Hand', motiv: 'Schrift', jahr: 2023, sitzungen: 1, zustand: 'abgeheilt', vbW: 400, vbH: 500, seed: 89 },
  { id: 'w12', nr: 'XII', t: 'Schwalbenpaar', tr: 'haut', ort: 'Oberschenkel', ortKey: 'Bein', motiv: 'Tier', jahr: 2022, sitzungen: 1, zustand: 'abgeheilt', vbW: 400, vbH: 500, seed: 97 }
];

/* Flash-Blätter. `src` (optional) für ein echtes Foto des Blatts, sonst Platzhalter. status: 'verfügbar' | 'vergeben' */
LUKE.FLASH = [
  { n: 1, format: 'A5', motiv: 'Schwalbe mit Banner', status: 'verfügbar', seed: 101 },
  { n: 2, format: 'A5', motiv: 'Distel und Dolch', status: 'vergeben', seed: 103 },
  { n: 3, format: 'A4', motiv: 'Falter, offen', status: 'verfügbar', seed: 107 },
  { n: 4, format: 'A5', motiv: 'Rose, schwarz', status: 'verfügbar', seed: 109 },
  { n: 5, format: 'A4', motiv: 'Zwei Hände, haltend', status: 'vergeben', seed: 113 },
  { n: 6, format: 'A5', motiv: 'Anker mit Tau', status: 'verfügbar', seed: 127 }
];
