/* Luke WTF — Seitenlogik. Portiert aus dem Claude-Design-Prototyp, ohne Framework.
   Daten und Konfiguration: js/works.js. 3D-Sequenz: js/werk-sequenz.js. */
(function () {
  'use strict';
  const L = window.LUKE || {};
  const CFG = L.CONFIG || {}, W = L.WERKE || [], FLASH = L.FLASH || [], FILTER = L.FILTER || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const app = $('.app');
  if (!app) return;
  const prm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);
  const pick = (v, opts, d) => (opts.includes(v) ? v : d);

  /* ---------- Zustand ---------- */
  const S = {
    richtung: pick(params.get('richtung'), ['a', 'b', 'c'], app.dataset.richtung || 'a'),
    /* Auf dem Telefon ist die Schiene die Voreinstellung: ein Blatt pro Bildschirm,
       zum Wischen. Am großen Bildschirm bleibt es beim Mauerwerk. */
    layout: pick(params.get('layout'), ['mauerwerk', 'buendig', 'schiene'],
      matchMedia('(max-width: 700px)').matches ? 'schiene' : 'mauerwerk'),
    bewegung: prm ? 'aus' : pick(params.get('bewegung'), ['aus', 'dezent', 'voll'], app.dataset.bewegung || 'voll'),
    dichte: 'luftig', rotspur: 'spur', sequenz: 'voll', korn: 'aus',
    panel: params.has('proto'), panelOpen: true,
    traeger: 'alles', fOrt: null, fMotiv: null, fSerie: null, fJahr: null,
    open: null
  };
  const TEMPO = {
    a: { washIn: 500, washOut: 560, flip: 520, ov: 620, eIn: 'cubic-bezier(.4,0,.2,1)', eFlip: 'cubic-bezier(.22,.9,.3,1)' },
    b: { washIn: 700, washOut: 800, flip: 700, ov: 780, eIn: 'cubic-bezier(.3,0,.15,1)', eFlip: 'cubic-bezier(.16,1,.3,1)' },
    c: { washIn: 260, washOut: 300, flip: 320, ov: 380, eIn: 'cubic-bezier(.34,1.3,.5,1)', eFlip: 'cubic-bezier(.34,1.35,.5,1)' }
  };
  const tempo = () => TEMPO[S.richtung] || TEMPO.a;
  const mScale = () => ({ aus: 0, dezent: 0.55, voll: 1 })[S.bewegung];

  /* ---------- Generierte Tuschplatzhalter (deterministisch aus seed) ---------- */
  function genArt(seed, Wd, Hd, red) {
    let a = seed >>> 0;
    const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const F = n => n.toFixed(1);
    const blob = (cx, cy, r) => {
      const n = 7, pts = [];
      for (let i = 0; i < n; i++) { const an = i / n * Math.PI * 2; const rr = r * (0.65 + rnd() * 0.7); pts.push([cx + Math.cos(an) * rr, cy + Math.sin(an) * rr * 1.15]); }
      let d = `M ${F((pts[n - 1][0] + pts[0][0]) / 2)} ${F((pts[n - 1][1] + pts[0][1]) / 2)}`;
      for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; d += ` Q ${F(p[0])} ${F(p[1])} ${F((p[0] + q[0]) / 2)} ${F((p[1] + q[1]) / 2)}`; }
      return d + ' Z';
    };
    const fills = ['var(--mut)', 'var(--ink)', 'var(--fnt)'];
    const washes = [];
    const wn = 2 + (rnd() * 2 | 0);
    for (let i = 0; i < wn; i++) {
      const f = fills[(rnd() * 3) | 0];
      washes.push({ d: blob(Wd * (0.3 + rnd() * 0.4), Hd * (0.25 + rnd() * 0.5), Math.min(Wd, Hd) * (0.16 + rnd() * 0.22)), f, o: (f === 'var(--fnt)' ? 0.5 + rnd() * 0.3 : 0.1 + rnd() * 0.16).toFixed(2) });
    }
    const lines = [];
    const ln = 6 + (rnd() * 5 | 0);
    for (let i = 0; i < ln; i++) {
      const x0 = Wd * (0.1 + rnd() * 0.8), y0 = Hd * (0.08 + rnd() * 0.7);
      const dx = (rnd() - 0.5) * Wd * 0.8, dy = (rnd() * 0.5 + 0.1) * Hd * (rnd() < 0.4 ? -1 : 1);
      const j = () => (rnd() - 0.5) * Wd * 0.3;
      lines.push({ d: `M ${F(x0)} ${F(y0)} C ${F(x0 + j())} ${F(y0 + dy * 0.3)} ${F(x0 + dx + j())} ${F(y0 + dy * 0.7)} ${F(x0 + dx)} ${F(y0 + dy)}`, w: F(0.8 + rnd() * 1.6), o: (0.3 + rnd() * 0.45).toFixed(2) });
    }
    let redD = '';
    if (red) { const x = Wd * (0.35 + rnd() * 0.3); const jj = () => (rnd() - 0.5) * Wd * 0.12; redD = `M ${F(x)} -8 C ${F(x + jj())} ${F(Hd * 0.3)} ${F(x + jj())} ${F(Hd * 0.6)} ${F(x + jj())} ${F(Hd + 8)}`; }
    return { washes, lines, redD };
  }
  const artCache = {};
  const art = (key, seed, w, h, red) => artCache[key] || (artCache[key] = genArt(seed, w, h, red));
  function artSVG(a, w, h, seed, fid, opts) {
    const o = Object.assign({ freq: '0.014 0.02', scale: 9, washes: a.washes, lines: a.lines, red: a.redD }, opts || {});
    const washes = o.washes.map(p => `<path d="${p.d}" fill="${p.f}" fill-opacity="${p.o}"/>`).join('');
    const lines = o.lines.map(p => `<path d="${p.d}" fill="none" stroke="var(--ink)" stroke-width="${p.w}" stroke-opacity="${p.o}" stroke-linecap="round"/>`).join('');
    const red = o.red ? `<path d="${o.red}" fill="none" stroke="var(--red)" stroke-width="4" stroke-opacity="0.92" stroke-linecap="round"/>` : '';
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><filter id="${fid}" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="${o.freq}" numOctaves="2" seed="${seed}"/><feDisplacementMap in="SourceGraphic" scale="${o.scale}"/></filter></defs><g filter="url(#${fid})">${washes}${lines}${red}</g></svg>`;
  }

  /* ---------- Werke ---------- */
  const isReal = w => !!w.src;
  const ratio = w => (isReal(w) ? `${w.w} / ${w.h}` : `${w.vbW} / ${w.vbH}`);
  const meta = w => (w.tr === 'haut' ? `Nr. ${w.nr} — Haut, ${w.ort}, ${w.jahr}` : `Nr. ${w.nr} — ${w.technik}, ${w.jahr}`);
  const altText = w => (w.tr === 'haut' ? `${w.t}, Blackwork auf ${w.ort}, ${w.jahr}.` : `${w.t}, ${w.technik}, ${w.jahr}.`) + (isReal(w) ? '' : ' Platzhalterzeichnung.') + ' Werkansicht öffnen.';
  function bildHTML(w, fid, sizes, alt) {
    if (isReal(w)) {
      return `<img class="${w.tr === 'papier' ? 'ink-img' : 'photo-img'}" src="${esc(w.src)}"${w.srcset ? ` srcset="${esc(w.srcset)}"` : ''} sizes="${sizes}" width="${w.w}" height="${w.h}" alt="${esc(alt || '')}" loading="lazy" decoding="async">`;
    }
    return artSVG(art(w.id, w.seed, w.vbW, w.vbH, !!w.red), w.vbW, w.vbH, w.seed, fid);
  }
  function filtered() {
    let list = W;
    if (S.traeger !== 'alles') list = list.filter(w => w.tr === S.traeger);
    if (S.traeger === 'haut') { if (S.fOrt) list = list.filter(w => w.ortKey === S.fOrt); if (S.fMotiv) list = list.filter(w => w.motiv === S.fMotiv); }
    if (S.traeger === 'papier') { if (S.fSerie) list = list.filter(w => w.serie === S.fSerie); if (S.fJahr) list = list.filter(w => w.jahr === S.fJahr); }
    return list;
  }
  function renderTabs() {
    $('#tr-tabs').innerHTML = [['haut', 'Haut'], ['papier', 'Papier'], ['alles', 'Alles']]
      .map(([k, label]) => `<button type="button" class="tr-tab" data-tr="${k}" aria-pressed="${S.traeger === k}">${label}</button>`).join('')
      + '<span class="tr-schiene" aria-hidden="true"></span>';
    schieneSetzen();
  }

  /* Die Linie unter den Reitern folgt dem gewählten Träger. Sie wird nach jedem Zeichnen
     neu vermessen, weil sich die Wortbreiten mit der Schrift ändern. */
  function schieneSetzen() {
    const leiste = $('#tr-tabs'), schiene = $('.tr-schiene', leiste);
    const aktiv = $('.tr-tab[aria-pressed="true"]', leiste);
    if (!schiene || !aktiv) return;
    schiene.style.width = aktiv.offsetWidth + 'px';
    schiene.style.transform = `translateX(${aktiv.offsetLeft}px)`;
  }
  addEventListener('resize', schieneSetzen, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schieneSetzen);
  function renderChips() {
    const chip = (label, active, f, v) => `<button type="button" class="chip" data-f="${f}" data-v="${esc(v == null ? '' : v)}" aria-pressed="${active}">${esc(label)}</button>`;
    let html = '';
    if (S.traeger === 'haut') {
      html = chip('Alle Stellen', !S.fOrt, 'fOrt', '') + (FILTER.orte || []).map(o => chip(o, S.fOrt === o, 'fOrt', o)).join('')
        + '<span class="chip-gap"></span>' + (FILTER.motive || []).map(o => chip(o, S.fMotiv === o, 'fMotiv', o)).join('');
    } else if (S.traeger === 'papier') {
      html = chip('Alle Serien', !S.fSerie, 'fSerie', '') + (FILTER.serien || []).map(o => chip(o, S.fSerie === o, 'fSerie', o)).join('')
        + '<span class="chip-gap"></span>' + (FILTER.jahre || []).map(o => chip(String(o), S.fJahr === o, 'fJahr', o)).join('');
    }
    const el = $('#werke-filter'); el.innerHTML = html; el.hidden = !html;
  }
  function renderGrid() {
    const list = filtered();
    $('#werke-count').textContent = list.length === 1 ? 'Ein Werk.' : list.length + ' Werke.';
    const gl = $('#g-list'); gl.dataset.layout = S.layout;
    const wall = gl.closest('.g-wall');
    if (wall) wall.dataset.schiene = S.layout === 'schiene' ? 'an' : 'aus';
    gl.innerHTML = list.map(w => `<button type="button" class="g-item rv" data-fid="${w.id}" aria-label="${esc(altText(w))}"><span class="tin"><span class="cnr" aria-hidden="true">${w.nr}</span><span class="g-ph" style="aspect-ratio:${ratio(w)};">${bildHTML(w, 'f' + w.id, '(max-width: 540px) 92vw, (max-width: 900px) 46vw, 380px')}</span><span class="g-meta"><span class="g-t">${esc(w.t)}</span><span class="g-m">${esc(meta(w))}</span></span></span></button>`).join('');
  }
  function renderWerke() { renderTabs(); renderChips(); renderGrid(); zaehlerNachfuehren(); }

  /* Zeigt in der Schiene, das wievielte Blatt gerade in der Mitte steht. Ohne diesen
     Hinweis weiß beim Wischen niemand, wie viel noch kommt. */
  function zaehlerNachfuehren() {
    const gl = $('#g-list'), z = $('#g-zaehler');
    if (!gl || !z) return;
    const items = $$('.g-item', gl);
    if (S.layout !== 'schiene' || !items.length) { z.textContent = ''; return; }
    const mitte = gl.scrollLeft + gl.clientWidth / 2;
    let nah = 0, beste = Infinity;
    items.forEach((el, i) => {
      const c = el.offsetLeft + el.offsetWidth / 2;
      const d = Math.abs(c - mitte);
      if (d < beste) { beste = d; nah = i; }
    });
    z.textContent = `${nah + 1} von ${items.length}`;
  }
  (function schienenZaehler() {
    const gl = $('#g-list'); if (!gl) return;
    let warte = 0;
    gl.addEventListener('scroll', () => {
      if (warte) return;
      warte = requestAnimationFrame(() => { warte = 0; zaehlerNachfuehren(); });
    }, { passive: true });
    addEventListener('resize', zaehlerNachfuehren, { passive: true });
  })();

  /* Übergänge: FLIP beim Filtern / Layoutwechsel, Waschung beim Trägerwechsel */
  let rects = null;
  function flipStart() { rects = {}; $$('.g-item').forEach(el => { rects[el.dataset.fid] = el.getBoundingClientRect(); }); }
  function flipPlay() {
    const m = mScale(); if (!m) return;
    const tp = tempo(); let k = 0;
    $$('.g-item').forEach(el => {
      const r0 = rects && rects[el.dataset.fid]; const r1 = el.getBoundingClientRect();
      const dl = Math.min(k * 28, 170) * m;
      if (!r0) { el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380 * m, delay: dl, easing: 'ease-out', fill: 'backwards' }); k++; return; }
      const dx = r0.left - r1.left, dy = r0.top - r1.top, sw = r0.width / r1.width;
      if (Math.abs(dx) + Math.abs(dy) > 1 || Math.abs(sw - 1) > 0.01) {
        el.animate([{ transform: `translate(${dx}px,${dy}px) scale(${sw})`, transformOrigin: '0 0' }, { transform: 'none', transformOrigin: '0 0' }], { duration: tp.flip * m, delay: dl * 0.5, easing: tp.eFlip, fill: 'backwards' });
        k++;
      }
    });
  }
  function chip(patch) { flipStart(); Object.assign(S, patch); renderChips(); renderGrid(); flipPlay(); }
  function setLayout(k) { if (k === S.layout) return; flipStart(); S.layout = k; $('#g-list').dataset.layout = k; flipPlay(); }
  function washAnim(w, ein) {
    const tp = tempo(), m = Math.max(mScale(), 0.01), r = S.richtung;
    w.getAnimations().forEach(a => a.cancel());
    let kf;
    if (r === 'b') { w.style.transform = 'none'; w.style.background = '#000'; kf = ein ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }]; }
    else if (r === 'c') { w.style.background = 'var(--sheet)'; w.style.transformOrigin = ein ? '0 50%' : '100% 50%'; kf = ein ? [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }] : [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }]; }
    else { w.style.background = 'var(--ink)'; w.style.transformOrigin = ein ? '50% 0%' : '50% 100%'; kf = ein ? [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }] : [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }]; }
    return w.animate(kf, { duration: (ein ? tp.washIn : tp.washOut) * m, easing: tp.eIn, fill: 'forwards' });
  }
  function setTraeger(t, sofort) {
    if (t === S.traeger) return;
    const m = mScale(), wash = $('#gwash');
    const apply = () => { Object.assign(S, { traeger: t, fOrt: null, fMotiv: null, fSerie: null, fJahr: null }); renderWerke(); };
    if (!sofort && m > 0 && wash) {
      washAnim(wash, true).onfinish = () => {
        apply();
        const tp = tempo(), r = S.richtung;
        washAnim(wash, false);
        const kfT = r === 'b' ? [{ opacity: 0, filter: 'blur(8px)' }, { opacity: 1, filter: 'blur(0px)' }] : r === 'c' ? [{ opacity: 0, transform: 'translateY(-16px) rotate(-2.5deg)' }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }];
        let k = 0;
        $$('.g-item').forEach(el => { el.animate(kfT, { duration: 420 * m, delay: (tp.washOut * 0.55 + Math.min(k * 32, 200)) * m, easing: 'ease-out', fill: 'backwards' }); k++; });
      };
    } else apply();
  }
  $('#tr-tabs').addEventListener('click', e => { const b = e.target.closest('[data-tr]'); if (b) setTraeger(b.dataset.tr); });
  $('#werke-filter').addEventListener('click', e => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    const f = b.dataset.f, v = b.dataset.v;
    let nv = v === '' ? null : (f === 'fJahr' ? Number(v) : v);
    if (nv !== null && S[f] === nv) nv = null;
    chip({ [f]: nv });
  });
  $('#g-list').addEventListener('click', e => { const b = e.target.closest('.g-item'); if (b) openWerk(b.dataset.fid, b); });

  /* ---------- Werkansicht ---------- */
  let ret = null, rect0 = null;
  function renderOverlay() {
    const root = $('#ov-root'); const ow = W.find(w => w.id === S.open);
    if (!ow) { root.innerHTML = ''; return; }
    const liste = filtered();
    const stelle = liste.findIndex(w => w.id === ow.id);
    const rows = [{ k: 'Werknummer', v: 'Nr. ' + ow.nr }, { k: 'Träger', v: ow.tr === 'haut' ? 'Haut' : 'Papier' }, { k: 'Jahr', v: String(ow.jahr) }];
    if (ow.tr === 'haut') rows.push({ k: 'Körperstelle', v: ow.ort }, { k: 'Sitzungen', v: ow.sitzungen + (ow.sitzungen > 1 ? ' Sitzungen' : ' Sitzung') }, { k: 'Zustand', v: ow.zustand });
    else rows.push({ k: 'Technik', v: ow.technik }, { k: 'Maße', v: ow.masse }, { k: 'Serie', v: ow.serie });
    /* Die Bildfläche hat eine feste Höhe und zeigt das Blatt vollständig. Ein gerechnetes
       Seitenverhältnis brauchte für jedes Format eine Ausnahme und ergab auf dem Telefon
       entweder einen Streifen oder eine Fläche, die nicht mehr aufs Bild passte. */
    const bild = isReal(ow)
      ? `<img class="${ow.tr === 'papier' ? 'ink-img' : 'photo-img'}" src="${esc(ow.src)}"${ow.srcset ? ` srcset="${esc(ow.srcset)}"` : ''} sizes="(max-width: 700px) 96vw, 620px" width="${ow.w}" height="${ow.h}" alt="${esc(ow.t)}" decoding="async">`
      : artSVG(art(ow.id, ow.seed, ow.vbW, ow.vbH, !!ow.red), ow.vbW, ow.vbH, ow.seed, 'fx' + ow.id);
    const zaehler = liste.length > 1 ? `<span class="ov-zaehler">${stelle + 1} von ${liste.length}</span>` : '';
    root.innerHTML = `<div id="ov" role="dialog" aria-modal="true" aria-label="${esc(ow.t)}"><div id="ov-bg"></div><div class="ov-card"><figure id="ov-fig" class="ov-fig">${bild}</figure><div class="ov-info"><h3 class="hd">${esc(ow.t)}</h3><div class="ov-rows">${rows.map(x => `<div class="ov-row"><div class="mut">${esc(x.k)}</div><div>${esc(x.v)}</div></div>`).join('')}</div><div class="ov-actions">${zaehler}<button type="button" id="ov-prev" class="btn">Zurück</button><button type="button" id="ov-next" class="btn">Weiter</button><button type="button" id="ov-close" class="btn primary" style="padding:10px 20px;font-size:16px;">Schließen</button></div></div></div></div>`;
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

  function animateOvIn() {
    const m = mScale(); if (!m) return;
    const tp = tempo();
    const bg = $('#ov-bg'), card = $('.ov-card'), fig = $('#ov-fig');
    if (bg) bg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: tp.ov * 0.6 * m, easing: 'ease-out' });
    if (fig && rect0) {
      const r1 = fig.getBoundingClientRect();
      const dx = rect0.left - r1.left, dy = rect0.top - r1.top, s = rect0.width / r1.width;
      fig.animate([{ transform: `translate(${dx}px,${dy}px) scale(${s})`, transformOrigin: 'top left' }, { transform: 'none' }], { duration: tp.ov * m, easing: tp.eFlip });
      if (card) card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: tp.ov * 0.5 * m, delay: tp.ov * 0.25 * m, easing: 'ease-out', fill: 'backwards' });
    } else if (card) card.animate([{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: tp.ov * 0.65 * m, easing: 'ease-out' });
  }
  function openWerk(id, btn) {
    ret = btn || null;
    const ph = btn && btn.querySelector('.g-ph'); rect0 = ph ? ph.getBoundingClientRect() : null;
    S.open = id; renderOverlay(); animateOvIn();
    const c = $('#ov-close'); if (c) c.focus();
  }
  function closeOv() { S.open = null; renderOverlay(); if (ret) ret.focus(); }
  function ovStep(dir) {
    const list = filtered(); if (!list.length) return;
    const i = list.findIndex(w => w.id === S.open);
    const nx = list[(i + dir + list.length) % list.length];
    rect0 = null; S.open = nx.id; renderOverlay();
    const c = $('#ov-close'); if (c) c.focus();
  }
  $('#ov-root').addEventListener('click', e => {
    if (e.target.closest('#ov-close') || e.target.id === 'ov-bg') closeOv();
    else if (e.target.closest('#ov-prev')) ovStep(-1);
    else if (e.target.closest('#ov-next')) ovStep(1);
  });

  /* ---------- Flash ---------- */
  function renderFlash() {
    const el = $('#flash-list'); if (!el) return;
    el.innerHTML = FLASH.map(f => {
      const bild = f.src
        ? `<img class="ink-img" src="${esc(f.src)}" alt="" loading="lazy" decoding="async">`
        : (() => { const a = art('fl' + f.n, f.seed, 220, 280, false); return artSVG(a, 220, 280, f.seed, 'ff' + f.n, { freq: '0.02 0.03', scale: 7, washes: a.washes.slice(0, 1), lines: a.lines.slice(0, 6), red: '' }); })();
      const vergeben = f.status === 'vergeben';
      return `<div class="sheet rv${vergeben ? ' vergeben' : ''}"><div class="sheet-head"><span class="sheet-n">Blatt ${f.n}</span><span class="sheet-f">${esc(f.format)}</span></div><div class="sheet-ph">${bild}</div><div class="sheet-m">${esc(f.motiv)}</div><div class="sheet-row"><span class="mut">${esc(f.preis || 'auf Anfrage')}</span><span class="sheet-status">${esc(f.status)}</span></div></div>`;
    }).join('');
  }

  /* ---------- Anfrage ---------- */
  const form = $('#af-form');
  function showErr(msg) { const el = $('#af-err'); if (!el) return; el.textContent = msg; el.hidden = !msg; if (msg) el.focus(); }
  function done(mode, text) {
    form.hidden = true;
    const d = $('#af-done');
    const ig = `<a href="${esc(CFG.instagram || '#')}" target="_blank" rel="noopener">${esc(CFG.handle || 'Instagram')}</a>`;
    const copyBlock = `<textarea readonly aria-label="Anfragetext">${esc(text || '')}</textarea><button type="button" class="btn" data-copy>Text kopieren</button>`;
    if (mode === 'sent') d.innerHTML = `<h3 class="hd">Angekommen.</h3><p>Du hörst von mir — in der Regel innerhalb einer Woche. Wenn es schneller gehen muss: DM an ${ig}.</p>`;
    else if (mode === 'mail') d.innerHTML = `<h3 class="hd">Fast geschafft.</h3><p>Dein Mailprogramm sollte sich jetzt mit der Anfrage öffnen. Falls nicht: Text kopieren und per DM an ${ig} schicken.</p>${copyBlock}`;
    else d.innerHTML = `<h3 class="hd">Fast geschafft.</h3><p>Kopier den Text und schick ihn mir per DM an ${ig}. Du hörst von mir — in der Regel innerhalb einer Woche.</p>${copyBlock}`;
    d.hidden = false; d.classList.add('rv', 'on');
    const cp = $('[data-copy]', d);
    if (cp) cp.addEventListener('click', () => {
      const ta = $('textarea', d); ta.select();
      const ok = () => { cp.textContent = 'Kopiert.'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(ok, () => { try { document.execCommand('copy'); ok(); } catch (e) { /* Auswahl bleibt markiert */ } });
      else { try { document.execCommand('copy'); ok(); } catch (e) { /* Auswahl bleibt markiert */ } }
    });
    d.scrollIntoView({ block: 'nearest', behavior: mScale() ? 'smooth' : 'auto' });
  }
  function sendeAnfrage() {
    const g = id => document.getElementById(id);
    const v = id => ((g(id) && g(id).value) || '').trim();
    const idee = v('af-idee'), traeger = v('af-traeger'), stelle = v('af-stelle'), groesse = v('af-groesse'), budget = v('af-budget'), termin = v('af-termin'), kontakt = v('af-kontakt'), kontaktwert = v('af-kontaktwert');
    const adult = g('af-adult') && g('af-adult').checked;
    if (!idee) return showErr('Bitte beschreib kurz die Motividee.');
    if (!kontakt) return showErr('Bitte wähl einen Kontaktweg.');
    if (!kontaktwert) return showErr('Bitte gib an, wie ich dich dort erreiche.');
    if (!adult) return showErr('Ohne Bestätigung der Volljährigkeit geht es nicht.');
    showErr('');
    const text = [
      'Anfrage an ' + (CFG.name || 'Luke WTF'),
      'Motividee: ' + idee,
      'Träger: ' + (traeger === 'papier' ? 'Papier (Original)' : 'Haut (Tattoo)'),
      stelle && 'Körperstelle: ' + stelle,
      groesse && 'Ungefähre Größe: ' + groesse,
      'Budgetrahmen: ' + (budget || 'möchte ich erst besprechen'),
      termin && 'Terminwunsch: ' + termin,
      'Kontakt: ' + kontakt + ' — ' + kontaktwert,
      'Volljährig: ja'
    ].filter(Boolean).join('\n');
    const btn = $('#af-send');
    if (CFG.formEndpoint) {
      btn.disabled = true;
      const fd = new FormData(form); fd.append('zusammenfassung', text);
      fetch(CFG.formEndpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
        .then(r => { if (!r.ok) throw new Error(String(r.status)); done('sent'); })
        .catch(() => { btn.disabled = false; showErr('Senden hat nicht geklappt. Schreib mir bitte direkt per DM an ' + (CFG.handle || 'Instagram') + '.'); });
    } else if (CFG.formEmail) {
      location.href = 'mailto:' + CFG.formEmail + '?subject=' + encodeURIComponent('Anfrage über die Website') + '&body=' + encodeURIComponent(text);
      done('mail', text);
    } else done('copy', text);
  }
  if (form) form.addEventListener('submit', e => { e.preventDefault(); sendeAnfrage(); });

  /* ---------- Aktuell: Streifen nach Ausstellungsende ausblenden ---------- */
  (function aktuell() {
    const s = $('#aktuell'); if (!s || !CFG.ausstellung || !CFG.ausstellung.bis) return;
    const ende = new Date(CFG.ausstellung.bis + 'T23:59:59');
    if (!isNaN(ende.getTime()) && Date.now() > ende.getTime()) { s.hidden = true; const n = $('[data-nav="aktuell"]'); if (n) n.hidden = true; }
  })();

  /* ---------- Thema / Bedienfeld ---------- */
  function applyTheme() {
    app.dataset.richtung = S.richtung; app.dataset.bewegung = S.bewegung; app.dataset.dichte = S.dichte;
    app.dataset.rot = S.rotspur; app.dataset.sequenz = S.sequenz; app.dataset.korn = S.korn;
    const seq = $('werk-sequenz');
    if (seq) { seq.setAttribute('richtung', S.richtung); seq.setAttribute('bewegung', S.sequenz === 'still' ? 'aus' : S.bewegung); }
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
      if (k === 'layout') setLayout(v); else { S[k] = v; applyTheme(); }
      renderPanel();
    });
    $('#panel-zu').addEventListener('click', () => { S.panelOpen = false; renderPanel(); });
    $('#panel-mini').addEventListener('click', () => { S.panelOpen = true; renderPanel(); });
    $('#panel-vorfuehr').addEventListener('click', () => { S.panel = false; renderPanel(); });
  }

  /* ---------- Einblenden beim Scrollen ----------
     Kein IntersectionObserver: die .rv-Elemente sind in Richtung A per clip-path auf Breite null
     beschnitten, und ein beschnittenes Element meldet dem Observer die Fläche null — es würde nie
     eingeblendet. Stattdessen prüfen wir die Position selbst, angetrieben vom Motion-Loop
     (js/motion.js) beziehungsweise ersatzweise vom Scroll-Ereignis. */
  let rvList = [], lastScanY = null;
  function collectRv() { rvList = $$('.rv:not(.on)'); lastScanY = null; }
  function revealScan() {
    if (!rvList.length) return;
    if (lastScanY !== null && Math.abs(scrollY - lastScanY) < 4) return;
    lastScanY = scrollY;
    const trigger = innerHeight * 0.92;
    const rest = []; let i = 0;
    for (const el of rvList) {
      if (el.getBoundingClientRect().top < trigger) {
        el.style.transitionDelay = Math.min(i * 70, 280) * mScale() + 'ms';
        el.classList.add('on'); i++;
        setTimeout(() => { el.style.transitionDelay = ''; }, 1400);
      } else rest.push(el);
    }
    rvList = rest;
  }
  const observeNew = () => { collectRv(); revealScan(); };
  new MutationObserver(observeNew).observe(document.body, { childList: true, subtree: true });
  addEventListener('resize', revealScan, { passive: true });
  if (L.motion) L.motion.on(revealScan); else addEventListener('scroll', revealScan, { passive: true });

  /* ---------- Scrollen, Zeiger, Tastatur ---------- */
  /* Der Scrollfortschritt wird von js/tropfspur.js gezeichnet. */
  let xy = null, pmr = 0;
  addEventListener('pointermove', e => {
    xy = [e.clientX, e.clientY]; if (pmr) return;
    pmr = requestAnimationFrame(() => { pmr = 0; if (xy) { app.style.setProperty('--mx', (xy[0] / innerWidth * 100).toFixed(1) + '%'); app.style.setProperty('--my', (xy[1] / innerHeight * 100).toFixed(1) + '%'); } });
  }, { passive: true });
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
  document.addEventListener('sequenz-select', e => {
    const k = e.detail && e.detail.key;
    const target = k === 'flash' ? 'flash' : 'werke';
    if (k === 'haut' || k === 'papier') setTraeger(k, true);
    const el = document.getElementById(target);
    if (!el) return;
    const top = el.getBoundingClientRect().top + scrollY - 56;
    if (L.motion) L.motion.scrollTo(top); else window.scrollTo({ top, behavior: mScale() ? 'smooth' : 'auto' });
  });

  /* ---------- Videos: Zeichnung im Auftakt, Signatur bei Handschrift ---------- */
  /* Der Live-Auftakt. assets/js/auftakt-player.js hängt eine Remotion-Komposition als
     React in die Seite: dieselbe Zeichnung, aber in Ebenen mit Tiefe, die dem Zeiger
     folgen. Das Bündel wiegt gezippt rund 150 kB, deshalb wird es erst nach dem Laden
     der Seite geholt, nur wenn Bewegung erwünscht ist und der Anschluss nicht spart.
     Kommt es nicht an, bleibt es beim Video und beim Standbild. */
  const buehneGeplant = (() => {
    const fig = $('.hero-fig');
    if (!fig || mScale() === 0 || prm) return false;
    const verbindung = navigator.connection;
    if (verbindung && (verbindung.saveData || /2g/.test(verbindung.effectiveType || ''))) return false;
    return true;
  })();

  (function buehne() {
    if (!buehneGeplant) return;
    const fig = $('.hero-fig');
    const laden = () => {
      /* Der Player löst staticFile() über diesen Wert auf. Ohne ihn läge er bei /img/...
         Es muss ein Pfad sein, keine vollständige URL: staticFile kodiert den Doppelpunkt
         und stellt einem Wert ohne führenden Schrägstrich einen voran, aus http://host
         würde also /http%3A//host. */
      window.remotion_staticBase = new URL('assets', document.baseURI).pathname.replace(/\/$/, '');
      const skript = document.createElement('script');
      skript.src = 'assets/js/auftakt-player.js';
      skript.defer = true;
      skript.addEventListener('error', () => heroOhneBuehne(true));
      document.body.appendChild(skript);
      /* Kommt die Bühne nicht binnen vier Sekunden, übernimmt der gewohnte Auftakt. */
      setTimeout(() => { if (!fig.classList.contains('hat-buehne')) heroOhneBuehne(true); }, 4000);
    };
    if (document.readyState === 'complete') laden();
    else addEventListener('load', laden, { once: true });
  })();

  function heroOhneBuehne(nurBildSofort) {
    const fig = $('.hero-fig'), v = $('.hero-video');
    if (!fig || fig.classList.contains('hat-buehne') || fig.dataset.auftakt === 'ab') return;
    fig.dataset.auftakt = 'ab';
    let fertig = false;
    const still = () => { if (fertig) return; fertig = true; fig.classList.add('done'); };
    const nurBild = () => { fig.classList.add('still'); still(); };
    if (!v || mScale() === 0 || nurBildSofort) { nurBild(); return; }
    /* Kann der Browser das Format nicht (fehlender Codec, gesperrte Wiedergabe), zeigen wir
       nach kurzer Frist das fertige Blatt statt einer leeren Fläche. */
    const wache = setTimeout(() => { if (v.readyState < 2 || !v.currentTime) nurBild(); }, 2200);
    const sicherung = setTimeout(still, 20000);
    const fertigMachen = () => { clearTimeout(wache); clearTimeout(sicherung); still(); };
    v.addEventListener('ended', fertigMachen, { once: true });
    v.addEventListener('error', () => { clearTimeout(wache); clearTimeout(sicherung); nurBild(); }, { once: true });
    v.addEventListener('timeupdate', () => { if (v.currentTime > 0) clearTimeout(wache); }, { once: true });
    const p = v.play(); if (p && p.catch) p.catch(() => { clearTimeout(wache); nurBild(); });
  }

  /* Ohne geplante Bühne läuft der Auftakt sofort wie gewohnt. */
  if (!buehneGeplant) heroOhneBuehne(false);

  (function band() {
    const v = $('.band-video');
    if (!v) return;
    /* Bei ausgeschalteter Bewegung bleibt das Standbild stehen, das ist die Signatur. */
    if (mScale() === 0) return;

    /* Statt einmal abzuspielen folgt die Zeichnung dem Scrollen: Wer den Abschnitt
       hinunterliest, zieht die Linie mit und sieht die Signatur am Ende entstehen.
       Das ist dieselbe Bewegung, die Luke beim Zeichnen macht, nur vom Leser ausgelöst. */
    let kaputt = false;
    v.preload = 'auto';
    v.pause();
    /* Kann der Browser das Format nicht, bleibt das Standbild stehen. */
    v.addEventListener('error', () => { kaputt = true; }, { once: true });
    v.addEventListener('loadedmetadata', folgen);

    function folgen() {
      /* Die Dauer wird bei jedem Durchgang gelesen, nicht einmal beim Start. Sonst hängt
         alles daran, ob loadedmetadata vor oder nach diesem Skript gefeuert hat. */
      const dauer = v.duration;
      if (kaputt || !dauer || !isFinite(dauer)) return;
      const r = v.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      /* Von „taucht unten auf" bis „ist oben durch": daraus wird die Zeit im Clip. */
      const p = (innerHeight * 0.92 - r.top) / (innerHeight * 0.72 + r.height);
      const ziel = Math.max(0, Math.min(1, p)) * (dauer - 0.05);
      if (Math.abs(v.currentTime - ziel) < 0.04) return;
      try { v.currentTime = ziel; } catch (e) { /* Spulen noch nicht möglich */ }
    }
    if (L.motion) L.motion.on(folgen); else addEventListener('scroll', folgen, { passive: true });
  })();

  /* ---------- Start ---------- */
  applyTheme();
  renderWerke();
  renderFlash();
  schieneSetzen();
  renderPanel();
  observeNew();
})();
