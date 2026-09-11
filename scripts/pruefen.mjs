#!/usr/bin/env node
/* Prüft die Seite mit Playwright: lädt sie in Chromium, scrollt sie durch, prüft Zusicherungen,
   verlangt eine leere Konsole und zieht auf Wunsch Bilder je Abschnitt nach pruefung/.

   Aufruf (Playwright ist hier global installiert):
     NODE_PATH=/opt/node22/lib/node_modules node scripts/pruefen.mjs
     … --bilder         zusätzlich Bilder je Abschnitt, 1440 und 390 Pixel breit
     … --nur=auftakt    nur Prüfungen, deren Name das Wort enthält

   Bilder werden angesehen, nicht beschrieben. Ein Bild, das niemand angesehen hat, zählt nicht. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) {
  console.error('Playwright fehlt. Global installieren (npm i -g playwright && npx playwright install chromium)\nund mit NODE_PATH auf das globale node_modules aufrufen, hier: NODE_PATH=/opt/node22/lib/node_modules');
  process.exit(2);
}

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUSGABE = path.join(WURZEL, 'pruefung');
const ARGS = process.argv.slice(2);
const BILDER = ARGS.includes('--bilder');
const NUR = (ARGS.find(a => a.startsWith('--nur=')) || '').slice(6);

/* Bis Aufgabe 3 stand hier eine Ausnahme für die WebGL-Warnungen der 3D-Sequenz. Die
   Sequenz ist jetzt raus, also gibt es nichts mehr zu tolerieren: Die Konsole muss
   vollständig leer sein. */
const TOLERIERT = [];

/* ---------- Server im Prozess ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm', '.gif': 'image/gif', '.json': 'application/json' };
function server() {
  const s = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(WURZEL, p);
    fs.stat(f, (err, st) => {
      if (err || !st.isFile()) { res.writeHead(404); res.end('nicht da'); return; }
      const type = MIME[path.extname(f).toLowerCase()] || 'application/octet-stream';
      const range = req.headers.range;
      if (range) {
        const m = /bytes=(\d*)-(\d*)/.exec(range);
        const a = m && m[1] ? +m[1] : 0, b = m && m[2] ? +m[2] : st.size - 1;
        res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${st.size}`, 'Content-Length': b - a + 1, 'Accept-Ranges': 'bytes' });
        fs.createReadStream(f, { start: a, end: b }).pipe(res);
        return;
      }
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' });
      fs.createReadStream(f).pipe(res);
    });
  });
  return new Promise(ok => s.listen(0, '127.0.0.1', () => ok({ url: `http://127.0.0.1:${s.address().port}/`, close: () => s.close() })));
}

/* ---------- Prüfungen ---------- */
const FENSTER = {
  schreibtisch: { width: 1440, height: 900 },
  telefon: { width: 390, height: 844, mobil: true }
};
const PRUEFUNGEN = [];
/* fenster: 'schreibtisch' | 'telefon' | 'beide'. optionen: { ruhig: true } für „reduzierte
   Bewegung“, { abfrage: '?richtung=b' } für URL-Parameter. */
const pruefung = (name, fenster, lauf, optionen) => PRUEFUNGEN.push({ name, fenster, lauf, optionen: optionen || {} });

pruefung('grundlage: Motion und LUKE.bewegung sind da', 'beide', async (page, t) => {
  const r = await page.evaluate(() => ({
    motion: typeof window.Motion === 'object' && typeof window.Motion.animate === 'function',
    b: !!(window.LUKE && window.LUKE.bewegung),
    m: window.LUKE && window.LUKE.bewegung ? window.LUKE.bewegung.m() : null,
    tempo: window.LUKE && window.LUKE.bewegung ? Object.keys(window.LUKE.bewegung.tempo()).sort().join(',') : '',
    js: document.documentElement.dataset.js
  }));
  t.ok(r.motion, 'window.Motion fehlt oder hat kein animate()');
  t.ok(r.b, 'LUKE.bewegung fehlt');
  t.gleich(r.m, 1, 'Stärke bei voll');
  t.gleich(r.tempo, 'ansicht,dauer,feder,kurve,kurz,versatz', 'Felder von tempo()');
  t.gleich(r.js, 'an', 'data-js im <head> gesetzt');
});

pruefung('enthuellen: unten ist vor dem Scrollen nichts zu sehen', 'schreibtisch', async (page, t) => {
  const op = await page.evaluate(() => getComputedStyle(document.querySelector('#atelier .rv')).opacity);
  t.gleich(op, '0', 'Deckkraft eines .rv im Studio vor dem Scrollen');
});

pruefung('enthuellen: nach dem Durchscrollen ist alles da und aufgeräumt', 'beide', async (page, t) => {
  await t.durchscrollen();
  await t.warten(1800);
  const r = await page.evaluate(() => {
    /* Was in der Wischschiene rechts außerhalb des Fensters steht, wurde noch nicht gesehen
       und darf noch warten; alles andere muss da sein. */
    const sichtbar = Array.from(document.querySelectorAll('.rv')).filter(el => {
      if (el.closest('[hidden]')) return false;
      const r = el.getBoundingClientRect();
      return !(r.right <= 0 || r.left >= innerWidth);
    });
    const fehlt = sichtbar.filter(el => !el.classList.contains('on') || getComputedStyle(el).opacity !== '1');
    const schmutzig = sichtbar.filter(el => el.style.opacity || el.style.clipPath || el.style.filter);
    return { n: sichtbar.length, fehlt: fehlt.map(el => el.tagName + '.' + el.className).slice(0, 5), schmutzig: schmutzig.length };
  });
  t.ok(r.n > 10, 'zu wenige .rv gefunden: ' + r.n);
  t.gleich(r.fehlt.length, 0, 'nicht enthüllt: ' + r.fehlt.join(', '));
  t.gleich(r.schmutzig, 0, 'Inline-Stile nach dem Eintritt nicht geleert');
  await t.bild('durchgescrollt');
});

pruefung('ruhe: reduzierte Bewegung zeigt alles sofort', 'beide', async (page, t) => {
  const r = await page.evaluate(() => ({
    js: document.documentElement.dataset.js || '',
    bewegung: document.querySelector('.app').dataset.bewegung,
    unten: getComputedStyle(document.querySelector('#atelier .rv')).opacity,
    y: scrollY
  }));
  t.gleich(r.js, '', 'data-js darf bei reduzierter Bewegung nicht gesetzt sein');
  t.gleich(r.bewegung, 'aus', 'data-bewegung');
  t.gleich(r.unten, '1', 'Deckkraft unten ohne Scrollen');
  t.gleich(r.y, 0, 'Seite steht oben');
}, { ruhig: true });

pruefung('bilder: jeder Abschnitt, oben angeschnitten', 'beide', async (page, t) => {
  if (!BILDER) return;
  await t.durchscrollen();
  for (const a of await t.abschnitte()) {
    await t.zu(Math.max(0, a.oben - 40));
    await t.warten(900);
    await t.bild('abschnitt-' + a.id);
  }
});

