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
    "titel": "Kopf",
    "traeger": "papier",
    "jahr": 2026,
    "technik": "Farbe auf Papier",
    "ort": null,
    "serie": "Köpfe"
  },
  {
    "nr": "VI",
    "titel": "Zwölf Köpfe",
    "traeger": "papier",
    "jahr": 2026,
    "technik": "Tusche auf Papier, zwölf Blätter",
    "ort": null,
    "serie": "Köpfe"
  },
  {
    "nr": "VII",
    "titel": "Schwarzdorn",
    "traeger": "haut",
    "jahr": 2025,
    "technik": null,
    "ort": "Unterarm",
    "serie": null
  },
  {
    "nr": "VIII",
    "titel": "Zugvogel",
    "traeger": "haut",
    "jahr": 2025,
    "technik": null,
    "ort": "Schulter",
    "serie": null
  },
  {
    "nr": "IX",
    "titel": "Doppelprofil",
    "traeger": "haut",
    "jahr": 2024,
    "technik": null,
    "ort": "Rücken",
    "serie": null
  },
  {
    "nr": "X",
    "titel": "Nachtfalter",
    "traeger": "haut",
    "jahr": 2024,
    "technik": null,
    "ort": "Brust",
    "serie": null
  },
  {
    "nr": "XI",
    "titel": "Distelzweig",
    "traeger": "haut",
    "jahr": 2023,
    "technik": null,
    "ort": "Wade",
    "serie": null
  },
  {
    "nr": "XII",
    "titel": "Bannerschrift",
    "traeger": "haut",
    "jahr": 2023,
    "technik": null,
    "ort": "Handrücken",
    "serie": null
  },
  {
    "nr": "XIII",
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
