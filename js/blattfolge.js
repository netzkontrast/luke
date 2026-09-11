/* Die Blattfolge.

   Ersetzt die 3D-Sequenz. Eine klebende Bühne, und ein Blatt nach dem anderen kommt von
   unten herauf, bleibt stehen, geht nach oben hinaus; dann das nächste. Nie zwei zugleich:
   Zwischen Austritt und nächstem Eintritt liegt ein leerer Augenblick, ein Schnitt. Das
   letzte Blatt bleibt stehen, die Bühne scrollt mit ihm davon.

   Das Scrollen sagt, welches Blatt dran ist; die Zeit sagt, wann gewechselt wird. Vorher hing
   jede Bewegung direkt am Scrollweg, und mit dem Schwung eines Wischens flogen drei Blätter
   in einer Sekunde vorbei. Jetzt steht jedes Blatt mindestens eine Sekunde, bevor das nächste
   kommt, und ein Wechsel dauert so lange, wie ein Blatt zum Ablegen braucht: Austritt kürzer
   als Eintritt, dazwischen der Schnitt. Wer schneller scrollt, als die Folge läuft, zieht ihr
   davon; die Bühne holt nach, ein Blatt nach dem anderen, solange sie klebt. Rückwärts geht
   es genauso, nur andersherum.

   Gezeigt wird nur, wofür es Aufnahmen gibt; ohne Kapitel verschwindet der Abschnitt. Der
   Stand folgt der .app: data-sequenz still oder Bewegung aus → ruhige Reihe. */