pruefung('auftakt: das Profil zeichnet sich in der Ecke und bleibt stehen, die kniende Figur kommt dazu', 'beide', async (page, t) => {
  const r1 = await page.evaluate(() => {
    const fig = document.querySelector('.hero-fig').getBoundingClientRect();
    const nav = document.querySelector('.top').getBoundingClientRect();
    return {
      motiv: document.querySelectorAll('.hero-fig .hero-motiv').length,
      fern: document.querySelectorAll('.hero-fig .hero-fern, .hero-fig .hero-ebene').length,
      buehne: !!document.getElementById('auftakt-buehne'),
      rechts: innerWidth - fig.right, oben: fig.top - nav.bottom, breite: fig.width, hoehe: fig.height
    };
  });
  t.gleich(r1.motiv, 1, 'genau ein Motiv'); t.gleich(r1.fern, 0, 'keine grauen Tiefenebenen mehr'); t.ok(!r1.buehne, 'die Remotion-Bühne muss weg sein');
  /* Das Blatt gehört in die Ecke der Seite: rechts an die Kante, oben an die Leiste. Vorher
     stand es in der Spalte des Inhalts (auf dem Schreibtisch 170 px vor der Kante) und auf
     dem Telefon mittig mit 24 px Luft. */
  t.ok(Math.abs(r1.rechts) <= 1, 'Blatt bündig mit der rechten Kante: ' + r1.rechts + ' px Abstand');
  t.ok(Math.abs(r1.oben) <= 1, 'Blatt bündig unter der Leiste: ' + r1.oben + ' px Abstand');
  t.ok(Math.abs(r1.breite / r1.hoehe - 1200 / 1948) < 0.01, 'Format des Videos: ' + (r1.breite / r1.hoehe).toFixed(3));
  await t.warten(1600);
  const r2 = await page.evaluate(() => ({ h1: getComputedStyle(document.querySelector('.hero-text h1')).opacity }));
  t.gleich(r2.h1, '1', 'Titel nach 1,6 s');
  await t.bild('auftakt-zeichnen');
  await t.warten(9200);
  const r3 = await page.evaluate(() => {
    const v = document.querySelector('.hero-video'), fig = document.querySelector('.hero-fig').getBoundingClientRect();
    const n = document.querySelector('.hero-neben'), nb = n.getBoundingClientRect();
    return {
      done: document.querySelector('.hero-fig').classList.contains('done'),
      still: getComputedStyle(document.querySelector('.hero-still')).opacity,
      video: getComputedStyle(v).opacity, ende: v.ended || v.currentTime > v.duration - 0.2,
      kniend: getComputedStyle(n.querySelector('.hero-kniend')).opacity, blass: +getComputedStyle(n).opacity,
      nebenRechts: nb.right, nebenUnten: nb.bottom, figLinks: fig.left, figUnten: fig.bottom, breit: innerWidth >= 1100
    };
  });
  t.ok(r3.done, 'Auftakt nicht zu Ende: kein .done nach 10,8 s');
  /* Das Video bleibt mit seinem letzten Bild stehen; nichts ersetzt es. */
  t.gleich(r3.video, '1', 'Video bleibt stehen'); t.ok(r3.ende, 'Video am letzten Bild');
  t.gleich(r3.still, '0', 'kein Standbild über dem Video');
  t.gleich(r3.kniend, '1', 'die kniende Figur ist da');
  if (r3.breit) {
    t.ok(r3.nebenRechts <= r3.figLinks && Math.abs(r3.nebenUnten - r3.figUnten) <= 1, 'links neben dem Video, auf einer Unterkante: ' + JSON.stringify(r3));
    t.gleich(r3.blass, 1, 'daneben, nicht blass');
  } else t.ok(r3.blass > 0.1 && r3.blass < 0.35, 'auf schmalen Schirmen blass im Hintergrund: ' + r3.blass);
  await t.bild('auftakt-blatt');
});

pruefung('auftakt: ohne Bewegung steht sofort der Endzustand', 'schreibtisch', async (page, t) => {
  const r = await page.evaluate(() => ({
    done: document.querySelector('.hero-fig').classList.contains('done'),
    still: getComputedStyle(document.querySelector('.hero-still')).opacity,
    video: getComputedStyle(document.querySelector('.hero-video')).display,
    kniend: getComputedStyle(document.querySelector('.hero-kniend')).opacity,
    h1: getComputedStyle(document.querySelector('.hero-text h1')).opacity
  }));
  t.ok(r.done && r.still === '1' && r.video === 'none' && r.kniend === '1' && r.h1 === '1', 'Endzustand: ' + JSON.stringify(r));
}, { ruhig: true });

pruefung('auftakt: ?bewegung=aus steht sofort am Ende, ohne dass das Video läuft', 'schreibtisch', async (page, t) => {
  const r = await page.evaluate(() => {
    const v = document.querySelector('.hero-video');
    return {
      done: document.querySelector('.hero-fig').classList.contains('done'),
      still: getComputedStyle(document.querySelector('.hero-still')).opacity,
      videoZeit: v.currentTime,
      videoDisplay: getComputedStyle(v).display
    };
  });
  /* Ohne diesen Lauf blieb unbemerkt, dass ?bewegung=aus den Auftakt gar nicht erreichte
     (js/bewegung.js löste die Adresse zu spät auf) und die Öffnung trotzdem mit voller
     Wucht lief. */
  t.ok(r.done, '.done fehlt bei ?bewegung=aus');
  t.gleich(r.still, '1', 'Standbild bei ?bewegung=aus');
  t.ok(r.videoZeit === 0 || r.videoDisplay === 'none', 'Video läuft trotz ?bewegung=aus: ' + JSON.stringify(r));
}, { abfrage: '?bewegung=aus' });

pruefung('bewegung: ?bewegung=dezent setzt die Stärke auf 0,55', 'schreibtisch', async (page, t) => {
  t.gleich(await page.evaluate(() => window.LUKE.bewegung.m()), 0.55, 'Stärke bei ?bewegung=dezent');
}, { abfrage: '?bewegung=dezent' });

/* Sieben Blätter: die drei von Werk I, die drei von Werk II und „Ansichten“. „Neuordnung des
   Speichers“ liegt auf schwarzem Holz und bleibt draußen (grund: 'foto'). */
