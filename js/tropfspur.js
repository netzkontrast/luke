/* Die Tropfspur.

   Im Blatt des Auftakts verlässt der rote Strang das Bild unten. Hier läuft er weiter: auf
   der Seite, nicht mehr auf dem Blatt. Je weiter man liest, desto weiter ist er gelaufen.
   Schneidet das Video zur knienden Figur, bleibt die Spur, wo sie ist: Das Blatt hat
   gewechselt, die Seite behält, was abgetropft ist.

   Blut, kein Faden. Die Spur ist eine Fläche mit wechselnder Breite, eine blasse Waschung
   mit dunklem Kern: oben breiter, unten dünner, mit kleinen Knicken, wo das Papier sie hält.
   Sie zeigt zwei Dinge zugleich:
   - Die Waschung bleibt stehen, so weit die Spur je gelaufen ist. Wer zurückscrollt, sieht
     die getrocknete Spur; nichts zieht sich zurück.
   - Kern und Tropfen zeigen, wo gerade gelesen wird. Der Tropfen hängt am Ende des Kerns,
     etwa in der Mitte des Fensters, und läuft dem Lesen mit einer Feder nach.
   Wer stehen bleibt, lässt den Tropfen stauen: Er wird dick. Liest man weiter, bleibt an der
   Stelle eine Verdickung in der Spur zurück — die Seite merkt sich, wo man verweilt hat.
   Unterwegs bleiben ein paar Spritzer liegen.

   Gezeichnet wird ein SVG in Seitenkoordinaten, kein festes Element: Die Spur gehört zur
   Seite. Die Mittellinie ist eine Funktion x(y); Waschung und Kern sind daraus abgetastete
   Pfade und entstehen einmal je Vermessung. Im Bildtakt ändern sich nur zwei Clip-Rechtecke
   (gelaufen, gelesen) und die transform des Tropfens: kein getPointAtLength, kein neuer
   Pfad. Eine Stauung baut die Waschung einmal neu; das ist selten.

   Aus: Systemeinstellung „reduzierte Bewegung“, data-rot="aus" oder Bewegung aus im
   Bedienfeld, oder wenn der Auftakt fehlt. */
