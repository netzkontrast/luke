/* Der Weltzustand.

   Bisher hatte jedes bewegte Ding auf dieser Seite seine eigene Buchhaltung: motion.js
   liest die Scrollposition, werk-sequenz.js liest sie noch einmal, tropfspur.js ein
   drittes Mal, und die Galerie prüft in ihrer eigenen Schleife, was schon sichtbar ist.
   Vier Module, vier Wahrheiten, vier Gelegenheiten, auseinanderzulaufen.

   Hier steht stattdessen ein Zustand. Eine Schleife liest einmal pro Bild, was auf der
   Seite los ist, rechnet daraus ein paar Zahlen aus, und alle anderen lesen nur noch.
   Niemand sonst fasst scrollY an.

   Das Vorbild ist das Kohärenzprotokoll aus dem Schwesterprojekt: Dort steht eine Tabelle
   mit einem Wert je Abschnitt, und alles Sichtbare — Farbe, Glitch, Partikel — wird daraus
   abgeleitet, statt für sich zu animieren. Hier heißt der Wert `fassung`: wie beisammen
   die Seite gerade ist. Oben ist sie es ganz, unten nicht mehr. Was daraus wird, entscheidet
   jedes System für sich; woher die Zahl kommt, entscheidet es nicht mehr.

   Benutzung:
     LUKE.welt.z                 der Zustand, immer aktuell, nie ersetzt
     LUKE.welt.an(fn)            fn(z) läuft einmal pro Bild, nach dem Rechnen
     LUKE.welt.ab(fn)            abmelden
     LUKE.welt.abschnitte        die Tabelle

   Auf <html> liegen außerdem ein paar gerundete Werte als data-Attribute. Die sind für
   deklarative Bindungen da (hx-live) und ändern sich absichtlich nur zehnmal die Sekunde:
   Jede Änderung dort löst einen MutationObserver aus, und der soll nicht im Bildtakt feuern. */