(function () {
  'use strict';
  const L = (window.LUKE = window.LUKE || {});
  const B = L.bewegung, M = B && B.M;
  const app = document.querySelector('.app');
  const halter = document.getElementById('blattfolge');
  if (!app || !halter) return;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const klemm = (v, a, b) => Math.max(a, Math.min(b, v));

  /* Die Kapitel der Folge. Heute eines; ein zweites wäre ein Eintrag mehr, etwa für eine
     neue Serie. Ein Kapitel ohne Aufnahmen bleibt weg. Je Blatt ein Stück: Ein Werk aus drei
     Blättern zieht dreimal vorbei, Blatt für Blatt. */
  const ALLE = [
    { key: 'blaetter', t: 'Blätter', sub: 'Tusche und Farbe auf Papier — zuletzt „Befreiung der Körperlichkeit“.', blaetter: L.helleBlaetter ? L.helleBlaetter() : [] }
  ];
  const KAPITEL = ALLE.filter(k => k.blaetter.length);
  const sec = halter.closest('section');
  if (!KAPITEL.length) { if (sec) sec.hidden = true; return; }
  /* Leichte Schräge im Wechsel, wie Blätter, die man ablegt. */
  const DREH = [-5, 4, -3, 5, -4];
  /* So lange steht ein Blatt wenigstens, in Millisekunden, bevor das nächste kommen darf. */
  const MINDESTENS = 1000;

  /* Beschriftung aus den Daten, nichts erfunden. */
  function schriftHTML(s) {
    const w = s.werk, m = `${w.technik}, ${w.jahr}`;
    const teil = s.teile > 1 ? ` · Bild ${s.teil} von ${s.teile}` : '';
    return `<span class="bf-nr">Nr. ${esc(w.nr)}${teil}</span><span class="bf-t">${esc(w.t)}</span><span class="bf-m">${esc(m)}</span>`;
  }
  const blattAlt = s => (s.teile > 1 ? `${s.werk.t}, Bild ${s.teil} von ${s.teile}` : s.werk.t);

  /* Aufbau. */
  const buehne = document.createElement('div'); buehne.className = 'bf-buehne';
  const kapitelEls = KAPITEL.map(k => {
    const el = document.createElement('div'); el.className = 'bf-kapitel';
    el.innerHTML = `<h2 class="bf-titel">${esc(k.t)}</h2><p class="bf-unter">${esc(k.sub)}</p><button type="button" class="btn">Ansehen</button>`;
    el.querySelector('button').addEventListener('click', () => halter.dispatchEvent(new CustomEvent('sequenz-select', { bubbles: true, detail: { key: k.key } })));
    buehne.appendChild(el); return el;
  });
  const reihe = document.createElement('div'); reihe.className = 'bf-reihe'; buehne.appendChild(reihe);
  const stuecke = [];
  KAPITEL.forEach((k, ki) => k.blaetter.forEach(w => {
    const st = document.createElement('div'); st.className = 'bf-stueck';
    const blatt = document.createElement('figure'); blatt.className = 'bf-blatt';
    blatt.style.setProperty('--verh', (w.w && w.h ? w.w / w.h : 0.6).toFixed(4));
    /* Nur das erste Blatt bringt seine Quelle gleich mit. Die übrigen bekommen sie, wenn
       der Leser sich ihnen nähert (nachladen()): Alle lagen in der klebenden Bühne dicht
       unter dem Auftakt, loading="lazy" hielt keines zurück, und rund 700 kB Blätter
       stritten beim Start mit dem Auftaktvideo um die Leitung. */
    const erstes = stuecke.length === 0;
    const quelle = erstes ? `src="${esc(w.src)}"${w.srcset ? ` srcset="${esc(w.srcset)}"` : ''}` : `data-src="${esc(w.src)}"${w.srcset ? ` data-srcset="${esc(w.srcset)}"` : ''}`;
    /* sizes folgt dem Stylesheet: Das Blatt ist 72 svh hoch (Telefon 46 svh), die Breite
       ergibt sich aus dem Seitenverhältnis. */
    const vh = Math.round(72 * (w.w && w.h ? w.w / w.h : 0.6)), vhMobil = Math.round(46 * (w.w && w.h ? w.w / w.h : 0.6));
    blatt.innerHTML = `<img class="ink-img" ${quelle} sizes="(max-width: 700px) ${vhMobil}vh, ${vh}vh" alt="${esc(blattAlt(w))}" loading="lazy" decoding="async">`;
    const schrift = document.createElement('p'); schrift.className = 'bf-schrift'; schrift.innerHTML = schriftHTML(w);
    st.appendChild(blatt); st.appendChild(schrift); reihe.appendChild(st);
    stuecke.push({ blatt, schrift, i: stuecke.length, kapitel: ki, geladen: erstes });
  }));
  let offen = stuecke.length - 1;   // Blätter, die ihre Quelle noch nicht haben
  function nachladen(bisIndex) {
    stuecke.forEach(s => {
      if (s.geladen || s.i > bisIndex) return;
      s.geladen = true; offen--;
      const img = s.blatt.querySelector('img');
      if (img.dataset.srcset) { img.srcset = img.dataset.srcset; delete img.dataset.srcset; }
      if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
    });
  }
  const hinweis = document.createElement('div'); hinweis.className = 'bf-hinweis'; hinweis.setAttribute('aria-hidden', 'true');
  hinweis.innerHTML = '<span>Scrollen</span><i></i>';
  buehne.appendChild(hinweis);
  halter.textContent = ''; halter.appendChild(buehne);
  const N = stuecke.length;

  /* Der Stand: voll (Bühne, Blatt für Blatt) oder still (Reihe). */
  /* „aus“ blendet den ganzen Abschnitt per CSS aus (.app[data-sequenz="aus"] #sequenz);
     ohne diese Zeile liefe die Bühne trotzdem an ein unsichtbares Ziel. */
  const stand = () => (!M || !B.m() || app.dataset.sequenz === 'still' || app.dataset.sequenz === 'aus') ? 'still' : 'voll';

  /* ---- Die Bühne ---- */
  /* aktuell: das Blatt, das steht. ziel: das Blatt, das laut Scrollweg dran wäre. seit: wann
     das aktuelle Blatt fertig da war. Ein Wechsel geht immer nur um eins, und erst, wenn das
     Blatt seine Sekunde hatte. gestartet: die Bühne ist angekommen, das erste Blatt liegt. */
  let aktuell = 0, ziel = 0, seit = 0, gestartet = false, wechselt = false, timer = 0, hinweisWeg = false;
  let laufend = [], generation = 0, stopps = [];
  const tf = (y, dreh, gross) => `translateY(${y}px) rotate(${dreh}deg) scale(${gross})`;
  const RUHE = tf(0, 0, 1);
  function anim(el, kf, opt) { const a = M.animate(el, kf, opt); laufend.push(a); return a; }
  function anhalten() { laufend.forEach(a => { if (a && a.stop) a.stop(); }); laufend = []; clearTimeout(timer); }
  function pose(s, da) {
    s.blatt.style.opacity = da ? '1' : '0'; s.blatt.style.transform = da ? RUHE : '';
    s.schrift.style.opacity = da ? '1' : '0'; s.schrift.style.transform = '';
  }

  /* Ein Blatt legt sich ab: von unten (rückwärts: von oben), leicht schräg, richtet sich
     auf; die Beschriftung folgt einen Augenblick später. */
  function eintritt(s, vor) {
    const t = B.tempo(), m = B.m(), vh = innerHeight;
    s.blatt.style.opacity = '0';
    s.blatt.style.transform = tf(vor ? 0.16 * vh : -0.14 * vh, DREH[s.i % DREH.length], 0.94);
    s.schrift.style.opacity = '0';
    const a = anim(s.blatt, { opacity: 1, transform: RUHE }, { duration: t.dauer * 0.8 * m, delay: 0.1 * m, ease: t.kurve });
    anim(s.schrift, { opacity: [0, 1], transform: ['translateY(8px)', 'translateY(0px)'] }, { duration: t.dauer * 0.6 * m, delay: 0.32 * m, ease: t.kurve });
    return a;
  }
  /* Ein Blatt geht: nach oben hinaus (rückwärts: nach unten), schneller, als es kam. */
  function austritt(s, vor) {
    const t = B.tempo(), m = B.m(), vh = innerHeight;
    anim(s.schrift, { opacity: 0, transform: `translateY(${vor ? -6 : 6}px)` }, { duration: t.kurz * 0.7 * m, ease: t.kurve });
    return anim(s.blatt, { opacity: 0, transform: tf(vor ? -0.1 * vh : 0.1 * vh, 0, vor ? 1.03 : 0.97) }, { duration: t.kurz * m, ease: t.kurve });
  }
  /* Kapitel: kurze Überblendung, wenn das nächste Blatt zu einem anderen gehört. */
  function kapitelWechsel(von, zu) {
    const t = B.tempo(), m = B.m();
    anim(kapitelEls[von], { opacity: 0 }, { duration: t.kurz * m, ease: t.kurve });
    anim(kapitelEls[zu], { opacity: [0, 1] }, { duration: t.dauer * 0.6 * m, delay: t.kurz * m, ease: t.kurve });
  }
  function wechseln(nach) {
    wechselt = true;
    const g = generation, von = stuecke[aktuell], zu = stuecke[nach], vor = nach > aktuell;
    nachladen(Math.min(N - 1, nach + 1));
    if (KAPITEL.length > 1 && zu.kapitel !== von.kapitel) kapitelWechsel(von.kapitel, zu.kapitel);
    austritt(von, vor).then(() => {
      if (g !== generation) return;
      aktuell = nach;
      eintritt(zu, vor).then(() => {
        if (g !== generation) return;
        seit = performance.now(); wechselt = false; pruefen();
      });
    });
  }
  /* Ist ein anderes Blatt dran, kommt es — sobald das stehende seine Sekunde hatte. */
  function pruefen() {
    if (wechselt || !gestartet || ziel === aktuell) return;
    clearTimeout(timer);
    const rest = MINDESTENS - (performance.now() - seit);
    if (rest > 0) { timer = setTimeout(pruefen, rest + 10); return; }
    wechseln(ziel > aktuell ? aktuell + 1 : aktuell - 1);
  }
  /* Die Ankunft: Sobald die Bühne zu einem guten Teil im Fenster steht, legt sich das erste
     Blatt ab; von da an zählt die Zeit. */
  function ankommen() {
    if (gestartet) return;
    gestartet = true; wechselt = true;
    const g = generation;
    eintritt(stuecke[0], true).then(() => { if (g !== generation) return; seit = performance.now(); wechselt = false; pruefen(); });
  }

  function bauen() {
    generation++; anhalten(); stopps.forEach(f => f()); stopps = [];
    const st = stand();
    halter.dataset.stand = st;
    if (st === 'still') {
      halter.style.height = '';
      kapitelEls.forEach(el => { el.style.opacity = ''; });
      stuecke.forEach(s => { s.blatt.style.opacity = ''; s.blatt.style.transform = ''; s.schrift.style.opacity = ''; s.schrift.style.transform = ''; });
      hinweis.style.opacity = '';
      nachladen(N - 1);
      return;
    }
    /* Der Scrollweg je Blatt. Er bestimmt, wie lange die Bühne klebt — nicht mehr, wie schnell
       die Blätter laufen; das tut die Zeit. */
    /* Seit ein Werk aus drei Blättern dreimal vorbeizieht, sind es sieben Blätter statt fünf.
       Auch mit 70 svh je Blatt klebte die Bühne noch sechs Fenster lang und nahm über zwei
       Fünftel der ganzen Seite ein, bevor ein einziges Werk mit Titel zu sehen war. Knapp ein
       halbes Fenster je Blatt reicht: Das Tempo gibt ohnehin die Zeit vor (MINDESTENS), der Weg
       sagt nur, welches Blatt dran ist. */
    const mobil = innerWidth <= 700, dezent = B.m() < 1;
    const je = dezent ? 42 : mobil ? 44 : 48;
    halter.style.height = Math.max(200, N * je + 60) + 'svh';
    wechselt = false;
    /* Posen: Das aktuelle Blatt steht, die anderen warten; vor der Ankunft liegt keines. */
    stuecke.forEach(s => pose(s, gestartet && s.i === aktuell));
    kapitelEls.forEach((el, k) => { el.style.opacity = (KAPITEL.length === 1 || k === stuecke[aktuell].kapitel) ? '1' : '0'; });
    hinweis.style.opacity = hinweisWeg ? '0' : '';
    /* Blatt i ist ab i/N dran; seine Quelle bekommt es 0,8 Fenster davor, das sind gut
       50 svh Scrollweg. Wer zu den Werken springt, holt alle auf einmal nach. */
    if (offen > 0) {
      const stopNachladen = M.scroll(p => { nachladen(Math.floor(p * N + 0.8)); if (offen <= 0) stopNachladen(); }, { target: halter, offset: ['start start', 'end end'] });
      stopps.push(stopNachladen);
    }
    stopps.push(M.scroll(p => {
      ziel = klemm(Math.floor(p * N), 0, N - 1);
      if (p > 0.04 && !hinweisWeg) { hinweisWeg = true; anim(hinweis, { opacity: 0 }, { duration: 0.5 * B.m(), ease: B.tempo().kurve }); }
      pruefen();
    }, { target: halter, offset: ['start start', 'end end'] }));
    if (!gestartet) stopps.push(M.inView(buehne, ankommen, { amount: 0.4 }));
    else pruefen();
  }
  bauen();
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(bauen, 150); });
  new MutationObserver(bauen).observe(app, { attributes: true, attributeFilter: ['data-sequenz', 'data-bewegung', 'data-richtung'] });
  L.blattfolge = { bauen, zahl: N, aktuell: () => aktuell, ziel: () => ziel, mindestens: MINDESTENS };
})();