pruefung('blattfolge: sieben Blätter, eins zur Zeit, keines kürzer als eine Sekunde, das letzte bleibt', 'beide', async (page, t) => {
  const r = await page.evaluate(() => {
    const bf = document.getElementById('blattfolge');
    return { stand: bf && bf.dataset.stand, n: bf ? bf.querySelectorAll('.bf-blatt').length : 0,
      h: bf ? bf.getBoundingClientRect().height : 0, oben: bf ? bf.getBoundingClientRect().top + scrollY : 0,
      vh: innerHeight, alt: !!document.querySelector('werk-sequenz, #sequenz canvas'), mindestens: window.LUKE.blattfolge.mindestens };
  });
  t.gleich(r.stand, 'voll', 'Stand'); t.gleich(r.n, 7, 'Blätter'); t.ok(!r.alt, 'kein <werk-sequenz>, kein Canvas in der Blattfolge');
  t.ok(r.h >= r.vh * (t.mobil ? 4.4 : 5.2), 'Abschnitt zu niedrig: ' + Math.round(r.h) + ' bei ' + r.vh);
  t.gleich(r.mindestens, 1000, 'Mindeststand eines Blatts in ms');
  const strecke = r.h - r.vh;
  const deck = () => page.evaluate(() => Array.from(document.querySelectorAll('.bf-blatt')).map(el => +getComputedStyle(el).opacity));
  const transformVon = (sel, i) => page.evaluate(([sel, i]) => getComputedStyle(document.querySelectorAll(sel)[i]).transform, [sel, i]);
  const ruhe = v => v === 'none' || v === 'matrix(1, 0, 0, 1, 0, 0)';
  const da = s => s.filter(v => v > 0.05).length;
  /* Ankunft: Das erste Blatt legt sich ab, sobald die Bühne zu einem guten Teil im Fenster steht. */
  await t.zu(r.oben - r.vh * 0.5); await t.warten(1500);
  let s = await deck();
  t.ok(s[0] > 0.95 && da(s) === 1, 'bei der Ankunft steht genau das erste Blatt: ' + s.map(v => v.toFixed(2)).join(','));
  /* Weiter zum zweiten: Der Wechsel braucht seine Zeit, dann steht es allein, in Ruhelage.
     Blatt i ist ab i/7 des Wegs dran; 20 % liegen mitten im zweiten. */
  await t.zu(r.oben + strecke * 0.2); await t.warten(2200);
  s = await deck();
  t.ok(s[1] > 0.95 && da(s) === 1, 'bei 20 % genau das zweite Blatt: ' + s.map(v => v.toFixed(2)).join(','));
  const tf1 = await transformVon('.bf-blatt', 1);
  t.ok(ruhe(tf1), 'zweites Blatt bei 20 % nicht in Ruhelage: ' + tf1);
  const schriftTf1 = await transformVon('.bf-schrift', 1);
  t.ok(ruhe(schriftTf1), 'Beschriftung des zweiten Blatts bei 20 % nicht in Ruhelage: ' + schriftTf1);
  const zeile = await page.evaluate(() => document.querySelectorAll('.bf-schrift .bf-nr')[1].textContent);
  t.gleich(zeile, 'Nr. I · Bild 2 von 3', 'Beschriftung nennt Werk und Blatt');
  await t.bild('blattfolge-zweites');
  /* Mit Schwung ans Ende: Die Bühne holt nach, aber kein Blatt steht kürzer als eine Sekunde.
     Nach anderthalb Sekunden darf das letzte Blatt darum noch nicht da sein — vorher flogen
     hier drei Blätter in einer Sekunde vorbei. */
  await t.zu(r.oben + strecke); await t.warten(1500);
  s = await deck();
  t.ok(s[6] < 0.5, 'das letzte Blatt kommt nicht sofort, jedes davor hat seine Sekunde: ' + s.map(v => v.toFixed(2)).join(','));
  t.ok(da(s) <= 2, 'höchstens ein Blatt und sein Nachfolger zugleich: ' + s.map(v => v.toFixed(2)).join(','));
  await t.bild('blattfolge-uebergang');
  /* Fünf Wechsel stehen noch aus, je gut zwei Sekunden. */
  await t.warten(12500);
  s = await deck();
  t.ok(s[6] > 0.95 && da(s) === 1, 'am Ende steht das letzte Blatt allein: ' + s.map(v => v.toFixed(2)).join(','));
  const schrift = await page.evaluate(() => Array.from(document.querySelectorAll('.bf-schrift')).map(el => +getComputedStyle(el).opacity));
  t.ok(schrift[6] > 0.95 && schrift[0] < 0.05, 'Beschriftung gehört zum Blatt: ' + schrift.map(v => v.toFixed(2)).join(','));
  const geladen = await page.evaluate(() => Array.from(document.querySelectorAll('.bf-blatt img')).map(i => !!i.getAttribute('src')));
  t.ok(geladen.every(Boolean), 'alle Blätter haben am Ende ihre Quelle: ' + geladen.join(','));
  await t.bild('blattfolge-ende');
});

pruefung('blattfolge: die Blätter 2 bis 7 laden erst, wenn der Leser kommt', 'schreibtisch', async (page, t) => {
  const vorher = await page.evaluate(() => Array.from(document.querySelectorAll('.bf-blatt img')).map(i => !!i.getAttribute('src')));
  t.gleich(vorher.join(','), 'true,false,false,false,false,false,false', 'beim Start hat nur das erste Blatt eine Quelle');
  const bf = await page.evaluate(() => { const b = document.getElementById('blattfolge').getBoundingClientRect(); return { oben: b.top + scrollY, h: b.height }; });
  await t.zu(bf.oben + (bf.h - 900) * 0.25); await t.warten(400);
  const mitte = await page.evaluate(() => Array.from(document.querySelectorAll('.bf-blatt img')).map(i => !!i.getAttribute('src')));
  t.gleich(mitte.join(','), 'true,true,true,false,false,false,false', 'bei 25 % sind die ersten drei geladen, die übrigen warten');
});

pruefung('blattfolge: ohne Bewegung eine ruhige Reihe', 'beide', async (page, t) => {
  const r = await page.evaluate(() => {
    const bf = document.getElementById('blattfolge');
    return { stand: bf.dataset.stand, lage: getComputedStyle(bf.querySelector('.bf-buehne')).position,
      deck: Array.from(bf.querySelectorAll('.bf-blatt')).map(el => getComputedStyle(el).opacity) };
  });
  t.gleich(r.stand, 'still', 'Stand'); t.gleich(r.lage, 'static', 'Bühne klebt nicht'); t.ok(r.deck.every(o => o === '1'), 'alle Blätter sichtbar: ' + r.deck.join(','));
}, { ruhig: true });

/* Die Tropfspur (js/tropfspur.js, aus PR #2): ein Canvas, nur so breit wie die Spur, der
   Tropfen läuft dem Lesen nach und nie zurück, die Spur trocknet vor dem Atelier (auf dem
   Telefon vor „Aktuell“) und läuft am rechten Rand, nicht durch den Text. */
const spurZustand = page => page.evaluate(() => {
  const T = window.LUKE.tropfspur, s = T.zustand(), cv = document.getElementById('tropfspur');
  const r = cv.getBoundingClientRect(), fig = document.querySelector('.hero-fig').getBoundingClientRect();
  const wrap = document.querySelector('#werke .wrap').getBoundingClientRect();
  const lage = id => { const el = document.getElementById(id); return el && !el.hidden ? el.getBoundingClientRect().top + scrollY : null; };
  const insta = document.querySelector('.foot-row a[href*="instagram"]');
  const x = f => T.xBei(s.quelle.y + f * s.strecke);
  /* Wie viele Pixel das Canvas im Fenster rot färbt: Die Spur soll zu sehen sein. */
  /* Auf eine Kopie gelesen, nicht auf das Canvas der Seite: Mehrfaches Zurücklesen dort
     kostet den Browser und landet als Warnung in der Konsole. */
  let daten = [];
  if (cv.width && cv.height) { const k = document.createElement('canvas'); k.width = cv.width; k.height = cv.height; const c2 = k.getContext('2d', { willReadFrequently: true }); c2.drawImage(cv, 0, 0); daten = c2.getImageData(0, 0, k.width, k.height).data; }
  let farbig = 0; for (let i = 3; i < daten.length; i += 4) if (daten[i] > 20) farbig++;
  return Object.assign(s, { x50: x(0.5), x95: x(0.95), strangX: fig.left + scrollX + fig.width * 0.705, figUnten: fig.bottom + scrollY,
    wrapRechts: wrap.right + scrollX, fenster: innerWidth, cvLinks: r.left, cvRechts: r.right, blend: getComputedStyle(cv).mixBlendMode,
    atelier: lage('atelier'), aktuell: lage('aktuell'), instaRechts: insta ? insta.getBoundingClientRect().right + scrollX : null, farbig });
});

