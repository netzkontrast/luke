/* Luke WTF — Seitenlogik. Portiert aus dem Claude-Design-Prototyp, ohne Framework.
   Daten und Konfiguration: js/works.js. Bewegung: js/bewegung.js. Blattfolge: js/blattfolge.js. */
(function () {
  'use strict';
  const L = window.LUKE || {};
  const CFG = L.CONFIG || {}, W = L.WERKE || [], FILTER = L.FILTER || {}, GRAFIK = L.GRAFIK || [];
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const app = $('.app');
  if (!app) return;
  /* Die Grundlage aller Bewegung (js/bewegung.js). Ohne sie läuft die Seite still. */
  const B = L.bewegung, M = B && B.M;
  const prm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);

  /* ---------- Zustand ---------- */
  const S = {
    /* js/bewegung.js hat ?richtung= und ?bewegung= schon vor jedem anderen Skript auf
       .app übertragen, als einzige Stelle, die die Adresse dafür liest. Hier wird nur
       noch gelesen, nicht ein zweites Mal geparst. */
    richtung: app.dataset.richtung || 'a',
    bewegung: prm ? 'aus' : (app.dataset.bewegung || 'voll'),
    dichte: 'luftig', rotspur: 'spur', sequenz: 'voll', korn: 'aus',
    panel: params.has('proto'), panelOpen: true,
    fSerie: null, fJahr: null,
    /* Die Werkansicht: welches Werk offen ist und welches seiner Blätter gezeigt wird. */
    open: null, teil: 0
  };
  const mScale = () => ({ aus: 0, dezent: 0.55, voll: 1 })[S.bewegung];

  /* ---------- Werke ---------- */
  /* Ein Eintrag ohne Bild wird übergangen. Früher stand an seiner Stelle eine erzeugte
     Tuschzeichnung; die ist raus, weil auf dieser Seite nur stehen soll, was es gibt. */
  const isReal = w => L.blaetter(w).length > 0;
  /* Tuscheblätter kommen mit multiply auf die Seite: Das Papier verschwindet, stehen
     bleibt nur die Zeichnung. Ein Foto mit dunklem Grund darf das nicht, sonst säuft
     die ganze Fläche ab. Wann was gilt, steht in js/works.js. */
  const bildKlasse = w => (L.istTuschblatt(w) ? 'ink-img' : 'photo-img');
  const verh = b => (b.w / b.h).toFixed(4);
  const ZAHLWORT = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];
  const blaetterText = n => `${ZAHLWORT[n] || n} Blätter`;
  /* Die Zahl der Blätter steht in der Zeile, wenn ein Werk aus mehreren besteht — außer die
     Technik nennt sie schon („zwölf Blätter“ bei einer einzigen Aufnahme). */
  function meta(w) {
    const n = L.blaetter(w).length;
    return `Nr. ${w.nr} — ${w.technik}${n > 1 ? ', ' + blaetterText(n) : ''}, ${w.jahr}`;
  }
  const blattName = (w, i, n) => (n > 1 ? `${w.t}, Bild ${i + 1} von ${n}` : w.t);
  const altText = (w, i, n) => `${blattName(w, i, n)}, ${w.technik}, ${w.jahr}. Werkansicht öffnen.`;
  function bildHTML(w, b, sizes, alt) {
    return `<img class="${bildKlasse(w)}" src="${esc(b.src)}" srcset="${esc(b.srcset)}" sizes="${sizes}" width="${b.w}" height="${b.h}" alt="${esc(alt || '')}" loading="lazy" decoding="async">`;
  }
  /* Ein Werk aus vielen kleinen Blättern, die in einem Raster liegen (w.kacheln): Jedes Blatt
     ist ein Ausschnitt aus demselben Bild, das damit zugleich Bildbogen ist. Welche Breite
     geladen wird, entscheidet die Pixeldichte; eine Datei für alle zwölf. */
  function kachelnHTML(w, b) {
    const { spalten, zeilen } = w.kacheln, B0 = (L.BILDER || {})[b.name];
    const breite = B0 ? (B0.breiten.find(x => x >= (window.devicePixelRatio > 1.3 ? 1200 : 800)) || B0.breiten[B0.breiten.length - 1]) : 0;
    /* Absolut: Ein url() in einer CSS-Variablen löst der Browser dort auf, wo sie benutzt
       wird, also relativ zu css/site.css — und fände das Bild nicht. */
    const bogen = new URL(breite ? `assets/img/${b.name}-${breite}.webp` : b.src, document.baseURI).href;
    const stuecke = Array.from({ length: spalten * zeilen }, (_, i) => `<span class="kachel" style="--sx:${i % spalten};--sy:${Math.floor(i / spalten)}"></span>`).join('');
    /* Die Adresse des Bogens kommt erst, wenn das Werk heranrückt (neuordnen()): Ein
       Hintergrundbild kennt kein loading="lazy" und lüde sonst gleich beim Start. */
    return `<span class="kacheln ${bildKlasse(w)}" data-bogen="${esc(bogen)}" style="--spalten:${spalten};--zeilen:${zeilen}" aria-hidden="true">${stuecke}</span>`;
  }
  function filtered() {
    let list = W.filter(isReal);
    if (S.fSerie) list = list.filter(w => w.serie === S.fSerie);
    if (S.fJahr) list = list.filter(w => w.jahr === S.fJahr);
    return list;
  }
  /* Ein Filter, hinter dem nichts steht, ist eine Sackgasse. Angeboten wird deshalb nur,
     was unter den vorhandenen Werken auch vorkommt — und nur dann, wenn es mehr als eine
     Möglichkeit gibt. Heute gibt es eine Serie und ein Jahr, also keinen Filter; er kommt
     von selbst, sobald js/works.js mehr hergibt. */
  function vorhanden(liste, feld) {
    const da = new Set(W.map(w => w[feld]));
    return (liste || []).filter(v => da.has(v));
  }
  const FILTERGRUPPEN = [['Alle Serien', 'serien', 'serie', 'fSerie'], ['Alle Jahre', 'jahre', 'jahr', 'fJahr']];
  function renderChips() {
    const chip = (label, active, f, v) => `<button type="button" class="chip" data-f="${f}" data-v="${esc(v == null ? '' : v)}" aria-pressed="${active}">${esc(label)}</button>`;
    const teile = FILTERGRUPPEN.map(([label, liste, feld, f]) => {
      const werte = vorhanden(FILTER[liste], feld);
      return werte.length < 2 ? ''
        : chip(label, !S[f], f, '') + werte.map(o => chip(String(o), S[f] === o, f, o)).join('');
    }).filter(Boolean);
    const el = $('#werke-filter');
    el.innerHTML = teile.join('<span class="chip-gap"></span>');
    el.hidden = !teile.length;
  }
  /* Die Hängung. Jedes Werk steht für sich, alle in derselben Höhe (--hoehe im Stylesheet),
     so wie Bilder an einer Wand auf einer Linie hängen. Ein Werk aus mehreren Blättern steht
     als Reihe: Die Blätter teilen sich die Breite nach ihrem Seitenverhältnis (--r) und sind
     dadurch gleich hoch, ohne dass hier eine Pixelzahl gerechnet wird. flex-grow ist das
     Seitenverhältnis mal tausend: Unter eins verteilte Flexbox nur einen Teil des Platzes,
     und ein einzelnes Hochformat bliebe schmaler als sein Werk. --r des ganzen Werks
     ist die Summe, --n die Zahl der Fugen plus eins; daraus setzt das Stylesheet die Breite.
     Jedes Blatt ist ein eigener Knopf und öffnet die Werkansicht bei sich. Beim Enthüllen
     legen sich die Blätter eines Werks nacheinander ab, die Beschriftung kommt zuletzt. */
  function renderGrid() {
    const list = filtered();
    $('#werke-count').textContent = list.length === 1 ? 'Ein Werk.' : list.length + ' Werke.';
    const gl = $('#g-list');
    gl.innerHTML = list.map(w => {
      const bl = L.blaetter(w), n = bl.length;
      const summe = bl.reduce((s, b) => s + b.w / b.h, 0);
      /* sizes: auf dem Telefon der Anteil an der vollen Breite, sonst die Breite bei der
         vollen Höhe von 560 px, gedeckelt durch die Spalte der Seite. */
      const sizes = b => { const r = b.w / b.h; return `(max-width: 700px) ${Math.round(92 * r / summe)}vw, ${Math.round(Math.min(560 * r, 1100 * r / summe))}px`; };
      const blaetter = bl.map((b, i) => `<button type="button" class="g-blatt rv" data-eintritt="blatt" data-versatz="${i}" data-teil="${i}" style="--r:${verh(b)};flex-grow:${Math.round(1000 * b.w / b.h)}" aria-label="${esc(altText(w, i, n))}"><span class="g-bild">${w.kacheln ? kachelnHTML(w, b) : bildHTML(w, b, sizes(b))}</span></button>`).join('');
      return `<figure class="g-item${n > 1 ? ' g-item--teile' : ''}" data-fid="${esc(w.id)}" style="--r:${summe.toFixed(4)};--n:${n}">`
        + `<span class="cnr" aria-hidden="true">${esc(w.nr)}</span><div class="g-ph">${blaetter}</div>`
        + `<figcaption class="g-meta rv" data-versatz="${n}"><span class="g-t">${esc(w.t)}</span><span class="g-m">${esc(meta(w))}</span></figcaption></figure>`;
    }).join('');
    if (B) B.heben($$('.g-blatt', gl), { um: 4, feld: '.g-bild' });
    neuordnen(gl);
  }

  /* Neuordnung des Speichers: Solange das Werk zu sehen ist, tauschen alle paar Sekunden zwei
     seiner Blätter die Plätze — der Speicher ordnet sich neu, er steht nie ganz still. Unter
     dem Zeiger halten sie still, damit man hinsehen kann. Getauscht wird im Raster (die
     Knoten wechseln die Stelle), die Bewegung dazwischen ist ein FLIP mit der Feder der
     Richtung. Ohne Bewegung bleibt die Ordnung, wie sie lag. */
  function neuordnen(root) {
    $$('.kacheln', root).forEach(el => {
      const zeigen = () => { if (el.dataset.bogen) { el.style.setProperty('--bogen', `url('${el.dataset.bogen}')`); delete el.dataset.bogen; } };
      if (typeof IntersectionObserver === 'function') {
        const io = new IntersectionObserver(e => { if (e[0].isIntersecting) { zeigen(); io.disconnect(); } }, { rootMargin: '100% 0px' });
        io.observe(el);
      } else zeigen();
      let timer = 0;
      const tauschen = () => {
        if (!el.isConnected) return;
        timer = setTimeout(tauschen, 2600 + Math.random() * 2200);
        if (!mScale() || el.matches(':hover') || document.hidden) return;
        const k = $$('.kachel', el), n = k.length;
        if (n < 2) return;
        const i = Math.floor(Math.random() * n);
        let j = Math.floor(Math.random() * (n - 1)); if (j >= i) j++;
        const a = k[i], b = k[j], ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        /* Die beiden Knoten tauschen ihre Stelle im Raster. */
        const platz = document.createComment('');
        a.replaceWith(platz); b.replaceWith(a); platz.replaceWith(b);
        const na = a.getBoundingClientRect(), nb = b.getBoundingClientRect();
        [[a, ra, na], [b, rb, nb]].forEach(([el2, vorher, nachher], z) => {
          el2.style.zIndex = String(2 - z);
          M.animate(el2, { x: [vorher.left - nachher.left, 0], y: [vorher.top - nachher.top, 0], scale: [1, 1.06, 1] }, Object.assign({}, B.feder.gesetzt, { scale: { duration: 0.7 * mScale(), ease: B.tempo().kurve } }))
            .then(() => M.frame.postRender(() => M.frame.postRender(() => { el2.style.transform = ''; el2.style.zIndex = ''; })));
        });
      };
      if (M) M.inView(el, () => { clearTimeout(timer); timer = setTimeout(tauschen, 1400); return () => clearTimeout(timer); }, { amount: 0.3 });
    });
  }
  function renderWerke() { renderChips(); renderGrid(); }

  /* Übergänge der Galerie. Was verschwindet, geht zuerst, und zwar schneller als es kam;
     dann wird neu gezeichnet; was bleibt, gleitet an seinen neuen Platz (FLIP), was neu ist,
     hebt sich kurz. Die neuen Blätter werden hier gezeigt, nicht vom Enthüllen: zwei
     Bewegungen auf einer transform überschrieben sich. */
  let rects = null;
  function flipStart() { rects = {}; $$('.g-item').forEach(el => { rects[el.dataset.fid] = el.getBoundingClientRect(); }); }
  /* Motion schreibt die Endwerte im Renderschritt des folgenden Bildes noch einmal (wie in
     js/bewegung.js, zeigen()); ein Aufräumen direkt im .then() kam deshalb wieder zurück —
     beobachtet nach zwei schnellen Filterwechseln hintereinander, wo neu erscheinende Blätter
     mit style.opacity="1"/transform="none" hängen blieben. Deshalb hier ebenso erst zwei
     Renderschritte später leeren. */
  /* Die Blätter und die Beschriftung eines Werks tragen .rv; nach einem Filterwechsel zeigt
     die Galerie sie selbst, im Ganzen, statt sie einzeln enthüllen zu lassen. */
  const werkSofort = el => { if (B) $$('.rv', el).forEach(x => B.sofort(x)); };
  function flipPlay() {
    const s = mScale(); if (!s || !M) { $$('.g-item').forEach(werkSofort); return; }
    const t = B.tempo(); let neu = 0;
    $$('.g-item').forEach(el => {
      const r0 = rects && rects[el.dataset.fid], r1 = el.getBoundingClientRect();
      werkSofort(el);
      if (!r0) {
        M.animate(el, { opacity: [0, 1], y: [16, 0] }, { duration: t.dauer * 0.6 * s, delay: Math.min(neu++, 6) * 0.05 * s, ease: t.kurve })
          .then(() => M.frame.postRender(() => M.frame.postRender(() => { el.style.opacity = ''; el.style.transform = ''; })));
        return;
      }
      const dx = r0.left - r1.left, dy = r0.top - r1.top, sw = r0.width / r1.width;
      if (Math.abs(dx) + Math.abs(dy) > 1 || Math.abs(sw - 1) > 0.01) {
        el.style.transformOrigin = '0 0';
        M.animate(el, { x: [dx, 0], y: [dy, 0], scale: [sw, 1] }, B.feder.gesetzt)
          .then(() => M.frame.postRender(() => M.frame.postRender(() => { el.style.transform = ''; })));
      }
    });
  }
  async function austritt(bleiben) {
    const s = mScale(); if (!s || !M) return;
    const weg = $$('.g-item').filter(el => !bleiben.has(el.dataset.fid));
    if (weg.length) await M.animate(weg, { opacity: 0, scale: 0.98 }, { duration: B.tempo().kurz * 0.5 * s, ease: B.tempo().kurve });
  }
  /* Klickt jemand weiter, bevor der Austritt zu Ende ist, zeichnet nur der letzte Lauf. */
  let filterLauf = 0;
  async function chip(patch) {
    const lauf = ++filterLauf;
    const vorher = Object.assign({}, S);
    Object.assign(S, patch);
    const bleiben = new Set(filtered().map(w => w.id));
    Object.assign(S, vorher);
    await austritt(bleiben);
    if (lauf !== filterLauf) return;
    flipStart(); Object.assign(S, patch); renderChips(); renderGrid(); flipPlay();
  }
  $('#werke-filter').addEventListener('click', e => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    const f = b.dataset.f, v = b.dataset.v;
    let nv = v === '' ? null : (f === 'fJahr' ? Number(v) : v);
    if (nv !== null && S[f] === nv) nv = null;
    chip({ [f]: nv });
  });
  $('#g-list').addEventListener('click', e => {
    const b = e.target.closest('.g-blatt'), w = b && b.closest('.g-item');
    if (w) openWerk(w.dataset.fid, b, Number(b.dataset.teil) || 0);
  });

  /* ---------- Werkansicht ---------- */
  let ret = null, rect0 = null;
  /* Die Werkansicht zeigt Werke und Grafiken. Beide sind Bilder mit ein paar Zeilen
     darunter; nur die Zeilen unterscheiden sich, und geblättert wird jeweils in der
     eigenen Reihe, nicht quer durch beides. */
  const istGrafik = o => !!o && !!o.art;
  const finde = id => W.find(w => w.id === id) || GRAFIK.find(g => g.id === id);
  const ovListe = o => (istGrafik(o) ? GRAFIK : filtered()).filter(isReal);
  /* Geblättert wird Blatt für Blatt: durch die Blätter eines Werks, dann weiter zum nächsten
     Werk. Wer ein dreiteiliges Werk ansieht, soll nicht nach dem ersten Blatt herausfliegen. */
  const ovFolge = o => ovListe(o).flatMap(w => L.blaetter(w).map((b, i) => ({ id: w.id, teil: i })));
  function ovZeilen(o) {
    if (istGrafik(o)) {
      const r = [{ k: 'Gattung', v: o.art }];
      if (o.fuer) r.push({ k: 'Für', v: o.fuer });
      if (o.jahr) r.push({ k: 'Jahr', v: String(o.jahr) });
      if (o.notiz) r.push({ k: 'Anlass', v: o.notiz });
      return r;
    }
    const r = [{ k: 'Werknummer', v: 'Nr. ' + o.nr }, { k: 'Jahr', v: String(o.jahr) }, { k: 'Technik', v: o.technik }];
    const n = L.blaetter(o).length;
    if (n > 1) r.push({ k: 'Umfang', v: blaetterText(n) });
    r.push({ k: 'Maße', v: o.masse });
    if (o.serie) r.push({ k: 'Serie', v: o.serie });
    if (o.gezeigt) r.push({ k: 'Gezeigt', v: o.gezeigt });
    return r;
  }
  function renderOverlay() {
    const root = $('#ov-root'); const ow = finde(S.open);
    if (!ow) { root.innerHTML = ''; return; }
    const bl = L.blaetter(ow), n = bl.length;
    const teil = Math.max(0, Math.min(S.teil || 0, n - 1)), b = bl[teil];
    const liste = ovListe(ow);
    const stelle = liste.findIndex(w => w.id === ow.id);
    const rows = ovZeilen(ow);
    /* Die Bildfläche hat eine feste Höhe und zeigt das Blatt vollständig. Ein gerechnetes
       Seitenverhältnis brauchte für jedes Format eine Ausnahme und ergab auf dem Telefon
       entweder einen Streifen oder eine Fläche, die nicht mehr aufs Bild passte. */
    const bild = `<img class="${bildKlasse(ow)}" src="${esc(b.src)}" srcset="${esc(b.srcset)}" sizes="(max-width: 700px) 96vw, 620px" width="${b.w}" height="${b.h}" alt="${esc(blattName(ow, teil, n))}" decoding="async">`;
    /* Bei einem Werk aus mehreren Blättern zählt die Ansicht die Blätter, sonst die Werke. */
    const zahl = n > 1 ? `Bild ${teil + 1} von ${n}` : (liste.length > 1 ? `${stelle + 1} von ${liste.length}` : '');
    const zaehler = zahl ? `<span class="ov-zaehler">${zahl}</span>` : '';
    /* Die Blätter des Werks klein nebeneinander, in der Reihenfolge der Hängung: Man sieht,
       wo man steht, und kann direkt zu einem anderen springen. */
    const leiste = n > 1 ? `<div class="ov-teile" role="group" aria-label="Die ${blaetterText(n)} dieses Werks">${bl.map((x, i) => `<button type="button" class="ov-teil" data-teil="${i}" aria-pressed="${i === teil}" aria-label="Bild ${i + 1} von ${n}" style="--r:${verh(x)}"><img class="${bildKlasse(ow)}" src="${esc(x.src)}" srcset="${esc(x.srcset)}" sizes="72px" width="${x.w}" height="${x.h}" alt="" decoding="async"></button>`).join('')}</div>` : '';
    root.innerHTML = `<div id="ov" role="dialog" aria-modal="true" aria-label="${esc(ow.t)}"><div id="ov-bg"></div><div class="ov-card"><figure id="ov-fig" class="ov-fig">${bild}</figure><div class="ov-info"><h3 class="hd">${esc(ow.t)}</h3><div class="ov-rows">${rows.map(x => `<div class="ov-row"><div class="mut">${esc(x.k)}</div><div>${esc(x.v)}</div></div>`).join('')}</div>${leiste}<div class="ov-actions">${zaehler}<button type="button" id="ov-prev" class="btn">Zurück</button><button type="button" id="ov-next" class="btn">Weiter</button><button type="button" id="ov-close" class="btn primary" style="padding:10px 20px;font-size:16px;">Schließen</button></div></div></div></div>`;
    wischen($('#ov'));
  }

  /* Wischen in der Werkansicht: seitwärts blättern, nach unten schließen. Auf dem Telefon
     ist das die erwartete Bedienung; die Knöpfe bleiben trotzdem da. */
  function wischen(ov) {
    if (!ov) return;
    let x0 = 0, y0 = 0, aktiv = false;
    ov.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return;
      if (e.target.closest('button, a')) return;
      aktiv = true; x0 = e.clientX; y0 = e.clientY;
    }, { passive: true });
    ov.addEventListener('pointerup', e => {
      if (!aktiv) return;
      aktiv = false;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) ovStep(dx < 0 ? 1 : -1);
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) closeOv();
    }, { passive: true });
  }

  /* Öffnen: Der Hintergrund kommt kurz, die Bildfläche fliegt vom Blatt in der Galerie an
     ihren Platz, die Zeilen folgen gestaffelt. Kein Aufblenden der ganzen Karte, sonst wäre
     der Flug unsichtbar. */
  function animateOvIn() {
    const s = mScale(); if (!s || !M) return;
    const t = B.tempo();
    const bg = $('#ov-bg'), card = $('.ov-card'), fig = $('#ov-fig'), info = $('.ov-info');
    if (bg) M.animate(bg, { opacity: [0, 1] }, { duration: t.kurz * s, ease: t.kurve });
    if (card) M.animate(card, { opacity: [0, 1] }, { duration: t.kurz * 0.5 * s, ease: t.kurve });
    if (fig && rect0) {
      const r1 = fig.getBoundingClientRect();
      fig.style.transformOrigin = 'top left';
      /* Motion schreibt die Endwerte im Renderschritt des folgenden Bildes noch einmal (wie in
         js/bewegung.js, zeigen(), und flipPlay() oben) — ein sofortiges Leeren hier käme zu
         früh und würde vom nächsten Bild wieder überschrieben. Deshalb erst zwei Renderschritte
         später leeren. */
      M.animate(fig, { x: [rect0.left - r1.left, 0], y: [rect0.top - r1.top, 0], scale: [rect0.width / r1.width, 1] }, B.feder.gesetzt)
        .then(() => M.frame.postRender(() => M.frame.postRender(() => { fig.style.transform = ''; })));
    } else if (fig) M.animate(fig, { opacity: [0, 1], scale: [0.97, 1] }, { duration: t.ansicht * 0.65 * s, ease: t.kurve });
    const teile = info ? Array.from(info.children) : [];
    if (teile.length) M.animate(teile, { opacity: [0, 1], y: [12, 0] }, { duration: t.dauer * 0.5 * s, delay: M.stagger(0.05 * s, { startDelay: 0.15 * s }), ease: t.kurve });
  }
  /* Die Bildfläche eines Knopfs in der Galerie: das Blatt selbst oder die Karte der Grafik. */
  const flaeche = btn => btn && (btn.querySelector('.g-bild, .gr-ph') || btn);
  function openWerk(id, btn, teil) {
    ret = btn || null;
    const ph = flaeche(btn); rect0 = ph ? ph.getBoundingClientRect() : null;
    S.open = id; S.teil = teil || 0; renderOverlay(); animateOvIn();
    /* preventScroll: Auf dem Telefon scrollt die Karte, und der Fokus auf „Schließen“ ganz
       unten schöbe sonst das Blatt aus dem Bild, bevor man es gesehen hat. */
    const c = $('#ov-close'); if (c) c.focus({ preventScroll: true });
  }
  /* Wohin die Werkansicht zurückgeht: zu dem Blatt, das sie zuletzt gezeigt hat — nach dem
     Blättern ist das nicht mehr das, von dem sie kam. */
  function heimkehr() {
    const id = window.CSS && CSS.escape ? CSS.escape(S.open) : S.open;
    return $(`.g-item[data-fid="${id}"] .g-blatt[data-teil="${S.teil || 0}"]`) || $(`.gr-item[data-gid="${id}"]`) || ret;
  }
  /* Schließen: umgekehrt und kürzer. Der Dialog bleibt, bis das Bild zurück am Blatt ist;
     erst dann geht er aus dem Dokument und der Fokus zurück. */
  let schliesst = false;
  async function closeOv() {
    if (schliesst || S.open == null) return;
    schliesst = true;
    const s = mScale(), t = B.tempo();
    const fig = $('#ov-fig'), bg = $('#ov-bg'), info = $('.ov-info');
    const zurueck = heimkehr();
    if (s && M) {
      const ziel = flaeche(zurueck);
      const r0 = ziel ? ziel.getBoundingClientRect() : null;
      const wartet = [];
      if (info) wartet.push(M.animate(Array.from(info.children), { opacity: 0, y: 8 }, { duration: t.kurz * 0.5 * s, ease: t.kurve }));
      if (fig && r0) {
        const r1 = fig.getBoundingClientRect();
        fig.style.transformOrigin = 'top left';
        wartet.push(M.animate(fig, { x: r0.left - r1.left, y: r0.top - r1.top, scale: r0.width / r1.width, opacity: 0.6 }, { duration: t.kurz * s, ease: t.kurve }));
      } else if (fig) wartet.push(M.animate(fig, { opacity: 0, scale: 0.97 }, { duration: t.kurz * s, ease: t.kurve }));
      if (bg) wartet.push(M.animate(bg, { opacity: 0 }, { duration: t.kurz * s, delay: t.kurz * 0.3 * s, ease: t.kurve }));
      await Promise.all(wartet);
    }
    S.open = null; S.teil = 0; renderOverlay(); schliesst = false;
    if (zurueck) zurueck.focus();
  }

  /* Blättern: das alte Bild geht kurz zur Seite, das neue kommt von der anderen. Bleibt es
     beim selben Werk, bleiben auch Titel und Zeilen stehen; nur das Blatt wechselt. */
  /* Wer schneller drückt, als das Blatt geht, überspringt nichts und verheddert nichts: Solange
     ein Wechsel läuft, zählt der nächste Druck nicht. Zwei Wechsel zugleich rechneten beide
     vom selben Blatt aus, und der langsamere gewann. */
  let blaettert = false;
  async function ovGehe(ziel, dir, fokus) {
    if (!ziel || schliesst || blaettert) return;
    const s = mScale(), t = B.tempo(), fig = $('#ov-fig');
    const werkWechsel = ziel.id !== S.open;
    blaettert = true;
    if (s && M && fig) await M.animate(fig, { opacity: 0, x: -14 * dir }, { duration: 0.18 * s, ease: t.kurve });
    blaettert = false;
    if (schliesst || S.open == null) return;
    rect0 = null; S.open = ziel.id; S.teil = ziel.teil; renderOverlay();
    if (s && M) {
      const f2 = $('#ov-fig'), zeilen = [$('.ov-info h3'), $('.ov-rows')].filter(Boolean);
      /* Dieselbe Nachschreib-Falle wie oben bei animateOvIn: erst zwei Renderschritte später leeren. */
      if (f2) M.animate(f2, { opacity: [0, 1], x: [14 * dir, 0] }, { duration: 0.35 * s, ease: t.kurve })
        .then(() => M.frame.postRender(() => M.frame.postRender(() => { f2.style.transform = ''; })));
      if (werkWechsel && zeilen.length) M.animate(zeilen, { opacity: [0, 1] }, { duration: 0.3 * s, ease: t.kurve });
    }
    const f = (fokus && $(fokus)) || $('#ov-close'); if (f) f.focus({ preventScroll: true });
  }
  function ovStep(dir) {
    const folge = ovFolge(finde(S.open)); if (!folge.length) return;
    const i = folge.findIndex(x => x.id === S.open && x.teil === (S.teil || 0));
    ovGehe(folge[(i + dir + folge.length) % folge.length], dir, dir > 0 ? '#ov-next' : '#ov-prev');
  }
  $('#ov-root').addEventListener('click', e => {
    const teil = e.target.closest('.ov-teil');
    if (teil) {
      const i = Number(teil.dataset.teil) || 0;
      if (i !== S.teil) ovGehe({ id: S.open, teil: i }, i > S.teil ? 1 : -1, `.ov-teil[data-teil="${i}"]`);
    } else if (e.target.closest('#ov-close') || e.target.id === 'ov-bg') closeOv();
    else if (e.target.closest('#ov-prev')) ovStep(-1);
    else if (e.target.closest('#ov-next')) ovStep(1);
  });

  /* Ein Abschnitt, hinter dem nichts steht, verschwindet — samt seinem Eintrag oben.
     Eine Stelle für alle, damit der nächste nicht wieder vergessen wird; beim Abschnitt
     Grafik war er es schon. */
  function abschnittZeigen(id, da) {
    const sec = document.getElementById(id);
    if (sec) sec.hidden = !da;
    const nav = document.querySelector('.top a[href="#' + id + '"], .top [data-nav="' + id + '"]');
    if (nav) nav.hidden = !da;
  }

  /* ---------- Grafik ---------- */
  /* Plakate, Flyer, Cover und Signets. Sie behalten ihren Grund: multiply würde aus einem
     schwarzen Plakat ein Loch in der Seite machen. Jede Karte trägt ihr eigenes Format,
     ein Plakat wird also nicht auf quadratisch gestutzt.

     Gehängt wird in Reihen gleicher Höhe, wie an einer Plakatwand: Jede Karte wächst nach
     ihrem Seitenverhältnis (--r), dadurch ist jede Reihe bündig und innen gleich hoch, ohne
     dass hier gemessen wird. Die Karte nennt nur Titel, Gattung und Jahr; für wen und zu
     welchem Anlass steht in der Werkansicht. */
  function renderGrafik() {
    const el = $('#grafik-list'); if (!el) return;
    const da = GRAFIK.map(g => ({ g, b: L.bild(g.bild) })).filter(x => x.b);
    abschnittZeigen('grafik', da.length > 0);
    el.innerHTML = da.map(({ g, b }, i) => {
      const r = b.w / b.h;
      const zeile = [g.art, g.jahr].filter(Boolean).join(', ');
      const alt = [g.t, g.art + (g.fuer ? ' ' + g.fuer : ''), g.jahr].filter(Boolean).join(', ') + '. Größer ansehen.';
      return `<button type="button" class="gr-item rv" data-eintritt="druck" data-versatz="${i % 3}" data-gid="${esc(g.id)}" style="--r:${verh(b)}" aria-label="${esc(alt)}">`
        + `<span class="gr-ph">`
        + `<img class="photo-img" src="${esc(b.src)}" srcset="${esc(b.srcset)}" sizes="(max-width: 700px) ${Math.round(Math.min(92, 48 * r))}vw, ${Math.round(Math.min(1100, 380 * r))}px" width="${b.w}" height="${b.h}" alt="" loading="lazy" decoding="async">`
        + `</span><span class="gr-meta"><span class="gr-t">${esc(g.t)}</span><span class="gr-m">${esc(zeile)}</span></span></button>`;
    }).join('');
    if (B) B.heben($$('.gr-item', el), { um: 3, feld: '.gr-ph' });
  }
  $('#grafik-list').addEventListener('click', e => {
    const b = e.target.closest('.gr-item'); if (b) openWerk(b.dataset.gid, b);
  });

  /* ---------- Aktuell: Streifen nach Ausstellungsende ausblenden ---------- */
  (function aktuell() {
    if (!$('#aktuell') || !CFG.ausstellung || !CFG.ausstellung.bis) return;
    const ende = new Date(CFG.ausstellung.bis + 'T23:59:59');
    if (!isNaN(ende.getTime())) abschnittZeigen('aktuell', Date.now() <= ende.getTime());
  })();

  /* ---------- Thema / Bedienfeld ---------- */
  function applyTheme() {
    app.dataset.richtung = S.richtung; app.dataset.bewegung = S.bewegung; app.dataset.dichte = S.dichte;
    app.dataset.rot = S.rotspur; app.dataset.sequenz = S.sequenz; app.dataset.korn = S.korn;
    const tc = $('meta[name="theme-color"]'); if (tc) tc.setAttribute('content', getComputedStyle(app).getPropertyValue('--bg').trim() || '#E8E8E6');
  }
  function renderPanel() {
    const p = $('#panel'), mini = $('#panel-mini'); if (!p || !mini) return;
    p.hidden = !(S.panel && S.panelOpen); mini.hidden = !(S.panel && !S.panelOpen);
    if (p.hidden) return;
    $$('[data-set]', p).forEach(b => b.classList.toggle('on', String(S[b.dataset.set]) === b.dataset.val));
    $('#panel-rname').textContent = ({ a: 'A — Werkverzeichnis', b: 'B — Nach der Sitzung', c: 'C — Werkstatt' })[S.richtung] || '';
    $('#panel-prm').hidden = !prm;
  }
  const panel = $('#panel');
  if (panel) {
    panel.addEventListener('click', e => {
      const b = e.target.closest('[data-set]'); if (!b) return;
      const k = b.dataset.set, v = b.dataset.val;
      S[k] = v; applyTheme();
      renderPanel();
    });
    $('#panel-zu').addEventListener('click', () => { S.panelOpen = false; renderPanel(); });
    $('#panel-mini').addEventListener('click', () => { S.panelOpen = true; renderPanel(); });
    $('#panel-vorfuehr').addEventListener('click', () => { S.panel = false; renderPanel(); });
  }

  /* ---------- Enthüllen ----------
     Was neu ins Dokument kommt (Galerie, Grafik, Bestätigung), meldet js/bewegung.js beim
     Sichtbarwerden an. Der Beobachter sieht nur neue Knoten, keine Attribute: Motion schreibt
     Inline-Stile, und die dürfen hier keinen Kreis auslösen. */
  const observeNew = () => { if (B) { B.enthuellen(document); B.parallaxe(document); } };
  new MutationObserver(observeNew).observe(document.body, { childList: true, subtree: true });

  /* ---------- Scrollen, Zeiger, Tastatur ---------- */
  /* Der Scrollfortschritt wird von js/tropfspur.js gezeichnet. */
  document.addEventListener('keydown', e => {
    if (e.key && e.key.toLowerCase() === 'b' && e.shiftKey && !e.target.closest('input,textarea,select')) { e.preventDefault(); S.panel = !S.panel; S.panelOpen = true; renderPanel(); return; }
    if (S.open == null) return;
    if (e.key === 'Escape') closeOv();
    else if (e.key === 'ArrowRight') ovStep(1);
    else if (e.key === 'ArrowLeft') ovStep(-1);
    else if (e.key === 'Tab') {
      const f = $$('#ov button, #ov a').filter(el => !el.disabled);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  /* „Ansehen“ in der Blattfolge führt zu den Werken. */
  document.addEventListener('sequenz-select', () => {
    const el = document.getElementById('werke');
    if (!el) return;
    /* Unter die Kopfleiste, wie hoch sie gerade ist (Schreibtisch rund 100 px, Telefon 54). */
    const leiste = document.querySelector('.top');
    const top = el.getBoundingClientRect().top + scrollY - (leiste ? leiste.offsetHeight : 56);
    window.scrollTo({ top, behavior: mScale() ? 'smooth' : 'auto' });
  });

  /* ---------- Start ---------- */
  applyTheme();
  renderWerke();
  renderGrafik();
  renderPanel();
  observeNew();
})();
