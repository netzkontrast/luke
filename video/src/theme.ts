/* Einzige Quelle für Farben, Kurven und Federn dieses Films.
   Die Werte stammen aus css/site.css, Richtung A (Werkverzeichnis).
   Keine Farbe und keine Kurve gehört direkt in eine Szene. */
import { Easing } from 'remotion';

export const theme = {
  farben: {
    papier: '#E8E8E6',
    papierHell: '#F1F1EF',
    tusche: '#0D0D0D',
    gedaempft: '#63625E',
    fastWeg: '#C9C9C7',
    linie: '#CFCFCB',
    /* Rot ist die einzige Farbe im Film und liegt pro Bild auf genau einem Element. */
    rot: '#D1232A',
    rotTief: '#7E141A',
  },
  schrift: {
    anzeige: "'Alegreya Sans', sans-serif",
    lauf: "'Alegreya Sans', sans-serif",
    serife: "'Alegreya', Georgia, serif",
  },
  /* Tusche fällt, sie springt nicht. Kein Überschwingen, keine lineare Interpolation. */
  kurve: {
    aus: Easing.bezier(0.16, 1, 0.3, 1),
    rein: Easing.bezier(0.7, 0, 0.84, 0),
    beides: Easing.bezier(0.83, 0, 0.17, 1),
    /* Die Kurve der Website für Richtung A, für Bewegungen die sich an sie anlehnen. */
    seite: Easing.bezier(0.3, 0.1, 0.2, 1),
  },
  feder: {
    ruhig: { damping: 22, stiffness: 80, mass: 1 },
    gesetzt: { damping: 18, stiffness: 120, mass: 0.8 },
  },
} as const;

/* Alle Zeiten in Sekunden, damit sie über useVideoConfig().fps in Bilder umgerechnet werden
   und der Film bei einer anderen Bildrate gleich lang bleibt. */
export const takt = {
  auftakt: 5,
  werkEins: 6,
  handschrift: 6,
  verzeichnis: 7,
  atelier: 5,
  abspann: 5,
} as const;

export const gesamtSekunden = Object.values(takt).reduce((a, b) => a + b, 0);