pruefung('tropfspur: hängt am Strang, läuft am Rand, trocknet vor dem Atelier', 'beide', async (page, t) => {
  await t.durchscrollen();
  /* Der Tropfen läuft höchstens 26 px je Bild nach; bis er unten ist, dauert es. */
  const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await t.zu(H); await t.warten(t.mobil ? 4000 : 8000);
  const r = await spurZustand(page);
  t.ok(r.aktiv && !r.statisch, 'Spur aktiv und in Bewegung');
  t.ok(Math.abs(r.quelle.x - r.strangX) < 2, 'Ansatz am Strang: ' + Math.round(r.quelle.x) + ' statt ' + Math.round(r.strangX));
  t.ok(Math.abs(r.quelle.y - r.figUnten) < 2, 'Ansatz an der Unterkante des Blatts: ' + Math.round(r.quelle.y) + ' statt ' + Math.round(r.figUnten));
  t.ok(r.cvLinks >= 0 && r.cvRechts <= r.fenster + 0.5, 'Canvas bleibt im Fenster: ' + Math.round(r.cvLinks) + '–' + Math.round(r.cvRechts));
  t.ok(r.breite < 200, 'Canvas nur so breit wie die Spur: ' + r.breite);
  t.gleich(r.blend, 'multiply', 'liegt mit multiply auf dem Papier');
  if (t.mobil) {
    t.ok(r.aktuell == null || Math.abs(r.ende - (r.aktuell - 6)) < 2, 'endet an der Kante von „Aktuell“: ' + Math.round(r.ende) + ' bei ' + r.aktuell);
    /* Der Rinnstein unter 900 px ist nur die 16 px Innenabstand der .wrap. */
    for (const [anteil, wert] of [[0.5, r.x50], [0.95, r.x95]]) t.ok(wert >= r.fenster - 13 && wert <= r.fenster - 3, 'Spur bleibt im Rand bei ' + anteil + ': ' + Math.round(wert));
  } else {
    t.ok(Math.abs(r.ende - (r.atelier - 6)) < 2, 'trocknet vor dem Atelier: ' + Math.round(r.ende) + ' bei ' + Math.round(r.atelier));
    t.ok(r.x50 >= r.wrapRechts + 20 && r.x50 <= r.fenster - 10, 'Spur rechts neben dem Inhalt: ' + Math.round(r.x50) + ' bei Kante ' + Math.round(r.wrapRechts));
    t.ok(Math.abs(r.x95 - r.x50) < 40, 'Spur bleibt am Rand');
  }
  t.ok(r.spitze > 0.99, 'der Tropfen ist unten angekommen: ' + r.spitze.toFixed(3));
  await t.zu(H * 0.3); await t.warten(600);
  const oben = await spurZustand(page);
  t.ok(oben.farbig > 300, 'die Spur ist im Fenster zu sehen: ' + oben.farbig + ' Pixel');
  t.ok(oben.spitze > 0.99, 'wer zurückscrollt, sieht, was gelaufen ist; nichts zieht sich zurück: ' + oben.spitze.toFixed(3));
  await t.bild('tropfspur-oben');
});

pruefung('tropfspur: der Tropfen staut, wo man steht, die Stauung bleibt zurück', 'schreibtisch', async (page, t) => {
  const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  /* Langsam hinlesen, dann stehen: Der Tropfen holt auf und schwillt an. */
  for (let y = 0; y <= H * 0.2; y += 150) { await t.zu(y); await t.warten(30); }
  await t.warten(4500);
  const a = await spurZustand(page);
  t.ok(a.spitze > 0.05 && a.spitze < 0.4, 'Tropfen steht bei gut einem Fünftel der Seite: ' + a.spitze.toFixed(3));
  t.ok(a.pool > a.poolMax * 0.6, 'der Tropfen staut sich beim Verweilen: ' + a.pool.toFixed(2) + ' von ' + a.poolMax);
  const vorher = a.stauungen;
  /* Weiterlesen: Die Stauung bleibt als Verdickung zurück, der Tropfen wird wieder schlank. */
  for (let y = H * 0.2; y <= H * 0.3; y += 150) { await t.zu(y); await t.warten(30); }
  await t.warten(2500);
  const b = await spurZustand(page);
  t.ok(b.stauungen > vorher, 'eine Stauung mehr nach dem Weiterlesen: ' + vorher + ' → ' + b.stauungen);
  t.ok(b.spitze > a.spitze + 0.03, 'der Tropfen ist weitergelaufen: ' + a.spitze.toFixed(3) + ' → ' + b.spitze.toFixed(3));
  await t.bild('tropfspur-stau');
});

pruefung('tropfspur: ohne Bewegung steht sie fertig da', 'beide', async (page, t) => {
  const r = await spurZustand(page);
  t.ok(r.statisch && r.aktiv, 'Endzustand statt Reise');
  t.gleich(r.spitze, 1, 'die ganze Spur');
  t.ok(r.stauungen >= 2, 'mit ein paar Stauungen: ' + r.stauungen);
}, { ruhig: true });

/* Die Hängung: vier Werke, zwei davon aus je drei Blättern. Alle Blätter stehen gleich hoch,
   die eines Werks nebeneinander; Filter gibt es nicht, weil es nur eine Serie und ein Jahr
   gibt. */
pruefung('werke: Hängung, alle gleich hoch, die Blätter eines Werks nebeneinander', 'beide', async (page, t) => {
  const r = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.g-item'));
    return {
      werke: items.map(el => el.dataset.fid + ':' + el.querySelectorAll('.g-blatt').length).join(','),
      hoehen: items.map(el => Array.from(el.querySelectorAll('.g-bild')).map(b => Math.round(b.getBoundingClientRect().height))),
      oben: items.map(el => Array.from(el.querySelectorAll('.g-bild')).map(b => Math.round(b.getBoundingClientRect().top))),
      breite: Math.max(...items.map(el => el.getBoundingClientRect().right)) - Math.min(...items.map(el => el.getBoundingClientRect().left)),
      spalte: document.querySelector('#werke .wrap').clientWidth,
      dreh: Array.from(document.querySelectorAll('.g-blatt')).slice(0, 3).map(el => getComputedStyle(el).getPropertyValue('--dreh').trim()).join('|'),
      eintritt: Array.from(document.querySelectorAll('.g-item[data-fid="w1"] .rv')).map(el => (el.dataset.eintritt || 'text') + el.dataset.versatz).join(','),
      filter: document.getElementById('werke-filter').hidden,
      titel: !!document.querySelector('#werke h2.hd'),
      zeile: document.querySelector('.g-item[data-fid="w1"] .g-m').textContent
    };
  });
  t.gleich(r.werke, 'w1:3,w2:3,w3:1,w4:1', 'Werke und ihre Blätter');
  const alle = r.hoehen.flat();
  t.ok(Math.max(...alle) - Math.min(...alle) <= 2 || t.mobil, 'alle Blätter gleich hoch: ' + JSON.stringify(r.hoehen));
  r.hoehen.forEach((h, i) => t.ok(Math.max(...h) - Math.min(...h) <= 1, 'Blätter eines Werks gleich hoch (' + i + '): ' + h.join(',')));
  r.oben.forEach((o, i) => t.ok(Math.max(...o) - Math.min(...o) <= 1, 'Blätter eines Werks auf einer Linie (' + i + '): ' + o.join(',')));
  t.ok(r.breite <= r.spalte - 20, 'die Hängung bleibt in der Spalte: ' + Math.round(r.breite) + ' / ' + r.spalte);
  t.gleich(r.dreh, '-1.1deg|0.8deg|1.4deg', '--dreh je Blatt');
  t.gleich(r.eintritt, 'blatt0,blatt1,blatt2,text3', 'die Blätter legen sich nacheinander ab, die Beschriftung zuletzt');
  t.ok(r.filter && r.titel, 'eine Serie, ein Jahr: Überschrift, kein Filter');
  t.gleich(r.zeile, 'Nr. I — Tusche auf Papier, drei Blätter, 2026', 'Zeile unter Werk I');
  await t.zu((await t.abschnitte()).find(a => a.id === 'werke').oben - 40); await t.warten(1800);
  await t.bild('werke-gehaengt');
});