(function () {
  'use strict';
  const L = (window.LUKE = window.LUKE || {});
  const B = L.bewegung, M = B && B.M;
  const app = document.querySelector('.app');
  const halter = document.getElementById('tropfspur');
  if (!app || !halter) return;
  const NS = 'http://www.w3.org/2000/svg';

  /* Ansatz: Im Blatt des Auftakts verlässt der rote Strang das Bild unten bei 70,5 Prozent
     der Breite, gemessen am letzten Bild der Zeichenanimation. Das Standbild danach liegt im
     selben Kasten (.hero-fig), die Spur hängt also an derselben Stelle. */
  const STRANG_X = 0.705;
  /* Abstand der Stützpunkte in Seitenpixeln. */
  const SCHRITT = 6;
  /* Feste Spritzer, als Anteil der Strecke. */
  const SPRITZER = [0.14, 0.37, 0.61, 0.84];
  /* Eine Stauung ist etwa 10 px hoch (σ); mehr als vierzehn merkt sich die Seite nicht. */
  const STAU_SIGMA2 = 200, STAU_MAX = 14;

  const klemm = (v, a, b) => Math.max(a, Math.min(b, v));
  const misch = (a, b, t) => a + (b - a) * t;
  const glatt = t => t * t * (3 - 2 * t);
  const zufall = i => { const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  /* Ein wenig Zufall über die Strecke, weich zwischen festen Stützstellen alle 160 px:
     Reine Sinuswellen wiederholen sich, und das Auge findet den Takt. Papier hat keinen. */
  function rausch(y, saat) { const i = Math.floor(y / 160), t = glatt(y / 160 - i); return misch(zufall(i * 7 + saat) - 0.5, zufall(i * 7 + 7 + saat) - 0.5, t); }
  const f1 = v => v.toFixed(1), f2 = v => v.toFixed(2);

  /* Geometrie, in Koordinaten des SVG (Ursprung: Ansatz, y nach unten). */
  let x0 = 0, x1 = 0, drift = 1, hoehe = 0, oben = 0, breite = 0, links = 0, docHoehe = 0;
  let faktor = 1;          // Wanderbreite: 1 ab 900 px, sonst gestaucht (siehe messen())
  let HW0 = 3.2;           // halbe Breite der Waschung am Ansatz
  let POOL_MAX = 1.8;      // um wie viel der Tropfen höchstens anschwillt, in Pixeln

  let svg, rectLauf, rectJetzt, wasch, stauG, kern, rest, spritzer = [], tropfen;
  let stauungen = [];      // { f, st }: Stelle als Anteil der Strecke, Stärke 0 bis 1
  let stand = 0, lauf = 0, letztesY = -1;

  /* Die Seitenhöhe wird beim Ausmessen gelesen, nicht im Bildtakt: scrollHeight erzwingt
     ein Layout. */
  const dokumentHoehe = () => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);

  /* Die Mittellinie: vom Ansatz in einer flachen S-Kurve an den Rand (drift Pixel lang),
     danach fast senkrecht, mit kleinen Knicken. Ganz gerade sähe sie nach Balken aus, zu
     wellig nach Dekoration. Blut läuft gerade. */
  const wander = y => (Math.sin(y / 138 + 1.1) * 3 + Math.sin(y / 415 + 0.6) * 6 + rausch(y, 3) * 4) * faktor;
  const xBei = y => misch(x0, x1 + wander(y), glatt(klemm(y / drift, 0, 1)));
  /* Die halbe Breite: am Ansatz am breitesten, dann dünner, mit feiner Unruhe, damit kein
     Strich daraus wird; dazu die Stauungen, wo der Leser verweilt hat. */
  const fein = y => 1 + Math.sin(y / 71 + 0.3) * 0.12 + Math.sin(y / 233 + 2.1) * 0.14;
  function stau(y) {
    let s = 0;
    for (const st of stauungen) {
      const dy = y - st.f * hoehe;
      if (dy > -40 && dy < 40) s += st.st * POOL_MAX * 1.3 * Math.exp(-(dy * dy) / STAU_SIGMA2);
    }
    return s;
  }
  const hwBei = y => HW0 * (1 - 0.45 * Math.pow(klemm(y / hoehe, 0, 1), 0.7)) * fein(y) + stau(y);
  /* Der Tropfen deckt die Schnittkante der Waschung und ist nie kleiner als 2,4 px. */
  const tropfenGross = y => Math.max(2.4, hwBei(y) + 0.6);

  /* Tropfenform um den Ursprung, Radius 1: oben spitz, unten rund. Gesetzt wird sie mit
     translate und scale, die Form selbst ändert sich nie. */
  const TROPFEN_D = 'M 0 -2.1 C 0.72 -0.7 1 -0.25 1 0.08 A 1 1 0 1 1 -1 0.08 C -1 -0.25 -0.72 -0.7 0 -2.1 Z';
  const setzen = (el, x, y, sx, sy) => el.setAttribute('transform', `translate(${f1(x)} ${f1(y)}) scale(${f2(sx)} ${f2(sy == null ? sx : sy)})`);

  function el(name, klasse) { const e = document.createElementNS(NS, name); if (klasse) e.setAttribute('class', klasse); return e; }
  function rechteck() { const r = el('rect'); r.setAttribute('x', '0'); r.setAttribute('y', '0'); r.setAttribute('width', '0'); r.setAttribute('height', '0'); return r; }

  function aufbauen() {
    halter.textContent = '';
    svg = el('svg'); svg.setAttribute('aria-hidden', 'true');
    const defs = el('defs');
    const cLauf = el('clipPath'); cLauf.id = 'ts-lauf'; rectLauf = rechteck(); cLauf.appendChild(rectLauf);
    const cJetzt = el('clipPath'); cJetzt.id = 'ts-jetzt'; rectJetzt = rechteck(); cJetzt.appendChild(rectJetzt);
    defs.append(cLauf, cJetzt);
    /* Gelaufen: die Waschung und die Stauungen, bis zum höchsten Stand. */
    const gLauf = el('g'); gLauf.setAttribute('clip-path', 'url(#ts-lauf)');
    wasch = el('path', 'ts-wasch'); stauG = el('g', 'ts-stau'); gLauf.append(wasch, stauG);
    /* Der getrocknete Tropfen am Ende der Waschung: rundet die Schnittkante, wenn der Leser
       wieder oben ist. Solange der Tropfen selbst dort hängt, liegt er darüber. */
    rest = el('path', 'ts-rest'); rest.setAttribute('d', TROPFEN_D); rest.setAttribute('opacity', '0');
    /* Gelesen: der Kern, bis zum jetzigen Stand. */
    const gJetzt = el('g'); gJetzt.setAttribute('clip-path', 'url(#ts-jetzt)');
    kern = el('path', 'ts-kern'); gJetzt.appendChild(kern);
    const gSpritzer = el('g', 'ts-spritzer');
    spritzer = SPRITZER.map(f => { const p = el('path'); p.setAttribute('d', TROPFEN_D); p.setAttribute('opacity', '0'); gSpritzer.appendChild(p); return { p, f, deck: '0' }; });
    tropfen = el('path', 'ts-tropfen'); tropfen.setAttribute('d', TROPFEN_D); tropfen.setAttribute('opacity', '0');
    svg.append(defs, gLauf, rest, gJetzt, gSpritzer, tropfen);
    halter.appendChild(svg);
  }

  /* Die Waschung als Fläche: linke Kante hinunter, rechte Kante hinauf. Die Stauungen
     liegen als dunklere Kerne darauf. */
  function waschBauen() {
    const n = Math.floor(hoehe / SCHRITT);
    const li = [], re = [];
    for (let i = 0; i <= n; i++) {
      const y = Math.min(i * SCHRITT, hoehe), x = xBei(y), hw = hwBei(y);
      li.push(`${f1(x - hw)} ${f1(y)}`);
      re.push(`${f1(x + hw)} ${f1(y)}`);
    }
    re.reverse();
    wasch.setAttribute('d', 'M ' + li.join(' L ') + ' L ' + re.join(' L ') + ' Z');
    stauG.textContent = '';
    stauungen.forEach(st => {
      const y = st.f * hoehe, e = el('ellipse');
      e.setAttribute('cx', f1(xBei(y))); e.setAttribute('cy', f1(y));
      e.setAttribute('rx', f1(HW0 * 0.45 + st.st * POOL_MAX * 0.9)); e.setAttribute('ry', f1(5 + st.st * 6));
      stauG.appendChild(e);
    });
  }
  function kernBauen() {
    const n = Math.floor(hoehe / SCHRITT), d = [];
    for (let i = 0; i <= n; i++) { const y = Math.min(i * SCHRITT, hoehe); d.push(`${f1(xBei(y))} ${f1(y)}`); }
    kern.setAttribute('d', 'M ' + d.join(' L '));
  }

  function messen() {
    const figur = document.querySelector('.hero-fig');
    docHoehe = dokumentHoehe();
    if (!figur) return false;
    const r = figur.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const quelleX = r.left + window.scrollX + r.width * STRANG_X;
    oben = Math.round(r.bottom + window.scrollY);
    hoehe = Math.max(0, docHoehe - oben - 90);
    if (hoehe < 200) return false;
    const schmal = innerWidth < 900;
    faktor = schmal ? 0.25 : 1;
    HW0 = schmal ? 2.4 : 3.2;
    POOL_MAX = schmal ? 1.4 : 1.8;
    /* Der Rand: ab 900 px rechts neben der .wrap und rechts neben den Blättern der Folge
       (die stehen 8 vw vor der Kante), darunter an der Kante des Fensters. Liegt die Quelle
       schon in diesem Rand, läuft die Spur gerade hinunter statt erst zur Seite: Das Blatt
       sitzt in der Ecke der Seite, der Strang tritt nahe der Kante aus.
       Unter 900 px ist der Rinnstein neben dem Text nur die 16 px Innenabstand der .wrap
       (siehe css/site.css); darin muss die Spur bleiben. Sie läuft deshalb 8 px vor der Kante
       und die Wanderung wird auf ein Viertel gestaucht: Bei voller Breite reichte sie bis in
       die rechtsbündige Nebenschrift und in den Instagram-Link im Fuß. */
    const wrap = document.querySelector('#werke .wrap') || document.querySelector('.wrap');
    const wrapRechts = wrap ? wrap.getBoundingClientRect().right + window.scrollX : innerWidth;
    const randMin = Math.min(Math.max(wrapRechts + 56, innerWidth * 0.92 + 24), innerWidth - 24);
    const randX = schmal ? innerWidth - 8 : klemm(quelleX, randMin, innerWidth - 24);
    /* Die S-Kurve zum Rand: auf dem Schreibtisch lang und flach, auf dem Telefon ein halbes
       Fenster — dort steht gleich unter dem Blatt der Vorspann, und die Spur soll neben dem
       Text laufen, nicht hindurch (der Vorspann bleibt dafür schmal, css/site.css). */
    drift = Math.max(1, Math.round(Math.min(hoehe * 0.12, innerHeight * (schmal ? 0.5 : 1.2))));
    /* Der Halter deckt Quelle und Rand samt Wanderung, Waschung und Spritzern (zusammen
       unter 30 px je Seite) und reicht nie über die Fensterkante hinaus: Kein Vorfahre
       schneidet #tropfspur ab, ein Überstand risse die Seite waagerecht auf. */
    links = Math.round(Math.min(quelleX, randX) - 40);
    breite = Math.min(Math.round(Math.abs(randX - quelleX) + 80), innerWidth - links);
    x0 = quelleX - links; x1 = randX - links;

    halter.style.left = links + 'px';
    halter.style.top = oben + 'px';
    halter.style.width = breite + 'px';
    halter.style.height = hoehe + 'px';
    svg.setAttribute('viewBox', `0 0 ${breite} ${hoehe}`);
    svg.setAttribute('width', String(breite));
    svg.setAttribute('height', String(hoehe));
    rectLauf.setAttribute('width', String(breite));
    rectJetzt.setAttribute('width', String(breite));

    waschBauen();
    kernBauen();
    spritzer.forEach((s, i) => {
      const y = s.f * hoehe, dx = (i % 2 ? 1 : -1) * (5 + (i % 3)) * (schmal ? 0.3 : 1);
      setzen(s.p, xBei(y) + dx, y, 1.5 + (i % 3) * 0.4);
    });
    /* Was schon gelaufen ist, bleibt gelaufen — auch nach einem Umbruch der Seite. */
    const yLauf = lauf * hoehe;
    rectLauf.setAttribute('height', f1(yLauf));
    setzen(rest, xBei(yLauf), yLauf, tropfenGross(yLauf));
    letztesY = -1;
    return true;
  }

  /* ---- Der Tropfen und die Stauung ---- */
  let pool = 0, poolAnim = null, ruheTimer = 0, ruheY = -1, ruheAmLauf = false;
  const poolWert = M ? M.motionValue(0) : null;
  if (poolWert) poolWert.on('change', v => { pool = v; tropfenSetzen(); });
  function halt(a) { if (a && a.stop) a.stop(); }

  function tropfenSetzen() {
    if (!hoehe) return;
    const y = stand * hoehe, gross = tropfenGross(y) + pool;
    /* Wer schnell nach unten liest, zieht den Tropfen ein wenig in die Länge. */
    const v = spur ? spur.getVelocity() * hoehe : 0;
    setzen(tropfen, xBei(y), y, gross, gross * (1 + klemm(v / 4000, 0, 0.35)));
    tropfen.setAttribute('opacity', stand > 0.003 ? '1' : '0');
  }
  /* Steht der Leser eine halbe Sekunde, sammelt sich am Tropfen etwas — drei Sekunden lang,
     dann ist er voll. */
  function sammeln(y) {
    if (!poolWert || stand < 0.003 || !an()) return;
    ruheY = y; ruheAmLauf = stand >= lauf - 0.0005;
    halt(poolAnim);
    poolAnim = M.animate(poolWert, POOL_MAX, { duration: 3, ease: [0.3, 0.1, 0.2, 1] });
  }
  /* Geht es weiter, bleibt die Stauung als Verdickung zurück, wenn der Tropfen vorn lag;
     der Tropfen selbst wird wieder schlank. */
  function weiter() {
    halt(poolAnim); poolAnim = null;
    if (pool > POOL_MAX * 0.3 && ruheAmLauf) ablegen(ruheY / hoehe, pool / POOL_MAX);
    if (pool > 0 && poolWert) poolAnim = M.animate(poolWert, 0, { duration: 0.4, ease: [0.3, 0.1, 0.2, 1] });
    ruheY = -1;
  }
  function ablegen(f, st) {
    const letzte = stauungen[stauungen.length - 1];
    if (letzte && Math.abs(letzte.f - f) * hoehe < 30) letzte.st = Math.max(letzte.st, st);
    else if (stauungen.length < STAU_MAX) stauungen.push({ f, st });
    else return;
    waschBauen();
  }
  function ruhe(y) {
    if (ruheY >= 0 && Math.abs(y - ruheY) > 24) weiter();
    clearTimeout(ruheTimer);
    ruheTimer = setTimeout(() => sammeln(y), 450);
  }

  function zeichnen(neu) {
    if (!hoehe || !docHoehe) return;
    if (typeof neu !== 'number') neu = spur ? spur.get() : 0;
    stand = klemm(neu, 0, 1);
    const y = stand * hoehe;
    /* Die Feder nähert sich ihrem Ziel nur asymptotisch; unter einem Viertelpixel wird
       nicht gezeichnet, und die Ruhe zählt weiter. */
    if (letztesY >= 0 && Math.abs(y - letztesY) < 0.25) return;
    letztesY = y;
    rectJetzt.setAttribute('height', f1(y));
    if (stand > lauf) {
      lauf = stand;
      rectLauf.setAttribute('height', f1(y));
      setzen(rest, xBei(y), y, tropfenGross(y));
      rest.setAttribute('opacity', lauf > 0.003 ? '1' : '0');
      /* Ein Spritzer wird sichtbar, sobald die Spur an ihm vorbei ist, und bleibt stehen. */
      spritzer.forEach(s => {
        const deck = lauf > s.f ? String(Math.min(1, (lauf - s.f) * 14)) : '0';
        if (deck !== s.deck) { s.deck = deck; s.p.setAttribute('opacity', deck); }
      });
    }
    tropfenSetzen();
    ruhe(y);
  }
  /* Der Stand aus der Scrollposition, dieselbe Abbildung wie bisher: Der Tropfen hängt
     ungefähr in der Mitte des Fensters und wandert langsam nach unten. */
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
    if (!an()) { halter.hidden = true; halt(poolAnim); return; }
    halter.hidden = !messen();
    zeichnen(spur ? spur.get() : 0);
  }

  /* Der Antrieb: scroll() liest den Fortschritt, die Feder läuft ihm nach. Ohne Motion gibt
     es keine Spur — dann ist auch sonst nichts in Bewegung. Steht vor aufbauen()/auffrischen():
     auffrischen() liest spur schon bei seinem ersten Aufruf, vor der let-Zeile wäre das ein
     ReferenceError (temporal dead zone). */
  let fortschritt = null, spur = null;
  if (M) {
    fortschritt = M.motionValue(0);
    spur = M.springValue(fortschritt, { stiffness: 120, damping: 28 });
    spur.on('change', zeichnen);
    M.scroll((p, info) => { fortschritt.set(standAus(info.y.current)); });
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

  L.tropfspur = { auffrischen, zeichnen, stand: () => stand, lauf: () => lauf, stauungen: () => stauungen.length };
})();
