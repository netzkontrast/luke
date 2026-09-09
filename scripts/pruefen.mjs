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

/* Warnungen, die bis zu einer bestimmten Aufgabe noch hingenommen werden. Aufgabe 3 nimmt
   die 3D-Sequenz heraus, mit ihr die WebGL-Warnungen; dann wird diese Liste leer. */
const TOLERIERT = [/WebGL/];

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