/* Neuordnung des Speichers: zwölf Blätter, freigestellt, ohne das schwarze Holz; solange
   das Werk zu sehen ist, tauschen sie die Plätze. Ohne Bewegung bleibt die Ordnung. */
const ordnung = page => page.evaluate(() => Array.from(document.querySelectorAll('.g-item[data-fid="w4"] .kachel')).map(k => k.style.getPropertyValue('--sx') + k.style.getPropertyValue('--sy')).join(' '));
pruefung('neuordnung: zwölf Blätter ohne Holz, sie tauschen die Plätze', 'schreibtisch', async (page, t) => {
  const r = await page.evaluate(() => {
    const k = document.querySelector('.g-item[data-fid="w4"] .kacheln');
    return { n: k ? k.querySelectorAll('.kachel').length : 0, bogen: k ? getComputedStyle(k.querySelector('.kachel')).backgroundImage : '',
      blend: k ? getComputedStyle(k).mixBlendMode : '' };
  });
  t.gleich(r.n, 12, 'zwölf Blätter');
  t.ok(/werk-neuordnung-des-speichers-\d+\.webp/.test(r.bogen), 'jedes Blatt ein Ausschnitt aus dem Bildbogen: ' + r.bogen);
  t.gleich(r.blend, 'multiply', 'liegt mit multiply auf dem Papier, kein dunkler Grund mehr');
  /* Der Bildbogen hat weiße Ecken: Das Holz ist weg. */
  const ecke = await page.evaluate(async () => {
    const img = new Image(); img.src = 'assets/img/werk-neuordnung-des-speichers-480.webp'; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
    return Array.from(x.getImageData(2, 2, 1, 1).data).slice(0, 3);
  });
  t.ok(ecke.every(v => v > 240), 'Ecke des Bildbogens ist weiß: ' + ecke.join(','));
  const vorher = await ordnung(page);
  await t.zu((await t.abschnitte()).find(a => a.id === 'werke').oben + 1400); await t.warten(300);
  await page.evaluate(() => document.querySelector('.g-item[data-fid="w4"]').scrollIntoView({ block: 'center' }));
  await page.mouse.move(2, 2);
  await t.warten(8000);
  const nachher = await ordnung(page);
  t.ok(nachher !== vorher, 'die Blätter haben die Plätze getauscht: ' + vorher + ' → ' + nachher);
  t.gleich(nachher.split(' ').sort().join(' '), vorher.split(' ').sort().join(' '), 'dieselben zwölf, nur anders geordnet');
  const haengt = await page.evaluate(() => Array.from(document.querySelectorAll('.kachel')).filter(k => k.style.transform && k.style.transform !== 'none').length);
  await t.warten(1200);
  await t.bild('neuordnung');
  t.ok(haengt <= 2, 'höchstens die zwei, die gerade tauschen, sind unterwegs: ' + haengt);
});

pruefung('neuordnung: ohne Bewegung bleibt die Ordnung', 'schreibtisch', async (page, t) => {
  const vorher = await ordnung(page);
  await page.evaluate(() => document.querySelector('.g-item[data-fid="w4"]').scrollIntoView({ block: 'center' }));
  await t.warten(6000);
  t.gleich(await ordnung(page), vorher, 'Ordnung unverändert');
}, { ruhig: true });

pruefung('werke: Hover hebt das Bildfeld, nicht mehr', 'schreibtisch', async (page, t) => {
  await t.zu((await t.abschnitte()).find(a => a.id === 'werke').oben - 40); await t.warten(1600);
  const box = await page.locator('.g-blatt').first().boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await t.warten(800);
  const tf = await page.evaluate(() => document.querySelector('.g-blatt .g-bild').style.transform);
  t.ok(/translateY\(-(3|4)(\.\d+)?px\)/.test(tf), 'Bildfeld hebt sich um 4 px: ' + JSON.stringify(tf));
  const knopf = await page.evaluate(() => document.querySelector('.g-blatt').style.transform);
  t.ok(!knopf || knopf === 'none', 'der Knopf selbst bleibt, wo er ist: ' + JSON.stringify(knopf));
  await page.mouse.move(2, 2); await t.warten(800);
  const tf2 = await page.evaluate(() => document.querySelector('.g-blatt .g-bild').style.transform);
  /* Eine Feder nähert sich der Ruhelage nur asymptotisch; Motion friert kurz davor ein
     (beobachtet: z. B. translateY(-0.00122px)). Ein Rest von Tausendstel Pixeln ist die
     Ruhelage, kein hängengebliebener Hub — den Unterschied macht die Größenordnung. */
  t.ok(!tf2 || /translateY\(-?0(\.\d+)?px\)|^none$/.test(tf2), 'senkt sich wieder: ' + JSON.stringify(tf2));
});

