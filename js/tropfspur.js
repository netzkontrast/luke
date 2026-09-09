/* Die Tropfspur.

   Auf der Website lief bisher links eine gerade rote Linie als Scrollfortschritt mit. Sie
   war abstrakt und hatte mit den Arbeiten nichts zu tun. Diese Spur setzt stattdessen dort
   an, wo im Blatt des Auftakts die Tusche endet, und läuft von da die Seite hinunter: Je
   weiter man liest, desto weiter ist sie gelaufen. Am unteren Ende hängt ein Tropfen,
   unterwegs bleiben einzelne Spritzer stehen.

   Neu: Die Spur findet innerhalb der Blattfolge den rechten Rand und läuft dort weiter —
   sie lief vorher mitten durch den Text der Handschrift, über das Formular und das
   Atelierfoto. Der Text ist die Hauptsache. Angetrieben wird sie von Motion: scroll()
   liest den Fortschritt, ein springValue läuft ihm einen Hauch nach, wie Flüssigkeit.

   Gezeichnet wird ein SVG in Seitenkoordinaten, kein festes Element: Die Spur gehört zur
   Seite, nicht zum Fenster. Bewegt wird nur stroke-dashoffset und ein Tropfen; beides ist
   für den Browser billig.

   Aus: Systemeinstellung „reduzierte Bewegung", data-rot="aus" im Bedienfeld, oder wenn
   der Auftakt fehlt. */
