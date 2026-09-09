/* LUKE.bewegung — die Grundlage aller Bewegung auf der Seite.

   Eine Bibliothek, Motion (vendor/motion/), und eine Stelle, an der steht, wie stark, wie
   schnell und mit welcher Kurve sich hier etwas bewegt. Die Abschnitte fragen hier nach
   und rechnen nicht selbst.

     LUKE.bewegung.M              Motion, oder null, wenn die Datei fehlt
     LUKE.bewegung.m()            Stärke: 0 aus (auch bei „reduzierte Bewegung“), 0.55 dezent, 1 voll
     LUKE.bewegung.richtung()     'a' | 'b' | 'c'
     LUKE.bewegung.tempo()        Dauer, Kurve, Versatz, Feder, Waschung, Ansicht der Richtung
     LUKE.bewegung.feder          { ruhig, gesetzt } als Optionen für animate()
     LUKE.bewegung.eintritt(el)   Keyframes des Eintritts für dieses Element
     LUKE.bewegung.enthuellen(r)  meldet .rv unter r beim Sichtbarwerden an, idempotent
     LUKE.bewegung.zeigen(el, o)  spielt den Eintritt jetzt, o.delay in Sekunden
     LUKE.bewegung.sofort(el)     zeigt ein Element ohne Bewegung im Endzustand
     LUKE.bewegung.strich(el, o)  --strich von 0 auf 1, o.delay und o.dauer in Sekunden
     LUKE.bewegung.parallaxe(r)   [data-depth] unter r scrollgebunden verschieben
     LUKE.bewegung.zeiger         { x, y } gefederte Werte, je -0,5 bis 0,5, Mitte null
     LUKE.bewegung.heben(els, o)  Hover und Fokus heben um o.um Pixel, Press drückt; o.feld
                                  nennt ein Kind, das statt des Elements bewegt wird

   Bei „reduzierte Bewegung“ oder data-bewegung="aus" wird nichts animiert: Jede Funktion
   setzt dann den Endzustand. Fehlt Motion, ebenso, und das Stylesheet versteckt nichts. */
