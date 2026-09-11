/* Erzeugt von scripts/werke-uebernehmen.mjs aus js/works.js. Nicht von Hand ändern:
   Änderungen gehören in js/works.js, danach das Skript erneut laufen lassen. */
export type Werk = {
  nr: string; titel: string; jahr: number;
  technik: string | null; serie: string | null; blaetter: number;
};

export const WERKE: Werk[] = [
  {
    "nr": "I",
    "titel": "Befreiung der Körperlichkeit, Werk I",
    "jahr": 2026,
    "technik": "Tusche auf Papier",
    "serie": "Befreiung der Körperlichkeit",
    "blaetter": 3
  },
  {
    "nr": "II",
    "titel": "Befreiung der Körperlichkeit, Werk II",
    "jahr": 2026,
    "technik": "Tusche auf Papier",
    "serie": "Befreiung der Körperlichkeit",
    "blaetter": 3
  },
  {
    "nr": "III",
    "titel": "Ansichten",
    "jahr": 2026,
    "technik": "Farbe auf Papier",
    "serie": null,
    "blaetter": 1
  },
  {
    "nr": "IV",
    "titel": "Neuordnung des Speichers",
    "jahr": 2026,
    "technik": "Tusche auf Papier, zwölf Blätter",
    "serie": null,
    "blaetter": 1
  }
];

export const AUSSTELLUNG = {
  "bis": "2026-09-27"
};
