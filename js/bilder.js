/* Erzeugt von scripts/bilder.py. Nicht von Hand ändern: Das Skript liest die Originale
   aus assets/original/ und schreibt die Bilder nach assets/img/<name>-<breite>.webp.
   w und h sind die Pixelmaße der größten Fassung. LUKE.bild() in js/works.js macht
   daraus src und srcset. */
window.LUKE = window.LUKE || {};
LUKE.BILDER = {
  'werk-befreiung-1-bild-1': { w: 713, h: 1350, breiten: [480, 713] },
  'werk-befreiung-1-bild-2': { w: 703, h: 1350, breiten: [480, 703] },
  'werk-befreiung-1-bild-3': { w: 622, h: 1350, breiten: [480, 622] },
  'werk-befreiung-2-bild-1': { w: 790, h: 1350, breiten: [480, 790] },
  'werk-befreiung-2-bild-2': { w: 800, h: 1250, breiten: [480, 800] },
  'werk-befreiung-2-bild-3': { w: 800, h: 1343, breiten: [480, 800] },
  'werk-ansichten': { w: 828, h: 1130, breiten: [480, 828] },
  'werk-neuordnung-des-speichers': { w: 1440, h: 1840, breiten: [480, 800, 1200, 1440] },
  'grafik-cover-bluthandwerk': { w: 1400, h: 1401, breiten: [480, 900, 1400] },
  'grafik-cover-requiem-zerfall': { w: 1400, h: 1400, breiten: [480, 900, 1400] },
  'grafik-plakat-nebelgrau-2026-02-21': { w: 1400, h: 1980, breiten: [480, 900, 1400] },
  'grafik-plakat-nebelgrau-2026-12-05': { w: 1400, h: 1980, breiten: [480, 900, 1400] },
  'grafik-flyer-noir-2026-04-18': { w: 946, h: 942, breiten: [480, 946] },
  'grafik-flyer-noir-2026-07-25': { w: 1400, h: 1400, breiten: [480, 900, 1400] },
  'grafik-flyer-noir-2026-09-19': { w: 1400, h: 1400, breiten: [480, 900, 1400] },
  'grafik-signet-kollektiv-noir': { w: 1400, h: 1556, breiten: [480, 900, 1400] },
  'grafik-signet-nox': { w: 1400, h: 1424, breiten: [480, 900, 1400] },
  'grafik-signet-spleen': { w: 844, h: 844, breiten: [480, 844] },
  'grafik-wortmarke-noir': { w: 1228, h: 898, breiten: [480, 900, 1228] },
  'gestaltung-kniend': { w: 1900, h: 2535, breiten: [800, 1200, 1900] },
  'gestaltung-profil': { w: 1900, h: 3085, breiten: [800, 1200, 1900] },
  'gestaltung-signatur': { w: 1800, h: 480, breiten: [1200, 1800] },
  'gestaltung-profil-ende': { w: 432, h: 704, breiten: [432] },
  'luke-atelier': { w: 1536, h: 2048, breiten: [800, 1200, 1536] }
};
/* Die Handschrift als Bildfolge (scripts/bilder.py, SIGNATUR); js/auge.js und
   js/abschnitte.js zeichnen sie. */
LUKE.SIGNATUR = {"w": 1072, "h": 272, "pfad": "assets/img/signatur/", "folge": 36, "blinzeln": 5, "handschrift": {"w": 1150, "h": 294}, "auge": {"x": 863, "y": 139, "r": 37, "rand": 6, "oeffnung": [[806, 154], [820, 140], [835, 128], [850, 121], [870, 118], [892, 121], [912, 127], [930, 135], [946, 143], [958, 151], [944, 158], [925, 164], [905, 169], [885, 173], [865, 175], [845, 173], [828, 167], [815, 160]]}};
