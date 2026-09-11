/* Die Tropfspur.

   Im Blatt des Auftakts läuft der rote Strang unten aus dem Bild. Hier läuft er weiter:
   auf der Seite, nicht mehr auf dem Blatt. Wenn das Video zur knienden Figur schneidet,
   bleibt die Spur stehen — das Blatt hat gewechselt, die Seite behält, was abgetropft ist.

   Was sie tut:
   - Sie folgt dem Lesen mit Verzögerung. Der Tropfen hängt etwas unter der Mitte des
     Fensters und läuft dorthin nach, wie Flüssigkeit, nicht wie ein Zeiger. Wer schnell
     scrollt, zieht eine dünne Bahn. Wer stehen bleibt, lässt sie stauen: Der Tropfen wird
     dick, und läuft er weiter, bleibt die Stauung als Verdickung in der Spur, ab und zu
     mit einem Spritzer daneben.
   - Sie läuft nur abwärts. Wer zurückscrollt, sieht, was schon gelaufen ist; nichts zieht
     sich zurück. Gezeichnet wird in Seitenkoordinaten: Spritzer bleiben, wo sie waren.
   - Sie trocknet. Wie viel an einer Stelle der Seite läuft, steht in der Tabelle des
     Weltzustands (LUKE.ABSCHNITTE in index.html): oben bei den Zeichnungen viel, und
     trocken, bevor die Seite praktisch wird — vor dem Atelier mit dem Kontakt. Auf dem
     Telefon endet sie schon an der Kante des Streifens „Aktuell", weil dort der Text die
     Hauptsache ist.
   - Sie läuft am Rand. Vom Strang geht sie in einer flachen S-Kurve an den rechten Rand,
     neben den Text und neben die Blätter der Folge, und dort fast senkrecht hinunter.
   - Sie liegt mit multiply auf dem Papier: über Weiß rot, über Tusche dunkel. Was auf dem
     Papier liegt — der Streifen „Aktuell", Fotos, Plakate —, deckt sie zu (css/site.css).

   Gezeichnet wird ein Strang als Fläche mit wechselnder Breite, eine blasse Waschung und
   darin ein dunkler Kern, kein Strich. Ein Canvas im Fenster, nur so breit wie die Spur,
   neu gezeichnet nur, wenn sich etwas geändert hat. Die Scrollposition liest niemand hier:
   Sie kommt vom Weltzustand (js/weltzustand.js), einmal pro Bild.

   Bei reduzierter Bewegung und bei data-bewegung="aus" steht die Spur fertig da: der
   Endzustand, nicht die Reise. data-rot="aus" nimmt sie ganz weg (css/site.css).

   Die Spur ist aus dem Entwurf in PR #2 übernommen (Canvas, Tabelle, Trocknen, Stauung,
   Spritzer). Den Weg an den Rand hat die Fassung davor gefunden; er bleibt, weil das Blatt
   im Kopf inzwischen in der Ecke der Seite sitzt und der Strang sonst durch den Text liefe. */
