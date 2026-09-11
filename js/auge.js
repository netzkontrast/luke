/* Das Auge.

   Das Auge aus der Handschrift sieht den Leser an. Es sitzt rechts in der Kopfleiste, am
   Ende der langen Linie: Erst schreibt sich dort die Signatur (unten, „Die Handschrift in der
   Kopfleiste“), dann liest das Auge von der ersten bis zur letzten Zeile mit. Es blickt
   dorthin, wo der Zeiger ist, und blinzelt. Weitere Augen meldet an, wer eines braucht;
   alle blicken und blinzeln zugleich.

   Gezeichnet wird aus drei Teilen, die scripts/bilder.py aus dem Video der Signatur zieht:
   das letzte Bild der Folge ohne Iris (auge-leer), die Iris allein (iris) und fünf Bilder,
   in denen sich das Lid schließt (blinzeln-1 bis -5). Die Iris liegt mit multiply über dem
   Grund und ist auf die Öffnung zwischen den Lidern beschnitten; die Lider bleiben dadurch
   von selbst davor. In der Mitte ergibt das wieder genau das letzte Bild der Folge.

   Ohne Maus (Telefon, Tablet) folgt das Auge dem Finger, solange er auf dem Glas liegt, und
   sieht sich sonst von selbst um: kurze Blicke, dazwischen Ruhe. Mit Maus ebenso, wenn sie
   eine Weile still steht oder das Fenster verlassen hat.

   Ohne Bewegung (Systemeinstellung, ?bewegung=aus, Bedienfeld) steht es still und blickt
   geradeaus.

     LUKE.auge.anmelden(canvas, { quelle: [x, y, b, h], an })   ein Auge; quelle ist der
                                   Ausschnitt aus dem Bild der Signatur. Gibt { an(ja) } zurück.
     LUKE.auge.laden()             lädt die Teile, einmal; gibt ein Promise
     LUKE.auge.zustand()           für die Prüfung */
