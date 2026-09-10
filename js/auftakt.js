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
  const app = document.querySelector('.app');
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

  /* Ein gemeinsames Ende für alle Wege dorthin: Wächter, Fehlschlag, Startabsage und das
     echte „ended“ konkurrieren um denselben Zustand. Ohne einen gemeinsamen Merker lief,
     wenn der Wächter zu früh urteilte und das Video später doch noch zu Ende spielte, der
     Schnitt ein zweites Mal — das schon gezeigte Blatt blitzte auf Null, bevor es erneut
     einblendete. Wer zuerst ankommt, gewinnt; jeder spätere Rückruf wird zum No-op. Schon
     der abgelöste Bühnen-Code kannte diesen Merker unter dem Namen „fertig“. */
  let fertig = false, wache = null, sicherung = null;
  /* Laufende Übergänge, um sie anzuhalten, wenn nurBild() mitten in der Öffnung greift
     (Wächter, Fehler oder das Bedienfeld) statt erst beim Start. */
  let titelAnim = null, zeileAnim = null, motivAnim = null, videoAnim = null;
  const fernAnims = [];
  function raeumen() { clearTimeout(wache); clearTimeout(sicherung); }

  /* Der Endzustand ohne Bewegung: das Blatt steht, das Video bleibt weg, die Ebenen stehen.
     Läuft die Öffnung schon, wenn diese Funktion greift (Wächter, Fehler, oder das
     Bedienfeld schaltet mitten in der Zeichnung auf „aus“), hält das erst die begonnenen
     Übergänge an. Sonst schriebe Motion im nächsten Bild wieder über den erzwungenen
     Endzustand hinweg. */
  function anhalten(anim) { if (anim && anim.stop) anim.stop(); }
  function nurBild() {
    if (fertig) return;
    fertig = true;
    raeumen();
    anhalten(titelAnim); anhalten(zeileAnim); anhalten(motivAnim); anhalten(videoAnim);
    fernAnims.forEach(anhalten);
    fig.classList.add('still', 'done');
    if (motiv) motiv.style.transform = '';
    if (video) video.style.opacity = '';
    /* --deck ist die vorgesehene Ruheopazität dieser Ebene (css/site.css). Der animierte Weg
       endet dort; der Sofort-Weg muss denselben Wert treffen, sonst begräbt volle Deckkraft
       die Zeichnung unter drei übereinanderliegenden Tuschekopien. */
    fern.forEach(img => { img.style.opacity = getComputedStyle(img).getPropertyValue('--deck').trim() || '0.1'; });
    if (titel) { titel.style.opacity = '1'; titel.style.transform = ''; }
    if (zeile) { zeile.style.opacity = '1'; zeile.style.transform = ''; }
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
  if (titel) titelAnim = M.animate(titel, { opacity: [0, 1], y: [18, 0] }, { duration: 1.1 * s, ease: KB });
  if (zeile) zeileAnim = M.animate(zeile, { opacity: [0, 1], y: [14, 0] }, { duration: 1.0 * s, delay: 0.3 * s, ease: KB });
  if (motiv) motivAnim = M.animate(motiv, { scale: [1.045, 1] }, { duration: 9.4 * s, ease: K });
  fern.forEach(img => {
    const deck = parseFloat(getComputedStyle(img).getPropertyValue('--deck')) || 0.1;
    fernAnims.push(M.animate(img, { opacity: [0, deck] }, { duration: 1.6 * s, delay: 0.15 * s, ease: KB }));
  });
  videoAnim = M.animate(video, { opacity: [0, 1] }, { duration: 0.5 * s, delay: 0.35 * s, ease: KB });

  /* Der Schnitt: Video weg, Leerstelle, Blatt. */
  function schnitt() {
    if (fertig) return;
    fertig = true;
    raeumen();
    M.animate(video, { opacity: 0 }, { duration: 0.5 * s, ease: KB }).then(() => {
      if (!still) { fig.classList.add('done'); return; }
      M.animate(still, { opacity: [0, 1], y: [10, 0] }, { duration: 0.9 * s, delay: 0.35 * s, ease: KB }).then(() => {
        fig.classList.add('done');
        still.style.opacity = ''; still.style.transform = '';
      });
    });
  }
  /* Kann der Browser das Format nicht, oder spielt er nicht ab, steht nach kurzer Frist das
     Blatt statt einer leeren Fläche. */
  wache = setTimeout(() => { if (video.readyState < 2 || !video.currentTime) nurBild(); }, 2200);
  sicherung = setTimeout(schnitt, 20000);
  video.addEventListener('ended', () => { schnitt(); }, { once: true });
  video.addEventListener('error', () => { nurBild(); }, { once: true });
  /* „playing“ statt timeupdate mit currentTime-Vorbehalt: Feuerte das erste timeupdate
     zufällig genau bei 0, wäre der Hörer schon weg gewesen und der Wächter hätte trotz
     laufendem Video zugeschlagen. */
  video.addEventListener('playing', () => clearTimeout(wache), { once: true });
  M.delay(() => {
    const p = video.play();
    if (p && p.catch) p.catch(() => { nurBild(); });
  }, 0.35 * s);
  /* Schaltet jemand das Bedienfeld mitten in der Zeichnung auf „Bewegung: aus“, bekäme das
     sonst niemand mit: Alles oben liest die Stärke nur einmal, beim Laden. */
  new MutationObserver(() => { if (!B.m()) nurBild(); }).observe(app, { attributes: true, attributeFilter: ['data-bewegung'] });
})();
