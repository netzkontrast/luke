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
  t.gleich(r.tempo, 'ansicht,dauer,feder,kurve,kurz,versatz,wasch', 'Felder von tempo()');
  t.gleich(r.js, 'an', 'data-js im <head> gesetzt');
});

pruefung('enthuellen: unten ist vor dem Scrollen nichts zu sehen', 'schreibtisch', async (page, t) => {
  const op = await page.evaluate(() => getComputedStyle(document.querySelector('#studio .rv')).opacity);
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
    unten: getComputedStyle(document.querySelector('#studio .rv')).opacity,
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

pruefung('auftakt: vier Ebenen, Titel kommt, das Blatt steht am Ende', 'beide', async (page, t) => {
  const r1 = await page.evaluate(() => ({
    ebenen: document.querySelectorAll('.hero-fig .hero-ebene').length,
    fern: document.querySelectorAll('.hero-fig .hero-fern').length,
    buehne: !!document.getElementById('auftakt-buehne')
  }));
  t.gleich(r1.ebenen, 4, 'Ebenen'); t.gleich(r1.fern, 3, 'ferne Blätter'); t.ok(!r1.buehne, 'die Remotion-Bühne muss weg sein');
  await t.warten(1600);
  const r2 = await page.evaluate(() => ({
    h1: getComputedStyle(document.querySelector('.hero-text h1')).opacity,
    fern: +getComputedStyle(document.querySelector('.hero-fern')).opacity
  }));
  t.gleich(r2.h1, '1', 'Titel nach 1,6 s');
  t.ok(r2.fern > 0.05 && r2.fern < 0.2, 'ferne Ebene blass sichtbar: ' + r2.fern);
  await t.bild('auftakt-zeichnen');
  await t.warten(9200);
  const r3 = await page.evaluate(() => ({
    done: document.querySelector('.hero-fig').classList.contains('done'),
    still: getComputedStyle(document.querySelector('.hero-still')).opacity,
    video: getComputedStyle(document.querySelector('.hero-video')).opacity
  }));
  t.ok(r3.done, 'Auftakt nicht zu Ende: kein .done nach 10,8 s');
  t.gleich(r3.still, '1', 'Standbild am Ende');
  t.gleich(r3.video, '0', 'Video am Ende weg');
  await t.bild('auftakt-blatt');
});

pruefung('auftakt: ohne Bewegung steht sofort das Blatt', 'schreibtisch', async (page, t) => {
  const r = await page.evaluate(() => ({
    done: document.querySelector('.hero-fig').classList.contains('done'),
    still: getComputedStyle(document.querySelector('.hero-still')).opacity,
    video: getComputedStyle(document.querySelector('.hero-video')).display,
    h1: getComputedStyle(document.querySelector('.hero-text h1')).opacity,
    fern: +getComputedStyle(document.querySelector('.hero-fern')).opacity
  }));
  t.ok(r.done && r.still === '1' && r.video === 'none' && r.h1 === '1', 'Endzustand: ' + JSON.stringify(r));
  /* nurBild() setzte die fernen Ebenen früher auf volle Deckkraft statt auf --deck: drei
     übereinandergelegte Tuschekopien begruben die Zeichnung, obwohl der Vollbewegungs-Check
     oben dieselbe Ebene schon immer richtig prüfte. */
  t.ok(r.fern > 0.05 && r.fern < 0.2, 'ferne Ebene blass sichtbar, nicht voll aufgedeckt: ' + r.fern);
}, { ruhig: true });

pruefung('auftakt: ?bewegung=aus steht sofort am Ende, ohne dass das Video läuft', 'schreibtisch', async (page, t) => {
  const r = await page.evaluate(() => {
    const v = document.querySelector('.hero-video');
    return {
      done: document.querySelector('.hero-fig').classList.contains('done'),
      still: getComputedStyle(document.querySelector('.hero-still')).opacity,
      videoZeit: v.currentTime,
      videoDisplay: getComputedStyle(v).display,
      fern: +getComputedStyle(document.querySelector('.hero-fern')).opacity
    };
  });
  /* Ohne diesen Lauf blieb unbemerkt, dass ?bewegung=aus den Auftakt gar nicht erreichte
     (js/bewegung.js löste die Adresse zu spät auf) und die Öffnung trotzdem mit voller
     Wucht lief. */
  t.ok(r.done, '.done fehlt bei ?bewegung=aus');
  t.gleich(r.still, '1', 'Standbild bei ?bewegung=aus');
  t.ok(r.videoZeit === 0 || r.videoDisplay === 'none', 'Video läuft trotz ?bewegung=aus: ' + JSON.stringify(r));
  t.ok(r.fern > 0.05 && r.fern < 0.2, 'ferne Ebene blass sichtbar bei ?bewegung=aus: ' + r.fern);
}, { abfrage: '?bewegung=aus' });

pruefung('bewegung: ?bewegung=dezent setzt die Stärke auf 0,55', 'schreibtisch', async (page, t) => {
  t.gleich(await page.evaluate(() => window.LUKE.bewegung.m()), 0.55, 'Stärke bei ?bewegung=dezent');
}, { abfrage: '?bewegung=dezent' });

pruefung('blattfolge: fünf Blätter, eins zur Zeit, das letzte bleibt', 'beide', async (page, t) => {
  const r = await page.evaluate(() => {
    const bf = document.getElementById('blattfolge');
    return { stand: bf && bf.dataset.stand, n: bf ? bf.querySelectorAll('.bf-blatt').length : 0,
      h: bf ? bf.getBoundingClientRect().height : 0, oben: bf ? bf.getBoundingClientRect().top + scrollY : 0,
      vh: innerHeight, alt: !!document.querySelector('werk-sequenz, canvas') };
  });
  t.gleich(r.stand, 'voll', 'Stand'); t.gleich(r.n, 5, 'Blätter'); t.ok(!r.alt, 'kein <werk-sequenz>, kein Canvas mehr');
  t.ok(r.h >= r.vh * (t.mobil ? 3.9 : 4.3), 'Abschnitt zu niedrig: ' + Math.round(r.h) + ' bei ' + r.vh);
  const strecke = r.h - r.vh;
  const deck = () => page.evaluate(() => Array.from(document.querySelectorAll('.bf-blatt')).map(el => +getComputedStyle(el).opacity));
  const transformVon = (sel, i) => page.evaluate(([sel, i]) => getComputedStyle(document.querySelectorAll(sel)[i]).transform, [sel, i]);
  const ruhe = v => v === 'none' || v === 'matrix(1, 0, 0, 1, 0, 0)';
  /* Motion fuhr transform früher als getrennte y/rotate/scale-Werte, gebunden über
     M.scroll(), und hielt dabei keine Zwischenstufe: Ein Blatt konnte bei voller Deckkraft
     trotzdem auf seinem Austrittswert stehen bleiben (js/blattfolge.js, tf()). Deshalb hier
     nicht nur die Deckkraft prüfen, sondern an zwei Stellen auch die Ruhelage selbst — und
     dass ein transform-String läuft, nicht mehr einzelne Werte. */
  await t.zu(r.oben + strecke * 0.1); await t.warten(300);
  let s = await deck();
  t.ok(s[0] > 0.95, 'bei 10 % steht das erste Blatt: ' + s[0]);
  const tf0 = await transformVon('.bf-blatt', 0);
  t.ok(ruhe(tf0), 'erstes Blatt bei 10 % nicht in Ruhelage: ' + tf0);
  await t.zu(r.oben + strecke * 0.3); await t.warten(300);
  s = await deck();
  t.ok(s[1] > 0.95 && s.filter(v => v > 0.05).length === 1, 'bei 30 % genau das zweite Blatt: ' + s.map(v => v.toFixed(2)).join(','));
  const tf1 = await transformVon('.bf-blatt', 1);
  t.ok(ruhe(tf1), 'zweites Blatt bei 30 % nicht in Ruhelage: ' + tf1);
  const schriftTf1 = await transformVon('.bf-schrift', 1);
  t.ok(ruhe(schriftTf1), 'Beschriftung des zweiten Blatts bei 30 % nicht in Ruhelage: ' + schriftTf1);
  const nativ = await page.evaluate(() => document.querySelectorAll('.bf-blatt')[1].getAnimations().some(a => 'transform' in a.effect.getKeyframes()[0]));
  t.ok(nativ, 'transform läuft nicht nativ auf der ScrollTimeline (getAnimations() ohne transform-Keyframes)');
  await t.bild('blattfolge-zweites');
  await t.zu(r.oben + strecke * 0.58); await t.warten(300);
  await t.bild('blattfolge-uebergang');
  await t.zu(r.oben + strecke); await t.warten(300);
  s = await deck();
  t.ok(s[4] > 0.95, 'das letzte Blatt bleibt stehen: ' + s[4]);
  const schrift = await page.evaluate(() => Array.from(document.querySelectorAll('.bf-schrift')).map(el => +getComputedStyle(el).opacity));
  t.ok(schrift[4] > 0.95 && schrift[0] < 0.05, 'Beschriftung gehört zum Blatt: ' + schrift.map(v => v.toFixed(2)).join(','));
  await t.bild('blattfolge-ende');
});

pruefung('blattfolge: ohne Bewegung eine ruhige Reihe', 'beide', async (page, t) => {
  const r = await page.evaluate(() => {
    const bf = document.getElementById('blattfolge');
    return { stand: bf.dataset.stand, lage: getComputedStyle(bf.querySelector('.bf-buehne')).position,
      deck: Array.from(bf.querySelectorAll('.bf-blatt')).map(el => getComputedStyle(el).opacity) };
  });
  t.gleich(r.stand, 'still', 'Stand'); t.gleich(r.lage, 'static', 'Bühne klebt nicht'); t.ok(r.deck.every(o => o === '1'), 'alle Blätter sichtbar: ' + r.deck.join(','));
}, { ruhig: true });

pruefung('tropfspur: läuft am rechten Rand, nicht durch den Text', 'beide', async (page, t) => {
  await t.durchscrollen(); await t.warten(1400);
  const r = await page.evaluate(() => {
    const h = document.getElementById('tropfspur'), p = h && h.querySelector('path');
    if (!h || !p || h.hidden) return null;
    const links = h.getBoundingClientRect().left + scrollX;
    const L = p.getTotalLength();
    const x = a => links + p.getPointAtLength(L * a).x;
    const wrap = document.querySelector('#werke .wrap').getBoundingClientRect();
    const insta = document.querySelector('.foot-row a[href*="instagram"]');
    return { x0: x(0), x50: x(0.5), x70: x(0.7), x95: x(0.95), wrapRechts: wrap.right + scrollX, breite: innerWidth,
      dash: parseFloat(getComputedStyle(p).strokeDashoffset), L,
      instaRechts: insta ? insta.getBoundingClientRect().right + scrollX : null };
  });
  t.ok(r, 'Spur fehlt oder ist versteckt');
  if (!r) return;
  if (t.mobil) {
    t.ok(r.x50 >= r.breite - 40, 'Spur an der rechten Kante (Telefon): ' + Math.round(r.x50));
    /* Der Rinnstein unter 900 px ist nur die 16 px Innenabstand der .wrap: die ganze
       Schwanzspitze der Spur muss darin bleiben, sonst streift sie Nebenschrift oder den
       Instagram-Link im Fuß (siehe js/tropfspur.js, messen()). */
    for (const [anteil, wert] of [[0.5, r.x50], [0.7, r.x70], [0.95, r.x95]]) {
      t.ok(wert >= r.breite - 13 && wert <= r.breite - 3, 'Spur bleibt im Rand bei ' + anteil + ': ' + Math.round(wert) + ' (Fenster ' + r.breite + ')');
    }
    t.ok(r.instaRechts != null, 'Instagram-Link im Fuß nicht gefunden');
    if (r.instaRechts != null) t.ok(r.x95 > r.instaRechts + 2, 'Spur rechts vom Instagram-Link im Fuß: ' + Math.round(r.x95) + ' vs ' + Math.round(r.instaRechts));
  }
  else t.ok(r.x50 >= r.wrapRechts + 20 && r.x50 <= r.breite - 10, 'Spur rechts neben dem Inhalt: ' + Math.round(r.x50) + ' bei Kante ' + Math.round(r.wrapRechts));
  t.ok(Math.abs(r.x95 - r.x50) < 40, 'Spur bleibt am Rand');
  t.ok(r.x0 < r.x50 - 100, 'Spur setzt am Strang an und findet den Rand: ' + Math.round(r.x0) + ' → ' + Math.round(r.x50));
  t.ok(r.dash < r.L * 0.1, 'Spur ist unten fast ganz gelaufen: ' + Math.round(r.dash) + ' von ' + Math.round(r.L));
  await t.bild('tropfspur-unten');
});

pruefung('tropfspur: ohne Bewegung versteckt', 'schreibtisch', async (page, t) => {
  t.ok(await page.evaluate(() => document.getElementById('tropfspur').hidden), 'Spur muss bei reduzierter Bewegung versteckt sein');
}, { ruhig: true });

pruefung('werke: drei Spalten, Blätter gedreht abgelegt, Filter mit Austritt', 'schreibtisch', async (page, t) => {
  const cols = await page.evaluate(() => getComputedStyle(document.querySelector('.app')).getPropertyValue('--cols').trim());
  t.gleich(cols, '3', 'Spalten in Richtung A ab 1100 px');
  const dreh = await page.evaluate(() => Array.from(document.querySelectorAll('.g-item')).slice(0, 3).map(el => getComputedStyle(el).getPropertyValue('--dreh').trim()));
  t.gleich(dreh.join('|'), '-1.1deg|0.8deg|1.4deg', '--dreh je Blatt');
  const art = await page.evaluate(() => Array.from(document.querySelectorAll('.g-item')).map(el => el.dataset.eintritt + el.dataset.versatz).join(','));
  t.gleich(art, 'blatt0,blatt1,blatt2,blatt0,blatt1,blatt2', 'Eintritt und Versatz je Spalte');
  await t.zu((await t.abschnitte()).find(a => a.id === 'werke').oben - 40); await t.warten(1600);
  await t.bild('werke-abgelegt');
  const vorher = await page.evaluate(() => document.querySelectorAll('.g-item').length);
  await page.click('.chip[data-v="Köpfe"]'); await t.warten(1400);
  const nachher = await page.evaluate(() => ({
    n: document.querySelectorAll('.g-item').length,
    sichtbar: Array.from(document.querySelectorAll('.g-item')).every(el => getComputedStyle(el).opacity === '1' && el.classList.contains('on') && !el.style.transform)
  }));
  t.gleich(vorher, 6, 'alle Werke vorher'); t.gleich(nachher.n, 2, 'Köpfe nachher'); t.ok(nachher.sichtbar, 'gefilterte Blätter sichtbar, aufgeräumt');
  await t.bild('werke-gefiltert');
  /* Klickt jemand weiter, während der Austritt des ersten Klicks noch läuft (Richtung A:
     rund 225 ms), darf nur der letzte Lauf zeichnen — sonst gewinnt, wer zufällig zuerst
     fertig wird, und ein überholter Filterstand blitzt auf. Beide Klicks bewusst ohne
     Wartezeit dazwischen. */
  await page.click('.chip[data-v="Befreiung der Körperlichkeit"]');
  await page.click('.chip[data-f="fSerie"][data-v=""]');
  await t.warten(1600);
  const rennen = await page.evaluate(() => ({
    n: document.querySelectorAll('.g-item').length,
    sichtbar: Array.from(document.querySelectorAll('.g-item')).every(el => getComputedStyle(el).opacity === '1' && el.classList.contains('on') && !el.style.transform)
  }));
  t.gleich(rennen.n, 6, 'nach schnellem Weiterklicken wieder alle sechs Werke');
  t.ok(rennen.sichtbar, 'alle sechs aufgeräumt, kein überholter Lauf hat mitgezeichnet');
});

pruefung('werke: Hover hebt das Bildfeld, nicht mehr', 'schreibtisch', async (page, t) => {
  await t.zu((await t.abschnitte()).find(a => a.id === 'werke').oben - 40); await t.warten(1600);
  const box = await page.locator('.g-item').first().boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await t.warten(800);
  const tf = await page.evaluate(() => document.querySelector('.g-item .g-ph').style.transform);
  t.ok(/translateY\(-(3|4)(\.\d+)?px\)/.test(tf), 'Bildfeld hebt sich um 4 px: ' + JSON.stringify(tf));
  await page.mouse.move(2, 2); await t.warten(800);
  const tf2 = await page.evaluate(() => document.querySelector('.g-item .g-ph').style.transform);
  /* Eine Feder nähert sich der Ruhelage nur asymptotisch; Motion friert kurz davor ein
     (beobachtet: z. B. translateY(-0.00122px)). Ein Rest von Tausendstel Pixeln ist die
     Ruhelage, kein hängengebliebener Hub — den Unterschied macht die Größenordnung. */
  t.ok(!tf2 || /translateY\(-?0(\.\d+)?px\)|^none$/.test(tf2), 'senkt sich wieder: ' + JSON.stringify(tf2));
});

pruefung('werkansicht: öffnet vom Blatt, blättert, schließt zum Blatt zurück', 'beide', async (page, t) => {
  await t.zu((await t.abschnitte()).find(a => a.id === 'werke').oben - 40); await t.warten(1600);
  await page.click('.g-item'); await t.warten(120);
  const flug = await page.evaluate(() => { const f = document.getElementById('ov-fig'); return f ? f.style.transform : null; });
  t.ok(flug && /translate|scale|matrix/.test(flug), 'das Bild fliegt vom Blatt aus: ' + JSON.stringify(flug));
  await t.warten(1000);
  const offen = await page.evaluate(() => ({
    da: !!document.getElementById('ov'), fokus: document.activeElement && document.activeElement.id,
    fig: document.getElementById('ov-fig').style.transform, rows: getComputedStyle(document.querySelector('.ov-rows')).opacity
  }));
  t.ok(offen.da, 'Werkansicht offen'); t.gleich(offen.fokus, 'ov-close', 'Fokus auf Schließen');
  t.gleich(offen.fig, '', 'Bild am Platz, transform geleert'); t.gleich(offen.rows, '1', 'Zeilen sichtbar');
  await t.bild('werkansicht');
  await page.keyboard.press('ArrowRight'); await t.warten(800);
  t.gleich(await page.evaluate(() => (document.querySelector('.ov-zaehler') || {}).textContent), '2 von 6', 'geblättert');
  await page.keyboard.press('Escape'); await t.warten(100);
  t.ok(await page.evaluate(() => !!document.getElementById('ov')), 'beim Schließen bleibt der Dialog, bis die Bewegung zu Ende ist');
  await t.warten(1000);
  const zu = await page.evaluate(() => ({ da: !!document.getElementById('ov'), fokus: document.activeElement && document.activeElement.className }));
  t.ok(!zu.da, 'Werkansicht geschlossen'); t.ok(/g-item/.test(zu.fokus || ''), 'Fokus zurück auf dem Blatt: ' + zu.fokus);
});

pruefung('abschnitte: Linien wachsen, das Foto wächst, das Band folgt', 'schreibtisch', async (page, t) => {
  const vorher = await page.evaluate(() => ({
    aktuell: getComputedStyle(document.getElementById('aktuell')).getPropertyValue('--strich').trim(),
    team: getComputedStyle(document.querySelector('.team li')).getPropertyValue('--strich').trim()
  }));
  t.gleich(vorher.aktuell, '0', 'die Linien von Aktuell warten'); t.gleich(vorher.team, '0', 'die Linien der Teamliste warten');
  await t.durchscrollen(); await t.warten(2000);
  const nachher = await page.evaluate(() => ({
    aktuell: getComputedStyle(document.getElementById('aktuell')).getPropertyValue('--strich').trim(),
    team: Array.from(document.querySelectorAll('.team li')).map(li => getComputedStyle(li).getPropertyValue('--strich').trim()).join(','),
    foto: getComputedStyle(document.querySelector('.studio-rahmen img')).transform,
    band: document.querySelector('.band-video').currentTime,
    text: Array.from(document.querySelectorAll('#aktuell .rv')).every(el => el.classList.contains('on'))
  }));
  t.gleich(nachher.aktuell, '1', 'die Linien von Aktuell sind gewachsen'); t.gleich(nachher.team, '1,1,1,1,1', 'die Linien der Teamliste sind gewachsen');
  t.ok(nachher.text, 'Aktuell-Text enthüllt');
  t.ok(/matrix\(1\.0[0-9]/.test(nachher.foto), 'das Foto ist scrollgebunden gewachsen: ' + nachher.foto);
  t.ok(nachher.band > 5, 'das Signaturvideo ist am Ende der Handschrift weit gespult: ' + nachher.band);
});

pruefung('anfrage: der Fehler kommt von links, ohne Schütteln', 'schreibtisch', async (page, t) => {
  await t.zu((await t.abschnitte()).find(a => a.id === 'anfrage').oben - 40); await t.warten(1600);
  await page.click('#af-send'); await t.warten(700);
  const r = await page.evaluate(() => { const e = document.getElementById('af-err'); return { hidden: e.hidden, text: e.textContent, op: getComputedStyle(e).opacity, tf: e.style.transform }; });
  t.ok(!r.hidden && /Motividee/.test(r.text) && r.op === '1', 'Fehlerhinweis steht: ' + JSON.stringify(r));
});

for (const r of ['b', 'c']) {
  pruefung(`richtung ${r}: alles kommt, Konsole leer`, 'beide', async (page, t) => {
    await t.durchscrollen(); await t.warten(2200);
    const fehlt = await page.evaluate(() => Array.from(document.querySelectorAll('.rv')).filter(el => {
      if (el.closest('[hidden]')) return false;
      const r = el.getBoundingClientRect();
      if (r.right <= 0 || r.left >= innerWidth) return false;
      /* Nicht auf genau 1 prüfen: Richtung B dimmt das Handschriftvideo dauerhaft auf
         0.9 (.app[data-richtung="b"] .band-video, aus dem ursprünglichen Prototyp, nicht
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
    spur: document.getElementById('tropfspur').hidden
  }));
  t.gleich(r.fehlt, 0, 'alles sichtbar'); t.gleich(r.stand, 'still', 'Blattfolge still'); t.ok(r.spur, 'Spur versteckt');
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
