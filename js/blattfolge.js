/* Die Blattfolge.

   Ersetzt die 3D-Sequenz. Eine klebende Bühne, und ein Blatt nach dem anderen kommt von
   unten herauf, bleibt stehen, geht nach oben hinaus; dann das nächste. Nie zwei zugleich:
   Zwischen Austritt und nächstem Eintritt liegt ein leerer Augenblick, ein Schnitt. Das
   letzte Blatt bleibt stehen, die Bühne scrollt mit ihm davon.

   Alles ist an den Scrollfortschritt gebunden, mit linearer Kurve: Die Kurve ist der Daumen
   des Lesers. Gezeigt wird nur, wofür es Aufnahmen gibt; ohne Kapitel verschwindet der
   Abschnitt. Der Stand folgt der .app: data-sequenz still oder Bewegung aus → ruhige Reihe. */
(function () {
  'use strict';
  const L = (window.LUKE = window.LUKE || {});
  const B = L.bewegung, M = B && B.M;
  const app = document.querySelector('.app');
  const halter = document.getElementById('blattfolge');
  if (!app || !halter) return;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Alle Kapitel, die die Folge kennt. Ein Kapitel ohne Aufnahmen bleibt weg — und kommt von
     selbst, sobald Bilder in js/works.js stehen. */
  const ALLE = [
    { key: 'haut', t: 'Haut', sub: 'Blackwork auf Arm, Rücken, Brust — seit 2012.' },
    { key: 'papier', t: 'Papier', sub: 'Tusche, Originale — zuletzt „Befreiung der Körperlichkeit“.' },
    { key: 'flash', t: 'Flash', sub: 'Fertige Blätter, jedes wird genau einmal gestochen.' }
  ];
  const aufnahmen = key => key === 'flash' ? (L.FLASH || []).filter(f => f.src) : (L.helleAufnahmen ? L.helleAufnahmen(key) : []);
  const KAPITEL = ALLE.map(k => Object.assign({}, k, { blaetter: aufnahmen(k.key) })).filter(k => k.blaetter.length);
  const sec = halter.closest('section');
  if (!KAPITEL.length) { if (sec) sec.hidden = true; return; }
  /* Leichte Schräge im Wechsel, wie Blätter, die man ablegt. */
  const DREH = [-5, 4, -3, 5, -4];

  /* Beschriftung aus den Daten, nichts erfunden. */
  function schriftHTML(w) {
    if (w.n != null) return `<span class="bf-nr">Blatt ${esc(w.n)}</span><span class="bf-t">${esc(w.motiv)}</span><span class="bf-m">${esc(w.format)}</span>`;
    const m = w.tr === 'haut' ? `${w.ort}, ${w.jahr}` : `${w.technik}, ${w.jahr}`;
    return `<span class="bf-nr">Nr. ${esc(w.nr)}</span><span class="bf-t">${esc(w.t)}</span><span class="bf-m">${esc(m)}</span>`;
  }

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
    blatt.innerHTML = `<img class="ink-img" src="${esc(w.src)}"${w.srcset ? ` srcset="${esc(w.srcset)}"` : ''} sizes="(max-width: 700px) 88vw, 44vw" alt="${esc(w.t || w.motiv || '')}" loading="lazy" decoding="async">`;
    const schrift = document.createElement('p'); schrift.className = 'bf-schrift'; schrift.innerHTML = schriftHTML(w);
    st.appendChild(blatt); st.appendChild(schrift); reihe.appendChild(st);
    stuecke.push({ blatt, schrift, i: stuecke.length, kapitel: ki });
  }));
  const hinweis = document.createElement('div'); hinweis.className = 'bf-hinweis'; hinweis.setAttribute('aria-hidden', 'true');
  hinweis.innerHTML = '<span>Scrollen</span><i></i>';
  buehne.appendChild(hinweis);
  halter.textContent = ''; halter.appendChild(buehne);
  const N = stuecke.length;

  /* Der Stand: voll (scrollgebunden) oder still (Reihe). */
  const stand = () => (!M || !B.m() || app.dataset.sequenz === 'still') ? 'still' : 'voll';
  let stopps = [];
  function binden(el, kf, times) {
    const anim = M.animate(el, kf, { ease: 'linear', times });
    const stop = M.scroll(anim, { target: halter, offset: ['start start', 'end end'] });
    stopps.push(() => { stop(); anim.cancel(); el.style.transform = ''; el.style.opacity = ''; });
  }
  function bauen() {
    stopps.forEach(f => f()); stopps = [];
    const st = stand();
    halter.dataset.stand = st;
    if (st === 'still') { halter.style.height = ''; kapitelEls.forEach(el => { el.style.opacity = ''; }); return; }
    /* Abweichung vom Brief: Ein eigens kürzeres Maß fürs Telefon (60) blieb bei den fünf
       Papierblättern unter der nötigen Höhe der Bühne — dieselbe Scrollstrecke je Blatt
       wie am großen Bildschirm reicht sicher. */
    const dezent = B.m() < 1;
    const je = dezent ? 55 : 70;
    halter.style.height = Math.max(200, N * je + 100) + 'svh';
    const vh = innerHeight, w = 1 / N;
    stuecke.forEach(s => {
      const t0 = s.i * w, letzte = s.i === N - 1, dreh = DREH[s.i % DREH.length];
      /* Eintritt 30 % des Fensters, Halten, Austritt: kürzer als der Eintritt.

         Abweichung vom Brief: Der Austritt begann dort bei 78 % des Fensters, hier bei 88 %
         (Beschriftung entsprechend mitgezogen). Motion hält eine scrollgebundene
         transform-Animation nicht sauber auf dem Zwischenwert einer Halte-Stufe: Bei 78 %
         stand das zweite Blatt laut Prüfung längst bei Deckkraft 1, war aber schon gut
         190 Pixel nach oben unterwegs — auf dem Telefon schob es sich dadurch unters
         Kapitel. Opacity hält exakt, was die Prüfung auch zeigt; y, rotate und scale tun es
         nicht. 88 % lässt der Bühne Luft, ohne den Übergang zum harten Schnitt zu machen. */
      if (letzte) {
        binden(s.blatt, { y: [0.7 * vh, 0.7 * vh, 0, 0], rotate: [dreh, dreh, 0, 0], scale: [0.92, 0.92, 1, 1], opacity: [0, 0, 1, 1] }, [0, t0, t0 + 0.3 * w, 1]);
        binden(s.schrift, { opacity: [0, 0, 1, 1], y: [8, 8, 0, 0] }, [0, t0 + 0.2 * w, t0 + 0.34 * w, 1]);
      } else {
        binden(s.blatt, { y: [0.7 * vh, 0.7 * vh, 0, 0, -0.6 * vh, -0.6 * vh], rotate: [dreh, dreh, 0, 0, 0, 0], scale: [0.92, 0.92, 1, 1, 1.04, 1.04], opacity: [0, 0, 1, 1, 0, 0] }, [0, t0, t0 + 0.3 * w, t0 + 0.88 * w, t0 + w, 1]);
        binden(s.schrift, { opacity: [0, 0, 1, 1, 0, 0], y: [8, 8, 0, 0, -6, -6] }, [0, t0 + 0.2 * w, t0 + 0.34 * w, t0 + 0.88 * w, t0 + 0.98 * w, 1]);
      }
    });
    /* Kapitel: das erste steht schon, das letzte bleibt; dazwischen kurze Überblendungen. */
    kapitelEls.forEach((el, k) => {
      if (KAPITEL.length === 1) { el.style.opacity = '1'; return; }
      const a = stuecke.findIndex(s => s.kapitel === k), b = a + KAPITEL[k].blaetter.length;
      const times = [], op = [];
      if (k === 0) { times.push(0); op.push(1); } else { times.push(0, a * w, a * w + 0.1 * w); op.push(0, 0, 1); }
      if (k === KAPITEL.length - 1) { times.push(1); op.push(1); } else { times.push(b * w - 0.1 * w, b * w, 1); op.push(1, 0, 0); }
      binden(el, { opacity: op }, times);
    });
    binden(hinweis, { opacity: [1, 0, 0] }, [0, 0.06, 1]);
  }
  bauen();
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(bauen, 150); });
  new MutationObserver(bauen).observe(app, { attributes: true, attributeFilter: ['data-sequenz', 'data-bewegung', 'data-richtung'] });
  L.blattfolge = { bauen, zahl: N };
})();