(function () {
  'use strict';
  const L = (window.LUKE = window.LUKE || {});
  const B = L.bewegung, M = B && B.M;
  const app = document.querySelector('.app');
  const halter = document.getElementById('tropfspur');
  if (!app || !halter) return;

  const NS = 'http://www.w3.org/2000/svg';
  const prm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Ansatzpunkt: die unterste Stelle, an der im Blatt des Auftakts noch Tusche steht.
     Im Bild liegt sie bei rund 44 Prozent der Breite und 93 Prozent der Höhe; weil die
     Figur im Kopf der Seite rechtsbündig beschnitten wird (siehe .hero-still), sind das
     hier gut 32 Prozent der sichtbaren Breite. Von dort läuft die Spur weiter, als
     tropfte die Zeichnung ab. */
  const STRANG_X = 0.32;
  const STRANG_Y = 0.93;
  /* Ruhepunkte, an denen ein Spritzer hängen bleibt, als Anteil der Spurlänge. */
  const SPRITZER = [0.16, 0.34, 0.52, 0.71, 0.88];
  let x0 = 0, x1 = 0, drift = 0;   // Ansatz, Randlage, Höhe der S-Kurve — in Koordinaten des SVG
  let faktor = 1;   // Wanderbreite: 1 ab 900 px, sonst gestaucht (siehe messen())

  let svg, pfad, tropfen, spritzer = [], laenge = 0, oben = 0, hoehe = 0, breite = 0;
  let letzterStand = -1, docHoehe = 0;

  /* Die Seitenhöhe wird beim Ausmessen gelesen, nicht im Bildtakt: scrollHeight erzwingt
     ein Layout, und zeichnen() lief damit auch auf Bildern, an denen es nichts zu tun gab. */
  const dokumentHoehe = () =>
    Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);

  /* Vom Ansatz in einer S-Kurve an den Rand, dann die leicht wandernde Linie senkrecht
     weiter. Ganz gerade sähe sie nach Balken aus, zu wellig nach Dekoration. */
  function pfadDaten(h) {
    let d = `M ${x0} 0 C ${x0} ${(drift * 0.55).toFixed(1)} ${x1} ${(drift * 0.45).toFixed(1)} ${x1} ${drift}`;
    const rest = h - drift;
    const schritte = Math.max(6, Math.round(rest / 260));
    for (let i = 1; i <= schritte; i++) {
      const y = drift + (rest * i) / schritte, y0 = drift + (rest * (i - 1)) / schritte;
      const ab = (Math.sin(i * 1.7) * 9 + Math.sin(i * 0.6) * 5) * faktor;
      const ab0 = (Math.sin((i - 1) * 1.7) * 9 + Math.sin((i - 1) * 0.6) * 5) * faktor;
      d += ` C ${x1 + ab0} ${y0 + (y - y0) * 0.4} ${x1 + ab} ${y - (y - y0) * 0.4} ${x1 + ab} ${y}`;
    }
    return d;
  }

  function aufbauen() {
    halter.textContent = '';
    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('fill', 'none');
    pfad = document.createElementNS(NS, 'path');
    pfad.setAttribute('stroke', 'var(--red)');
    pfad.setAttribute('stroke-linecap', 'round');
    /* Dünn und leicht durchscheinend: Die Spur soll über der Seite liegen, aber nicht
       gegen die Zeichnungen antreten. */
    pfad.setAttribute('stroke-opacity', '0.72');
    svg.appendChild(pfad);

    spritzer = SPRITZER.map(() => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('opacity', '0');
      const tr = document.createElementNS(NS, 'path');
      tr.setAttribute('fill', 'var(--red)');
      tr.setAttribute('fill-opacity', '0.8');
      g.appendChild(tr);
      svg.appendChild(g);
      return { g, tr, bei: 0, deck: '' };
    });
    spritzer.forEach((s, i) => { s.bei = SPRITZER[i]; });

    tropfen = document.createElementNS(NS, 'path');
    tropfen.setAttribute('fill', 'var(--red)');
    tropfen.setAttribute('fill-opacity', '0.85');
    svg.appendChild(tropfen);
    halter.appendChild(svg);
  }

  /* Tropfenform: oben spitz, unten rund, wie ein hängender Tropfen. */
  function tropfenForm(x, y, r) {
    return `M ${x} ${y - r * 2.1} C ${x + r * 0.72} ${y - r * 0.7} ${x + r} ${y - r * 0.25} ${x + r} ${y + r * 0.08}
            A ${r} ${r} 0 1 1 ${x - r} ${y + r * 0.08}
            C ${x - r} ${y - r * 0.25} ${x - r * 0.72} ${y - r * 0.7} ${x} ${y - r * 2.1} Z`;
  }

  function messen() {
    const figur = document.querySelector('.hero-fig');
    const doc = docHoehe = dokumentHoehe();
    if (!figur) return false;
    const r = figur.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const seitenX = r.left + window.scrollX + r.width * STRANG_X;
    oben = Math.round(r.top + window.scrollY + r.height * STRANG_Y);
    hoehe = Math.max(0, doc - oben - 90);
    /* Der Rand: ab 900 px rechts neben der .wrap, darunter an der Kante des Fensters.
       Unter 900 px ist der Rinnstein neben dem Text nur die 16 px Innenabstand der .wrap
       (siehe css/site.css) — darin muss die Spur bleiben. Sie läuft deshalb näher an der
       Kante (8 statt 18 px) und die Wanderung wird auf ein Viertel gestaucht: Bei voller
       Breite reichte sie bis in die rechtsbündige Nebenschrift der Team-Liste und in den
       Instagram-Link im Fuß hinein. */
    const wrap = document.querySelector('#werke .wrap') || document.querySelector('.wrap');
    const wrapRechts = wrap ? wrap.getBoundingClientRect().right + window.scrollX : innerWidth;
    const randX = innerWidth >= 900 ? Math.min(wrapRechts + 56, innerWidth - 24) : innerWidth - 8;
    faktor = innerWidth >= 900 ? 1 : 0.25;
    drift = Math.round(Math.min(hoehe * 0.12, innerHeight * 1.2));
    const links = Math.round(Math.min(seitenX, randX) - 110);
    breite = Math.round(Math.abs(randX - seitenX) + 220);
    x0 = seitenX - links; x1 = randX - links;
    /* Der übliche Puffer von 110 px reicht auf dem Telefon (randX nur 8 px vor der Kante)
       über das Fenster hinaus: kein Vorfahre schneidet #tropfspur ab (anders als .g-wall bei
       der Galerie), das riss die Seite waagerecht auf und blähte in mobilen Browsern sogar
       innerWidth auf. Der Halter reicht darum nie weiter als bis zur Fensterkante. */
    breite = Math.min(breite, innerWidth - links);
    if (hoehe < 200) return false;

    halter.style.left = links + 'px';
    halter.style.top = oben + 'px';
    halter.style.width = breite + 'px';
    halter.style.height = hoehe + 'px';
    svg.setAttribute('viewBox', `0 0 ${breite} ${hoehe}`);
    svg.setAttribute('width', String(breite));
    svg.setAttribute('height', String(hoehe));

    pfad.setAttribute('d', pfadDaten(hoehe));
    pfad.setAttribute('stroke-width', '2');
    laenge = pfad.getTotalLength();
    pfad.style.strokeDasharray = String(laenge);

    spritzer.forEach((s, i) => {
      const p = pfad.getPointAtLength(laenge * SPRITZER[i]);
      const gross = 2.4 + (i % 3) * 0.8;
      s.tr.setAttribute('d', tropfenForm(p.x + (i % 2 ? 3 : -3), p.y, gross));
    });
    letzterStand = -1;
    return true;
  }

  function zeichnen(stand) {
    if (!laenge || !docHoehe) return;
    if (typeof stand !== 'number') stand = spur ? spur.get() : 0;
    stand = Math.max(0, Math.min(1, stand));
    if (Math.abs(stand - letzterStand) < 0.0008) return;
    letzterStand = stand;

    pfad.style.strokeDashoffset = String(laenge * (1 - stand));
    /* Der Tropfen hängt am unteren Ende der bereits gelaufenen Spur. */
    const p = pfad.getPointAtLength(Math.max(1, laenge * stand));
    const wachsen = 2.2 + Math.min(1.8, stand * 2.4);
    tropfen.setAttribute('d', tropfenForm(p.x, p.y, wachsen));
    tropfen.setAttribute('opacity', stand > 0.004 ? '1' : '0');

    spritzer.forEach((s) => {
      /* Ein Spritzer wird sichtbar, sobald die Spur an ihm vorbei ist, und bleibt stehen.
         Geschrieben wird nur, wenn sich der Wert wirklich ändert. */
      const deck = stand > s.bei ? String(Math.min(1, (stand - s.bei) * 14) * 0.85) : '0';
      if (deck !== s.deck) { s.deck = deck; s.g.setAttribute('opacity', deck); }
    });
  }
  /* Der Stand aus der Scrollposition, dieselbe Abbildung wie bisher. */
  function standAus(y) {
    const max = docHoehe - innerHeight;
    return max > 0 ? (y - oben * 0.35) / (max - oben * 0.35 + 1) : 0;
  }

  function an() {
    if (app.dataset.rot === 'aus') return false;
    if (app.dataset.bewegung === 'aus') return false;
    if (!M || !B.m()) return false;
    return true;
  }

  function auffrischen() {
    if (!an()) { halter.hidden = true; return; }
    halter.hidden = !messen();
    zeichnen(spur ? spur.get() : 0);
  }

  /* Der Antrieb: scroll() liest den Fortschritt, die Feder läuft ihm nach. Ohne Motion gibt
     es keine Spur — dann ist auch sonst nichts in Bewegung. Steht vor aufbauen()/auffrischen():
     auffrischen() liest spur schon bei seinem ersten Aufruf, vor der let-Zeile wäre das ein
     ReferenceError (temporal dead zone). */
  let stand = null, spur = null;
  if (M) {
    stand = M.motionValue(0);
    spur = M.springValue(stand, { stiffness: 120, damping: 28 });
    spur.on('change', zeichnen);
    M.scroll((p, info) => { stand.set(standAus(info.y.current)); });
  }

  aufbauen();
  auffrischen();

  let warte = 0;
  const neuMessen = () => {
    clearTimeout(warte);
    warte = setTimeout(auffrischen, 140);
  };
  addEventListener('resize', neuMessen);
  addEventListener('load', neuMessen);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(neuMessen);
  /* Die Seitenhöhe ändert sich, wenn die Galerie filtert oder die Werkansicht aufgeht. */
  new MutationObserver(neuMessen).observe(document.body, { childList: true, subtree: true });
  new MutationObserver(auffrischen).observe(app, { attributes: true, attributeFilter: ['data-rot', 'data-bewegung', 'data-richtung'] });
  if (prm) halter.dataset.ruhig = 'an';

  L.tropfspur = { auffrischen, zeichnen };
})();
