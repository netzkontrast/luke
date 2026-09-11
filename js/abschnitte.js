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

  /* Atelier: Das Foto wird beim Scrollen ganz langsam größer, im Rahmen beschnitten. */
  (function atelier() {
    const img = document.querySelector('.atelier-rahmen img'), fig = img && img.closest('.atelier-fig');
    if (!img || !fig || !M || !s()) return;
    M.scroll(M.animate(img, { scale: [1, 1.06] }, { ease: 'linear' }), { target: fig, offset: ['start end', 'end start'] });
  })();
})();