pruefung('werkansicht: öffnet vom Blatt, blättert Blatt für Blatt, schließt zum letzten Blatt zurück', 'beide', async (page, t) => {
  await t.zu((await t.abschnitte()).find(a => a.id === 'werke').oben - 40); await t.warten(1600);
  await page.click('.g-item[data-fid="w1"] .g-blatt[data-teil="0"]'); await t.warten(120);
  const flug = await page.evaluate(() => { const f = document.getElementById('ov-fig'); return f ? f.style.transform : null; });
  t.ok(flug && /translate|scale|matrix/.test(flug), 'das Bild fliegt vom Blatt aus: ' + JSON.stringify(flug));
  await t.warten(1000);
  const lesen = () => page.evaluate(() => ({
    da: !!document.getElementById('ov'), fokus: document.activeElement && document.activeElement.id,
    fig: document.getElementById('ov-fig') && document.getElementById('ov-fig').style.transform,
    rows: document.querySelector('.ov-rows') && getComputedStyle(document.querySelector('.ov-rows')).opacity,
    titel: (document.querySelector('.ov-info h3') || {}).textContent,
    zaehler: (document.querySelector('.ov-zaehler') || {}).textContent,
    teile: Array.from(document.querySelectorAll('.ov-teil')).map(b => b.getAttribute('aria-pressed')).join(','),
    bild: (document.querySelector('#ov-fig img') || {}).currentSrc || '',
    oben: document.querySelector('.ov-card') ? document.querySelector('.ov-card').scrollTop : -1
  }));
  const offen = await lesen();
  t.ok(offen.da, 'Werkansicht offen'); t.gleich(offen.fokus, 'ov-close', 'Fokus auf Schließen');
  t.gleich(offen.fig, '', 'Bild am Platz, transform geleert'); t.gleich(offen.rows, '1', 'Zeilen sichtbar');
  t.gleich(offen.zaehler, 'Bild 1 von 3', 'zählt die Blätter des Werks'); t.gleich(offen.teile, 'true,false,false', 'Blattleiste');
  t.ok(/werk-befreiung-1-bild-1-\d+\.webp$/.test(offen.bild), 'zeigt das erste Blatt: ' + offen.bild);
  t.gleich(offen.oben, 0, 'die Karte steht oben, der Fokus hat sie nicht gescrollt');
  await t.bild('werkansicht');
  await page.keyboard.press('ArrowRight'); await t.warten(800);
  let r = await lesen();
  t.gleich(r.zaehler, 'Bild 2 von 3', 'weiter zum zweiten Blatt'); t.gleich(r.titel, 'Befreiung der Körperlichkeit, Werk I', 'noch Werk I');
  await page.click('.ov-teil[data-teil="2"]'); await t.warten(800);
  r = await lesen();
  t.gleich(r.teile, 'false,false,true', 'Sprung über die Blattleiste');
  await page.keyboard.press('ArrowRight'); await t.warten(800);
  r = await lesen();
  t.gleich(r.titel, 'Befreiung der Körperlichkeit, Werk II', 'nach dem letzten Blatt kommt das nächste Werk');
  t.gleich(r.zaehler, 'Bild 1 von 3', 'dort beim ersten Blatt');
  await page.keyboard.press('ArrowLeft'); await t.warten(800); await page.keyboard.press('ArrowRight'); await t.warten(800);
  await page.keyboard.press('Escape'); await t.warten(100);
  t.ok(await page.evaluate(() => !!document.getElementById('ov')), 'beim Schließen bleibt der Dialog, bis die Bewegung zu Ende ist');
  await t.warten(1000);
  const zu = await page.evaluate(() => { const a = document.activeElement; return { da: !!document.getElementById('ov'), klasse: a && a.className, werk: a && a.closest('.g-item') && a.closest('.g-item').dataset.fid, teil: a && a.dataset.teil }; });
  t.ok(!zu.da, 'Werkansicht geschlossen');
  t.ok(/g-blatt/.test(zu.klasse || '') && zu.werk === 'w2' && zu.teil === '0', 'Fokus auf dem Blatt, das zuletzt gezeigt wurde: ' + JSON.stringify(zu));
});

/* Elf Arbeiten an der Plakatwand: jede Reihe bündig, alles in einer Reihe gleich hoch; die
   letzte Reihe darf kürzer sein, wird aber nicht aufgeblasen. */
pruefung('grafik: elf Arbeiten, Reihen gleich hoch und bündig', 'beide', async (page, t) => {
  const r = await page.evaluate(() => {
    const karten = Array.from(document.querySelectorAll('.gr-item .gr-ph')).map(el => el.getBoundingClientRect());
    const reihen = [];
    karten.forEach(k => { const z = reihen.find(x => Math.abs(x.top - k.top) < 2); if (z) z.k.push(k); else reihen.push({ top: k.top, k: [k] }); });
    const spalte = document.getElementById('grafik-list').getBoundingClientRect();
    return { n: karten.length, reihen: reihen.map(z => ({ hoehen: z.k.map(k => Math.round(k.height)), rechts: Math.round(Math.max(...z.k.map(k => k.right))) })), rechts: Math.round(spalte.right) };
  });
  t.gleich(r.n, 11, 'Arbeiten');
  r.reihen.forEach((z, i) => t.ok(Math.max(...z.hoehen) - Math.min(...z.hoehen) <= 1, 'Reihe ' + (i + 1) + ' gleich hoch: ' + z.hoehen.join(',')));
  r.reihen.slice(0, -1).forEach((z, i) => t.ok(Math.abs(z.rechts - r.rechts) <= 2, 'Reihe ' + (i + 1) + ' bündig: ' + z.rechts + ' / ' + r.rechts));
  const letzte = r.reihen[r.reihen.length - 1].hoehen[0], erste = r.reihen[0].hoehen[0];
  t.ok(letzte <= erste * 1.25, 'die letzte Reihe ist nicht aufgeblasen: ' + letzte + ' bei ' + erste);
  await t.zu((await t.abschnitte()).find(a => a.id === 'grafik').oben - 40); await t.warten(1600);
  await t.bild('grafik-wand');
});

/* Jedes Bild, das die Seite nennt, kommt auch an: kein Tippfehler in einem Namen, keine
   vergessene Breite. Geprüft nach dem Durchscrollen, damit auch spät geladene dabei sind. */
pruefung('bilder: jedes Bild lädt, alle als WebP aus assets/img', 'schreibtisch', async (page, t) => {
  await t.durchscrollen(); await t.warten(1500);
  const r = await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('#auftakt img, #werke img, #grafik img, #atelier img, #blattfolge img'));
    imgs.forEach(i => { i.loading = 'eager'; });
    await Promise.all(imgs.map(i => i.complete ? null : new Promise(ok => { i.onload = i.onerror = ok; })));
    return imgs.map(i => ({ src: i.currentSrc || i.src, w: i.naturalWidth }));
  });
  const kaputt = r.filter(x => !x.w);
  t.ok(r.length >= 25, 'Bilder gefunden: ' + r.length);
  t.ok(!kaputt.length, 'Bilder ohne Inhalt: ' + kaputt.map(x => x.src).join(', '));
  /* Werke, Grafik und Gestaltung tragen die Breite im Namen; die Teile der Handschrift
     (Signatur, Bildfolge, Auge) liegen unter assets/img/signatur/ und haben nur eine Größe. */
  const muster = /\/assets\/img\/([a-z0-9-]+-\d+|signatur\/[a-z0-9-]+)\.webp$/;
  t.ok(r.every(x => muster.test(x.src)), 'nur WebP aus assets/img: ' + r.filter(x => !muster.test(x.src)).map(x => x.src).join(', '));
});

/* Die Handschrift als Bildfolge: Die Signatur schreibt sich beim Scrollen, danach blickt
   das Auge dem Zeiger nach. Auf dem Telefon, ohne Maus, sieht es sich von selbst um. */
