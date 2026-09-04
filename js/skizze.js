/* Die drei Systeme der Skizze. Keines von ihnen liest die Scrollposition.

   Alle drei melden sich bei LUKE.welt an und bekommen einmal pro Bild denselben Zustand
   gereicht. Was sie daraus machen, ist ihre Sache; woher er kommt, ist es nicht.

     1. Die Blätter fliegen durch die Szene.  -> aus p, zug und zeiger
     2. Die Zeichnung entsteht im Sprite.     -> aus p
     3. Die Seite weint.                      -> aus p und blut

   Das ist der ganze Unterschied zu vorher: Es gibt keine zweite Meinung darüber, wo man
   gerade ist. */
(function () {
  'use strict';
  const L = (window.LUKE = window.LUKE || {});
  const welt = L.welt;
  if (!welt) { console.warn('skizze: Weltzustand fehlt'); return; }
  const z = welt.z, klemm = welt.klemm, misch = welt.misch;

  /* ------------------------------------------------------------------ Sprite */
  /* assets/img/zeichnung-sprite.webp: 48 Bilder aus der Zeichenanimation, 8 Spalten,
     6 Zeilen, je 160 × 260. Klein gerechnet, damit die Parallaxe sofort steht: Das Bündel
     wiegt 283 kB statt der 1,8 MB des Videos, und ein Sprite lässt sich bildgenau
     ansteuern — ein Video nicht, das muss man spulen und hoffen. */
  const SP = (L.GESTALTUNG && L.GESTALTUNG.profil && L.GESTALTUNG.profil.sprite)
    || { src: 'assets/img/zeichnung-sprite.webp', spalten: 8, zeilen: 6, bilder: 48 };

  function bildSetzen(el, nr) {
    const n = klemm(Math.round(nr), 0, SP.bilder - 1);
    if (el._nr === n) return;
    el._nr = n;
    const sx = n % SP.spalten, sy = Math.floor(n / SP.spalten);
    el.style.backgroundPosition =
      (sx * 100 / (SP.spalten - 1)).toFixed(3) + '% ' + (sy * 100 / (SP.zeilen - 1)).toFixed(3) + '%';
  }

  /* Fünf Ebenen desselben Sprites, verschieden groß und verschieden tief. Die hintersten
     laufen dem Zeiger kaum nach und bleiben blass, die vorderste deutlich. Mehr ist
     Parallaxe nicht. */
  const EBENEN = [
    { tiefe: 0.10, gross: 1.55, deck: 0.045, x: -14, y: -6, versatz: -6 },
    { tiefe: 0.26, gross: 1.22, deck: 0.075, x: 16, y: 4, versatz: -3 },
    { tiefe: 0.52, gross: 1.00, deck: 1.00, x: 0, y: 0, versatz: 0 },
    { tiefe: 0.78, gross: 0.58, deck: 0.10, x: -24, y: 12, versatz: 4 },
    { tiefe: 1.00, gross: 0.40, deck: 0.085, x: 28, y: -14, versatz: 8 }
  ];

  function spriteBauen() {
    const halter = document.getElementById('sprite-buehne');
    if (!halter) return [];
    /* Bild und Raster stehen in works.js, nicht noch einmal im Stil. Der Pfad wird vorher
       aufgelöst: Ein relativer url() in einer Custom Property zieht seinen Bezugspunkt aus
       dem Stylesheet, in dem das var() steht — also aus css/, wo der Pfad ins Leere geht. */
    halter.style.setProperty('--sprite', 'url("' + new URL(SP.src, document.baseURI).href + '")');
    halter.style.setProperty('--sprite-raster', (SP.spalten * 100) + '% ' + (SP.zeilen * 100) + '%');
    return EBENEN.map(e => {
      const el = document.createElement('div');
      el.className = 'sp-ebene';
      el.style.opacity = String(e.deck);
      halter.appendChild(el);
      return { el, e };
    });
  }

  const spriteTeile = spriteBauen();

  function spriteFuehren() {
    if (!spriteTeile.length) return;
    /* Die Zeichnung entsteht über die ersten zwei Drittel der Seite und bleibt dann
       stehen. Wer schnell scrollt, zeichnet schnell — das ist der ganze Reiz daran,
       dass es ein Sprite ist und kein Video. */
    const lauf = klemm(z.p / 0.66, 0, 1);
    for (const t of spriteTeile) {
      const { el, e } = t;
      bildSetzen(el, lauf * (SP.bilder - 1) + e.versatz * lauf);
      if (z.ruhig) { el.style.transform = 'scale(' + e.gross + ')'; continue; }
      const x = e.x + z.zeiger.x * 110 * e.tiefe;
      const y = e.y + z.zeiger.y * 70 * e.tiefe - z.p * 130 * e.tiefe;
      const dreh = (z.v * 0.05 * e.tiefe).toFixed(3);
      el.style.transform =
        'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + dreh + 'deg) scale(' + e.gross + ')';
    }
  }

  /* ------------------------------------------------------------ fliegende Blätter */
  /* Die Blätter ziehen durch die Szene wie Papier im Zug: von unten rechts herein, an der
     Kamera vorbei, oben links hinaus. Ihre Bahn hängt allein am Fortschritt der Seite,
     also fliegen sie beim Zurückscrollen rückwärts. Das ist Absicht: Es soll sich anfühlen
     wie ein Stapel, durch den man blättert, nicht wie eine Schleife, die nebenher läuft. */
  const BAHNEN = [
    { spur: 0.16, tiefe: 0.30, tempo: 1.00, ab: 0.00, dreh: -9 },
    { spur: 0.74, tiefe: 0.62, tempo: 1.35, ab: 0.22, dreh: 7 },
    { spur: 0.42, tiefe: 0.18, tempo: 0.78, ab: 0.47, dreh: -4 },
    { spur: 0.88, tiefe: 0.85, tempo: 1.70, ab: 0.63, dreh: 12 },
    { spur: 0.28, tiefe: 0.48, tempo: 1.15, ab: 0.81, dreh: -6 }
  ];

  function flugBauen() {
    const halter = document.getElementById('flug-buehne');
    if (!halter) return [];
    const werke = L.helleAufnahmen ? L.helleAufnahmen('papier') : [];
    if (!werke.length) return [];
    return BAHNEN.map((b, i) => {
      const w = werke[i % werke.length];
      const el = document.createElement('img');
      el.className = 'fl-blatt';
      el.src = w.src;
      if (w.srcset) el.srcset = w.srcset;
      el.sizes = '260px';
      el.alt = '';
      el.decoding = 'async';
      el.loading = 'lazy';
      halter.appendChild(el);
      return { el, b };
    });
  }

  const flugTeile = flugBauen();

  function flugFuehren() {
    if (!flugTeile.length) return;
    const B = z.fenster.b, H = z.fenster.h;
    for (const t of flugTeile) {
      const { el, b } = t;
      /* Bahnstelle: 0 heißt weit unten rechts, 1 heißt oben links draußen. */
      let s = (z.p * b.tempo + b.ab) % 1;
      if (s < 0) s += 1;
      /* Ein Blatt, das gerade an der Kamera vorbeizieht, ist groß und deckend;
         am Anfang und Ende der Bahn ist es klein und fort. */
      const nah = Math.sin(s * Math.PI);
      const gross = misch(0.34, 1.05, nah) * misch(1, 0.62, b.tiefe);
      /* Die Blätter sind Hintergrund, nicht Motiv. Deckend genug, um da zu sein,
         durchsichtig genug, dass der Text darüber lesbar bleibt. */
      const deck = klemm(nah * 1.6 - 0.12, 0, 1) * misch(0.46, 0.18, b.tiefe)
        * (B < 760 ? 0.6 : 1);
      const x = misch(B * 1.05, -B * 0.35, s) + (b.spur - 0.5) * B * 0.5
        + (z.ruhig ? 0 : z.zeiger.x * 120 * b.tiefe);
      const y = misch(H * 0.92, -H * 0.30, s)
        + (z.ruhig ? 0 : z.zeiger.y * 70 * b.tiefe + z.v * 3.4 * b.tiefe);
      const dreh = b.dreh * (1 - nah) + (z.ruhig ? 0 : z.v * 0.09);
      el.style.opacity = deck.toFixed(3);
      el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate('
        + dreh.toFixed(2) + 'deg) scale(' + gross.toFixed(3) + ')';
    }
  }

  /* --------------------------------------------------------------------- Weinen */
  /* Die Seite weint, und zwar Blut. Der Fortschritt beim Lesen ist die Menge: ganz oben
     ist nichts, ganz unten läuft alles. Gezeichnet wird auf ein Canvas in Seitenkoordinaten,
     nicht im Fenster — die Spuren gehören zur Seite und bleiben stehen, wo sie sind.

     Warum Canvas und nicht wie bisher ein SVG-Pfad: Eine Träne ist eine Linie, mehrere
     Tränen mit Tropfen, Spritzern und wechselnder Breite sind hundert. Als SVG wären das
     hundert Knoten, die der Browser bei jedem Bild neu anfasst. */
  /* Sechs Tränen. Die Tempi liegen dicht beieinander, damit sie als Gruppe laufen und
     nicht einzeln über die Seite verteilt tröpfeln; die seitlichen Abstände sind dafür
     deutlich, damit ein Vorhang daraus wird und kein Bündel. */
  const STRAENGE = [
    { x: 0.000, tempo: 1.00, breite: 5.4, welle: 1.00, ab: 0.00 },
    { x: -0.032, tempo: 0.96, breite: 3.4, welle: 1.55, ab: 0.02 },
    { x: 0.037, tempo: 0.98, breite: 4.0, welle: 1.20, ab: 0.01 },
    { x: -0.076, tempo: 0.90, breite: 2.6, welle: 2.05, ab: 0.05 },
    { x: 0.081, tempo: 0.93, breite: 2.8, welle: 1.80, ab: 0.04 },
    { x: 0.018, tempo: 0.86, breite: 2.0, welle: 2.55, ab: 0.08 }
  ];

  const cv = document.getElementById('weinen');
  const ctx = cv ? cv.getContext('2d') : null;
  let dpr = 1, quelle = { x: 0, y: 0 }, docHoehe = 0;
  /* Die beiden Rot der Seite stehen in css/skizze.css. Sie hier noch einmal als Zahlen
     hinzuschreiben hieße, sie beim nächsten Farbwechsel zu vergessen. */
  let ROT = '209,35,42', ROT2 = '126,20,26';
  function rgbLesen(name, rueck) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const m = /^#([0-9a-f]{6})$/i.exec(v);
    if (!m) return rueck;
    const n = parseInt(m[1], 16);
    return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
  }

  function weinenMessen() {
    if (!cv) return;
    ROT = rgbLesen('--red', ROT);
    ROT2 = rgbLesen('--red2', ROT2);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(z.fenster.b * dpr);
    cv.height = Math.round(z.fenster.h * dpr);
    cv.style.width = z.fenster.b + 'px';
    cv.style.height = z.fenster.h + 'px';
    /* Ansatzpunkt: das Auge der Zeichnung im Auftakt. Fehlt der Anker, nimmt die Spur
       die obere Mitte. */
    const anker = document.getElementById('traenenpunkt');
    if (anker) {
      const r = anker.getBoundingClientRect();
      quelle.x = r.left + r.width * 0.5 + window.scrollX;
      quelle.y = r.top + r.height * 0.5 + window.scrollY;
    } else {
      quelle.x = z.fenster.b * 0.5;
      quelle.y = z.fenster.h * 0.35;
    }
    /* Auf schmalen Geräten steht die Zeichnung mittig, und die Tränen liefen mitten durch
       den Text. Sie rücken deshalb an den rechten Rand: Der Text ist die Hauptsache. */
    if (z.fenster.b < 760) quelle.x = Math.max(quelle.x, z.fenster.b * 0.84);
    docHoehe = z.dokument;
  }

  /* Seitliches Wandern einer Träne an der Stelle y. An die Strecke gebunden, nicht an die
     Zeit: Die Spur steht still, wenn niemand scrollt. Eine Träne, die von selbst zappelt,
     wäre Dekoration. Die Wellenlänge ist in Pixeln gedacht, nicht als Anteil der Länge —
     sonst wandert eine kurze Träne genauso oft wie eine, die über die halbe Seite läuft. */
  function ab(s, y) {
    return Math.sin(y / (150 / s.welle) + s.ab * 21) * 8
         + Math.sin(y / (430 / s.welle) + s.ab * 7) * 15;
  }

  /* Halbe Breite an der Stelle: oben am dicksten, unten dünner, unterwegs Stauungen.
     Eine Träne mit gleichbleibender Breite sieht aus wie ein Strich, nicht wie Flüssigkeit. */
  function halb(s, f, y, blut) {
    const zulauf = misch(1, 0.42, f * f);
    const stau = 1 + Math.sin(y / 260 + s.ab * 13) * 0.34 + Math.sin(y / 91 + s.ab * 5) * 0.16;
    return Math.max(0.35, s.breite * 0.5 * zulauf * stau * misch(0.6, 1.35, blut));
  }

  /* Eine Träne als Fläche, nicht als Strich: linke Kante hinunter, rechte Kante hinauf.
     Nur so bekommt sie eine Breite, die sich ändert. */
  /* Nur der Streifen, der gerade im Fenster steht. Vorher lief die Schleife über die ganze
     Spur — bei einer Seite von zehntausend Pixeln also 260 Schritte, von denen der Browser
     neun Zehntel wieder wegschnitt. Die Form ist ein senkrechtes Band; wer den Bereich in y
     beschneidet, bekommt Pixel für Pixel dasselbe Bild. */
  function strang(s, laenge, blut) {
    const x0 = quelle.x + s.x * z.fenster.b;
    const vonY = Math.max(quelle.y, z.y - 80);
    const bisY = Math.min(quelle.y + laenge, z.y + z.fenster.h + 80);
    if (bisY <= vonY) return;
    const schritte = Math.max(4, Math.min(260, Math.round((bisY - vonY) / 18)));
    /* Erst die linke Kante hinunter, dann die rechte hinauf. Ohne Zwischenspeicher:
       zwei Durchläufe kosten weniger als tausend kurzlebige Punktpaare je Bild. */
    ctx.beginPath();
    for (let i = 0; i <= schritte; i++) {
      const y = vonY + (bisY - vonY) * (i / schritte);
      const hw = halb(s, (y - quelle.y) / laenge, y, blut);
      const x = x0 + ab(s, y) - hw;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    for (let i = schritte; i >= 0; i--) {
      const y = vonY + (bisY - vonY) * (i / schritte);
      ctx.lineTo(x0 + ab(s, y) + halb(s, (y - quelle.y) / laenge, y, blut), y);
    }
    ctx.closePath();
    ctx.fill();

    /* Der Tropfen am unteren Ende. Er wächst mit dem Tempo: als hinge er und fiele gleich. */
    const ey = quelle.y + laenge;
    if (ey < z.y - 40 || ey > z.y + z.fenster.h + 40) return;
    const ex = x0 + ab(s, ey);
    const r = (s.breite * 0.42 + z.zug * 3.4) * misch(0.75, 1.4, blut);
    ctx.beginPath();
    ctx.moveTo(ex, ey - r * 2.3);
    ctx.bezierCurveTo(ex + r, ey - r, ex + r, ey + r * 0.2, ex, ey + r);
    ctx.bezierCurveTo(ex - r, ey + r * 0.2, ex - r, ey - r, ex, ey - r * 2.3);
    ctx.fill();
  }

  /* Spritzer bleiben liegen, wo eine Träne einmal war. Sie sind der Grund, warum die
     Spur zur Seite gehört und nicht zum Fenster: Beim Zurückscrollen stehen sie noch da. */
  const zufall = i => { const v = Math.sin(i * 12.9898) * 43758.5453; return v - Math.floor(v); };
  const SPRITZER = [];
  for (let i = 0; i < 30; i++) {
    SPRITZER.push({ bei: 0.06 + (i / 30) * 0.9, dx: zufall(i) * 150 - 75, r: 1 + zufall(i + 91) * 2.6 });
  }

  /* Neu gezeichnet wird nur, wenn sich etwas geändert hat. Steht die Seite still, steht
     auch das Canvas — sonst räumt der Browser sechzigmal je Sekunde eine Fläche von
     zweitausend mal dreitausend Pixeln frei, für nichts. */
  let letzteLage = -1;
  function weinenZeichnen() {
    if (!ctx) return;
    const lage = Math.round(z.y) * 100000 + Math.round(z.p * 10000);
    if (lage === letzteLage) return;
    letzteLage = lage;
    ctx.setTransform(dpr, 0, 0, dpr, 0, -z.y * dpr);
    ctx.clearRect(0, z.y, z.fenster.b, z.fenster.h);
    if (z.p <= 0.001) return;

    const gesamt = Math.max(0, docHoehe - quelle.y - 40);
    const blut = z.blut;

    /* Wie viele Stränge laufen, hängt an der Fassung: Oben ist es einer, unten sind es
       alle. Das ist die ganze Dramaturgie — die Seite fasst sich immer weniger. */
    const wieViele = Math.max(1, Math.round(misch(1, STRAENGE.length, klemm(blut * 1.3, 0, 1))));

    for (let i = 0; i < wieViele; i++) {
      const s = STRAENGE[i];
      const roh = klemm((z.p - s.ab) / (1 - s.ab), 0, 1);
      const laenge = roh * gesamt * s.tempo;
      if (laenge < 8) continue;
      const oben = quelle.y, unten = quelle.y + laenge;
      if (unten < z.y - 80 || oben > z.y + z.fenster.h + 80) continue;

      const deck = klemm(0.30 + blut * 0.55, 0, 0.9) * (i === 0 ? 1 : 0.72);
      ctx.fillStyle = 'rgba(' + ROT + ',' + deck.toFixed(3) + ')';
      strang(s, laenge, blut);

      /* Spritzer nur für den Hauptstrang, sonst wird es Konfetti. */
      if (i === 0) {
        ctx.fillStyle = 'rgba(' + ROT2 + ',' + (deck * 0.62).toFixed(3) + ')';
        const x0 = quelle.x + s.x * z.fenster.b;
        for (const sp of SPRITZER) {
          if (roh <= sp.bei) continue;
          const y = quelle.y + gesamt * s.tempo * sp.bei;
          if (y < z.y - 40 || y > z.y + z.fenster.h + 40) continue;
          ctx.beginPath();
          ctx.arc(x0 + ab(s, y) + sp.dx, y, sp.r, 0, 6.2832);
          ctx.fill();
        }
      }
    }
  }

  /* ---------------------------------------------------------------------- Lauf */
  /* Der Weltzustand misst ohnehin schon aus und zählt dabei hoch. Ein eigener Satz
     Zuhörer für resize, load und die Schriften wäre dieselbe Arbeit ein zweites Mal — und
     die beiden Messungen fielen in verschiedene Bilder. */
  let letzteMessung = -1, letzterSchlag = '';
  welt.an(function () {
    if (z.messung !== letzteMessung) { letzteMessung = z.messung; weinenMessen(); letzteLage = -1; }
    /* Blätter und Sprite hängen an Fortschritt, Zeiger und Tempo. Ändert sich davon
       nichts, gibt es auch nichts zu schreiben. */
    const schlag = Math.round(z.y) + '|' + Math.round(z.zeiger.x * 400)
      + '|' + Math.round(z.zeiger.y * 400) + '|' + Math.round(z.v * 4);
    if (schlag !== letzterSchlag) { letzterSchlag = schlag; spriteFuehren(); flugFuehren(); }
    weinenZeichnen();
  });
})();