(function () {
  'use strict';
  const L = (window.LUKE = window.LUKE || {});
  const SIG = L.SIGNATUR, B = L.bewegung;
  if (!SIG) return;
  const A = SIG.auge;
  const klemm = (v, a, b) => Math.max(a, Math.min(b, v));
  const stark = () => (B ? B.m() : 0);

  /* Wie weit die Iris wandert, in Pixeln der Zeichnung: seitlich weiter als auf und ab. */
  const WEIT = { x: 9, y: 4 };

  /* ---- Die Teile ---- */
  const teile = { leer: null, iris: null, blinzeln: [] };
  let ladend = null, geladen = false;
  function bild(name) {
    return new Promise(ok => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => ok(img));
      img.onerror = () => ok(null);
      img.src = SIG.pfad + name + '.webp';
    });
  }
  function laden() {
    if (ladend) return ladend;
    const namen = Array.from({ length: SIG.blinzeln }, (_, k) => 'blinzeln-' + (k + 1));
    ladend = Promise.all([bild('auge-leer'), bild('iris')].concat(namen.map(bild))).then(([leer, iris, ...bl]) => {
      teile.leer = leer; teile.iris = iris; teile.blinzeln = bl.filter(Boolean);
      geladen = !!(leer && iris);
      augen.forEach(a => { a.neu = true; });
      if (geladen) starten();
      return geladen;
    });
    return ladend;
  }

  /* ---- Wohin es blickt ---- */
  /* Der Zeiger in Fensterkoordinaten, und wann er zuletzt etwas getan hat. Ohne frische
     Eingabe übernimmt das Umsehen. */
  const zeiger = { x: 0, y: 0, zeit: -1e9, finger: false };
  function merken(e) { zeiger.x = e.clientX; zeiger.y = e.clientY; zeiger.zeit = performance.now(); zeiger.finger = e.pointerType !== 'mouse'; }
  addEventListener('pointermove', merken, { passive: true });
  addEventListener('pointerdown', merken, { passive: true });
  document.addEventListener('pointerleave', () => { zeiger.zeit = -1e9; });
  document.documentElement.addEventListener('mouseleave', () => { zeiger.zeit = -1e9; });
  const frisch = () => performance.now() - zeiger.zeit < (zeiger.finger ? 1400 : 5000);

  /* Das Umsehen: ein Blick, dann Ruhe, dann der nächste; manchmal zurück zur Mitte. */
  const umsehen = { x: 0, y: 0, naechster: 0 };
  function umherblicken(jetzt) {
    if (jetzt < umsehen.naechster) return;
    const mitte = Math.random() < 0.3;
    umsehen.x = mitte ? 0 : (Math.random() * 2 - 1) * 0.85;
    umsehen.y = mitte ? 0 : (Math.random() * 2 - 1) * 0.6;
    umsehen.naechster = jetzt + 1100 + Math.random() * 2600;
  }

  /* ---- Das Blinzeln ---- */
  /* Alle paar Sekunden: erst kehrt die Iris zur Mitte zurück (in den Bildern des Lidschlags
     steht sie dort), dann schließt sich das Lid und öffnet sich wieder. */
  const LIDSCHLAG = [0, 1, 2, 3, 4, 4, 3, 2, 1, 0];
  let blinzeln = { ab: 0, schritt: -1 };
  function naechstesBlinzeln(jetzt) { blinzeln = { ab: jetzt + 3200 + Math.random() * 4200, schritt: -1 }; }
  naechstesBlinzeln(performance.now());

  /* ---- Die Augen ---- */
  const augen = [];
  function anmelden(cv, opt) {
    const o = opt || {};
    const a = { cv, ctx: cv.getContext('2d'), quelle: o.quelle || [0, 0, SIG.w, SIG.h], an: o.an !== false,
      sichtbar: true, x: 0, y: 0, vx: 0, vy: 0, gezeigt: '', neu: true };
    if (!a.ctx) return { an() {} };
    if (typeof IntersectionObserver === 'function') {
      new IntersectionObserver(e => { a.sichtbar = e[0].isIntersecting; if (a.sichtbar) starten(); }).observe(cv);
    }
    augen.push(a);
    groesse(a);
    starten();
    return { an(ja) { a.an = !!ja; a.gezeigt = ''; if (ja) starten(); } };
  }
  /* Die Pixel des Canvas folgen seiner Größe auf dem Schirm, höchstens aber der Zeichnung:
     Mehr als die Zeichnung hat, gibt es nicht zu zeigen. */
  function groesse(a) {
    const [, , qb, qh] = a.quelle;
    const r = a.cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const b = Math.max(1, Math.round(Math.min(qb, (r.width || qb) * dpr)));
    const h = Math.max(1, Math.round(b * qh / qb));
    if (a.cv.width !== b || a.cv.height !== h) { a.cv.width = b; a.cv.height = h; a.gezeigt = ''; }
  }
  addEventListener('resize', () => augen.forEach(groesse), { passive: true });

  function zeichnen(a, lid) {
    const [qx, qy, qb, qh] = a.quelle, ctx = a.ctx, s = a.cv.width / qb;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, a.cv.width, a.cv.height);
    if (lid >= 0 && teile.blinzeln[lid]) {
      ctx.drawImage(teile.blinzeln[lid], qx, qy, qb, qh, 0, 0, a.cv.width, a.cv.height);
      return;
    }
    ctx.drawImage(teile.leer, qx, qy, qb, qh, 0, 0, a.cv.width, a.cv.height);
    ctx.save();
    ctx.setTransform(s, 0, 0, s, -qx * s, -qy * s);
    ctx.beginPath();
    A.oeffnung.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.clip();
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(teile.iris, A.x - A.r - A.rand + a.x, A.y - A.r - A.rand + a.y);
    ctx.restore();
  }

  /* ---- Der Lauf ---- */
  let raf = 0, zuletzt = 0;
  function starten() { if (!raf && geladen) raf = requestAnimationFrame(schritt); }
  function schritt(jetzt) {
    raf = 0;
    const dt = klemm((jetzt - (zuletzt || jetzt)) / 16.7, 0, 3);
    zuletzt = jetzt;
    const ruhig = !stark();
    const aktiv = augen.filter(a => a.an && a.sichtbar);
    if (!aktiv.length) return;

    /* Der Lidschlag, für alle zugleich. */
    let lid = -1, zurMitte = false;
    if (!ruhig && teile.blinzeln.length) {
      if (jetzt >= blinzeln.ab) {
        const t = jetzt - blinzeln.ab;
        if (t < 140) zurMitte = true;
        else {
          const k = Math.floor((t - 140) / 38);
          if (k < LIDSCHLAG.length) lid = Math.min(LIDSCHLAG[k], teile.blinzeln.length - 1);
          else naechstesBlinzeln(jetzt);
        }
      }
    }
    if (!frisch()) umherblicken(jetzt);

    for (const a of aktiv) {
      /* Wohin dieses Auge blickt: vom eigenen Mittelpunkt auf dem Schirm zum Zeiger. So
         schauen beide Augen wirklich zum Zeiger, auch wenn sie an verschiedenen Stellen
         sitzen. */
      let zx = 0, zy = 0;
      if (!ruhig && !zurMitte) {
        if (frisch()) {
          const r = a.cv.getBoundingClientRect(), [qx, qy, qb, qh] = a.quelle;
          const ex = r.left + (A.x - qx) / qb * r.width, ey = r.top + (A.y - qy) / qh * r.height;
          const dx = zeiger.x - ex, dy = zeiger.y - ey, d = Math.hypot(dx, dy) || 1;
          const nah = Math.min(1, d / 260);
          zx = dx / d * nah; zy = dy / d * nah;
        } else { zx = umsehen.x; zy = umsehen.y; }
      }
      /* Eine Feder, wie ein Blick: schnell los, weich an. */
      const k = zurMitte ? 0.35 : 0.14;
      a.vx = (a.vx + (zx * WEIT.x - a.x) * k * dt) * Math.pow(0.62, dt);
      a.vy = (a.vy + (zy * WEIT.y - a.y) * k * dt) * Math.pow(0.62, dt);
      a.x += a.vx * dt; a.y += a.vy * dt;
      if (ruhig) { a.x = 0; a.y = 0; }
      const stempel = lid >= 0 ? 'lid' + lid : a.x.toFixed(2) + '|' + a.y.toFixed(2);
      if (stempel !== a.gezeigt || a.neu) { a.gezeigt = stempel; a.neu = false; zeichnen(a, lid); }
    }
    /* Ohne Bewegung reicht ein Bild; sonst läuft es weiter, solange ein Auge zu sehen ist. */
    if (!ruhig) raf = requestAnimationFrame(schritt);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { zuletzt = 0; starten(); } });
  /* Schaltet das Bedienfeld die Bewegung um, zeichnet das Auge neu: still oder lebendig. */
  const app = document.querySelector('.app');
  if (app) new MutationObserver(() => { augen.forEach(x => { x.neu = true; }); starten(); }).observe(app, { attributes: true, attributeFilter: ['data-bewegung'] });

  /* Die Handschrift in der Kopfleiste. Die Folge in klein (kopf-01 … kopf-36, scripts/bilder.py)
     läuft einmal durch, nach der Zeit, nicht nach dem Scrollweg: Die Leiste ist immer zu sehen.
     Die lange Linie zieht sich, die Signatur schreibt sich, das Auge öffnet sich; dann übernimmt
     das Auge dasselbe Canvas und blickt dem Zeiger nach. Das letzte Bild der Folge und das
     offene Auge in der Mitte sind dasselbe Bild, der Übergang ist unsichtbar.

     Geladen wird erst, wenn die Seite steht: Das Auftaktvideo soll die Leitung zuerst haben.
     Ohne Bewegung läuft nichts, und das Standbild bleibt stehen; ebenso, wenn die Folge nicht
     lädt. Mit Bewegung ist das Standbild bis dahin verborgen (css/site.css), sonst stünde die
     fertige Zeichnung da und spränge zum Anfang zurück. */
  const kopf = document.querySelector('.nav-hand');
  const kv = kopf && kopf.querySelector('.nav-hand-folge');
  if (kv && SIG.kopf) {
    const DAUER = 3200;
    const kurve = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const still = () => kopf.classList.add('still');
    /* Ohne Bewegung, oder wo die Handschrift gar nicht steht (Richtung B zeigt dort den Namen),
       wird nichts geladen. */
    if (!stark() || getComputedStyle(kopf).display === 'none') still();
    else {
      const n = SIG.folge, folge = new Array(n);
      const datei = k => SIG.pfad + 'kopf-' + String(k + 1).padStart(2, '0') + '.webp';
      const auge = anmelden(kv, { quelle: [0, 0, SIG.w, SIG.h], an: false });
      const ctx = kv.getContext('2d');
      function bildZeigen(p) {
        const f = p * (n - 1), i = Math.min(n - 1, Math.floor(f)), t = f - i;
        ctx.globalAlpha = 1;
        ctx.drawImage(folge[i], 0, 0, kv.width, kv.height);
        if (t > 0.02 && folge[i + 1]) { ctx.globalAlpha = t; ctx.drawImage(folge[i + 1], 0, 0, kv.width, kv.height); ctx.globalAlpha = 1; }
      }
      function spielen() {
        kopf.classList.add('lebt');
        const beginn = performance.now();
        const lauf = jetzt => {
          const t = Math.min(1, (jetzt - beginn) / DAUER);
          bildZeigen(kurve(t));
          if (t < 1) requestAnimationFrame(lauf);
          else auge.an(true);
        };
        requestAnimationFrame(lauf);
      }
      const bild = k => new Promise(ok => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => { folge[k] = img; ok(true); });
        img.onerror = () => ok(false);
        img.src = datei(k);
      });
      const los = () => Promise.all([laden(), ...Array.from({ length: n }, (_, k) => bild(k))])
        .then(([teileDa, ...da]) => (teileDa && da.every(Boolean) ? spielen() : still()));
      if (document.readyState === 'complete') setTimeout(los, 300);
      else addEventListener('load', () => setTimeout(los, 300), { once: true });
    }
  }

  L.auge = {
    anmelden, laden,
    zustand: () => ({ geladen, augen: augen.map(a => ({ an: a.an, sichtbar: a.sichtbar, x: +a.x.toFixed(2), y: +a.y.toFixed(2), gezeigt: a.gezeigt })), blinzeln: blinzeln.ab })
  };
})();