pruefung('handschrift: die Signatur schreibt sich, dann folgt das Auge dem Zeiger', 'beide', async (page, t) => {
  const fig = await page.evaluate(() => { const r = document.querySelector('.band-fig').getBoundingClientRect(); return { oben: r.top + scrollY, h: r.height }; });
  const vh = await page.evaluate(() => innerHeight);
  /* Langsam heran: Die Bilder laden der Reihe nach, die Folge läuft mit. */
  for (let y = fig.oben - vh; y <= fig.oben - vh * 0.2; y += 80) { await t.zu(y); await t.warten(60); }
  await t.warten(1500);
  const r = await page.evaluate(() => {
    const cv = document.querySelector('.band-folge'), k = document.createElement('canvas');
    k.width = cv.width; k.height = cv.height;
    const c = k.getContext('2d', { willReadFrequently: true }); c.drawImage(cv, 0, 0);
    const d = c.getImageData(0, 0, k.width, k.height).data;
    let dunkel = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] < 200) dunkel++;
    const auge = window.LUKE.auge.zustand();
    return { lebt: document.querySelector('.band-rahmen').classList.contains('lebt'), dunkel, anteil: dunkel / (k.width * k.height),
      video: document.querySelectorAll('#handschrift video').length, geladen: auge.geladen, band: auge.augen[1],
      blend: getComputedStyle(cv).mixBlendMode, depth: document.querySelector('.band-fig').hasAttribute('data-depth') };
  });
  t.ok(r.lebt, 'die Bildfolge steht statt des Standbilds');
  t.gleich(r.video, 0, 'kein Video mehr in der Handschrift');
  t.ok(r.anteil > 0.04 && r.anteil < 0.5, 'auf dem Canvas steht die Zeichnung: ' + (r.anteil * 100).toFixed(1) + ' % dunkel');
  t.gleich(r.blend, 'multiply', 'liegt mit multiply auf dem Grund');
  t.ok(!r.depth, 'keine Parallaxe auf der Figur, sonst stünde sie als weißer Kasten da');
  t.ok(r.geladen && r.band && r.band.an, 'das Auge ist wach, sobald die Signatur geschrieben ist: ' + JSON.stringify(r.band));
  if (!t.mobil) {
    const box = await page.evaluate(() => { const b = document.querySelector('.band-folge').getBoundingClientRect(); return { l: b.left, t: b.top, w: b.width, h: b.height }; });
    await page.mouse.move(box.l + 10, box.t + box.h / 2); await t.warten(900);
    const links = await page.evaluate(() => window.LUKE.auge.zustand().augen[1]);
    await page.mouse.move(box.l + box.w - 2, Math.max(4, box.t - 160)); await t.warten(900);
    const rechts = await page.evaluate(() => window.LUKE.auge.zustand().augen[1]);
    t.ok(links.x < -5, 'blickt nach links zum Zeiger: ' + links.x);
    t.ok(rechts.x > 3 && rechts.y < -1, 'blickt nach rechts oben zum Zeiger: ' + rechts.x + ', ' + rechts.y);
    await t.bild('handschrift-auge');
  } else {
    const a = await page.evaluate(() => window.LUKE.auge.zustand().augen[1]);
    await t.warten(4500);
    const b = await page.evaluate(() => window.LUKE.auge.zustand().augen[1]);
    t.ok(Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 0.5, 'ohne Maus sieht es sich um: ' + JSON.stringify([a, b]));
  }
});

/* Das Auge in der Kopfleiste: klein, vor dem Namen, immer da, und es blickt mit. */
pruefung('auge: sitzt in der Kopfleiste, bleibt beim Scrollen, folgt dem Zeiger', 'beide', async (page, t) => {
  await t.warten(1500);
  const a = await page.evaluate(() => { const cv = document.querySelector('.top .nav-auge'), r = cv.getBoundingClientRect();
    return { da: cv.classList.contains('da'), b: r.width, h: r.height, op: getComputedStyle(cv).opacity, top: getComputedStyle(document.querySelector('.top')).position }; });
  t.ok(a.da && a.op === '1', 'das Auge ist geladen und eingeblendet');
  t.ok(a.b > 30 && a.b < 70, 'klein, so hoch wie zwei Zeilen: ' + a.b + ' × ' + a.h);
  t.gleich(a.top, 'sticky', 'die Kopfleiste bleibt oben stehen, auch auf dem Telefon');
  await t.zu(4000); await t.warten(400);
  const oben = await page.evaluate(() => { const r = document.querySelector('.top .nav-auge').getBoundingClientRect(); return { top: r.top, sichtbar: window.LUKE.auge.zustand().augen[0].sichtbar }; });
  t.ok(oben.top >= 0 && oben.top < 40 && oben.sichtbar, 'nach dem Scrollen noch oben zu sehen: ' + JSON.stringify(oben));
  if (!t.mobil) {
    await page.mouse.move(1400, 880); await t.warten(900);
    const z = await page.evaluate(() => window.LUKE.auge.zustand().augen[0]);
    t.ok(z.x > 5 && z.y > 2, 'blickt nach rechts unten zum Zeiger: ' + z.x + ', ' + z.y);
  }
});

pruefung('auge: ohne Bewegung steht es still und blickt geradeaus', 'schreibtisch', async (page, t) => {
  await t.warten(1500);
  const r = await page.evaluate(() => ({ z: window.LUKE.auge.zustand(), standbild: getComputedStyle(document.querySelector('.band-standbild')).visibility }));
  await page.mouse.move(1400, 880); await t.warten(600);
  const n = await page.evaluate(() => window.LUKE.auge.zustand().augen[0]);
  t.ok(r.z.geladen, 'die Teile sind geladen');
  t.ok(n.x === 0 && n.y === 0, 'blickt geradeaus: ' + JSON.stringify(n));
  t.gleich(r.standbild, 'visible', 'die Handschrift steht als Standbild');
}, { ruhig: true });

