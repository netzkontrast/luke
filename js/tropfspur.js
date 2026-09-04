/* Die Tropfspur.

   Auf der Website lief bisher links eine gerade rote Linie als Scrollfortschritt mit. Sie
   war abstrakt und hatte mit den Arbeiten nichts zu tun. Diese Spur setzt stattdessen dort
   an, wo der rote Strang in Werk I aus der Zeichnung austritt, und läuft von da die Seite
   hinunter: Je weiter man liest, desto weiter ist sie gelaufen. Am unteren Ende hängt ein
   Tropfen, unterwegs bleiben einzelne Spritzer stehen.

   Gezeichnet wird ein SVG in Seitenkoordinaten, kein festes Element: Die Spur gehört zur
   Seite, nicht zum Fenster. Bewegt wird nur stroke-dashoffset und ein Tropfen; beides ist
   für den Browser billig.

   Aus: Systemeinstellung „reduzierte Bewegung", data-rot="aus" im Bedienfeld, oder wenn
   der Auftakt fehlt. */
(function () {
  'use strict';
  const L = (window.LUKE = window.LUKE || {});
  const app = document.querySelector('.app');
  const halter = document.getElementById('tropfspur');
  if (!app || !halter) return;

  const NS = 'http://www.w3.org/2000/svg';
  const prm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Der rote Strang sitzt in Werk I bei knapp 57 Prozent der Bildbreite und tritt bei
     rund 62 Prozent der Bildhöhe aus der Figur aus. Von dort startet die Spur. */
  const STRANG_X = 0.57;
  const STRANG_Y = 0.62;
  /* Ruhepunkte, an denen ein Spritzer hängen bleibt, als Anteil der Spurlänge. */
  const SPRITZER = [0.16, 0.34, 0.52, 0.71, 0.88];

  let svg, pfad, tropfen, spritzer = [], laenge = 0, oben = 0, hoehe = 0, breite = 220;
  let letzterStand = -1;

  const dokumentHoehe = () =>
    Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);

  /* Eine leicht wandernde Linie. Ganz gerade sähe sie nach Balken aus, zu wellig nach
     Dekoration; hier reichen wenige Pixel Abweichung. */
  function pfadDaten(h, x) {
    const schritte = Math.max(6, Math.round(h / 260));
    let d = `M ${x} 0`;
    for (let i = 1; i <= schritte; i++) {
      const y = (h * i) / schritte;
      const y0 = (h * (i - 1)) / schritte;
      const ab = Math.sin(i * 1.7) * 9 + Math.sin(i * 0.6) * 5;
      const ab0 = Math.sin((i - 1) * 1.7) * 9 + Math.sin((i - 1) * 0.6) * 5;
      d += ` C ${x + ab0} ${y0 + (y - y0) * 0.4} ${x + ab} ${y - (y - y0) * 0.4} ${x + ab} ${y}`;
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
      return { g, tr };
    });

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
    const doc = dokumentHoehe();
    if (!figur) return false;
    const r = figur.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const seitenX = r.left + window.scrollX + r.width * STRANG_X;
    oben = Math.round(r.top + window.scrollY + r.height * STRANG_Y);
    hoehe = Math.max(0, doc - oben - 90);
    if (hoehe < 200) return false;

    const links = Math.round(seitenX - breite / 2);
    halter.style.left = links + 'px';
    halter.style.top = oben + 'px';
    halter.style.width = breite + 'px';
    halter.style.height = hoehe + 'px';
    svg.setAttribute('viewBox', `0 0 ${breite} ${hoehe}`);
    svg.setAttribute('width', String(breite));
    svg.setAttribute('height', String(hoehe));

    pfad.setAttribute('d', pfadDaten(hoehe, breite / 2));
    pfad.setAttribute('stroke-width', '2');
    laenge = pfad.getTotalLength();
    pfad.style.strokeDasharray = String(laenge);

    spritzer.forEach((s, i) => {
      const p = pfad.getPointAtLength(laenge * SPRITZER[i]);
      const gross = 2.4 + (i % 3) * 0.8;
      s.tr.setAttribute('d', tropfenForm(p.x + (i % 2 ? 3 : -3), p.y, gross));
      s.g.dataset.bei = String(SPRITZER[i]);
    });
    letzterStand = -1;
    return true;
  }

  function zeichnen() {
    if (!laenge) return;
    const max = dokumentHoehe() - innerHeight;
    const roh = max > 0 ? (window.scrollY - oben * 0.35) / (max - oben * 0.35 + 1) : 0;
    const stand = Math.max(0, Math.min(1, roh));
    if (Math.abs(stand - letzterStand) < 0.0008) return;
    letzterStand = stand;

    pfad.style.strokeDashoffset = String(laenge * (1 - stand));
    /* Der Tropfen hängt am unteren Ende der bereits gelaufenen Spur. */
    const p = pfad.getPointAtLength(Math.max(1, laenge * stand));
    const wachsen = 2.2 + Math.min(1.8, stand * 2.4);
    tropfen.setAttribute('d', tropfenForm(p.x, p.y, wachsen));
    tropfen.setAttribute('opacity', stand > 0.004 ? '1' : '0');

    spritzer.forEach((s) => {
      const bei = Number(s.g.dataset.bei);
      /* Ein Spritzer wird sichtbar, sobald die Spur an ihm vorbei ist, und bleibt stehen. */
      s.g.setAttribute('opacity', stand > bei ? String(Math.min(1, (stand - bei) * 14) * 0.85) : '0');
    });
  }

  function an() {
    if (app.dataset.rot === 'aus') return false;
    if (app.dataset.bewegung === 'aus') return false;
    return true;
  }

  function auffrischen() {
    if (!an()) { halter.hidden = true; return; }
    halter.hidden = !messen();
    zeichnen();
  }

  aufbauen();
  auffrischen();

  /* Ohne Motion-Modul greifen wir auf das Scroll-Ereignis zurück. */
  if (L.motion && typeof L.motion.on === 'function') L.motion.on(zeichnen);
  else addEventListener('scroll', zeichnen, { passive: true });

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
