/* Die kleinen Bewegungen der Abschnitte. Jede kommt aus dem Material: eine Linie, die
   weiterläuft (Aktuell), eine Zeichnung, die der Leser zieht (Handschrift), ein Foto, das
   beim Scrollen kaum merklich näher kommt (Atelier). Was hier gezeigt wird, trägt
   data-eigen und wird vom automatischen Enthüllen übersprungen. */
(function () {
  'use strict';
  const L = (window.LUKE = window.LUKE || {});
  const B = L.bewegung, M = B && B.M;
  if (!B) return;
  const s = () => B.m();

  /* Aktuell: erst die Linien, 0,35 s später der Text, gestaffelt. */
  (function aktuell() {
    const sec = document.getElementById('aktuell'); if (!sec) return;
    const teile = Array.from(sec.querySelectorAll('.rv[data-eigen]'));
    if (!M || !s()) { teile.forEach(el => B.sofort(el)); B.strich(sec); return; }
    sec.style.setProperty('--strich', '0');
    const stop = M.inView(sec, () => {
      stop();
      B.strich(sec, { dauer: 1.1 });
      teile.forEach((el, i) => B.zeigen(el, { delay: (0.35 + i * B.tempo().versatz) * s() }));
    }, { amount: 0.4 });
  })();

  /* Handschrift: Die Signatur schreibt sich, während der Leser den Abschnitt hinunterliest;
     ist sie fertig, sieht das Auge ihn an (js/auge.js).

     Vorher war das ein Video, dessen Zeit am Scrollen hing. Das lief nicht überall: Auf dem
     iPhone lädt ein Video, das nie abgespielt wurde, keine Bilder, und es blieb beim
     Standbild; auf schwächeren Geräten stockte das Spulen. Jetzt sind es 36 einzelne Bilder
     auf einem Canvas (scripts/bilder.py), überblendet, wo das Scrollen zwischen zwei Bildern
     steht. Das läuft auf jedem Gerät gleich und lädt weniger als das Video.

     Die Bilder laden, wenn der Abschnitt ein Fenster weit heranrückt, der Reihe nach. Bis
     das erste da ist, steht das Standbild; ohne Bewegung bleibt es stehen. */
  (function handschrift() {
    const SIG = L.SIGNATUR;
    const rahmen = document.querySelector('.band-rahmen'), cv = rahmen && rahmen.querySelector('.band-folge');
    const fig = rahmen && rahmen.closest('.band-fig');
    if (!SIG || !cv || !fig || !M || !s()) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const n = SIG.folge, folge = new Array(n);
    const datei = k => SIG.pfad + 'folge-' + String(k + 1).padStart(2, '0') + '.webp';
    let p = 0, gezeigt = '', lebt = false;
    /* Ist die Folge durch, übernimmt das Auge dasselbe Canvas; zurückgescrollt gibt es es
       wieder ab. */
    const auge = L.auge ? L.auge.anmelden(cv, { quelle: [0, 0, SIG.w, SIG.h], an: false }) : null;

    function zeichnen() {
      const fertig = p >= 0.999;
      if (auge) auge.an(fertig);
      if (fertig && auge && lebt) { gezeigt = ''; return; }
      const f = p * (n - 1), i = Math.min(n - 1, Math.floor(f)), t = f - i;
      let a = i;
      while (a >= 0 && !folge[a]) a--;
      if (a < 0) return;
      const mit = a === i && t > 0.02 && folge[i + 1];
      const stempel = a + ':' + (mit ? t.toFixed(2) : '0');
      if (stempel === gezeigt) return;
      gezeigt = stempel;
      ctx.globalAlpha = 1;
      ctx.drawImage(folge[a], 0, 0, cv.width, cv.height);
      if (mit) { ctx.globalAlpha = t; ctx.drawImage(folge[i + 1], 0, 0, cv.width, cv.height); ctx.globalAlpha = 1; }
      if (!lebt) { lebt = true; rahmen.classList.add('lebt'); }
    }
    function laden() {
      if (L.auge) L.auge.laden();
      /* Der Reihe nach, damit die ersten Bilder zuerst da sind. */
      let k = 0;
      const weiter = () => {
        if (k >= n) return;
        const img = new Image(), jetzt = k++;
        img.decoding = 'async';
        img.onload = () => { (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => { folge[jetzt] = img; gezeigt = ''; zeichnen(); weiter(); }); };
        img.onerror = weiter;
        img.src = datei(jetzt);
      };
      /* Zwei Stränge zugleich: schnell genug, ohne die Leitung zu verstopfen. */
      weiter(); weiter();
    }
    /* Ändert sich die Größe, setzt das Auge die Pixel des Canvas neu, und das leert es. */
    addEventListener('resize', () => { gezeigt = ''; zeichnen(); }, { passive: true });
    const stopLaden = M.inView(fig, () => { stopLaden(); laden(); }, { margin: '100% 0px 100% 0px' });
    /* Geschrieben ist die Signatur, wenn die Zeichnung etwas über der Mitte des Fensters
       steht; ab da blickt das Auge. */
    M.scroll(v => { p = Math.max(0, Math.min(1, v)); zeichnen(); }, { target: fig, offset: ['start 0.92', 'center 0.42'] });
  })();

  /* Atelier: Das Foto wird beim Scrollen ganz langsam größer, im Rahmen beschnitten. */
  (function atelier() {
    const img = document.querySelector('.atelier-rahmen img'), fig = img && img.closest('.atelier-fig');
    if (!img || !fig || !M || !s()) return;
    M.scroll(M.animate(img, { scale: [1, 1.06] }, { ease: 'linear' }), { target: fig, offset: ['start end', 'end start'] });
  })();
})();