pruefung('abschnitte: Linien wachsen, das Foto wächst, das Band folgt', 'schreibtisch', async (page, t) => {
  const vorher = await page.evaluate(() => ({
    aktuell: getComputedStyle(document.getElementById('aktuell')).getPropertyValue('--strich').trim()
  }));
  t.gleich(vorher.aktuell, '0', 'die Linien von Aktuell warten');
  await t.durchscrollen(); await t.warten(2000);
  const nachher = await page.evaluate(() => ({
    aktuell: getComputedStyle(document.getElementById('aktuell')).getPropertyValue('--strich').trim(),
    foto: getComputedStyle(document.querySelector('.atelier-rahmen img')).transform,
    band: { lebt: document.querySelector('.band-rahmen').classList.contains('lebt'), auge: window.LUKE.auge.zustand().augen[1] },
    text: Array.from(document.querySelectorAll('#aktuell .rv')).every(el => el.classList.contains('on'))
  }));
  t.gleich(nachher.aktuell, '1', 'die Linien von Aktuell sind gewachsen');
  t.ok(nachher.text, 'Aktuell-Text enthüllt');
  t.ok(/matrix\(1\.0[0-9]/.test(nachher.foto), 'das Foto ist scrollgebunden gewachsen: ' + nachher.foto);
  t.ok(nachher.band.lebt, 'die Handschrift zeichnet ihre Bildfolge');
});

/* Die Seite ist eine Werkschau. Was zum Tätowieren gehörte — Anfrage, Ablauf, Flash, der
   Träger „Haut“, das Team des Studios —, ist raus und soll nicht zurückkommen. */
pruefung('werkschau: keine Anfrage, kein Flash, keine Haut, kein Tattoo', 'beide', async (page, t) => {
  const r = await page.evaluate(() => ({
    teile: ['anfrage', 'flash', 'studio', 'tr-tabs', 'af-form'].filter(id => document.getElementById(id)),
    nav: Array.from(document.querySelectorAll('.top a')).filter(a => !a.hidden).map(a => (a.querySelector('img') ? a.querySelector('img').alt : a.textContent).trim()).join(','),
    text: /tätow|tattoo|walk-in|blackwork|körperstelle|sitzung/i.exec(document.body.innerText + ' ' + document.title + ' ' + (document.querySelector('meta[name="description"]') || {}).content),
    formular: document.querySelectorAll('form, input, textarea, select').length
  }));
  t.gleich(r.teile.join(','), '', 'Abschnitte, die es nicht mehr gibt');
  /* „Aktuell“ verschwindet nach dem 27. September von selbst. */
  t.ok(/^Luke WTF,(Aktuell,)?Werke,Grafik,Atelier$/.test(r.nav), 'Navigation: ' + r.nav);
  t.ok(!r.text, 'kein Wort vom Tätowieren: ' + (r.text && r.text[0]));
  t.gleich(r.formular, 0, 'kein Formular');
});

for (const r of ['b', 'c']) {
  pruefung(`richtung ${r}: alles kommt, Konsole leer`, 'beide', async (page, t) => {
    await t.durchscrollen(); await t.warten(2200);
    const fehlt = await page.evaluate(() => Array.from(document.querySelectorAll('.rv')).filter(el => {
      if (el.closest('[hidden]')) return false;
      const r = el.getBoundingClientRect();
      if (r.right <= 0 || r.left >= innerWidth) return false;
      /* Nicht auf genau 1 prüfen: Richtung B dimmt das Handschriftvideo dauerhaft auf
         0.9 (.app[data-richtung="b"] .band-rahmen, aus dem ursprünglichen Prototyp, nicht
         Teil dieses Umbaus). Enthüllt ist enthüllt, auch wenn die Ruhelage nicht 1 heißt —
         hängengeblieben ist nur, was noch nahe der versteckten Deckkraft 0 steht. */
      return !el.classList.contains('on') || parseFloat(getComputedStyle(el).opacity) < 0.5;
    }).length);
    t.gleich(fehlt, 0, 'nicht enthüllt');
    await t.zu(0); await t.warten(600); await t.bild('richtung-' + r + '-oben');
    await t.zu((await t.abschnitte()).find(a => a.id === 'werke').oben - 40); await t.warten(1200); await t.bild('richtung-' + r + '-werke');
  }, { abfrage: '?richtung=' + r });
}

pruefung('richtung c: die Schräglage der Plakate übersteht den Hover', 'schreibtisch', async (page, t) => {
  await t.zu((await t.abschnitte()).find(a => a.id === 'grafik').oben - 40); await t.warten(600);
  const dreh = i => page.evaluate(i => getComputedStyle(document.querySelectorAll('.gr-item')[i].querySelector('.gr-ph')).rotate, i);
  const vorher = await dreh(1);
  t.ok(vorher && vorher !== 'none', 'zweites Plakat ist in Richtung C nicht schräg: ' + vorher);
  const box = await page.locator('.gr-item').nth(1).locator('.gr-ph').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await t.warten(400);
  await page.mouse.move(2, 2); await t.warten(1000);
  /* css/site.css setzte die Schräge früher über transform: rotate(...) auf .gr-ph, demselben
     Element, auf dem B.heben() (js/site.js, renderGrafik()) beim Hover transform: translateY
     schreibt und translateY(0px) hinterlässt. Seither steht die Schräge in der Einzeleigenschaft
     rotate, die Motion nie anfasst. */
  const nachher = await dreh(1);
  t.gleich(nachher, vorher, 'Plakat liegt nach dem Hover gerade: ' + nachher + ' statt ' + vorher);
  await t.bild('richtung-c-grafik');
}, { abfrage: '?richtung=c' });

pruefung('bedienfeld: Bewegung aus zeigt alles, die Blattfolge wird eine Reihe', 'schreibtisch', async (page, t) => {
  await page.click('[data-set="bewegung"][data-val="aus"]'); await t.warten(400);
  const r = await page.evaluate(() => ({
    fehlt: Array.from(document.querySelectorAll('.rv')).filter(el => { if (el.closest('[hidden]')) return false; const r = el.getBoundingClientRect(); return !(r.right <= 0 || r.left >= innerWidth) && getComputedStyle(el).opacity !== '1'; }).length,
    stand: document.getElementById('blattfolge').dataset.stand,
    spur: window.LUKE.tropfspur.zustand()
  }));
  t.gleich(r.fehlt, 0, 'alles sichtbar'); t.gleich(r.stand, 'still', 'Blattfolge still');
  t.ok(r.spur.statisch && r.spur.spitze === 1, 'die Spur steht fertig da');
  await page.click('[data-set="bewegung"][data-val="voll"]'); await t.warten(400);
  t.gleich(await page.evaluate(() => document.getElementById('blattfolge').dataset.stand), 'voll', 'Blattfolge wieder voll');
}, { abfrage: '?proto' });

/* ---------- Lauf ---------- */
async function laufen() {
  fs.mkdirSync(AUSGABE, { recursive: true });
  const srv = await server();
  const browser = await chromium.launch();
  let fehler = 0, zahl = 0;
  const liste = PRUEFUNGEN.filter(p => !NUR || p.name.includes(NUR));
  for (const p of liste) {
    for (const f of (p.fenster === 'beide' ? ['schreibtisch', 'telefon'] : [p.fenster])) {
      const v = FENSTER[f];
      const ctx = await browser.newContext({
        viewport: { width: v.width, height: v.height }, deviceScaleFactor: 1,
        isMobile: !!v.mobil, hasTouch: !!v.mobil,
        reducedMotion: p.optionen.ruhig ? 'reduce' : 'no-preference'
      });
      const page = await ctx.newPage();
      const konsole = [];
      page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !TOLERIERT.some(re => re.test(m.text()))) konsole.push(m.type() + ': ' + m.text()); });
      page.on('pageerror', e => konsole.push('Fehler: ' + e.message));
      page.on('requestfailed', r => {
        const u = r.url(), text = (r.failure() || {}).errorText || '';
        /* Ein Video, das der Browser abbricht, weil er eine andere Quelle nimmt, ist kein Mangel. */
        if (/\.(mp4|webm)$/.test(u) && /ABORTED/.test(text)) return;
        konsole.push('Anfrage: ' + u + ' ' + text);
      });
      const maengel = [];
      const t = {
        f, v, mobil: !!v.mobil,
        ok(b, text) { if (!b) maengel.push(text); },
        gleich(a, b, text) { if (a !== b) maengel.push(`${text}: ${JSON.stringify(a)} statt ${JSON.stringify(b)}`); },
        warten: ms => page.waitForTimeout(ms),
        async zu(y) { await page.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y); await page.waitForTimeout(250); },
        /* Scrollt in Schritten von 70 Prozent der Fensterhöhe bis ganz unten und bleibt dort. */
        async durchscrollen() {
          const H = await page.evaluate(() => document.documentElement.scrollHeight);
          for (let y = 0; y < H; y += Math.round(v.height * 0.7)) { await page.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y); await page.waitForTimeout(140); }
          await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
          await page.waitForTimeout(300);
        },
        async bild(name) { if (!BILDER) return; await page.screenshot({ path: path.join(AUSGABE, `${name}-${f}.png`) }); },
        abschnitte: () => page.evaluate(() => Array.from(document.querySelectorAll('main > section, footer')).filter(s => !s.hidden).map(s => ({ id: s.id, oben: s.getBoundingClientRect().top + scrollY, hoehe: s.getBoundingClientRect().height })))
      };
      try {
        await page.goto(srv.url + 'index.html' + (p.optionen.abfrage || ''), { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);
        await p.lauf(page, t);
      } catch (e) { maengel.push('Ausnahme: ' + e.message); }
      if (konsole.length) maengel.push('Konsole nicht leer:\n      ' + konsole.join('\n      '));
      zahl++;
      console.log(`${maengel.length ? 'FEHLT' : 'ok   '} ${p.name} [${f}]`);
      for (const m of maengel) console.log('      - ' + m);
      if (maengel.length) fehler++;
      await ctx.close();
    }
  }
  await browser.close();
  srv.close();
  console.log(fehler ? `\n${fehler} von ${zahl} Prüfungen fehlgeschlagen.` : `\nAlle ${zahl} Prüfungen in Ordnung.`);
  process.exit(fehler ? 1 : 0);
}
laufen().catch(e => { console.error(e); process.exit(1); });
