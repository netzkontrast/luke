/* Erzeugt von scripts/werke-uebernehmen.mjs aus js/works.js. Nicht von Hand ändern:
   Änderungen gehören in js/works.js, danach das Skript erneut laufen lassen. */
export type Werk = {
  nr: string; titel: string; traeger: 'haut' | 'papier'; jahr: number;
  technik: string | null; ort: string | null; serie: string | null;
};

export const WERKE: Werk[] = [
  {
    "nr": "I",
    "titel": "Befreiung der Körperlichkeit, Werk I",
    "traeger": "papier",
    "jahr": 2026,
    "technik": "Tusche auf Papier",
    "ort": null,
    "serie": "Befreiung der Körperlichkeit"
  },
  {
    "nr": "II",
    "titel": "Befreiung der Körperlichkeit, Werk II",
    "traeger": "papier",
    "jahr": 2026,
    "technik": "Tusche auf Papier",
    "ort": null,
    "serie": "Befreiung der Körperlichkeit"
  },
  {
    "nr": "III",
    "titel": "Befreiung der Körperlichkeit, Werk III",
    "traeger": "papier",
    "jahr": 2026,
    "technik": "Tusche auf Papier",
    "ort": null,
    "serie": "Befreiung der Körperlichkeit"
  },
  {
    "nr": "IV",
    "titel": "Befreiung der Körperlichkeit, Werk IV",
    "traeger": "papier",
    "jahr": 2026,
    "technik": "Tusche auf Papier",
    "ort": null,
    "serie": "Befreiung der Körperlichkeit"
  },
  {
    "nr": "V",
    "titel": "Befreiung der Körperlichkeit, Werk V",
    "traeger": "papier",
    "jahr": 2026,
    "technik": "Tusche auf Papier",
    "ort": null,
    "serie": "Befreiung der Körperlichkeit"
  },
  {
    "nr": "VI",
    "titel": "Befreiung der Körperlichkeit, Werk VI",
    "traeger": "papier",
    "jahr": 2026,
    "technik": "Tusche auf Papier",
    "ort": null,
    "serie": "Befreiung der Körperlichkeit"
  },
  {
    "nr": "VII",
    "titel": "Zwölf Köpfe",
    "traeger": "papier",
    "jahr": 2026,
    "technik": "Tusche auf Papier, zwölf Blätter",
    "ort": null,
    "serie": "Tuschstudien"
  },
  {
    "nr": "VIII",
    "titel": "Schwarzdorn",
    "traeger": "haut",
    "jahr": 2025,
    "technik": null,
    "ort": "Unterarm",
    "serie": null
  },
  {
    "nr": "IX",
    "titel": "Zugvogel",
    "traeger": "haut",
    "jahr": 2025,
    "technik": null,
    "ort": "Schulter",
    "serie": null
  },
  {
    "nr": "X",
    "titel": "Doppelprofil",
    "traeger": "haut",
    "jahr": 2024,
    "technik": null,
    "ort": "Rücken",
    "serie": null
  },
  {
    "nr": "XI",
    "titel": "Nachtfalter",
    "traeger": "haut",
    "jahr": 2024,
    "technik": null,
    "ort": "Brust",
    "serie": null
  },
  {
    "nr": "XII",
    "titel": "Distelzweig",
    "traeger": "haut",
    "jahr": 2023,
    "technik": null,
    "ort": "Wade",
    "serie": null
  },
  {
    "nr": "XIII",
    "titel": "Bannerschrift",
    "traeger": "haut",
    "jahr": 2023,
    "technik": null,
    "ort": "Handrücken",
    "serie": null
  },
  {
    "nr": "XIV",
    "titel": "Schwalbenpaar",
    "traeger": "haut",
    "jahr": 2022,
    "technik": null,
    "ort": "Oberschenkel",
    "serie": null
  }
];

export const AUSSTELLUNG = {
  "bis": "2026-09-27"
};