(function () {
  'use strict';
  const L = (window.LUKE = window.LUKE || {});
  const app = document.querySelector('.app');
  const cv = document.getElementById('tropfspur');
  const welt = L.welt;
  if (!app || !cv || !welt || typeof cv.getContext !== 'function') return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  const z = welt.z, klemm = welt.klemm, misch = welt.misch;

  /* Ansatz: Im Blatt des Auftakts verlässt der rote Strang das Bild unten bei 70,5 Prozent
     der Breite, gemessen am letzten Bild der Zeichenanimation. Das Standbild danach liegt im
     selben Kasten (.hero-fig), die Spur hängt also an derselben Stelle. */
  const STRANG_X = 0.705;
  /* Abstand der Stützpunkte auf der Spur in Seitenpixeln. */
  const SCHRITT = 6;
  /* Wie weit Spur, Wanderung und Spritzer höchstens neben der Mittellinie liegen. Das Canvas
     ist nur so breit, wie es dafür braucht: multiply auf einer fensterfüllenden Fläche
     kostete den Browser bei jedem Bild einen ganzen Mischdurchgang, auf einem Streifen fast
     nichts. */
  const RAND = 40;

  const glatt = t => t * t * (3 - 2 * t);
  const zufall = i => { const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };

  let aktiv = false, statisch = false;
  let dpr = 1, links = 0, breite = 0;
  const quelle = { x: 0, y: 0 };
  let randX = 0, drift = 1, faktor = 1;
  let ende = 0, strecke = 0;
  let HW0 = 3, POOL_MAX = 3.2;
  let ROT = '209,35,42', ROT2 = '126,20,26', satt = false;

  /* Die Spur ist Geschichte: Jeder Stützpunkt merkt sich, wie breit der Strang war, als
     der Tropfen dort vorbeikam. Alles liegt als Anteil der Strecke vor (0 Quelle, 1 Ende),
     damit ein Umbruch der Seite die Spur mitnimmt, statt sie zu verschieben. */
  let spitze = 0;          // wie weit der Tropfen gelaufen ist, 0 bis 1
  let proben = [];         // { f, hw }: halbe Breite an der Stelle
  let stauungen = [];      // { f, st }: wo der Tropfen stand, und wie lange
  let spritzer = [];       // { f, dx, r }
  let pool = 0;            // was sich am hängenden Tropfen gerade sammelt, in Pixeln
  let schwall = 0;         // was nach dem Loslassen noch mitläuft
  let ruhe = 0;            // Bilder, seit der Tropfen steht
  let tempo = 0, tempoGlatt = 0;
  let letzterStempel = '';

  function rgb(name, rueck) {
    const v = getComputedStyle(app).getPropertyValue(name).trim();
    const m = /^#([0-9a-f]{6})$/i.exec(v);
    if (!m) return rueck;
    const n = parseInt(m[1], 16);
    return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
  }

  /* ---- Der Weg ---- */
  /* Ein wenig Zufall über die Strecke, weich zwischen festen Stützstellen: Reine Sinuswellen
     wiederholen sich, und das Auge findet den Takt. Papier hat keinen. */
  function rausch(y, saat) {
    const i = Math.floor(y / 90), t = y / 90 - i, w = t * t * (3 - 2 * t);
    return misch(zufall(i * 7 + saat) - 0.5, zufall(i * 7 + 7 + saat) - 0.5, w);
  }
  /* Seitliches Wandern, an die Strecke gebunden, nicht an die Zeit. Wenig: Blut läuft
     gerade, mit kleinen Knicken, wo das Papier es hält. Auf dem Telefon auf ein Viertel
     gestaucht, weil der Rand dort nur 16 Pixel breit ist. */
  const wander = y => (Math.sin(y / 138 + 1.1) * 3 + Math.sin(y / 415 + 0.6) * 6 + Math.sin(y / 37) * 0.6 + rausch(y, 3) * 6) * faktor;
  /* Die Mittellinie in Seitenkoordinaten: vom Strang in einer flachen S-Kurve an den Rand
     (drift Pixel lang), danach fast senkrecht, mit kleinen Knicken. */
  const xBei = y => { const d = y - quelle.y; return misch(quelle.x, randX + wander(d), glatt(klemm(d / drift, 0, 1))); };
  /* Feine Unruhe in der Breite, damit kein Strich daraus wird. */
  const fein = y => 1 + Math.sin(y / 71 + 0.3) * 0.12 + Math.sin(y / 233 + 2.1) * 0.14 + rausch(y * 1.7 + 50, 11) * 0.2;

  function messen() {
    const warStatisch = statisch;
    ROT = rgb('--red', ROT);
    ROT2 = rgb('--red2', ROT2);
    satt = app.dataset.rot === 'satt';
    dpr = Math.min(2, window.devicePixelRatio || 1);
    letzterStempel = '';
    aktiv = false;

    const fig = document.querySelector('.hero-fig');
    if (!fig) return;
    const r = fig.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0)) return;
    quelle.x = r.left + window.scrollX + r.width * STRANG_X;
    quelle.y = r.bottom + window.scrollY;

    /* Der Rand, nach dem Satzspiegel der Seite (css/site.css), nicht nach der Tabelle: ab
       900 px rechts neben der .wrap und rechts neben den Blättern der Folge (die stehen 8 vw
       vor der Kante), darunter 8 px vor der Kante des Fensters, im Innenabstand der .wrap.
       Liegt die Quelle schon im Rand, läuft die Spur gerade hinunter. */
    const schmal = innerWidth < 900;
    faktor = schmal ? 0.25 : 1;
    HW0 = schmal ? 2.4 : 3.2;
    POOL_MAX = schmal ? 2.4 : 3.2;
    const wrap = document.querySelector('#werke .wrap') || document.querySelector('.wrap');
    const wrapRechts = wrap ? wrap.getBoundingClientRect().right + window.scrollX : innerWidth;
    const randMin = Math.min(Math.max(wrapRechts + 56, innerWidth * 0.92 + 24), innerWidth - 24);
    randX = schmal ? innerWidth - 8 : klemm(quelle.x, randMin, innerWidth - 24);

    /* Das Ende: der erste Abschnitt unter der Quelle, in dem die Seite ganz gefasst ist.
       Dort trocknet die Spur, ein paar Pixel vor der Kante, damit die Lache davor liegt.
       Gibt es keinen, läuft sie bis kurz vor den Fuß. */
    ende = z.dokument - 90;
    for (const l of welt.lagen) {
      if (l.oben > quelle.y + 40 && l.fassung >= 0.999) { ende = l.oben - 6; break; }
    }
    strecke = ende - quelle.y;
    /* Die S-Kurve zum Rand: auf dem Schreibtisch lang und flach, auf dem Telefon ein halbes
       Fenster — dort steht gleich unter dem Blatt der Vorspann, und die Spur soll neben dem
       Text laufen, nicht hindurch (der Vorspann bleibt dafür schmal, css/site.css). */
    drift = Math.max(1, Math.round(Math.min(strecke * 0.12, innerHeight * (schmal ? 0.5 : 1.2))));

    /* Der Streifen deckt Quelle und Rand samt Wanderung, Waschung und Spritzern und reicht
       nie über die Fensterkante hinaus. Gezeichnet wird trotzdem in Seitenkoordinaten. */
    links = Math.max(0, Math.round(Math.min(quelle.x, randX) - RAND));
    breite = Math.max(1, Math.min(Math.round(Math.abs(randX - quelle.x) + 2 * RAND), innerWidth - links));
    cv.width = Math.round(breite * dpr);
    cv.height = Math.round(z.fenster.h * dpr);
    cv.style.left = links + 'px';
    cv.style.width = breite + 'px';
    cv.style.height = z.fenster.h + 'px';

    aktiv = strecke > 120;
    statisch = z.ruhig || app.dataset.bewegung === 'aus';
    if (statisch) endzustand();
    else if (warStatisch) zuruecksetzen();
  }

  function zuruecksetzen() {
    spitze = 0; proben = []; stauungen = []; spritzer = [];
    pool = 0; schwall = 0; ruhe = 0; tempo = 0; tempoGlatt = 0;
  }

  /* Wie breit der Strang von sich aus ist: an der Quelle am breitesten, dann dünner, und
     überall so stark, wie die Seite dort blutet. Ganz dünn wird er nie: Auch die trockene
     Spur soll man noch sehen. */
  function grundHw(f, y) {
    const blut = 1 - welt.fassungBei(y);
    return HW0 * misch(1, 0.5, Math.pow(f, 0.7)) * (0.32 + 0.68 * blut);
  }

  /* Stützpunkte nachziehen, bis der Tropfen bei neuF steht. Eine schnelle Bahn ist dünn,
     eine langsame breit; nach einer Stauung läuft ein Schwall mit, der abklingt. */
  function nachziehen(neuF, tempoJetzt) {
    const df = SCHRITT / strecke;
    let f = proben.length ? proben[proben.length - 1].f + df : df;
    const duenn = misch(1, 0.55, klemm(tempoJetzt / 22, 0, 1));
    for (; f <= neuF; f += df) {
      const y = quelle.y + f * strecke;
      proben.push({ f, hw: grundHw(f, y) * duenn + schwall });
      schwall *= 0.86;
    }
  }

  /* Der Tropfen läuft weiter: Was sich gesammelt hat, bleibt als Stauung stehen, ein Teil
     läuft als Schwall mit, und war es viel, springt ein Spritzer daneben. */
  function loslassen() {
    const st = pool / POOL_MAX;
    stauungen.push({ f: spitze, st });
    schwall = pool * 0.7;
    /* Nicht bei jeder Stauung: Sonst wird die Seite zum Konfetti. */
    const n = stauungen.length * 5;
    if (st > 0.55 && zufall(n + 4) < 0.5 && spritzer.length < 300) {
      const wieViele = zufall(n) < 0.45 ? 1 : 2;
      for (let i = 0; i < wieViele; i++) {
        const s = n + i;
        const seite = zufall(s + 1) < 0.5 ? -1 : 1;
        spritzer.push({
          f: spitze + (8 + zufall(s) * 24) / strecke,
          dx: seite * (5 + zufall(s + 2) * 11) * (faktor < 1 ? 0.4 : 1),
          r: 1 + zufall(s + 3) * 1.6 * st
        });
      }
    }
    pool = 0;
  }

  /* Der Endzustand für reduzierte Bewegung: die ganze Spur, ein paar Stauungen, die
     Lache am Ende. Gezeigt wird, was wäre, nicht die Reise dorthin. */
  function endzustand() {
    zuruecksetzen();
    spitze = 1;
    nachziehen(1, 0);
    [[0.17, 0.6], [0.46, 0.75], [0.81, 0.55]].forEach(([f, st], i) => {
      if (f * strecke < 60) return;
      stauungen.push({ f, st });
      if (i < 2) spritzer.push({ f: f + 16 / strecke, dx: (i ? -1 : 1) * 9 * faktor, r: 1.6 });
    });
    pool = POOL_MAX * 1.5;
  }

  /* Den Tropfen führen. Ziel ist eine Stelle etwas unter der Fenstermitte, wo gelesen
     wird; dorthin läuft er nach, gebremst und nicht schneller als ein Fall. Zurück läuft
     er nie. Steht er, sammelt sich etwas. dt ist in Bildern zu 16,7 ms. */
  function fuehren(dt) {
    const zielY = klemm(z.y + z.fenster.h * 0.62, quelle.y, ende);
    const spitzeY = quelle.y + spitze * strecke;
    const diff = zielY - spitzeY;
    if (diff > 6) {
      /* Erst wenn es wirklich weitergeht, bleibt die Stauung zurück. Ein paar Pixel
         nimmt der Tropfen sie noch mit. */
      if (diff > 24 && pool > 0.25 && spitze > 0.004) loslassen();
      /* Gebremst, aber nie kriechend: Ein Tropfen, der die letzten Pixel minutenlang
         braucht, stünde nicht, er zitterte. */
      const k = 1 - Math.pow(0.955, dt);
      const v = Math.max(Math.min(diff * k, 26 * dt), Math.min(diff, 0.8 * dt));
      tempo = v / dt;
      ruhe = 0;
      spitze = klemm((spitzeY + v - quelle.y) / strecke, 0, 1);
      nachziehen(spitze, tempo);
    } else {
      if (diff > 0.2) { spitze = klemm((zielY - quelle.y) / strecke, 0, 1); nachziehen(spitze, 0); }
      tempo = 0;
      ruhe += dt;
      if (ruhe > 8 && spitze > 0.002) {
        const deckel = POOL_MAX * (spitze >= 0.999 ? 1.6 : 1);
        pool = Math.min(deckel, pool + 0.03 * dt);
      }
    }
    tempoGlatt += (tempo - tempoGlatt) * 0.15;
  }

  /* ---- Form ---- */
  /* Stauungen als Verdickung. */
  function stau(y) {
    let s = 0;
    for (const st of stauungen) {
      const dy = y - (quelle.y + st.f * strecke);
      if (dy > -36 && dy < 36) s += st.st * POOL_MAX * Math.exp(-(dy * dy) / 121);
    }
    return s;
  }

  /* Der Strang als Fläche: linke Kante hinunter, rechte Kante hinauf. Nur der Streifen,
     der im Fenster steht. `anteil` unter 1 zeichnet den Kern. */
  function strang(vonY, bisY, anteil, farbe) {
    const spitzeY = quelle.y + spitze * strecke;
    let a = 0;
    while (a < proben.length && quelle.y + proben[a].f * strecke < vonY) a++;
    if (a > 0) a--;
    let b = a;
    while (b < proben.length && quelle.y + proben[b].f * strecke <= bisY) b++;
    if (b < proben.length) b++;
    const punkte = [];
    if (a === 0) punkte.push({ y: quelle.y, hw: (proben[0] ? proben[0].hw : HW0) * 1.1 });
    for (let i = a; i < b; i++) punkte.push({ y: quelle.y + proben[i].f * strecke, hw: proben[i].hw });
    if (b >= proben.length) punkte.push({ y: spitzeY, hw: (proben[proben.length - 1] || { hw: HW0 }).hw * 0.9 });
    if (punkte.length < 2) return;
    ctx.fillStyle = farbe;
    ctx.beginPath();
    for (let i = 0; i < punkte.length; i++) {
      const p = punkte[i];
      const hw = Math.max(0.3, (p.hw * fein(p.y) + stau(p.y)) * anteil);
      if (i === 0) ctx.moveTo(xBei(p.y) - hw, p.y); else ctx.lineTo(xBei(p.y) - hw, p.y);
    }
    for (let i = punkte.length - 1; i >= 0; i--) {
      const p = punkte[i];
      const hw = Math.max(0.3, (p.hw * fein(p.y) + stau(p.y)) * anteil);
      ctx.lineTo(xBei(p.y) + hw, p.y);
    }
    ctx.closePath();
    ctx.fill();
  }

  /* Ein hängender Tropfen: oben spitz, unten rund. Läuft er schnell, zieht er sich lang. */
  function tropfen(x, y, rx, ry, farbe) {
    ctx.fillStyle = farbe;
    ctx.beginPath();
    ctx.moveTo(x, y - ry * 2.2);
    ctx.bezierCurveTo(x + rx, y - ry * 0.8, x + rx, y + ry * 0.15, x, y + ry);
    ctx.bezierCurveTo(x - rx, y + ry * 0.15, x - rx, y - ry * 0.8, x, y - ry * 2.2);
    ctx.closePath();
    ctx.fill();
  }

  function lache(x, y, rx, ry, farbe) {
    ctx.fillStyle = farbe;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, 6.2832);
    ctx.fill();
  }

  function zeichnen() {
    const stempel = aktiv
      ? Math.round(z.y) + '|' + spitze.toFixed(5) + '|' + pool.toFixed(2) + '|' + tempoGlatt.toFixed(1) + '|' + spritzer.length + '|' + stauungen.length
      : 'leer';
    if (stempel === letzterStempel) return;
    letzterStempel = stempel;
    ctx.setTransform(dpr, 0, 0, dpr, -links * dpr, -z.y * dpr);
    ctx.clearRect(links, z.y, breite, z.fenster.h);
    if (!aktiv || spitze * strecke < 2) return;

    const deck = satt ? 1.25 : 1;
    const wasch = 'rgba(' + ROT + ',' + (0.5 * deck).toFixed(3) + ')';
    const kern = 'rgba(' + ROT2 + ',' + (0.5 * deck).toFixed(3) + ')';
    const oben = z.y - 80, unten = z.y + z.fenster.h + 80;
    const spitzeY = quelle.y + spitze * strecke;

    /* Die Quelle: eine kleine Lache an der Blattkante, wo der Strang aufsetzt. */
    if (quelle.y > oben && quelle.y < unten) {
      const qy = quelle.y + HW0 * 0.45;
      lache(quelle.x, qy, HW0 * 1.7, HW0 * 0.95, wasch);
      lache(quelle.x, qy, HW0 * 0.9, HW0 * 0.5, kern);
    }

    const vonY = Math.max(quelle.y, oben), bisY = Math.min(spitzeY, unten);
    if (bisY > vonY) {
      strang(vonY, bisY, 1, wasch);
      strang(vonY, bisY, 0.45, kern);
    }

    /* Der hängende Tropfen am Ende der Spur. */
    if (spitzeY > oben - 40 && spitzeY < unten + 40) {
      const ex = xBei(spitzeY);
      const letzte = proben.length ? proben[proben.length - 1].hw : HW0;
      const r = letzte * 1.6 * fein(spitzeY) + pool;
      const ry = r * (1 + klemm(tempoGlatt / 22, 0, 1) * 0.6);
      tropfen(ex, spitzeY, r, ry, wasch);
      tropfen(ex, spitzeY, r * 0.55, ry * 0.55, kern);
    }

    /* Spritzer: kleine Kleckse neben der Spur, dunkler, und nicht ganz rund. */
    ctx.fillStyle = kern;
    for (const sp of spritzer) {
      const y = quelle.y + sp.f * strecke;
      if (y < oben || y > unten) continue;
      const x = xBei(y) + sp.dx;
      ctx.beginPath();
      ctx.arc(x, y, sp.r, 0, 6.2832);
      ctx.arc(x + sp.r * 0.7 * (sp.dx < 0 ? -1 : 1), y + sp.r * 0.5, sp.r * 0.6, 0, 6.2832);
      ctx.fill();
    }
  }

  /* ---- Lauf ---- */
  let letzteMessung = -1, letzteZeit = 0;
  welt.an(function () {
    const jetzt = performance.now();
    const dt = letzteZeit ? klemm((jetzt - letzteZeit) / 16.7, 0.2, 4) : 1;
    letzteZeit = jetzt;
    if (z.messung !== letzteMessung) { letzteMessung = z.messung; messen(); }
    if (aktiv && !statisch) fuehren(dt);
    zeichnen();
  });

  /* Das Bedienfeld schaltet Rot, Bewegung und Richtung um; dann wird neu gemessen und
     neu eingefärbt. Die Blattfolge setzt die Höhe ihres Abschnitts erst, wenn sie gebaut
     ist; der Weltzustand sieht das über seinen ResizeObserver. */
  new MutationObserver(() => welt.messen()).observe(app, { attributes: true, attributeFilter: ['data-rot', 'data-bewegung', 'data-richtung'] });

  L.tropfspur = {
    auffrischen: welt.messen,
    /* Die Mittellinie an einer Stelle der Seite, für die Prüfung. */
    xBei,
    /* Zum Nachsehen in der Konsole und für die Prüfung, nicht für die Seite. */
    zustand: () => ({ aktiv, statisch, quelle: { x: quelle.x, y: quelle.y }, randX, ende, strecke, spitze,
      proben: proben.length, stauungen: stauungen.length, spritzer: spritzer.length, pool, poolMax: POOL_MAX,
      links, breite })
  };
})();
