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
    "titel": "Tuschstudie, Profil",
    "traeger": "papier",
    "jahr": 2025,
    "technik": "Tusche auf Papier",
    "ort": null,
    "serie": "Tuschstudien"
  },
  {
    "nr": "IV",
    "titel": "Tuschstudie, Rückenlinie",
    "traeger": "papier",
    "jahr": 2025,
    "technik": "Tusche auf Papier",
    "ort": null,
    "serie": "Tuschstudien"
  },
  {
    "nr": "V",
    "titel": "Tuschstudie, zwei Hände",
    "traeger": "papier",
    "jahr": 2024,
    "technik": "Tusche und Bleistift auf Papier",
    "ort": null,
    "serie": "Tuschstudien"
  },
  {
    "nr": "VI",
    "titel": "Schwarzdorn",
    "traeger": "haut",
    "jahr": 2025,
    "technik": null,
    "ort": "Unterarm",
    "serie": null
  },
  {
    "nr": "VII",
    "titel": "Zugvogel",
    "traeger": "haut",
    "jahr": 2025,
    "technik": null,
    "ort": "Schulter",
    "serie": null
  },
  {
    "nr": "VIII",
    "titel": "Doppelprofil",
    "traeger": "haut",
    "jahr": 2024,
    "technik": null,
    "ort": "Rücken",
    "serie": null
  },
  {
    "nr": "IX",
    "titel": "Nachtfalter",
    "traeger": "haut",
    "jahr": 2024,
    "technik": null,
    "ort": "Brust",
    "serie": null
  },
  {
    "nr": "X",
    "titel": "Distelzweig",
    "traeger": "haut",
    "jahr": 2023,
    "technik": null,
    "ort": "Wade",
    "serie": null
  },
  {
    "nr": "XI",
    "titel": "Bannerschrift",
    "traeger": "haut",
    "jahr": 2023,
    "technik": null,
    "ort": "Handrücken",
    "serie": null
  },
  {
    "nr": "XII",
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
