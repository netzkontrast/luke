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

  /* Handschrift: Die Zeichnung folgt dem Scrollen. Wer den Abschnitt hinunterliest, zieht
     die Linie mit und sieht die Signatur entstehen. Von „taucht unten auf“ bis „ist oben
     durch“ wird die Zeit im Clip; geschrieben wird nur bei einem Unterschied über 0,04 s. */
  (function band() {
    const v = document.querySelector('.band-video'), fig = v && v.closest('.band-fig');
    if (!v || !fig || !M || !s()) return;
    let kaputt = false;
    v.pause();
    v.addEventListener('error', () => { kaputt = true; }, { once: true });
    /* Ganz laden darf das Video erst, wenn die Handschrift ein Fenster weit herangerückt ist.
       Vorher stand hier preload = 'auto' schon beim Start der Seite: 1,7 MB, die mit dem
       Auftaktvideo um die Leitung stritten, obwohl sie erst weit unten gebraucht werden. */
    const stopLaden = M.inView(fig, () => { stopLaden(); v.preload = 'auto'; }, { margin: '100% 0px 100% 0px' });
    M.scroll(p => {
      const dauer = v.duration;
      if (kaputt || !dauer || !isFinite(dauer)) return;
      const ziel = Math.max(0, Math.min(1, p)) * (dauer - 0.05);
      if (Math.abs(v.currentTime - ziel) < 0.04) return;
      try { v.currentTime = ziel; } catch (e) { /* Spulen noch nicht möglich */ }
    }, { target: fig, offset: ['start 0.92', 'end 0.2'] });
  })();

  /* Atelier: Das Foto wird beim Scrollen ganz langsam größer, im Rahmen beschnitten. */
  (function atelier() {
    const img = document.querySelector('.atelier-rahmen img'), fig = img && img.closest('.atelier-fig');
    if (!img || !fig || !M || !s()) return;
    M.scroll(M.animate(img, { scale: [1, 1.06] }, { ease: 'linear' }), { target: fig, offset: ['start end', 'end start'] });
  })();
})();