(function () {
  'use strict';
  const L = (window.LUKE = window.LUKE || {});
  if (L.welt) return;

  /* Die Tabelle. Ein Eintrag je Abschnitt, in der Reihenfolge der Seite.
     `stufe` ist die grobe Lage (0 ruhig bis 3 offen), `fassung` der genaue Wert am
     Anfang des Abschnitts. Zwischen zwei Abschnitten wird interpoliert, damit nichts
     springt. Wer einen Abschnitt einfügt, ändert nur diese Tabelle. */
  const ABSCHNITTE = [
    { id: 'auftakt', name: 'Auftakt',    stufe: 0, fassung: 1.00 },
    { id: 'zug',     name: 'Der Zug',    stufe: 1, fassung: 0.86 },
    { id: 'werke',   name: 'Werke',      stufe: 1, fassung: 0.72 },
    { id: 'schnitt', name: 'Schnitt',    stufe: 2, fassung: 0.48 },
    { id: 'fall',    name: 'Fall',       stufe: 3, fassung: 0.18 },
    { id: 'ruhe',    name: 'Ruhe',       stufe: 1, fassung: 0.64 }
  ];

  const klemm = (v, a, b) => (v < a ? a : v > b ? b : v);
  const misch = (a, b, t) => a + (b - a) * t;

  /* Der Zustand ist ein Objekt, das nie ersetzt wird. Wer es sich merkt, hält damit
     immer den aktuellen Stand in der Hand, ohne bei jedem Bild neu nachzufragen. */
  const z = {
    /* Seite */
    y: 0,             // Scrollposition in Pixeln
    hoehe: 0,         // scrollbare Strecke
    p: 0,             // Fortschritt der ganzen Seite, 0 bis 1
    fenster: { b: 0, h: 0 },

    /* Bewegung */
    v: 0,             // Geschwindigkeit, Pixel je Bild, geglättet
    zug: 0,           // Betrag davon, auf 0 bis 1 normiert. Wie hastig gerade gelesen wird.
    richtung: 1,      // 1 nach unten, -1 nach oben

    /* Zeiger */
    zeiger: { x: 0, y: 0 },   // jeweils -0,5 bis 0,5, Mitte ist null

    /* Abschnitt */
    i: 0,             // Index in der Tabelle
    id: 'auftakt',
    name: 'Auftakt',
    lokal: 0,         // Fortschritt im Abschnitt, 0 bis 1
    stufe: 0,

    /* Das abgeleitete Maß */
    fassung: 1,       // 1 beisammen, 0 auseinander
    blut: 0,          // 1 - fassung, weil die Seite damit blutet

    /* Betrieb */
    takt: 0,          // Bildzähler
    ruhig: false,     // Systemeinstellung „reduzierte Bewegung"
    an: true          // läuft die Schleife
  };

  const prm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)');
  z.ruhig = !!(prm && prm.matches);
  if (prm && prm.addEventListener) prm.addEventListener('change', e => { z.ruhig = e.matches; });

  const hoerer = new Set();
  let kasten = [];      // gemessene Lage der Abschnitte auf der Seite
  let letztesY = 0;
  let raf = 0;
  let messenGeplant = true;

  /* Die Abschnitte einmal ausmessen. Das kostet Layout und passiert deshalb nur bei
     Größenänderung, nach dem Laden und wenn sich die Seitenhöhe ändert, nie im Bildtakt. */
  function messen() {
    messenGeplant = false;
    const doc = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    z.hoehe = Math.max(1, doc - innerHeight);
    z.fenster.b = innerWidth;
    z.fenster.h = innerHeight;
    kasten = ABSCHNITTE.map(a => {
      const el = document.getElementById(a.id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { oben: r.top + window.scrollY, hoehe: Math.max(1, r.height) };
    });
  }

  /* Aus der Scrollposition wird der Abschnitt, aus dem Abschnitt die Fassung.
     Gemessen wird an der Mitte des Fensters: Was dort steht, ist das, was gelesen wird. */
  function abschnittBestimmen() {
    const blick = z.y + innerHeight * 0.5;
    let i = 0, lokal = 0;
    for (let k = 0; k < kasten.length; k++) {
      const b = kasten[k];
      if (!b) continue;
      if (blick >= b.oben) { i = k; lokal = klemm((blick - b.oben) / b.hoehe, 0, 1); }
    }
    z.i = i;
    z.id = ABSCHNITTE[i].id;
    z.name = ABSCHNITTE[i].name;
    z.lokal = lokal;
    z.stufe = ABSCHNITTE[i].stufe;
    /* Fassung zwischen diesem und dem nächsten Abschnitt überblenden, damit der Wert
       läuft und nicht springt. Ein Sprung wäre auf der Seite sofort als Ruck zu sehen. */
    const jetzt = ABSCHNITTE[i].fassung;
    const naechst = ABSCHNITTE[i + 1] ? ABSCHNITTE[i + 1].fassung : jetzt;
    z.fassung = klemm(misch(jetzt, naechst, lokal), 0, 1);
    z.blut = 1 - z.fassung;
  }

  /* Gerundete Werte für deklarative Bindungen. Absichtlich grob und selten:
     Jede Änderung hier ist eine DOM-Mutation, und daran hängt hx-live. */
  let letzterStempel = '';
  function veroeffentlichen() {
    const d = document.documentElement.dataset;
    const stempel = z.id + '|' + Math.round(z.p * 100) + '|' + Math.round(z.fassung * 100) + '|' + z.stufe;
    if (stempel === letzterStempel) return;
    letzterStempel = stempel;
    d.weltAbschnitt = z.id;
    d.weltName = z.name;
    d.weltStufe = String(z.stufe);
    d.weltP = String(Math.round(z.p * 100));
    d.weltFassung = String(Math.round(z.fassung * 100));
  }

  function schritt() {
    raf = 0;
    if (!z.an) return;
    if (messenGeplant) messen();

    const y = window.scrollY || window.pageYOffset || 0;
    const dy = y - letztesY;
    letztesY = y;
    z.y = y;
    z.p = klemm(y / z.hoehe, 0, 1);
    /* Geglättete Geschwindigkeit: Der Rohwert springt bei jedem Radschub und wäre als
       Antrieb für Bewegung unbrauchbar. */
    z.v = z.v + (dy - z.v) * 0.18;
    if (Math.abs(z.v) > 0.05) z.richtung = z.v > 0 ? 1 : -1;
    z.zug = klemm(Math.abs(z.v) / 42, 0, 1);
    z.takt++;

    abschnittBestimmen();
    if ((z.takt & 5) === 0) veroeffentlichen();

    for (const fn of hoerer) {
      try { fn(z); } catch (e) { /* ein kaputter Hörer legt die Welt nicht still */ }
    }
    raf = requestAnimationFrame(schritt);
  }

  function starten() {
    if (raf || !z.an) return;
    raf = requestAnimationFrame(schritt);
  }

  const neuMessen = () => { messenGeplant = true; };
  addEventListener('resize', neuMessen);
  addEventListener('load', neuMessen);
  addEventListener('orientationchange', neuMessen);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(neuMessen);
  /* Bilder laden nach, die Seite wird höher, die Abschnitte verschieben sich. */
  new MutationObserver(neuMessen).observe(document.documentElement, { childList: true, subtree: true });

  addEventListener('pointermove', e => {
    z.zeiger.x = e.clientX / innerWidth - 0.5;
    z.zeiger.y = e.clientY / innerHeight - 0.5;
  }, { passive: true });

  /* Läuft nur, solange jemand hinsieht. Im Hintergrundtab ruht die Welt. */
  document.addEventListener('visibilitychange', () => {
    z.an = !document.hidden;
    if (z.an) { letztesY = window.scrollY; starten(); }
  });

  L.welt = {
    z,
    abschnitte: ABSCHNITTE,
    an(fn) { hoerer.add(fn); return () => hoerer.delete(fn); },
    ab(fn) { hoerer.delete(fn); },
    messen: neuMessen,
    klemm,
    misch
  };

  starten();
})();