(function () {
  'use strict';
  const L = (window.LUKE = window.LUKE || {});
  const app = document.querySelector('.app');
  if (!app) return;
  const M = window.Motion || null;
  const html = document.documentElement;
  const prm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const grob = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

  /* Ohne Motion darf das Stylesheet nichts verstecken. */
  if (!M) delete html.dataset.js;

  const m = () => (!M || prm ? 0 : ({ aus: 0, dezent: 0.55, voll: 1 })[app.dataset.bewegung] ?? 1);
  const richtung = () => (/^[abc]$/.test(app.dataset.richtung || '') ? app.dataset.richtung : 'a');

  /* Das Tempo je Richtung, in Sekunden. dauer für Eintritte, kurz für Austritte, versatz für
     die Staffelung, wasch für die Waschung beim Trägerwechsel, ansicht für die Werkansicht.
     A und B schwingen nicht über; C darf, das ist die Werkstatt. */
  const TEMPO = {
    a: { dauer: 0.9, kurz: 0.45, kurve: [0.3, 0.1, 0.2, 1], versatz: 0.08, feder: { stiffness: 170, damping: 26 }, wasch: { ein: 0.5, aus: 0.56 }, ansicht: 0.62 },
    b: { dauer: 1.3, kurz: 0.6, kurve: [0.16, 1, 0.3, 1], versatz: 0.11, feder: { stiffness: 120, damping: 24 }, wasch: { ein: 0.7, aus: 0.8 }, ansicht: 0.78 },
    c: { dauer: 0.5, kurz: 0.28, kurve: [0.34, 1.3, 0.5, 1], versatz: 0.05, feder: { stiffness: 260, damping: 18 }, wasch: { ein: 0.26, aus: 0.3 }, ansicht: 0.38 }
  };
  const tempo = () => TEMPO[richtung()];
  const feder = {
    ruhig: { type: 'spring', stiffness: 80, damping: 22, mass: 1 },
    get gesetzt() { return Object.assign({ type: 'spring', mass: 1 }, tempo().feder); }
  };

  /* Der Eintritt: zwei bis drei Eigenschaften zusammen, nie ein reines Aufblenden. Richtung A
     unterscheidet nach dem, was hereinkommt (data-eintritt): Text wird von links aufgezogen
     wie Tusche, ein Blatt legt sich ab und richtet sich gerade, ein Druck kommt ohne Drehung,
     ein Block hebt sich nur kurz. B und C haben je einen Eintritt für alles. */
  function eintritt(el) {
    const r = richtung();
    if (r === 'b') return { opacity: [0, 1], y: [22, 0], scale: [0.985, 1], filter: ['blur(9px) brightness(0.55)', 'blur(0px) brightness(1)'] };
    if (r === 'c') return { opacity: [0, 1], y: [-12, 0], rotate: [-1.1, 0], scale: [1.015, 1] };
    const art = el.dataset.eintritt || 'text';
    if (art === 'blatt') return { opacity: [0, 1], y: [26, 0], rotate: [parseFloat(getComputedStyle(el).getPropertyValue('--dreh')) || 0, 0] };
    if (art === 'druck') return { opacity: [0, 1], y: [36, 0] };
    if (art === 'block') return { opacity: [0, 1], y: [16, 0] };
    /* Links über den Rand hinaus, sonst schneidet der Eintritt Listenziffern ab. */
    return { opacity: [0, 1], clipPath: ['inset(-2% 100% -2% -40px)', 'inset(-2% -2% -2% -40px)'] };
  }

  /* Nach dem Eintritt gehören die Inline-Stile weg: Das Stylesheet zeigt .rv.on, und ein
     stehengebliebenes transform käme jedem späteren Heben oder Drehen in die Quere. */
  const STILE = ['opacity', 'transform', 'clipPath', 'filter'];
  function aufraeumen(el) { el.classList.add('on'); STILE.forEach(k => { el.style[k] = ''; }); }
  const gesehen = new WeakSet();
  function sofort(el) { gesehen.add(el); aufraeumen(el); }

  function zeigen(el, opts) {
    gesehen.add(el);
    const s = m(), t = tempo();
    if (!s) { aufraeumen(el); return null; }
    const delay = (opts && opts.delay) || 0;
    const anim = M.animate(el, eintritt(el), { duration: t.dauer * s, delay, ease: t.kurve });
    /* Die rote Linie unter einer Überschrift läuft weiter, sobald die Schrift steht — auf
       demselben Element wie der Eintritt, deshalb erst aufräumen, wenn beide fertig sind. */
    const strichAnim = (richtung() === 'a' && el.matches('h2.hd')) ? strich(el, { delay: delay + 0.25 * s, dauer: 0.9 }) : null;
    /* Motion schreibt die Endwerte im Renderschritt des folgenden Bildes noch einmal; deshalb
       zwei Renderschritte später aufräumen, nicht sofort im then(). */
    Promise.all([anim, strichAnim].filter(Boolean)).then(() => M.frame.postRender(() => M.frame.postRender(() => aufraeumen(el))));
    return anim;
  }

  /* Was im selben Augenblick sichtbar wird, kommt gestaffelt: eine Reihe, die sich nach
     120 ms Ruhe zurücksetzt. data-versatz überstimmt die Reihe, etwa nach Spalte. */
  let reihe = 0, zuletzt = 0;
  function enthuellen(root) {
    (root || document).querySelectorAll('.rv').forEach(el => {
      if (gesehen.has(el)) return;
      /* data-eigen: Ein Abschnitt zeigt das Element selbst, zu seiner Zeit (js/abschnitte.js). */
      if (el.hasAttribute('data-eigen')) return;
      if (!m()) { sofort(el); return; }
      gesehen.add(el);
      /* amount: 'some' statt eines Flächenanteils: Ein Blatt in der Wischschiene steht rechts
         oft nur mit einem schmalen Streifen im Fenster, weil die Schiene selbst per overflow-x
         scrollt — ein Flächenanteil würde es dort nie erreichen, ein ungewischtes Blatt bliebe
         für immer unsichtbar. „some“ reicht schon bei einem sichtbaren Pixel; zusammen mit dem
         Rand unten genau der Auslösepunkt des früheren revealScan (oberkante bei 92 % Höhe). */
      const stop = M.inView(el, () => {
        stop();
        const jetzt = performance.now();
        if (jetzt - zuletzt > 120) reihe = 0;
        zuletzt = jetzt;
        const eigen = el.dataset.versatz != null ? (parseFloat(el.dataset.versatz) || 0) : Math.min(reihe, 4);
        reihe++;
        zeigen(el, { delay: eigen * tempo().versatz * m() });
      }, { amount: 'some', margin: '0px 0px -8% 0px' });
    });
  }

  function strich(el, opts) {
    const s = m(), o = opts || {};
    if (!s) { el.style.setProperty('--strich', '1'); return null; }
    el.style.setProperty('--strich', '0');
    return M.animate(el, { '--strich': [0, 1] }, { duration: (o.dauer || 0.9) * s, delay: o.delay || 0, ease: tempo().kurve });
  }

  /* Parallaxe: [data-depth] wandert scrollgebunden gegen die Seite, über ScrollTimeline, wo
     der Browser sie kann. Nur auf Figuren und dem Titel des Auftakts, nie auf Lauftext. */
  const tiefen = [];
  function parallaxe(root) {
    (root || document).querySelectorAll('[data-depth]').forEach(el => {
      if (tiefen.some(t => t.el === el)) return;
      tiefen.push({ el, stop: null, anim: null });
    });
    parallaxeBauen();
  }
  function parallaxeBauen() {
    const s = m();
    tiefen.forEach(t => {
      if (t.stop) { t.stop(); t.stop = null; }
      if (t.anim) { t.anim.cancel(); t.anim = null; }
      t.el.style.transform = '';
      const amp = (parseFloat(t.el.dataset.depth) || 0) * innerHeight * 0.5 * s;
      if (!amp) return;
      t.anim = M.animate(t.el, { y: [amp, -amp] }, { ease: 'linear' });
      t.stop = M.scroll(t.anim, { target: t.el, offset: ['start end', 'end start'] });
    });
  }

  /* Der Zeiger, gefedert. Niemand sonst hört auf pointermove. Grobe Zeiger (Finger) bleiben
     in der Mitte; dort trägt das Scrollen die Tiefe. */
  const roh = { x: M ? M.motionValue(0) : null, y: M ? M.motionValue(0) : null };
  const zeiger = M
    ? { x: M.springValue(roh.x, { stiffness: 60, damping: 20 }), y: M.springValue(roh.y, { stiffness: 60, damping: 20 }) }
    : { x: null, y: null };
  if (M && !grob) {
    addEventListener('pointermove', e => {
      if (!m()) return;
      roh.x.set(e.clientX / innerWidth - 0.5);
      roh.y.set(e.clientY / innerHeight - 0.5);
    }, { passive: true });
    /* Der Lichtkegel der Richtung B liest --mx und --my aus dem Stylesheet. */
    zeiger.x.on('change', v => app.style.setProperty('--mx', ((v + 0.5) * 100).toFixed(1) + '%'));
    zeiger.y.on('change', v => app.style.setProperty('--my', ((v + 0.5) * 100).toFixed(1) + '%'));
  }

  /* Heben: Hover und Fokus heben ein Blatt an, Press drückt es leicht. Ein Blatt, das man
     anhebt — nicht mehr. Bei Stärke null passiert nichts. */
  const gehoben = new WeakSet();
  function heben(els, opts) {
    if (!M) return;
    const o = opts || {}, um = o.um == null ? 4 : o.um;
    const liste = typeof els === 'string' ? Array.from(document.querySelectorAll(els)) : els instanceof Element ? [els] : Array.from(els || []);
    const neu = liste.filter(el => !gehoben.has(el));
    if (!neu.length) return;
    neu.forEach(el => gehoben.add(el));
    const feld = el => (o.feld && el.querySelector(o.feld)) || el;
    const hoch = el => { if (m()) M.animate(feld(el), { y: -um * m() }, feder.gesetzt); };
    const runter = el => { if (m()) M.animate(feld(el), { y: 0 }, feder.gesetzt); };
    M.hover(neu, el => { hoch(el); return () => runter(el); });
    M.press(neu, el => {
      if (m()) M.animate(feld(el), { scale: 0.985 }, feder.gesetzt);
      return () => { if (m()) M.animate(feld(el), { scale: 1 }, feder.gesetzt); };
    });
    neu.forEach(el => { el.addEventListener('focus', () => hoch(el)); el.addEventListener('blur', () => runter(el)); });
  }

  L.bewegung = { M, m, richtung, tempo, feder, eintritt, enthuellen, zeigen, sofort, strich, parallaxe, zeiger, heben };

  const start = () => { enthuellen(document); parallaxe(document); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(parallaxeBauen, 150); });
  /* Schaltet das Bedienfeld die Bewegung aus, kommt alles Ausstehende sofort; schaltet es sie
     an, baut die Parallaxe neu. Was schon enthüllt ist, bleibt. */
  new MutationObserver(() => {
    if (!m()) document.querySelectorAll('.rv:not(.on)').forEach(sofort);
    parallaxeBauen();
  }).observe(app, { attributes: true, attributeFilter: ['data-bewegung', 'data-richtung'] });
})();
