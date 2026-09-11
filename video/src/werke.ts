/* Erzeugt von scripts/werke-uebernehmen.mjs aus js/works.js. Nicht von Hand ändern:
   Änderungen gehören in js/works.js, danach das Skript erneut laufen lassen. */
export type Werk = {
  nr: string; titel: string; jahr: number;
  technik: string | null; serie: string | null; blaetter: number;
  bilder: { datei: string; seite: number }[];
};

export const WERKE: Werk[] = [
  {
    "nr": "I",
    "titel": "Befreiung der Körperlichkeit, Werk I",
    "jahr": 2026,
    "technik": "Tusche auf Papier",
    "serie": "Befreiung der Körperlichkeit",
    "blaetter": 3,
    "bilder": [
      {
        "datei": "img/werk-befreiung-1-bild-1-713.webp",
        "seite": 0.5281
      },
      {
        "datei": "img/werk-befreiung-1-bild-2-703.webp",
        "seite": 0.5207
      },
      {
        "datei": "img/werk-befreiung-1-bild-3-622.webp",
        "seite": 0.4607
      }
    ]
  },
  {
    "nr": "II",
    "titel": "Befreiung der Körperlichkeit, Werk II",
    "jahr": 2026,
    "technik": "Tusche auf Papier",
    "serie": "Befreiung der Körperlichkeit",
    "blaetter": 3,
    "bilder": [
      {
        "datei": "img/werk-befreiung-2-bild-1-790.webp",
        "seite": 0.5852
      },
      {
        "datei": "img/werk-befreiung-2-bild-2-800.webp",
        "seite": 0.64
      },
      {
        "datei": "img/werk-befreiung-2-bild-3-800.webp",
        "seite": 0.5957
      }
    ]
  },
  {
    "nr": "III",
    "titel": "Ansichten",
    "jahr": 2026,
    "technik": "Farbe auf Papier",
    "serie": null,
    "blaetter": 1,
    "bilder": [
      {
        "datei": "img/werk-ansichten-828.webp",
        "seite": 0.7327
      }
    ]
  },
  {
    "nr": "IV",
    "titel": "Neuordnung des Speichers",
    "jahr": 2026,
    "technik": "Tusche und Farbe auf Papier, zwölf Blätter",
    "serie": null,
    "blaetter": 1,
    "bilder": [
      {
        "datei": "img/werk-neuordnung-des-speichers-1440.webp",
        "seite": 0.7826
      }
    ]
  }
];

export const AUSSTELLUNG = {
  "titel": "Red",
  "art": "Gruppenausstellung",
  "ort": "Stage Gallery, Köln",
  "vernissage": {
    "datum": "2026-09-23",
    "von": 19,
    "bis": 21
  },
  "bis": "2026-09-27"
};
