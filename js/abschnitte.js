/* Die kleinen Bewegungen der Abschnitte. Jede kommt aus dem Material: eine Linie, die
   weiterläuft (Aktuell, Teamliste), eine Zeichnung, die der Leser zieht (Handschrift), ein
   Foto, das beim Scrollen kaum merklich näher kommt (Studio). Was hier gezeigt wird, trägt
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
    v.preload = 'auto'; v.pause();
    v.addEventListener('error', () => { kaputt = true; }, { once: true });
    M.scroll(p => {
      const dauer = v.duration;
      if (kaputt || !dauer || !isFinite(dauer)) return;
      const ziel = Math.max(0, Math.min(1, p)) * (dauer - 0.05);
      if (Math.abs(v.currentTime - ziel) < 0.04) return;
      try { v.currentTime = ziel; } catch (e) { /* Spulen noch nicht möglich */ }
    }, { target: fig, offset: ['start 0.92', 'end 0.2'] });
  })();

  /* Studio: Das Foto wird beim Scrollen ganz langsam größer, im Rahmen beschnitten. */
  (function studio() {
    const img = document.querySelector('.studio-rahmen img'), fig = img && img.closest('.studio-fig');
    if (!img || !fig || !M || !s()) return;
    M.scroll(M.animate(img, { scale: [1, 1.06] }, { ease: 'linear' }), { target: fig, offset: ['start end', 'end start'] });
  })();

  /* Team: Jede Zeile kommt mit ihrer Linie, die Linie einen Augenblick nach der Schrift. */
  (function team() {
    const liste = document.querySelector('.team'); if (!liste) return;
    const zeilen = Array.from(liste.querySelectorAll('li.rv[data-eigen]'));
    if (!M || !s()) { zeilen.forEach(li => { B.sofort(li); B.strich(li); }); return; }
    zeilen.forEach(li => li.style.setProperty('--strich', '0'));
    const stop = M.inView(liste, () => {
      stop();
      zeilen.forEach((li, i) => {
        const d = i * B.tempo().versatz * s();
        B.zeigen(li, { delay: d });
        B.strich(li, { delay: d + 0.1 * s(), dauer: 0.7 });
      });
    }, { amount: 0.3 });
  })();
})();
