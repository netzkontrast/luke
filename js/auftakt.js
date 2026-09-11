/* Der Auftakt.

   Ein Blatt in der Ecke der Seite: Das Zeichenvideo läuft einmal und bleibt mit seinem
   letzten Bild stehen, dem Profil mit dem roten Strang. Dann, nach einer kurzen Pause, legt
   sich links daneben die kniende Figur ab (unter 1100 px blass im Hintergrund). Zwei Blätter,
   die einander anblicken; keines ersetzt das andere. Titel und Unterzeile kommen, während
   die Zeichnung beginnt. Danach steht alles still — nichts folgt dem Zeiger oder dem
   Scrollen: Die Tropfspur (js/tropfspur.js) hängt am roten Strang, und der soll bleiben,
   wo er ist.

   Die grauen Tiefenebenen von früher sind raus. Ihre Hüllen trugen will-change und waren
   damit eigene Stapelkontexte; multiply griff darin nicht, und über dem Video lag eine
   blasse Kopie der Zeichnung samt ihrer Kanten. Zwei der drei Ebenen lagen zudem hinter
   dem deckenden Video und waren nie zu sehen.

   Ohne Bewegung, bei sparsamer Verbindung oder ohne Video steht sofort der Endzustand:
   das letzte Bild des Videos als Standbild, daneben die kniende Figur. */
(function () {
  'use strict';
  const L = (window.LUKE = window.LUKE || {});
  const B = L.bewegung, M = B && B.M;
  const fig = document.querySelector('.hero-fig');
  if (!fig) return;
  const app = document.querySelector('.app');
  const motiv = fig.querySelector('.hero-motiv');
  const video = fig.querySelector('.hero-video');
  const neben = document.querySelector('.hero-neben');
  const kniend = neben && neben.querySelector('.hero-kniend');
  const draw = fig.closest('.hero-draw');
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
     einblendete. Wer zuerst ankommt, gewinnt; jeder spätere Rückruf wird zum No-op. */
  let fertig = false, wache = null, sicherung = null;
  /* Laufende Übergänge, um sie anzuhalten, wenn nurBild() mitten in der Öffnung greift
     (Wächter, Fehler oder das Bedienfeld) statt erst beim Start. */
  let titelAnim = null, zeileAnim = null, motivAnim = null, videoAnim = null, knieAnim = null;
  function raeumen() { clearTimeout(wache); clearTimeout(sicherung); }

  /* Der Endzustand ohne Bewegung: das Standbild steht, das Video bleibt weg. Läuft die Öffnung
     schon, wenn diese Funktion greift (Wächter, Fehler, oder das Bedienfeld schaltet mitten
     in der Zeichnung auf „aus“), hält das erst die begonnenen Übergänge an. Sonst schriebe
     Motion im nächsten Bild wieder über den erzwungenen Endzustand hinweg. */
  function anhalten(anim) { if (anim && anim.stop) anim.stop(); }
  function nurBild() {
    if (fertig) return;
    fertig = true;
    raeumen();
    anhalten(titelAnim); anhalten(zeileAnim); anhalten(motivAnim); anhalten(videoAnim); anhalten(knieAnim);
    fig.classList.add('still', 'done');
    if (draw) draw.classList.add('neben-da');
    if (motiv) motiv.style.transform = '';
    if (video) { video.style.opacity = ''; video.pause(); }
    if (kniend) { kniend.style.opacity = ''; kniend.style.transform = ''; }
    if (titel) { titel.style.opacity = '1'; titel.style.transform = ''; const h = titel.querySelector('.handschrift'); if (h) h.style.clipPath = ''; }
    if (zeile) { zeile.style.opacity = '1'; zeile.style.transform = ''; }
  }
  if (!M || !s || sparsam || !video) { nurBild(); return; }
  /* Erst jetzt laden: Im Markup steht preload="none", damit ohne Bewegung nichts kommt. Kein
     load() dazu — das stieß eine zweite Anfrage auf dieselbe Datei an; play() lädt ohnehin. */
  video.preload = 'auto';

  /* Der Ablauf, Sekunden ab jetzt. */
  /* Der Name ist die Signatur: Sie schreibt sich von links nach rechts, so wie die Hand sie
     zieht, während das Profil zu entstehen beginnt. */
  const handschrift = titel && titel.querySelector('.handschrift');
  if (titel) titelAnim = M.animate(titel, { opacity: [0, 1], y: [10, 0] }, { duration: 0.6 * s, ease: KB });
  if (handschrift) M.animate(handschrift, { clipPath: ['inset(-10% 100% -10% -4%)', 'inset(-10% -4% -10% -4%)'] }, { duration: 2.2 * s, delay: 0.15 * s, ease: [0.45, 0.05, 0.25, 1] })
    .then(() => M.frame.postRender(() => M.frame.postRender(() => { handschrift.style.clipPath = ''; })));
  if (zeile) zeileAnim = M.animate(zeile, { opacity: [0, 1], y: [14, 0] }, { duration: 1.0 * s, delay: 0.3 * s, ease: KB });
  if (motiv) motivAnim = M.animate(motiv, { scale: [1.045, 1] }, { duration: 9.4 * s, ease: K });
  videoAnim = M.animate(video, { opacity: [0, 1] }, { duration: 0.5 * s, delay: 0.35 * s, ease: KB });

  /* Das Ende der Zeichnung: Das Video bleibt auf seinem letzten Bild stehen. Nach einer
     kurzen Pause legt sich die kniende Figur daneben ab, von unten, wie ein Blatt, das man
     neben das erste legt. Aufgeräumt wird erst, wenn .neben-da ihre Deckkraft übernimmt. */
  function ankommen() {
    if (fertig) return;
    fertig = true;
    raeumen();
    if (!kniend) { fig.classList.add('done'); if (draw) draw.classList.add('neben-da'); return; }
    knieAnim = M.animate(kniend, { opacity: [0, 1], y: [14, 0] }, { duration: 1.1 * s, delay: 0.45 * s, ease: KB });
    knieAnim.then(() => {
      fig.classList.add('done');
      if (draw) draw.classList.add('neben-da');
      M.frame.postRender(() => M.frame.postRender(() => { kniend.style.opacity = ''; kniend.style.transform = ''; }));
    });
  }
  /* Kann der Browser das Format nicht, oder spielt er nicht ab, steht nach kurzer Frist das
     Standbild statt einer leeren Fläche. */
  wache = setTimeout(() => { if (video.readyState < 2 || !video.currentTime) nurBild(); }, 2200);
  sicherung = setTimeout(ankommen, 20000);
  video.addEventListener('ended', () => { ankommen(); }, { once: true });
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
