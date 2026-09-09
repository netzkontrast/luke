/* Der Auftakt.

   Vier Ebenen in der Tiefe, das Motiv in der dritten: Das Zeichenvideo läuft einmal, dann
   ein Schnitt, dann steht das Blatt mit der knienden Figur. Zwei Blätter, kein Verwandeln;
   die Leerstelle dazwischen ist Absicht. Titel und Unterzeile kommen, während die Zeichnung
   beginnt. Danach folgt jede Ebene dem Zeiger und dem Scrollen — nicht sich selbst.

   Ohne Bewegung, bei sparsamer Verbindung oder ohne Video steht sofort das Blatt. */
(function () {
  'use strict';
  const L = (window.LUKE = window.LUKE || {});
  const B = L.bewegung, M = B && B.M;
  const fig = document.querySelector('.hero-fig');
  if (!fig) return;
  const ebenen = Array.from(fig.querySelectorAll('.hero-ebene'));
  const fern = Array.from(fig.querySelectorAll('.hero-fern'));
  const motiv = fig.querySelector('.hero-motiv');
  const video = fig.querySelector('.hero-video');
  const still = fig.querySelector('.hero-still');
  const titel = document.querySelector('.hero-text h1');
  const zeile = document.querySelector('.hero-text p');
  /* Ken Burns ohne Ruck, und die Kurve der Eintritte aus Richtung B: beide ohne Überschwingen. */
  const K = [0.83, 0, 0.17, 1], KB = [0.16, 1, 0.3, 1];
  const s = B ? B.m() : 0;
  const verbindung = navigator.connection;
  const sparsam = !!(verbindung && (verbindung.saveData || /2g/.test(verbindung.effectiveType || '')));

  /* Der Endzustand ohne Bewegung: das Blatt steht, das Video bleibt weg, die Ebenen stehen. */
  function nurBild() {
    fig.classList.add('still', 'done');
    fern.forEach(img => { img.style.opacity = '1'; });
    if (titel) titel.style.opacity = '1';
    if (zeile) zeile.style.opacity = '1';
  }
  if (!M || !s || sparsam || !video) { nurBild(); return; }

  /* Die Tiefe: Jede Ebene folgt dem Zeiger und dem Scrollen, nach ihrer Tiefe. Beides
     kommt von außen; von allein bewegt sich hier nichts. */
  const tiefe = M.motionValue(0);
  M.scroll(p => tiefe.set(p), { target: fig, offset: ['start start', 'end start'] });
  ebenen.forEach(eb => {
    const t = parseFloat(eb.dataset.tiefe) || 0;
    const x = M.transformValue(() => B.zeiger.x.get() * 96 * t * B.m());
    const y = M.transformValue(() => B.zeiger.y.get() * 62 * t * B.m() + tiefe.get() * -140 * t * B.m());
    M.styleEffect(eb, { x, y });
  });

  /* Der Ablauf, Sekunden ab jetzt. */
  if (titel) M.animate(titel, { opacity: [0, 1], y: [18, 0] }, { duration: 1.1 * s, ease: KB });
  if (zeile) M.animate(zeile, { opacity: [0, 1], y: [14, 0] }, { duration: 1.0 * s, delay: 0.3 * s, ease: KB });
  M.animate(motiv, { scale: [1.045, 1] }, { duration: 9.4, ease: K });
  fern.forEach(img => {
    const deck = parseFloat(getComputedStyle(img).getPropertyValue('--deck')) || 0.1;
    M.animate(img, { opacity: [0, deck] }, { duration: 1.6 * s, delay: 0.15 * s, ease: KB });
  });
  M.animate(video, { opacity: [0, 1] }, { duration: 0.5 * s, delay: 0.35 * s, ease: KB });

  /* Der Schnitt: Video weg, Leerstelle, Blatt. */
  let geschnitten = false;
  function schnitt() {
    if (geschnitten) return;
    geschnitten = true;
    M.animate(video, { opacity: 0 }, { duration: 0.5, ease: KB }).then(() => {
      M.animate(still, { opacity: [0, 1], y: [10, 0] }, { duration: 0.9, delay: 0.35, ease: KB }).then(() => {
        fig.classList.add('done');
        still.style.opacity = ''; still.style.transform = '';
      });
    });
  }
  /* Kann der Browser das Format nicht, oder spielt er nicht ab, steht nach kurzer Frist das
     Blatt statt einer leeren Fläche. */
  const wache = setTimeout(() => { if (video.readyState < 2 || !video.currentTime) nurBild(); }, 2200);
  const sicherung = setTimeout(schnitt, 20000);
  video.addEventListener('ended', () => { clearTimeout(wache); clearTimeout(sicherung); schnitt(); }, { once: true });
  video.addEventListener('error', () => { clearTimeout(wache); clearTimeout(sicherung); nurBild(); }, { once: true });
  video.addEventListener('timeupdate', () => { if (video.currentTime > 0) clearTimeout(wache); }, { once: true });
  M.delay(() => {
    const p = video.play();
    if (p && p.catch) p.catch(() => { clearTimeout(wache); nurBild(); });
  }, 0.35 * s);
})();
