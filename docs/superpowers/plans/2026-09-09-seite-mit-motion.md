# Die Seite mit Motion — Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Werkschau-Seite `index.html` bekommt ihre gesamte Bewegung neu, gebaut mit Motion 13 (lokal), ohne three.js, ohne Remotion-Player, ohne abgefangenes Mausrad — Abschnitt für Abschnitt nach dem Entwurf.

**Architecture:** Ein Grundmodul `js/bewegung.js` kapselt Motion (Stärke, Tempo je Richtung, Enthüllen, Strich, Parallaxe, Zeiger, Heben). Je Abschnitt ein kleines Modul (`auftakt.js`, `blattfolge.js`, `abschnitte.js`, `tropfspur.js`), die Seitenlogik in `site.js` nutzt Motion für Galerie und Werkansicht. Alles klassische IIFEs auf `window.LUKE`, kein Bauschritt. Geprüft wird mit einem Playwright-Skript, das die Seite lädt, durchscrollt, Zusicherungen prüft und Bilder zieht.

**Tech Stack:** Statisches HTML/CSS/JS, Motion 13.2.0 (UMD, `window.Motion`), Playwright (global installiert, `NODE_PATH=/opt/node22/lib/node_modules`) für die Prüfung.

**Spec:** `docs/superpowers/specs/2026-09-09-seite-mit-motion-design.md` — der Plan argumentiert aus dem Entwurf; wer eine Aufgabe umsetzt, liest beide.

## Global Constraints

- Motion liegt lokal unter `vendor/motion/motion-13.2.0.min.js` und wird als klassisches Skript geladen (`window.Motion`). **Kein CDN, kein `import`, nichts von Dritten zur Laufzeit.**
- Kein Bauschritt. Kein `package.json` im Wurzelverzeichnis. Alle Seitenskripte sind IIFEs auf `window.LUKE`, `'use strict'`, in der Sprache des Repositories: **Kommentare, Bezeichner und Commit-Botschaften auf Deutsch**, im Ton der bestehenden Dateien (Kommentare sagen *warum*, nicht *was*).
- Bewegt wird nur `transform`, `opacity`, `clip-path` und CSS-Variablen dafür. `filter` nur im Eintritt der Richtung B. Kein `box-shadow` in Bewegung, kein Leuchten, kein Verlauf.
- Zeitgesteuerte Bewegung nie mit `ease: "linear"`. Scrollgebundene Bewegung (`scroll(animate(...))`) **immer** mit `ease: "linear"` und `times`, deren erster Wert 0 und letzter Wert 1 ist.
- Kurven ohne Überschwingen: A `[0.3, 0.1, 0.2, 1]`, B `[0.16, 1, 0.3, 1]`; Federn A `{ stiffness: 170, damping: 26 }`, B `{ stiffness: 120, damping: 24 }`; C darf überschwingen: `[0.34, 1.3, 0.5, 1]`, `{ stiffness: 260, damping: 18 }`.
- Kein zusätzliches Rot. Rot ist `var(--red)` in der Tropfspur und in den Zeichnungen, sonst nirgends neu.
- Bei `prefers-reduced-motion` und `data-bewegung="aus"` wird nicht animiert, sondern der Endzustand gesetzt. `data-bewegung="dezent"` skaliert alle Dauern mit 0,55.
- Die Konsole bleibt leer: keine Fehler, keine Warnungen (`scripts/pruefen.mjs` schlägt sonst fehl).
- Ein Element trägt nie zugleich `.rv` und `data-depth` (Eintritt und Parallaxe schrieben sonst dieselbe `transform`).
- Texte, Titel, Nummern, Jahre kommen aus `js/works.js` und dem bestehenden Markup. Keine erfundenen Inhalte, keine Emoji, kein Gedankenstrich als Zierde in neuen Texten.
- Commit-Botschaften wie im Repository: eine Zeile, deutsch, sagt was und warum („Grundlage: Motion lokal, Enthüllen und Parallaxe über js/bewegung.js“).

## Motion 13 in diesem Projekt — Spickzettel

Alles unter `window.Motion` (kurz `M`). Geprüft in dieser Umgebung (Chromium mit `ScrollTimeline`):

```js
// Zeitgesteuert. Gibt ein Promise-artiges Objekt mit .then/.stop/.cancel zurück.
M.animate(el, { opacity: [0, 1], y: [18, 0] }, { duration: 0.9, delay: 0.1, ease: [0.3, 0.1, 0.2, 1] });
M.animate(el, { y: -4 }, { type: 'spring', stiffness: 170, damping: 26 });
M.animate(el, { '--strich': [0, 1] }, { duration: 0.9 });          // CSS-Variable, geprüft
M.animate(el, { clipPath: ['inset(-2% 100% -2% -40px)', 'inset(-2% -2% -2% -40px)'] }, { duration: 0.9 });
M.animate(pfad, { pathLength: [0, 1] }, { duration: 2 });         // SVG
M.animate([el1, el2, el3], { opacity: [0, 1] }, { delay: M.stagger(0.05, { startDelay: 0.15 }) });
// Nach dem Ende bleiben die Endwerte als Inline-Stil stehen (style.opacity = "1" usw.).

// Scrollgebunden. animate() ohne Dauer, ease linear, times von 0 bis 1; scroll() gibt eine Stopp-Funktion.
const anim = M.animate(el, { y: [560, 560, 0, 0, -480, -480], opacity: [0, 0, 1, 1, 0, 0] },
  { ease: 'linear', times: [0, 0.2, 0.32, 0.5, 0.6, 1] });
const stop = M.scroll(anim, { target: abschnitt, offset: ['start start', 'end end'] });
// Rückruf statt Animation: (fortschritt, info) => …, info.y.current ist scrollY.
M.scroll((p, info) => { … }, { target: el, offset: ['start 0.92', 'end 0.2'] });
// Ohne target: Fortschritt der ganzen Seite.

// Sichtbar werden. Rückruf beim Eintritt; gibt Stopp-Funktion zurück; ohne "once": mit stop() selbst beenden.
const stop = M.inView(el, (el, eintrag) => { stop(); … }, { amount: 0.15, margin: '0px 0px -8% 0px' });

// Werte. styleEffect verlangt für JEDEN Schlüssel einen Motion-Wert (keine nackte Zahl).
const roh = M.motionValue(0);
const weich = M.springValue(roh, { stiffness: 60, damping: 20 });   // folgt roh mit Feder
weich.on('change', v => { … });                                      // feuert je Bild, solange sich etwas bewegt
const x = M.transformValue(() => weich.get() * 96);                  // abgeleitet, rechnet neu, wenn weich sich ändert
const stopEffekt = M.styleEffect(el, { x, y: M.motionValue(0) });   // schreibt transform einmal je Bild

// Gesten. Rückruf beim Beginn, zurückgegebene Funktion beim Ende. press macht Elemente per Tastatur (Enter) bedienbar.
M.hover(els, el => { M.animate(el, { y: -4 }); return () => M.animate(el, { y: 0 }); });
M.press(els, el => { M.animate(el, { scale: 0.985 }); return (e, info) => M.animate(el, { scale: 1 }); });

// Sonstiges
M.delay(fn, sekunden);  M.supportsScrollTimeline();
```

Stolpersteine, in dieser Umgebung gesehen:
- `styleEffect` mit einer Zahl statt Motion-Wert wirft `e.get is not a function`.
- Eine gestoppte `scroll()`-Animation lässt Zwischenwerte im Stil stehen; nach `stop()` die Inline-Stile leeren, bevor man neu baut.
- Zwei Motion-Animationen auf derselben `transform` desselben Elements überschreiben einander. Eintritt (y) und Parallaxe/Zeiger (x, y) und Ken-Burns (scale) deshalb auf **verschiedene** Elemente (Kind/Elternteil) legen.

## Prüfen

Das Prüfskript `scripts/pruefen.mjs` (Aufgabe 1) startet einen kleinen Server im Prozess, lädt die Seite in Chromium, scrollt sie durch, prüft Zusicherungen und zieht Bilder nach `pruefung/`. Aufruf:

```bash
NODE_PATH=/opt/node22/lib/node_modules node scripts/pruefen.mjs            # Zusicherungen, 1440 und 390
NODE_PATH=/opt/node22/lib/node_modules node scripts/pruefen.mjs --bilder   # dazu Bilder je Abschnitt nach pruefung/
NODE_PATH=/opt/node22/lib/node_modules node scripts/pruefen.mjs --nur=auftakt   # nur Prüfungen, deren Name "auftakt" enthält
```

Ende mit Exitcode 1, wenn eine Zusicherung fehlschlägt oder die Konsole nicht leer ist. Jede Aufgabe fügt ihre Zusicherungen in `PRUEFUNGEN` hinzu (Datei `scripts/pruefen.mjs`, Abschnitt „Prüfungen“). **Bilder werden angesehen, nicht beschrieben** (mit dem Read-Werkzeug öffnen).

---

## Dateien

| Datei | Zuständig für | Aufgabe |
| --- | --- | --- |
| `vendor/motion/motion-13.2.0.min.js`, `LICENSE`, `HERKUNFT.md` | Motion, lokal | 1 |
| `scripts/pruefen.mjs` | Prüfung mit Playwright: Zusicherungen, Konsole, Bilder | 1, alle ergänzen |
| `js/bewegung.js` | Grundlage: Stärke, Tempo, Eintritt, Enthüllen, Strich, Parallaxe, Zeiger, Heben, Lichtkegel | 1 |
| `js/auftakt.js` | Auftakt: Ebenen, Video, Schnitt, Titel | 2 |
| `js/blattfolge.js` | Die Sequenz: ein Blatt nach dem anderen | 3 |
| `js/tropfspur.js` | Die rote Spur, Weg an den Rand, Federantrieb | 4 |
| `js/site.js` | Galerie, Werkansicht, Grafik, Flash, Formular, Bedienfeld | 1, 5, 6, 7 |
| `js/abschnitte.js` | Aktuell, Handschrift, Studio | 7 |
| `css/site.css` | Stile, Zustände je Richtung | 1, 2, 3, 5, 7 |
| `index.html` | Markup, Skriptreihenfolge | 1, 2, 3, 7 |
| `README.md`, `NOTES.md` | Aufbau, Prüfen, offene Punkte | 8 |
| gelöscht: `js/motion.js` (1), `assets/js/auftakt-player.js` (2), `js/werk-sequenz.js` und `vendor/three.module.min.js` (3) | | |

Reihenfolge und Abhängigkeiten: Aufgabe 1 zuerst. Danach 2, 3 und 4 unabhängig voneinander (eigene Dateien, eigene Bereiche in `css/site.css` und `index.html`). Dann 5 und 6 nacheinander (beide in `js/site.js`, Galerie und Werkansicht), parallel dazu 7. Zuletzt 8.

---

### Aufgabe 1: Motion lokal, Grundlage `js/bewegung.js`, Prüfskript, Bühne und Mausrad raus

**Files:**
- Create: `vendor/motion/motion-13.2.0.min.js`, `vendor/motion/LICENSE`, `vendor/motion/HERKUNFT.md`
- Create: `scripts/pruefen.mjs`
- Create: `js/bewegung.js`
- Modify: `index.html` (Einzeiler im `<head>`, Skripte am Ende)
- Modify: `css/site.css` (Block „Einblenden beim Scrollen“ ersetzen, Bühne raus)
- Modify: `js/site.js` (Enthüllen an `LUKE.bewegung` abgeben, `L.motion` und `--mx/--my` raus)
- Modify: `.gitignore` (`pruefung/`)
- Delete: `js/motion.js`

**Interfaces:**
- Produces: `LUKE.bewegung` mit `M, m(), richtung(), tempo(), feder, eintritt(el), enthuellen(root), zeigen(el, {delay}), sofort(el), strich(el, {delay, dauer}), parallaxe(root), zeiger {x, y}, heben(els, {um, feld})` — genau wie unten im Code. Markup-Verträge: `.rv` = kommt beim Sichtbarwerden herein; `data-eintritt="text|blatt|druck|block"` (Standard `text`); `data-versatz="n"` = Staffelung in Vielfachen von `tempo().versatz` statt der automatischen Reihe; `data-eigen` = das automatische Enthüllen lässt das Element in Ruhe, ein Abschnitt zeigt es selbst; `--dreh` als CSS-Variable in Grad für Blätter; `--strich` für Linien; `[data-depth]` = scrollgebundene Parallaxe.
- Produces: `scripts/pruefen.mjs` mit `pruefung(name, fenster, lauf, optionen)` und den Helfern `t.ok, t.gleich, t.warten, t.durchscrollen, t.zu, t.bild, t.abschnitte, t.mobil`.

- [ ] **Step 1: Motion aus dem npm-Paket holen und lokal ablegen**

```bash
cd /tmp && rm -rf motion-holen && mkdir motion-holen && cd motion-holen
npm pack motion@13.2.0 --silent && tar xzf motion-13.2.0.tgz
cd /home/user/luke
mkdir -p vendor/motion
cp /tmp/motion-holen/package/dist/motion.js vendor/motion/motion-13.2.0.min.js
cp /tmp/motion-holen/package/LICENSE.md vendor/motion/LICENSE
sha256sum vendor/motion/motion-13.2.0.min.js
gzip -c vendor/motion/motion-13.2.0.min.js | wc -c
head -c 200 vendor/motion/motion-13.2.0.min.js   # muss mit !function(t,e){"object"==typeof exports … beginnen und .Motion={} enthalten
```

Dann `vendor/motion/HERKUNFT.md` schreiben (Prüfsumme und Größen aus den Befehlen oben eintragen):

```markdown
# Herkunft

Motion 13.2.0, die Animationsbibliothek von Matt Perry.

- Projekt: https://github.com/motiondivision/motion — Dokumentation: https://motion.dev/docs
- Bezogen über npm: `npm pack motion@13.2.0`
- Lizenz: MIT, siehe `LICENSE`

| Datei | Quelle im Paket | Größe |
| --- | --- | --- |
| `motion-13.2.0.min.js` | `dist/motion.js` (UMD-Bündel, stellt `window.Motion` bereit) | 140,5 kB, 46,7 kB gezippt |

Unverändert übernommen. SHA-256: `<hier die Prüfsumme>`

Sie liegt hier und nicht auf einem CDN, weil die Datenschutzerklärung der Seite zusagt, dass
zur Laufzeit nichts von Dritten nachgeladen wird.

## Wofür

Die gesamte Bewegung der Seite: Eintritte beim Sichtbarwerden, scrollgebundene Bewegung
(über `ScrollTimeline`, wo der Browser sie kann), Federn, Zeigerfolge, Gesten. Der Zugang
läuft über `js/bewegung.js`; die Abschnitte nehmen Motion nicht direkt, sondern fragen dort.
```

- [ ] **Step 2: Das Prüfskript schreiben**

`scripts/pruefen.mjs` vollständig:

```js
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
```

Dazu in `.gitignore` eine Zeile: `pruefung/` (unter `.vercel/`).

- [ ] **Step 3: Prüfskript laufen lassen, es muss fehlschlagen**

Run: `NODE_PATH=/opt/node22/lib/node_modules node scripts/pruefen.mjs`
Expected: `FEHLT grundlage …` (window.Motion fehlt, LUKE.bewegung fehlt, data-js nicht gesetzt), `FEHLT enthuellen: unten …` (die alte `.rv`-Regel versteckt zwar, aber `.on` und die Aufräumprüfung scheitern), Exitcode 1.

- [ ] **Step 4: `index.html` — Einzeiler im Kopf, Skripte am Ende**

Im `<head>`, direkt vor `<link rel="stylesheet" href="css/site.css">`:

```html
  <script>
    /* Nur wenn Bewegung möglich ist, darf das Stylesheet die .rv-Elemente bis zum Enthüllen
       verstecken. Ohne JavaScript, bei „reduzierte Bewegung“ und mit ?bewegung=aus steht
       alles von Anfang an da. js/bewegung.js nimmt das Merkmal wieder weg, falls Motion fehlt. */
    (function () {
      var q = new URLSearchParams(location.search).get('bewegung');
      if (q === 'aus' || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
      document.documentElement.dataset.js = 'an';
    })();
  </script>
```

Am Ende des `<body>` die Skripte so (Motion vor allem, was es braucht; `js/motion.js` ist weg):

```html
<script src="js/works.js"></script>
<script src="vendor/motion/motion-13.2.0.min.js"></script>
<script src="js/bewegung.js"></script>
<script src="js/werk-sequenz.js"></script>
<script src="js/site.js"></script>
<script src="js/tropfspur.js" defer></script>
```

- [ ] **Step 5: `css/site.css` — Enthüllen neu, Bühne raus**

Löschen: die beiden `@keyframes draw` und `@keyframes surface` (Zeilen 13–14); den ganzen Block `/* ---------- Einblenden beim Scrollen ---------- */` von `.rv { opacity: 0; transition: … }` bis einschließlich `.hw { … }` (Zeilen 45–61); den Block `/* ---------- 3D-Bühne (js/motion.js) ---------- */` bis einschließlich `[data-tilt] { transform-style: preserve-3d; }` (behalte davon nur `[data-depth] { will-change: transform; }`); die Zeile `.app[data-richtung="a"][data-rot="satt"] h2.rv.on::after { width: 110px; }` im Abschnitt „Dichte, Rotspur, Papierkorn“.

An die Stelle des gelöschten Blocks „Einblenden beim Scrollen“:

```css
/* ---------- Enthüllen (js/bewegung.js) ----------
   Was hereinkommt, trägt .rv und ist versteckt, bis Motion es zeigt. Versteckt wird nur,
   wenn der Einzeiler im <head> data-js gesetzt hat — also mit JavaScript, ohne „reduzierte
   Bewegung“ und ohne ?bewegung=aus. Sonst steht alles von Anfang an da. Wie etwas
   hereinkommt, sagt data-eintritt (text | blatt | druck | block), siehe js/bewegung.js. */
html[data-js="an"] .rv:not(.on) { opacity: 0; }
/* Schaltet das Bedienfeld die Bewegung aus, gewinnt diese Regel (eine Klasse mehr). */
html[data-js="an"] .app[data-bewegung="aus"] .rv:not(.on) { opacity: 1; }

/* Ein Strich, der von links wächst: Das Stylesheet zeichnet die Linie, Motion dreht --strich
   von 0 auf 1. Ohne JavaScript steht sie ganz. */
.app[data-richtung="a"] h2.hd::after { content: ''; display: block; width: 64px; height: 3px; margin-top: 14px; background: var(--red); transform: scaleX(var(--strich, 1)); transform-origin: 0 50%; }
.app[data-richtung="a"][data-rot="satt"] h2.hd::after { width: 110px; }
/* Die Werkstatt markiert ihre Überschriften mit Textmarker. Er steht, er wächst nicht. */
.app[data-richtung="c"] h2.hd { background-image: linear-gradient(rgba(212,160,23,0.4), rgba(212,160,23,0.4)); background-repeat: no-repeat; background-size: 100% 42%; background-position: 0 88%; }

/* ---------- Parallaxe (js/bewegung.js) ---------- */
[data-depth] { will-change: transform; }
```

Wichtig: Es darf keine `transition` mehr auf `.rv` geben; `.tr-schiene` und `.tin` behalten ihre Transitionen bis Aufgabe 5.

- [ ] **Step 6: `js/bewegung.js` schreiben**

```js
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
    anim.then(() => aufraeumen(el));
    /* Die rote Linie unter einer Überschrift läuft weiter, sobald die Schrift steht. */
    if (richtung() === 'a' && el.matches('h2.hd')) strich(el, { delay: delay + 0.25 * s, dauer: 0.9 });
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
      const stop = M.inView(el, () => {
        stop();
        const jetzt = performance.now();
        if (jetzt - zuletzt > 120) reihe = 0;
        zuletzt = jetzt;
        const eigen = el.dataset.versatz != null ? (parseFloat(el.dataset.versatz) || 0) : Math.min(reihe, 4);
        reihe++;
        zeigen(el, { delay: eigen * tempo().versatz * m() });
      }, { amount: 0.15, margin: '0px 0px -8% 0px' });
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
```

- [ ] **Step 7: `js/site.js` umstellen, `js/motion.js` löschen**

1. Den Block `/* ---------- Einblenden beim Scrollen ---------- …` (von `let rvList = [], lastScanY = null;` bis `if (L.motion) L.motion.on(revealScan); else addEventListener('scroll', revealScan, { passive: true });`) ersetzen durch:

```js
  /* ---------- Enthüllen ----------
     Was neu ins Dokument kommt (Galerie, Grafik, Bestätigung), meldet js/bewegung.js beim
     Sichtbarwerden an. Der Beobachter sieht nur neue Knoten, keine Attribute: Motion schreibt
     Inline-Stile, und die dürfen hier keinen Kreis auslösen. */
  const observeNew = () => { if (B) { B.enthuellen(document); B.parallaxe(document); } };
  new MutationObserver(observeNew).observe(document.body, { childList: true, subtree: true });
```

2. Oben in `site.js`, direkt nach `const app = $('.app'); if (!app) return;`, die Grundlage holen — alle späteren Aufgaben greifen darauf zu:

```js
  /* Die Grundlage aller Bewegung (js/bewegung.js). Ohne sie läuft die Seite still. */
  const B = L.bewegung, M = B && B.M;
```

3. Im Block „Scrollen, Zeiger, Tastatur“ den `pointermove`-Zuhörer samt `let xy = null, pmr = 0;` löschen (der Zeiger wohnt jetzt in `js/bewegung.js`); der `keydown`-Zuhörer bleibt.
4. Im `sequenz-select`-Zuhörer die Zeile `if (L.motion) L.motion.scrollTo(top); else window.scrollTo({ top, behavior: mScale() ? 'smooth' : 'auto' });` ersetzen durch `window.scrollTo({ top, behavior: mScale() ? 'smooth' : 'auto' });`.
5. In `band()` die Zeile `if (L.motion) L.motion.on(folgen); else addEventListener('scroll', folgen, { passive: true });` ersetzen durch `addEventListener('scroll', folgen, { passive: true });` (Aufgabe 7 baut das Band neu).
6. `git rm js/motion.js`.
7. In der Kopfzeile von `site.js` den Verweis „3D-Sequenz: js/werk-sequenz.js“ so lassen; Bewegung: „js/bewegung.js“ ergänzen.

- [ ] **Step 8: Prüfen, ansehen**

Run: `NODE_PATH=/opt/node22/lib/node_modules node scripts/pruefen.mjs --bilder`
Expected: alle Prüfungen `ok`, Exitcode 0. Konsole leer bis auf tolerierte WebGL-Warnungen der noch vorhandenen 3D-Sequenz. Dann `pruefung/durchgescrollt-schreibtisch.png`, `pruefung/abschnitt-werke-schreibtisch.png`, `pruefung/abschnitt-studio-telefon.png` mit dem Read-Werkzeug öffnen und ansehen: Überschriften mit roter Linie, Blätter der Galerie sichtbar, nichts abgeschnitten, kein Element auf halbem Weg.

Zusätzlich von Hand im Browser-Kontext (Playwright, eigenes kleines Skript oder `page.evaluate` in einer weiteren Prüfung): Beim Scrollen kommen die Absätze der Handschrift von links aufgezogen, nacheinander; die Galerieblätter legen sich ab (leicht gedreht, dann gerade).

- [ ] **Step 9: Commit**

```bash
git add vendor/motion scripts/pruefen.mjs js/bewegung.js index.html css/site.css js/site.js .gitignore
git rm -q js/motion.js
git commit -m "Grundlage: Motion lokal, Enthüllen und Parallaxe über js/bewegung.js, Bühne und Mausrad raus"
```

---

### Aufgabe 2: Der Auftakt — Ebenen, Video, Schnitt, Titel (`js/auftakt.js`)

**Files:**
- Create: `js/auftakt.js`
- Modify: `index.html` (Markup der `.hero-fig`, Skript einhängen)
- Modify: `css/site.css` (Block „Auftakt“)
- Modify: `js/site.js` (Live-Auftakt und `heroOhneBuehne` raus)
- Delete: `assets/js/auftakt-player.js`

**Interfaces:**
- Consumes: `LUKE.bewegung.M, m(), zeiger`.
- Produces: nichts für andere Module. Klassen auf `.hero-fig`: `done` (Blatt steht), `still` (Video weg).

- [ ] **Step 1: Prüfungen ergänzen (in `scripts/pruefen.mjs`, unter den bestehenden)**

```js
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
    h1: getComputedStyle(document.querySelector('.hero-text h1')).opacity
  }));
  t.ok(r.done && r.still === '1' && r.video === 'none' && r.h1 === '1', 'Endzustand: ' + JSON.stringify(r));
}, { ruhig: true });
```

Run: `NODE_PATH=/opt/node22/lib/node_modules node scripts/pruefen.mjs --nur=auftakt` → Expected: FEHLT (keine Ebenen, `#auftakt-buehne` noch da).

- [ ] **Step 2: Markup in `index.html`**

Den ganzen `<div class="hero-draw" id="hero-par" data-depth="-0.05">…</div>` ersetzen durch:

```html
          <div class="hero-draw" id="hero-par">
            <!-- Vier Ebenen, von hinten nach vorn, jede mit eigener Tiefe. Die grauen sind
                 Tiefe, kein Motiv; das Motiv ist das Zeichenvideo, danach das Blatt. Skalierung
                 und Ausschnitt stehen am Bild, die Ebene selbst bekommt von js/auftakt.js
                 nur ihre Verschiebung. -->
            <figure class="hero-fig">
              <div class="hero-ebene" data-tiefe="0.14"><img class="hero-fern ink-img" src="assets/img/gestaltung-profil-1200.jpg" alt="" aria-hidden="true" style="--deck:0.10; --gross:1.55; object-position:38% 30%" fetchpriority="low" decoding="async"></div>
              <div class="hero-ebene" data-tiefe="0.30"><img class="hero-fern ink-img" src="assets/img/gestaltung-profil-1200.jpg" alt="" aria-hidden="true" style="--deck:0.16; --gross:1.22; --versatz:-4%; object-position:68% 62%" fetchpriority="low" decoding="async"></div>
              <div class="hero-ebene" data-tiefe="0.48">
                <div class="hero-motiv">
                  <video class="hero-video ink-img" muted playsinline preload="auto" aria-hidden="true" tabindex="-1">
                    <source src="assets/video/gestaltung-profil-zeichnung.webm" type="video/webm">
                    <source src="assets/video/gestaltung-profil-zeichnung.mp4" type="video/mp4">
                  </video>
                  <img class="hero-still ink-img"
                       src="assets/img/gestaltung-kniend-1200.jpg"
                       srcset="assets/img/gestaltung-kniend-800.jpg 800w, assets/img/gestaltung-kniend-1200.jpg 1200w, assets/img/gestaltung-kniend-1900.jpg 1900w"
                       sizes="(max-width: 900px) 90vw, 40vw"
                       width="1900" height="2536" fetchpriority="high" decoding="async"
                       alt="Tuschzeichnung: kniende Figur im Profil, Kopf gesenkt, hinter ihr ein offener Kreis">
                </div>
              </div>
              <div class="hero-ebene" data-tiefe="0.95"><img class="hero-fern ink-img" src="assets/img/gestaltung-profil-1200.jpg" alt="" aria-hidden="true" style="--deck:0.09; --gross:2.1; object-position:82% 88%" fetchpriority="low" decoding="async"></div>
            </figure>
          </div>
```

`data-depth="0.10"` am `.hero-text` bleibt (die Parallaxe liegt auf dem Rahmen, die Eintritte auf `h1` und `p` darin). Das `<noscript>` im Kopf bleibt. Skript: `<script src="js/auftakt.js"></script>` direkt nach `js/bewegung.js`.

- [ ] **Step 3: Stylesheet, Block „Auftakt“**

Den bestehenden Block von `.hero-fig { position: relative; …` bis `.hero-fig.hat-buehne .hero-video, .hero-fig.hat-buehne .hero-still { display: none; }` ersetzen durch:

```css
/* Dasselbe Seitenverhältnis wie die Zeichnung, damit Video und Standbild exakt übereinander
   liegen. Der Beschnitt hält die vergrößerten Tiefenebenen im Rahmen. */
.hero-fig { position: relative; margin: 0; height: min(78vh, 150vw); aspect-ratio: 1200 / 1948; max-width: 100%; overflow: hidden; }
/* Eine Ebene bekommt von js/auftakt.js nur x und y. Skaliert wird am Bild darin, sonst
   schrieben zwei Bewegungen dieselbe transform. */
.hero-ebene { position: absolute; inset: 0; will-change: transform; }
.hero-fern { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1); opacity: var(--deck, 0.1); transform: scale(var(--gross, 1)) translateX(var(--versatz, 0)); transform-origin: 50% 50%; }
.hero-motiv { position: absolute; inset: 0; will-change: transform; }
.hero-motiv > video, .hero-motiv > img { position: absolute; inset: 0; width: 100%; height: 100%; }
.hero-video { object-fit: cover; }
/* Das Blatt im Kopf hat links ein breites leeres Drittel. Der Ausschnitt nimmt es weg und
   rückt die Figur an ihren Platz. */
.hero-still { object-fit: cover; object-position: 100% 50%; opacity: 0; }
.hero-fig.done .hero-still { opacity: 1; }
.hero-fig.done .hero-video { opacity: 0; }
.hero-fig.still .hero-video { display: none; }
/* Vor dem Eintritt versteckt, nur wenn Bewegung möglich ist (siehe Enthüllen). */
html[data-js="an"] .hero-fern, html[data-js="an"] .hero-text h1, html[data-js="an"] .hero-text p { opacity: 0; }
```

Die Regeln für `.app[data-richtung="b"] .hero-grid` … `.app[data-richtung="c"] .hero-draw` darunter bleiben. Die Regel `.hero-video { … transition: … }` und `.hero-still { … transition … }` gibt es danach nicht mehr — keine CSS-Transition im Auftakt.

- [ ] **Step 4: `js/auftakt.js`**

```js
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

  /* Der Endzustand ohne Bewegung: das Blatt steht, das Video bleibt weg, die Ebenen stehen. */
  function nurBild() {
    fig.classList.add('still', 'done');
    fern.forEach(img => { img.style.opacity = '1'; });
    if (titel) titel.style.opacity = '1';
    if (zeile) zeile.style.opacity = '1';
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
  if (titel) M.animate(titel, { opacity: [0, 1], y: [18, 0] }, { duration: 1.1 * s, ease: KB });
  if (zeile) M.animate(zeile, { opacity: [0, 1], y: [14, 0] }, { duration: 1.0 * s, delay: 0.3 * s, ease: KB });
  M.animate(motiv, { scale: [1.045, 1] }, { duration: 9.4, ease: K });
  fern.forEach(img => {
    const deck = parseFloat(getComputedStyle(img).getPropertyValue('--deck')) || 0.1;
    M.animate(img, { opacity: [0, deck] }, { duration: 1.6 * s, delay: 0.15 * s, ease: KB });
  });
  M.animate(video, { opacity: [0, 1] }, { duration: 0.5 * s, delay: 0.35 * s, ease: KB });

  /* Der Schnitt: Video weg, Leerstelle, Blatt. */
  let geschnitten = false;
  function schnitt() {
    if (geschnitten) return;
    geschnitten = true;
    M.animate(video, { opacity: 0 }, { duration: 0.5, ease: KB }).then(() => {
      M.animate(still, { opacity: [0, 1], y: [10, 0] }, { duration: 0.9, delay: 0.35, ease: KB }).then(() => {
        fig.classList.add('done');
        still.style.opacity = ''; still.style.transform = '';
      });
    });
  }
  /* Kann der Browser das Format nicht, oder spielt er nicht ab, steht nach kurzer Frist das
     Blatt statt einer leeren Fläche. */
  const wache = setTimeout(() => { if (video.readyState < 2 || !video.currentTime) nurBild(); }, 2200);
  const sicherung = setTimeout(schnitt, 20000);
  video.addEventListener('ended', () => { clearTimeout(wache); clearTimeout(sicherung); schnitt(); }, { once: true });
  video.addEventListener('error', () => { clearTimeout(wache); clearTimeout(sicherung); nurBild(); }, { once: true });
  video.addEventListener('timeupdate', () => { if (video.currentTime > 0) clearTimeout(wache); }, { once: true });
  M.delay(() => {
    const p = video.play();
    if (p && p.catch) p.catch(() => { clearTimeout(wache); nurBild(); });
  }, 0.35 * s);
})();
```

- [ ] **Step 5: `js/site.js` — den Live-Auftakt entfernen**

Löschen: den Kommentar „Der Live-Auftakt …“, `const buehneGeplant = (() => { … })();`, die IIFE `(function buehne() { … })();`, die Funktion `heroOhneBuehne(nurBildSofort) { … }` und die Zeile `if (!buehneGeplant) heroOhneBuehne(false);`. Die IIFE `band()` bleibt (Aufgabe 7). Dann `git rm assets/js/auftakt-player.js`; im Stylesheet gibt es nach Step 3 keine `#auftakt-buehne`- und `hat-buehne`-Regeln mehr — prüfen mit `grep -n "buehne" css/site.css js/site.js index.html` → keine Treffer.

- [ ] **Step 6: Prüfen, ansehen, Commit**

Run: `NODE_PATH=/opt/node22/lib/node_modules node scripts/pruefen.mjs --bilder`
Expected: alles `ok`. Bilder `pruefung/auftakt-zeichnen-schreibtisch.png` (Zeichnung im Entstehen, Titel steht, graue Ebenen kaum sichtbar), `pruefung/auftakt-blatt-schreibtisch.png` (kniende Figur, kein weißer Kasten, kein Rest des Videos), dieselben für `telefon` ansehen.

```bash
git add index.html css/site.css js/auftakt.js js/site.js scripts/pruefen.mjs
git rm -q assets/js/auftakt-player.js
git commit -m "Auftakt: vier Ebenen in der Tiefe, Zeichnung, Schnitt, Blatt — mit Motion statt Remotion"
```

---

### Aufgabe 3: Die Blattfolge — ein Blatt nach dem anderen (`js/blattfolge.js`)

**Files:**
- Create: `js/blattfolge.js`
- Modify: `index.html` (`#sequenz`, Skripte)
- Modify: `css/site.css` (Block „Sequenz“ → „Blattfolge“)
- Modify: `js/site.js` (`applyTheme`: Zeilen zu `werk-sequenz` raus)
- Modify: `scripts/pruefen.mjs` (`TOLERIERT = []`, Prüfungen)
- Delete: `js/werk-sequenz.js`, `vendor/three.module.min.js`

**Interfaces:**
- Consumes: `LUKE.bewegung.M, m()`, `LUKE.helleAufnahmen(key)`, `LUKE.FLASH`, Attribute `data-sequenz` (`voll | still | aus`) und `data-bewegung` an `.app`.
- Produces: `LUKE.blattfolge = { bauen, zahl }`; Ereignis `sequenz-select` (bubbles, `detail.key`) vom Knopf „Ansehen“ — `js/site.js` hört schon darauf.

- [ ] **Step 1: Prüfungen ergänzen, `TOLERIERT` leeren**

In `scripts/pruefen.mjs`: `const TOLERIERT = [];` (Kommentar anpassen: nichts mehr toleriert). Dann:

```js
pruefung('blattfolge: fünf Blätter, eins zur Zeit, das letzte bleibt', 'beide', async (page, t) => {
  const r = await page.evaluate(() => {
    const bf = document.getElementById('blattfolge');
    return { stand: bf && bf.dataset.stand, n: bf ? bf.querySelectorAll('.bf-blatt').length : 0,
      h: bf ? bf.getBoundingClientRect().height : 0, oben: bf ? bf.getBoundingClientRect().top + scrollY : 0,
      vh: innerHeight, alt: !!document.querySelector('werk-sequenz, canvas') };
  });
  t.gleich(r.stand, 'voll', 'Stand'); t.gleich(r.n, 5, 'Blätter'); t.ok(!r.alt, 'kein <werk-sequenz>, kein Canvas mehr');
  t.ok(r.h >= r.vh * 4.3, 'Abschnitt zu niedrig: ' + Math.round(r.h) + ' bei ' + r.vh);
  const strecke = r.h - r.vh;
  const deck = () => page.evaluate(() => Array.from(document.querySelectorAll('.bf-blatt')).map(el => +getComputedStyle(el).opacity));
  await t.zu(r.oben + strecke * 0.3); await t.warten(300);
  let s = await deck();
  t.ok(s[1] > 0.95 && s.filter(v => v > 0.05).length === 1, 'bei 30 % genau das zweite Blatt: ' + s.map(v => v.toFixed(2)).join(','));
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
```

Run: `NODE_PATH=/opt/node22/lib/node_modules node scripts/pruefen.mjs --nur=blattfolge` → Expected: FEHLT.

- [ ] **Step 2: Markup und Skripte**

In `index.html` den Abschnitt ersetzen:

```html
    <section id="sequenz" aria-label="Papier, Haut, Flash">
      <!-- Die Blattfolge: js/blattfolge.js baut hier aus den Werkdaten eine klebende Bühne,
           auf der ein Blatt nach dem anderen vorbeizieht. Ohne Aufnahmen verschwindet der
           Abschnitt, ohne Bewegung wird er eine ruhige Reihe. -->
      <div class="bf" id="blattfolge"></div>
    </section>
```

Ohne JavaScript bliebe der Halter leer; deshalb im `<head>` das bestehende `<noscript><style>…</style></noscript>` um `#sequenz{display:none}` ergänzen: `<noscript><style>.hero-still{opacity:1}.hero-video{display:none}#sequenz{display:none}</style></noscript>`.

Skripte: `<script src="js/werk-sequenz.js"></script>` raus, `<script src="js/blattfolge.js"></script>` nach `js/auftakt.js`. In `js/site.js`, Funktion `applyTheme()`: die beiden Zeilen `const seq = $('werk-sequenz');` und `if (seq) { seq.setAttribute(…) }` löschen (die Blattfolge liest die Attribute der `.app` selbst). `git rm js/werk-sequenz.js vendor/three.module.min.js`. Im Kopfkommentar von `site.js` „3D-Sequenz: js/werk-sequenz.js“ durch „Blattfolge: js/blattfolge.js“ ersetzen.

- [ ] **Step 3: Stylesheet, Block „Sequenz“ ersetzen**

```css
/* ---------- Blattfolge (js/blattfolge.js) ----------
   Eine klebende Bühne, ein Blatt nach dem anderen. Die Höhe des Abschnitts setzt das Skript
   aus der Zahl der Blätter. Bewegt werden nur transform und opacity, scrollgebunden. Im
   Stand „still“ wird daraus eine ruhige Reihe mit natürlicher Höhe. */
.app[data-sequenz="aus"] #sequenz { display: none; }
.bf { position: relative; }
.bf-buehne { position: sticky; top: 0; height: 100svh; overflow: hidden; }
.bf-reihe, .bf-stueck { display: contents; }
.bf-kapitel { position: absolute; left: clamp(20px, 6vw, 80px); bottom: clamp(64px, 14vh, 140px); max-width: min(78vw, 420px); }
.bf-titel { font-family: var(--fd); font-weight: var(--wtd); text-transform: var(--ttd); font-size: clamp(38px, 6vw, 72px); line-height: .95; color: var(--ink); margin: 0; }
.bf-unter { color: var(--mut); font-size: clamp(15px, 2vw, 17px); margin: 10px 0 0; text-wrap: pretty; }
.bf-kapitel .btn { margin-top: 14px; }
/* Das Blatt steht rechts, in voller Höhe, ohne Beschnitt. --verh ist Breite durch Höhe. */
.bf-blatt { position: absolute; inset: 0 8vw 0 auto; margin: auto 0; height: 72svh; width: calc(72svh * var(--verh, 0.6)); max-width: 44vw; will-change: transform, opacity; opacity: 0; }
.bf-blatt img { width: 100%; height: 100%; object-fit: contain; display: block; }
.bf-schrift { position: absolute; right: 8vw; bottom: 6vh; text-align: right; max-width: 40ch; opacity: 0; }
.bf-nr { display: block; font-family: var(--fd); font-weight: var(--wtd); text-transform: var(--ttd); font-size: 22px; color: var(--annot); }
.bf-t { display: block; font-weight: 500; }
.bf-m { display: block; color: var(--mut); font-size: 15.5px; }
.bf-hinweis { position: absolute; left: 50%; bottom: 18px; margin-left: -22px; display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--mut); font-size: 13px; }
.bf-hinweis i { display: block; width: 1px; height: 26px; background: var(--mut); }
.bf[data-stand="still"] .bf-buehne { position: static; height: auto; overflow: visible; padding: var(--sp) 0; }
.bf[data-stand="still"] .bf-kapitel { position: static; max-width: var(--mw); margin: 0 auto 28px; padding: 0 clamp(16px,4vw,40px); }
.bf[data-stand="still"] .bf-reihe { display: flex; gap: var(--gg); overflow-x: auto; max-width: var(--mw); margin: 0 auto; padding: 0 clamp(16px,4vw,40px) 12px; }
.bf[data-stand="still"] .bf-stueck { display: block; flex: 0 0 auto; }
.bf[data-stand="still"] .bf-blatt { position: static; margin: 0; height: min(52vh, 480px); width: calc(min(52vh, 480px) * var(--verh, 0.6)); max-width: 80vw; opacity: 1; will-change: auto; }
.bf[data-stand="still"] .bf-schrift { position: static; opacity: 1; text-align: left; margin-top: 8px; max-width: none; }
.bf[data-stand="still"] .bf-hinweis { display: none; }
@media (max-width: 700px) {
  .bf-blatt { inset: 0; margin: auto; height: 56svh; width: calc(56svh * var(--verh, 0.6)); max-width: 88vw; }
  .bf-kapitel { left: 6vw; right: 6vw; top: 9svh; bottom: auto; max-width: none; }
  .bf-schrift { left: 6vw; right: 6vw; bottom: 4svh; text-align: left; }
}
```

- [ ] **Step 4: `js/blattfolge.js`**

```js
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
    const mobil = innerWidth <= 700, dezent = B.m() < 1;
    const je = dezent ? 55 : mobil ? 60 : 70;
    halter.style.height = Math.max(200, N * je + 100) + 'svh';
    const vh = innerHeight, w = 1 / N;
    stuecke.forEach(s => {
      const t0 = s.i * w, letzte = s.i === N - 1, dreh = DREH[s.i % DREH.length];
      /* Eintritt 30 % des Fensters, Halten, Austritt 22 %: kürzer als der Eintritt. */
      if (letzte) {
        binden(s.blatt, { y: [0.7 * vh, 0.7 * vh, 0, 0], rotate: [dreh, dreh, 0, 0], scale: [0.92, 0.92, 1, 1], opacity: [0, 0, 1, 1] }, [0, t0, t0 + 0.3 * w, 1]);
        binden(s.schrift, { opacity: [0, 0, 1, 1], y: [8, 8, 0, 0] }, [0, t0 + 0.2 * w, t0 + 0.34 * w, 1]);
      } else {
        binden(s.blatt, { y: [0.7 * vh, 0.7 * vh, 0, 0, -0.6 * vh, -0.6 * vh], rotate: [dreh, dreh, 0, 0, 0, 0], scale: [0.92, 0.92, 1, 1, 1.04, 1.04], opacity: [0, 0, 1, 1, 0, 0] }, [0, t0, t0 + 0.3 * w, t0 + 0.78 * w, t0 + w, 1]);
        binden(s.schrift, { opacity: [0, 0, 1, 1, 0, 0], y: [8, 8, 0, 0, -6, -6] }, [0, t0 + 0.2 * w, t0 + 0.34 * w, t0 + 0.78 * w, t0 + 0.88 * w, 1]);
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
```

Hinweis für `js/site.js`: Der `sequenz-select`-Zuhörer bleibt unverändert und funktioniert, weil das Ereignis bubbelt.

- [ ] **Step 5: Prüfen, ansehen, Commit**

Run: `NODE_PATH=/opt/node22/lib/node_modules node scripts/pruefen.mjs --bilder`
Expected: alles `ok`, Konsole ohne jede Warnung (three.js ist weg). Ansehen: `pruefung/blattfolge-zweites-schreibtisch.png` (ein Blatt rechts, Beschriftung darunter, Kapitel links unten, kein zweites Blatt), `…-uebergang-…` (Blatt auf dem Weg hinaus, verblassend, noch nichts Neues), `…-ende-…` (letztes Blatt steht), dieselben für `telefon` (Kapitel oben, Blatt mittig, Beschriftung unten, nichts überlappt den Titel).

```bash
git add index.html css/site.css js/blattfolge.js js/site.js scripts/pruefen.mjs
git rm -q js/werk-sequenz.js vendor/three.module.min.js
git commit -m "Blattfolge: ein Blatt nach dem anderen, scrollgeführt mit Motion; three.js raus"
```

---

### Aufgabe 4: Die Tropfspur — an den Rand, mit Feder (`js/tropfspur.js`)

**Files:**
- Modify: `js/tropfspur.js`
- Modify: `scripts/pruefen.mjs`

**Interfaces:**
- Consumes: `LUKE.bewegung.M, m()`; `.hero-fig` als Ansatz; `.wrap` in `#werke` für die rechte Kante.
- Produces: `LUKE.tropfspur = { auffrischen, zeichnen }` wie bisher.

- [ ] **Step 1: Prüfungen ergänzen**

```js
pruefung('tropfspur: läuft am rechten Rand, nicht durch den Text', 'beide', async (page, t) => {
  await t.durchscrollen(); await t.warten(1400);
  const r = await page.evaluate(() => {
    const h = document.getElementById('tropfspur'), p = h && h.querySelector('path');
    if (!h || !p || h.hidden) return null;
    const links = h.getBoundingClientRect().left + scrollX;
    const L = p.getTotalLength();
    const x = a => links + p.getPointAtLength(L * a).x;
    const wrap = document.querySelector('#werke .wrap').getBoundingClientRect();
    return { x0: x(0), x50: x(0.5), x95: x(0.95), wrapRechts: wrap.right + scrollX, breite: innerWidth,
      dash: parseFloat(getComputedStyle(p).strokeDashoffset), L };
  });
  t.ok(r, 'Spur fehlt oder ist versteckt');
  if (!r) return;
  if (t.mobil) t.ok(r.x50 >= r.breite - 40, 'Spur an der rechten Kante (Telefon): ' + Math.round(r.x50));
  else t.ok(r.x50 >= r.wrapRechts + 20 && r.x50 <= r.breite - 10, 'Spur rechts neben dem Inhalt: ' + Math.round(r.x50) + ' bei Kante ' + Math.round(r.wrapRechts));
  t.ok(Math.abs(r.x95 - r.x50) < 40, 'Spur bleibt am Rand');
  t.ok(r.x0 < r.x50 - 100, 'Spur setzt am Strang an und findet den Rand: ' + Math.round(r.x0) + ' → ' + Math.round(r.x50));
  t.ok(r.dash < r.L * 0.1, 'Spur ist unten fast ganz gelaufen: ' + Math.round(r.dash) + ' von ' + Math.round(r.L));
  await t.bild('tropfspur-unten');
});

pruefung('tropfspur: ohne Bewegung versteckt', 'schreibtisch', async (page, t) => {
  t.ok(await page.evaluate(() => document.getElementById('tropfspur').hidden), 'Spur muss bei reduzierter Bewegung versteckt sein');
}, { ruhig: true });
```

Run: `… --nur=tropfspur` → Expected: FEHLT (die Spur läuft heute senkrecht unter dem Strang, `x0 < x50 − 100` scheitert).

- [ ] **Step 2: `js/tropfspur.js` umbauen**

Kopfkommentar ergänzen: „Neu: Die Spur findet innerhalb der Blattfolge den rechten Rand und läuft dort weiter — sie lief vorher mitten durch den Text der Handschrift, über das Formular und das Atelierfoto. Der Text ist die Hauptsache. Angetrieben wird sie von Motion: `scroll()` liest den Fortschritt, ein `springValue` läuft ihm einen Hauch nach, wie Flüssigkeit.“

Konstanten und Zustand: `STRANG_X`, `STRANG_Y`, `SPRITZER` bleiben. Neu oben:

```js
  const B = L.bewegung, M = B && B.M;
  let x0 = 0, x1 = 0, drift = 0;   // Ansatz, Randlage, Höhe der S-Kurve — in Koordinaten des SVG
```

`pfadDaten` ersetzen:

```js
  /* Vom Ansatz in einer S-Kurve an den Rand, dann die leicht wandernde Linie senkrecht
     weiter. Ganz gerade sähe sie nach Balken aus, zu wellig nach Dekoration. */
  function pfadDaten(h) {
    let d = `M ${x0} 0 C ${x0} ${(drift * 0.55).toFixed(1)} ${x1} ${(drift * 0.45).toFixed(1)} ${x1} ${drift}`;
    const rest = h - drift;
    const schritte = Math.max(6, Math.round(rest / 260));
    for (let i = 1; i <= schritte; i++) {
      const y = drift + (rest * i) / schritte, y0 = drift + (rest * (i - 1)) / schritte;
      const ab = Math.sin(i * 1.7) * 9 + Math.sin(i * 0.6) * 5;
      const ab0 = Math.sin((i - 1) * 1.7) * 9 + Math.sin((i - 1) * 0.6) * 5;
      d += ` C ${x1 + ab0} ${y0 + (y - y0) * 0.4} ${x1 + ab} ${y - (y - y0) * 0.4} ${x1 + ab} ${y}`;
    }
    return d;
  }
```

In `messen()` nach `oben = …` und `hoehe = …`:

```js
    /* Der Rand: ab 900 px rechts neben der .wrap, darunter an der Kante des Fensters. */
    const wrap = document.querySelector('#werke .wrap') || document.querySelector('.wrap');
    const wrapRechts = wrap ? wrap.getBoundingClientRect().right + window.scrollX : innerWidth;
    const randX = innerWidth >= 900 ? Math.min(wrapRechts + 56, innerWidth - 24) : innerWidth - 18;
    drift = Math.round(Math.min(hoehe * 0.12, innerHeight * 1.2));
    const links = Math.round(Math.min(seitenX, randX) - 110);
    breite = Math.round(Math.abs(randX - seitenX) + 220);
    x0 = seitenX - links; x1 = randX - links;
```

und die alten Zeilen `const links = Math.round(seitenX - breite / 2);` sowie `pfad.setAttribute('d', pfadDaten(hoehe, breite / 2));` entsprechend durch `pfad.setAttribute('d', pfadDaten(hoehe));` ersetzen (`breite` ist jetzt eine `let`-Variable ohne festen Anfangswert 220 — Deklaration anpassen).

`zeichnen()` nimmt den Stand als Argument statt ihn aus `scrollY` zu rechnen:

```js
  function zeichnen(stand) {
    if (!laenge || !docHoehe) return;
    if (typeof stand !== 'number') stand = spur ? spur.get() : 0;
    stand = Math.max(0, Math.min(1, stand));
    if (Math.abs(stand - letzterStand) < 0.0008) return;
    letzterStand = stand;

    pfad.style.strokeDashoffset = String(laenge * (1 - stand));
    /* Der Tropfen hängt am unteren Ende der bereits gelaufenen Spur. */
    const p = pfad.getPointAtLength(Math.max(1, laenge * stand));
    const wachsen = 2.2 + Math.min(1.8, stand * 2.4);
    tropfen.setAttribute('d', tropfenForm(p.x, p.y, wachsen));
    tropfen.setAttribute('opacity', stand > 0.004 ? '1' : '0');

    spritzer.forEach((s) => {
      /* Ein Spritzer wird sichtbar, sobald die Spur an ihm vorbei ist, und bleibt stehen.
         Geschrieben wird nur, wenn sich der Wert wirklich ändert. */
      const deck = stand > s.bei ? String(Math.min(1, (stand - s.bei) * 14) * 0.85) : '0';
      if (deck !== s.deck) { s.deck = deck; s.g.setAttribute('opacity', deck); }
    });
  }
  /* Der Stand aus der Scrollposition, dieselbe Abbildung wie bisher. */
  function standAus(y) {
    const max = docHoehe - innerHeight;
    return max > 0 ? (y - oben * 0.35) / (max - oben * 0.35 + 1) : 0;
  }
```

`an()` prüft zusätzlich `if (!M || !B.m()) return false;`. Der Antrieb, anstelle von `if (L.motion && …) L.motion.on(zeichnen); else addEventListener('scroll', …)`:

```js
  /* Der Antrieb: scroll() liest den Fortschritt, die Feder läuft ihm nach. Ohne Motion gibt
     es keine Spur — dann ist auch sonst nichts in Bewegung. */
  let stand = null, spur = null;
  if (M) {
    stand = M.motionValue(0);
    spur = M.springValue(stand, { stiffness: 120, damping: 28 });
    spur.on('change', zeichnen);
    M.scroll((p, info) => { stand.set(standAus(info.y.current)); });
  }
```

`auffrischen()` ruft am Ende `zeichnen(spur ? spur.get() : 0)` auf; `L.tropfspur = { auffrischen, zeichnen }` bleibt. Die Zeile `if (prm) halter.dataset.ruhig = 'an';` bleibt.

- [ ] **Step 3: Prüfen, ansehen, Commit**

Run: `NODE_PATH=/opt/node22/lib/node_modules node scripts/pruefen.mjs --bilder`
Expected: alles `ok`. `pruefung/tropfspur-unten-schreibtisch.png`: die Spur läuft rechts neben dem Inhalt, der Tropfen hängt unten; `pruefung/abschnitt-handschrift-schreibtisch.png`: kein Rot mehr im Text; `…-anfrage-…`, `…-studio-…`: kein Rot über Formular oder Foto; `pruefung/tropfspur-unten-telefon.png`: Spur an der rechten Kante.

```bash
git add js/tropfspur.js scripts/pruefen.mjs
git commit -m "Tropfspur: findet den rechten Rand und läuft dem Lesen mit einer Feder nach"
```

---

### Aufgabe 5: Werke — Reiter, abgelegte Blätter, Heben, Filtern, Waschung, drei Spalten

**Files:**
- Modify: `js/site.js` (Reiter, `renderGrid`, FLIP, `washAnim`, `setTraeger`, `setLayout`, `chip`)
- Modify: `css/site.css` (Blöcke „Werke“, „Umbrüche“)
- Modify: `scripts/pruefen.mjs`

**Interfaces:**
- Consumes: `LUKE.bewegung` (`M, m(), tempo(), feder, eintritt, sofort, heben`); `B` und `M` stehen seit Aufgabe 1 oben in `site.js`.
- Produces: `.g-item` trägt `data-eintritt="blatt"` und `data-versatz` (Spalte); `--dreh` je Blatt im Stylesheet.

- [ ] **Step 1: Prüfungen ergänzen**

```js
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
});

pruefung('werke: Hover hebt das Bildfeld, nicht mehr', 'schreibtisch', async (page, t) => {
  await t.zu((await t.abschnitte()).find(a => a.id === 'werke').oben - 40); await t.warten(1600);
  const box = await page.locator('.g-item').first().boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await t.warten(800);
  const tf = await page.evaluate(() => document.querySelector('.g-item .g-ph').style.transform);
  t.ok(/translateY\(-(3|4)(\.\d+)?px\)/.test(tf), 'Bildfeld hebt sich um 4 px: ' + JSON.stringify(tf));
  await page.mouse.move(2, 2); await t.warten(800);
  const tf2 = await page.evaluate(() => document.querySelector('.g-item .g-ph').style.transform);
  t.ok(!tf2 || /translateY\(0px\)|^none$/.test(tf2), 'senkt sich wieder: ' + JSON.stringify(tf2));
});
```

Run: `… --nur=werke` → Expected: FEHLT.

- [ ] **Step 2: Stylesheet**

Im Block „Werke“:
- `.tr-schiene { … transition: transform …, width …, background-color … }` → `transition` streichen (die Schiene gleitet mit Motion); `.app[data-bewegung="aus"] .tr-schiene { transition: none; }` löschen.
- `.tr-tab { … transition: opacity …, border-color … }` → belassen (Zustand, keine Bewegung).
- Neu, hinter `.g-item { … }`:

```css
/* Jedes Blatt legt sich mit eigener Schräge ab und richtet sich gerade (js/bewegung.js liest
   --dreh). Das Bildfeld ist das, was Hover hebt — nicht der ganze Kasten, damit die
   Werkstatt-Richtung ihre Drehung auf .tin behält. */
.g-item:nth-child(3n+1) { --dreh: -1.1deg; }
.g-item:nth-child(3n+2) { --dreh: 0.8deg; }
.g-item:nth-child(3n) { --dreh: 1.4deg; }
.g-ph { will-change: transform; }
```

- `.tin { display: block; transition: … }` bleibt (nur die Werkstatt-Richtung nutzt sie beim Hover).
- Im Block „Umbrüche“, ganz oben, vor `@media (max-width: 900px)`:

```css
/* Sechs Hochformate in zwei Spalten machen die Seite lang; groß zeigt die Blattfolge die
   Blätter ohnehin. Das Verzeichnis ist zum Ordnen da. */
@media (min-width: 1100px) { .app[data-richtung="a"] { --cols: 3; } }
```

- [ ] **Step 3: `js/site.js`**

`schieneSetzen` ersetzen:

```js
  /* Die Linie unter den Reitern gleitet mit einer Feder von einem zum nächsten. Beim ersten
     Zeichnen und nach Größenänderungen wird sie gesetzt, nicht bewegt. */
  function schieneSetzen(sofort) {
    const leiste = $('#tr-tabs'), schiene = $('.tr-schiene', leiste);
    const aktiv = $('.tr-tab[aria-pressed="true"]', leiste);
    if (!schiene || !aktiv) return;
    const ziel = { x: aktiv.offsetLeft, width: aktiv.offsetWidth };
    if (sofort === true || !M || !mScale()) { schiene.style.transform = `translateX(${ziel.x}px)`; schiene.style.width = ziel.width + 'px'; return; }
    M.animate(schiene, ziel, B.feder.gesetzt);
  }
  addEventListener('resize', () => schieneSetzen(true), { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => schieneSetzen(true));
```

In `renderTabs()` am Ende `schieneSetzen(true)` beim ersten Zeichnen; in `setTraeger` nach `apply()` gleitet sie (`renderWerke` → `renderTabs` zeichnet neu, also dort `schieneSetzen(true)` lassen und in `setTraeger` vor `apply()` die Schiene nicht anfassen — die Reiter werden beim Trägerwechsel ohnehin neu gezeichnet; die Feder greift im Klick-Zuhörer: erst `aria-pressed` umsetzen, `schieneSetzen()` ohne `true`, dann `setTraeger`).

Im Klick-Zuhörer der Reiter:

```js
  $('#tr-tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tr]'); if (!b) return;
    $$('.tr-tab').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    schieneSetzen();
    setTraeger(b.dataset.tr);
  });
```

`renderGrid()`: die Zahl der Spalten lesen und jedem Blatt Eintritt und Versatz geben; danach Heben anmelden:

```js
    const cols = Math.max(1, parseInt(getComputedStyle(app).getPropertyValue('--cols'), 10) || 2);
    gl.innerHTML = list.map((w, i) => `<button type="button" class="g-item rv" data-eintritt="blatt" data-versatz="${i % cols}" data-fid="${w.id}" aria-label="${esc(altText(w))}"><span class="tin"><span class="cnr" aria-hidden="true">${w.nr}</span><span class="g-ph" style="aspect-ratio:${ratio(w)};">${bildHTML(w, '(max-width: 540px) 92vw, (max-width: 900px) 46vw, 380px')}</span><span class="g-meta"><span class="g-t">${esc(w.t)}</span><span class="g-m">${esc(meta(w))}</span></span></span></button>`).join('');
    if (B) B.heben($$('.g-item', gl), { um: 4, feld: '.g-ph' });
```

FLIP, Austritt, Filtern und Layout:

```js
  /* Übergänge der Galerie. Was verschwindet, geht zuerst, und zwar schneller als es kam;
     dann wird neu gezeichnet; was bleibt, gleitet an seinen neuen Platz (FLIP), was neu ist,
     hebt sich kurz. Die neuen Blätter werden hier gezeigt, nicht vom Enthüllen: zwei
     Bewegungen auf einer transform überschrieben sich. */
  let rects = null;
  function flipStart() { rects = {}; $$('.g-item').forEach(el => { rects[el.dataset.fid] = el.getBoundingClientRect(); }); }
  function flipPlay() {
    const s = mScale(); if (!s || !M) { $$('.g-item').forEach(el => B.sofort(el)); return; }
    const t = B.tempo(); let neu = 0;
    $$('.g-item').forEach(el => {
      const r0 = rects && rects[el.dataset.fid], r1 = el.getBoundingClientRect();
      B.sofort(el);
      if (!r0) {
        M.animate(el, { opacity: [0, 1], y: [16, 0] }, { duration: t.dauer * 0.6 * s, delay: Math.min(neu++, 6) * 0.05 * s, ease: t.kurve })
          .then(() => { el.style.opacity = ''; el.style.transform = ''; });
        return;
      }
      const dx = r0.left - r1.left, dy = r0.top - r1.top, sw = r0.width / r1.width;
      if (Math.abs(dx) + Math.abs(dy) > 1 || Math.abs(sw - 1) > 0.01) {
        el.style.transformOrigin = '0 0';
        M.animate(el, { x: [dx, 0], y: [dy, 0], scale: [sw, 1] }, B.feder.gesetzt).then(() => { el.style.transform = ''; });
      }
    });
  }
  async function austritt(bleiben) {
    const s = mScale(); if (!s || !M) return;
    const weg = $$('.g-item').filter(el => !bleiben.has(el.dataset.fid));
    if (weg.length) await M.animate(weg, { opacity: 0, scale: 0.98 }, { duration: B.tempo().kurz * 0.5 * s, ease: B.tempo().kurve });
  }
  async function chip(patch) {
    const vorher = Object.assign({}, S);
    Object.assign(S, patch);
    const bleiben = new Set(filtered().map(w => w.id));
    Object.assign(S, vorher);
    await austritt(bleiben);
    flipStart(); Object.assign(S, patch); renderChips(); renderGrid(); flipPlay();
  }
  function setLayout(k) { if (k === S.layout) return; flipStart(); S.layout = k; $('#g-list').dataset.layout = k; zaehlerNachfuehren(); flipPlay(); }
```

Waschung und Trägerwechsel:

```js
  /* Die Waschung beim Trägerwechsel, je Richtung: A zieht Tusche von oben herunter, B blendet
     ins Schwarz, C schiebt ein Blatt von links. Gebaut mit Motion, Dauern aus tempo(). */
  function washAnim(w, ein) {
    const t = B.tempo(), s = Math.max(mScale(), 0.01), r = S.richtung;
    const dauer = (ein ? t.wasch.ein : t.wasch.aus) * s;
    if (r === 'b') { w.style.transform = 'none'; w.style.background = '#000'; return M.animate(w, { opacity: ein ? [0, 1] : [1, 0] }, { duration: dauer, ease: t.kurve }); }
    if (r === 'c') { w.style.background = 'var(--sheet)'; w.style.transformOrigin = ein ? '0 50%' : '100% 50%'; return M.animate(w, { scaleX: ein ? [0, 1] : [1, 0] }, { duration: dauer, ease: t.kurve }); }
    w.style.background = 'var(--ink)'; w.style.transformOrigin = ein ? '50% 0%' : '50% 100%';
    return M.animate(w, { scaleY: ein ? [0, 1] : [1, 0] }, { duration: dauer, ease: t.kurve });
  }
  function setTraeger(tr, sofort) {
    if (tr === S.traeger) return;
    const s = mScale(), wash = $('#gwash');
    const apply = () => { Object.assign(S, { traeger: tr, fOrt: null, fMotiv: null, fSerie: null, fJahr: null }); renderWerke(); };
    if (sofort || !s || !M || !wash) { apply(); return; }
    washAnim(wash, true).then(() => {
      apply();
      const t = B.tempo(), items = $$('.g-item');
      items.forEach(el => B.sofort(el));
      washAnim(wash, false);
      items.forEach((el, k) => M.animate(el, B.eintritt(el), { duration: t.dauer * 0.5 * s, delay: (t.wasch.aus * 0.55 + Math.min(k * 0.032, 0.2)) * s, ease: t.kurve })
        .then(() => { el.style.opacity = ''; el.style.transform = ''; el.style.clipPath = ''; el.style.filter = ''; }));
    });
  }
```

`TEMPO` und `tempo()` in `site.js` (die alte Tabelle mit `washIn`, `eFlip` …) löschen — das Tempo wohnt in `js/bewegung.js`.

- [ ] **Step 4: Prüfen, ansehen, Commit**

Run: `NODE_PATH=/opt/node22/lib/node_modules node scripts/pruefen.mjs --bilder`
Expected: alles `ok`. Ansehen: `pruefung/werke-abgelegt-schreibtisch.png` (drei Spalten, sechs Blätter, keins schief stehen geblieben), `pruefung/werke-gefiltert-schreibtisch.png` (zwei Köpfe, nichts halb verblasst), `pruefung/abschnitt-werke-telefon.png` (Schiene, ein Blatt in der Mitte, Zähler „1 von 6“).

```bash
git add js/site.js css/site.css scripts/pruefen.mjs
git commit -m "Werke: Blätter legen sich ab, die Schiene gleitet, Filtern mit Austritt und FLIP, drei Spalten"
```

---

### Aufgabe 6: Die Werkansicht — vom Blatt her, zum Blatt zurück

**Files:**
- Modify: `js/site.js` (`animateOvIn`, `closeOv`, `ovStep`, `openWerk`)
- Modify: `scripts/pruefen.mjs`

**Interfaces:**
- Consumes: `LUKE.bewegung` (`M, tempo(), feder`), `rect0` (Rechteck des Bildfelds beim Öffnen), `ret` (Knopf, zu dem der Fokus zurückkehrt).

- [ ] **Step 1: Prüfung ergänzen**

```js
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
```

Run: `… --nur=werkansicht` → Expected: FEHLT (heute schließt der Dialog sofort).

- [ ] **Step 2: `js/site.js`**

```js
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
      M.animate(fig, { x: [rect0.left - r1.left, 0], y: [rect0.top - r1.top, 0], scale: [rect0.width / r1.width, 1] }, B.feder.gesetzt)
        .then(() => { fig.style.transform = ''; });
    } else if (fig) M.animate(fig, { opacity: [0, 1], scale: [0.97, 1] }, { duration: t.ansicht * 0.65 * s, ease: t.kurve });
    const teile = info ? Array.from(info.children) : [];
    if (teile.length) M.animate(teile, { opacity: [0, 1], y: [12, 0] }, { duration: t.dauer * 0.5 * s, delay: M.stagger(0.05 * s, { startDelay: 0.15 * s }), ease: t.kurve });
  }

  /* Schließen: umgekehrt und kürzer. Der Dialog bleibt, bis das Bild zurück am Blatt ist;
     erst dann geht er aus dem Dokument und der Fokus zurück. */
  let schliesst = false;
  async function closeOv() {
    if (schliesst || S.open == null) return;
    schliesst = true;
    const s = mScale(), t = B.tempo();
    const fig = $('#ov-fig'), bg = $('#ov-bg'), info = $('.ov-info');
    if (s && M) {
      const ziel = ret && ret.querySelector('.g-ph, .gr-ph');
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
    S.open = null; renderOverlay(); schliesst = false;
    if (ret) ret.focus();
  }

  /* Blättern: das alte Bild geht kurz zur Seite, das neue kommt von der anderen. */
  async function ovStep(dir) {
    const list = ovListe(finde(S.open)); if (!list.length || schliesst) return;
    const i = list.findIndex(w => w.id === S.open);
    const nx = list[(i + dir + list.length) % list.length];
    const s = mScale(), t = B.tempo(), fig = $('#ov-fig');
    if (s && M && fig) await M.animate(fig, { opacity: 0, x: -14 * dir }, { duration: 0.18 * s, ease: t.kurve });
    rect0 = null; S.open = nx.id; renderOverlay();
    if (s && M) {
      const f2 = $('#ov-fig'), zeilen = [$('.ov-info h3'), $('.ov-rows')].filter(Boolean);
      if (f2) M.animate(f2, { opacity: [0, 1], x: [14 * dir, 0] }, { duration: 0.35 * s, ease: t.kurve }).then(() => { f2.style.transform = ''; });
      if (zeilen.length) M.animate(zeilen, { opacity: [0, 1] }, { duration: 0.3 * s, ease: t.kurve });
    }
    const c = $('#ov-close'); if (c) c.focus();
  }
```

`openWerk` bleibt; der Klick-Zuhörer auf `#ov-root` und der `keydown`-Zuhörer rufen `closeOv()` und `ovStep()` wie bisher (sie geben jetzt Promises zurück, das stört nicht).

- [ ] **Step 3: Prüfen, ansehen, Commit**

Run: `NODE_PATH=/opt/node22/lib/node_modules node scripts/pruefen.mjs --bilder` → alles `ok`; `pruefung/werkansicht-schreibtisch.png` und `-telefon.png` ansehen (Bild ganz, Zeilen lesbar, Knöpfe da).

```bash
git add js/site.js scripts/pruefen.mjs
git commit -m "Werkansicht: fliegt vom Blatt her, blättert seitwärts, schließt zum Blatt zurück"
```

---

### Aufgabe 7: Die Abschnitte — Aktuell, Handschrift, Grafik, Anfrage, Studio (`js/abschnitte.js`)

**Files:**
- Create: `js/abschnitte.js`
- Modify: `index.html` (Aktuell, Handschrift-Video, Formular, Studio-Figur, Teamliste; Skript)
- Modify: `css/site.css` (Aktuell-Linien, Flash-Reste, Studio-Rahmen, Team-Linien)
- Modify: `js/site.js` (`band()` raus, `renderGrafik`, `renderFlash`, `showErr`, `done`)
- Modify: `scripts/pruefen.mjs`

**Interfaces:**
- Consumes: `LUKE.bewegung` (`M, m(), tempo(), zeigen, sofort, strich, heben`). Markup-Vertrag aus Aufgabe 1: `.rv[data-eigen]` wird vom automatischen Enthüllen übersprungen und hier selbst gezeigt.

- [ ] **Step 1: Prüfungen ergänzen**

```js
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
```

Run: `… --nur=abschnitte` und `… --nur=anfrage` → Expected: FEHLT.

- [ ] **Step 2: Markup in `index.html`**

Aktuell (die Zeile bekommt kein `.rv` mehr, ihre drei Teile schon, mit `data-eigen`):

```html
    <section id="aktuell">
      <div class="wrap aktuell-row">
        <div class="a mut rv" data-eigen>Aktuell, bis 27. September</div>
        <div class="b rv" data-eigen>Zwei Arbeiten in der Gruppenausstellung „Red“: <em>Befreiung der Körperlichkeit</em>, Werk I und Werk II. Stage Gallery, Köln.</div>
        <div class="c mut rv" data-eigen>Vernissage 23. September, 19–21 Uhr. Danach Do–Fr 14–18 Uhr, So 14–17 Uhr.</div>
      </div>
    </section>
```

Handschrift: `<video class="band-video ink-img rv" data-eintritt="block" …>` (sonst unverändert).

Anfrage: `<form id="af-form" class="field rv" data-eintritt="block" novalidate>`.

Studio-Figur (drei Elemente, drei Bewegungen: Parallaxe auf der Figur, Eintritt auf dem Rahmen, Wachsen auf dem Bild):

```html
          <figure class="studio-fig" data-depth="0.07">
            <div class="studio-rahmen rv" data-eintritt="block">
              <img src="assets/img/luke-atelier-1200.jpg"
                   srcset="assets/img/luke-atelier-800.jpg 800w, assets/img/luke-atelier-1200.jpg 1200w, assets/img/luke-atelier-1536.jpg 1536w"
                   sizes="(max-width: 900px) 90vw, 40vw"
                   width="1536" height="2048" loading="lazy" decoding="async"
                   alt="Luke im Atelier: mit Pinsel und Palette vor der Staffelei, im Hintergrund Regale mit Farben">
            </div>
            <figcaption>Im Atelier, Bluthandwerk Köln-Ehrenfeld.</figcaption>
          </figure>
          <div class="card rv" data-eintritt="block">
```

Teamliste: jedes `<li class="rv">` wird `<li class="rv" data-eigen>`. Skript: `<script src="js/abschnitte.js"></script>` nach `js/site.js`, vor `js/tropfspur.js`.

- [ ] **Step 3: Stylesheet**

Aktuell: `#aktuell { border-top: …; border-bottom: …; }` ersetzen durch

```css
/* Zwei Linien, die von links wachsen (--strich, js/abschnitte.js). Ein Vermerk am Rand. */
#aktuell { position: relative; }
#aktuell::before, #aktuell::after { content: ''; position: absolute; left: 0; right: 0; height: 1px; background: var(--line); transform: scaleX(var(--strich, 1)); transform-origin: 0 50%; }
#aktuell::before { top: 0; }
#aktuell::after { bottom: 0; }
```

Flash: die beiden Regeln `.app[data-richtung="a"] .sheet.rv { clip-path: none; transform: … }` und `.app[data-richtung="a"] .sheet.rv.on { transform: none; }` löschen (der Eintritt „blatt“ übernimmt), die `--dreh`-Regeln der `.flash-grid .sheet:nth-child(…)` bleiben. `.sheet { … transition: transform …, background-color …, border-color … }` → `transition` auf `background-color` und `border-color` beschränken.

Studio: `.studio-fig img { width: 100%; height: auto; }` ersetzen durch

```css
.studio-rahmen { overflow: hidden; }
.studio-rahmen img { width: 100%; height: auto; display: block; will-change: transform; transform-origin: 50% 50%; }
```

Team: `.team li { display: flex; …; border-bottom: 1px solid var(--line); padding: 7px 0; }` → `border-bottom` weg, `position: relative` dazu, und

```css
.team li::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: var(--line); transform: scaleX(var(--strich, 1)); transform-origin: 0 50%; }
```

- [ ] **Step 4: `js/abschnitte.js`**

```js
/* Die kleinen Bewegungen der Abschnitte. Jede kommt aus dem Material: eine Linie, die
   weiterläuft (Aktuell, Teamliste), eine Zeichnung, die der Leser zieht (Handschrift), ein
   Foto, das beim Scrollen kaum merklich näher kommt (Studio). Was hier gezeigt wird, trägt
   data-eigen und wird vom automatischen Enthüllen übersprungen. */
(function () {
  'use strict';
  const L = (window.LUKE = window.LUKE || {});
  const B = L.bewegung, M = B && B.M;
  if (!B) return;
  const s = () => B.m();

  /* Aktuell: erst die Linien, 0,35 s später der Text, gestaffelt. */
  (function aktuell() {
    const sec = document.getElementById('aktuell'); if (!sec) return;
    const teile = Array.from(sec.querySelectorAll('.rv[data-eigen]'));
    if (!M || !s()) { teile.forEach(el => B.sofort(el)); B.strich(sec); return; }
    sec.style.setProperty('--strich', '0');
    const stop = M.inView(sec, () => {
      stop();
      B.strich(sec, { dauer: 1.1 });
      teile.forEach((el, i) => B.zeigen(el, { delay: (0.35 + i * B.tempo().versatz) * s() }));
    }, { amount: 0.4 });
  })();

  /* Handschrift: Die Zeichnung folgt dem Scrollen. Wer den Abschnitt hinunterliest, zieht
     die Linie mit und sieht die Signatur entstehen. Von „taucht unten auf“ bis „ist oben
     durch“ wird die Zeit im Clip; geschrieben wird nur bei einem Unterschied über 0,04 s. */
  (function band() {
    const v = document.querySelector('.band-video'), fig = v && v.closest('.band-fig');
    if (!v || !fig || !M || !s()) return;
    let kaputt = false;
    v.preload = 'auto'; v.pause();
    v.addEventListener('error', () => { kaputt = true; }, { once: true });
    M.scroll(p => {
      const dauer = v.duration;
      if (kaputt || !dauer || !isFinite(dauer)) return;
      const ziel = Math.max(0, Math.min(1, p)) * (dauer - 0.05);
      if (Math.abs(v.currentTime - ziel) < 0.04) return;
      try { v.currentTime = ziel; } catch (e) { /* Spulen noch nicht möglich */ }
    }, { target: fig, offset: ['start 0.92', 'end 0.2'] });
  })();

  /* Studio: Das Foto wird beim Scrollen ganz langsam größer, im Rahmen beschnitten. */
  (function studio() {
    const img = document.querySelector('.studio-rahmen img'), fig = img && img.closest('.studio-fig');
    if (!img || !fig || !M || !s()) return;
    M.scroll(M.animate(img, { scale: [1, 1.06] }, { ease: 'linear' }), { target: fig, offset: ['start end', 'end start'] });
  })();

  /* Team: Jede Zeile kommt mit ihrer Linie, die Linie einen Augenblick nach der Schrift. */
  (function team() {
    const liste = document.querySelector('.team'); if (!liste) return;
    const zeilen = Array.from(liste.querySelectorAll('li.rv[data-eigen]'));
    if (!M || !s()) { zeilen.forEach(li => { B.sofort(li); B.strich(li); }); return; }
    zeilen.forEach(li => li.style.setProperty('--strich', '0'));
    const stop = M.inView(liste, () => {
      stop();
      zeilen.forEach((li, i) => {
        const d = i * B.tempo().versatz * s();
        B.zeigen(li, { delay: d });
        B.strich(li, { delay: d + 0.1 * s(), dauer: 0.7 });
      });
    }, { amount: 0.3 });
  })();
})();
```

- [ ] **Step 5: `js/site.js`**

- Die IIFE `(function band() { … })();` und den Kommentar davor löschen (wohnt jetzt in `js/abschnitte.js`).
- `renderGrafik()`: `<button type="button" class="gr-item rv" data-eintritt="druck" data-versatz="${i % 2}" …>` (der `map`-Rückruf bekommt `(g, i)`), nach `el.innerHTML = …`: `if (B) B.heben($$('.gr-item', el), { um: 3, feld: '.gr-ph' });`.
- `renderFlash()`: `<div class="sheet rv${vergeben ? ' vergeben' : ''}" data-eintritt="blatt">`.
- `showErr(msg)`:

```js
  function showErr(msg) {
    const el = $('#af-err'); if (!el) return;
    el.textContent = msg; el.hidden = !msg;
    if (!msg) return;
    if (M && mScale()) M.animate(el, { opacity: [0, 1], x: [-8, 0] }, { duration: B.tempo().kurz * mScale(), ease: B.tempo().kurve }).then(() => { el.style.transform = ''; });
    el.focus();
  }
```

- `done(mode, text)`: nach `d.hidden = false; d.classList.add('rv', 'on');` → `if (B) B.sofort(d); if (M && mScale()) M.animate(d, { opacity: [0, 1], y: [12, 0] }, { duration: B.tempo().dauer * 0.6 * mScale(), ease: B.tempo().kurve }).then(() => { d.style.opacity = ''; d.style.transform = ''; });`

- [ ] **Step 6: Prüfen, ansehen, Commit**

Run: `NODE_PATH=/opt/node22/lib/node_modules node scripts/pruefen.mjs --bilder` → alles `ok`. Ansehen: `pruefung/abschnitt-aktuell-*.png` (zwei Linien, drei Texte), `abschnitt-handschrift-*` (Signatur, kein Rot im Text), `abschnitt-grafik-*` (Plakate gerade, nichts gedreht), `abschnitt-anfrage-*`, `abschnitt-studio-*` (Foto im Rahmen, Linien unter den Namen).

```bash
git add js/abschnitte.js index.html css/site.css js/site.js scripts/pruefen.mjs
git commit -m "Abschnitte: Linien, die weiterlaufen; das Band folgt dem Lesen; das Foto kommt näher"
```

---

### Aufgabe 8: Richtungen B und C, Bedienfeld, README und NOTES, Gesamtprüfung

**Files:**
- Modify: `scripts/pruefen.mjs`
- Modify: `README.md`, `NOTES.md`

- [ ] **Step 1: Prüfungen ergänzen**

```js
for (const r of ['b', 'c']) {
  pruefung(`richtung ${r}: alles kommt, Konsole leer`, 'beide', async (page, t) => {
    await t.durchscrollen(); await t.warten(2200);
    const fehlt = await page.evaluate(() => Array.from(document.querySelectorAll('.rv')).filter(el => {
      if (el.closest('[hidden]')) return false;
      const r = el.getBoundingClientRect();
      if (r.right <= 0 || r.left >= innerWidth) return false;
      return !el.classList.contains('on') || getComputedStyle(el).opacity !== '1';
    }).length);
    t.gleich(fehlt, 0, 'nicht enthüllt');
    await t.zu(0); await t.warten(600); await t.bild('richtung-' + r + '-oben');
    await t.zu((await t.abschnitte()).find(a => a.id === 'werke').oben - 40); await t.warten(1200); await t.bild('richtung-' + r + '-werke');
  }, { abfrage: '?richtung=' + r });
}

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
```

Run: `NODE_PATH=/opt/node22/lib/node_modules node scripts/pruefen.mjs --bilder` → alles `ok`. **Jedes** Bild unter `pruefung/` ansehen, in beiden Breiten. Was nicht stimmt, wird behoben und erneut geprüft.

- [ ] **Step 2: README und NOTES**

`README.md`:
- „Lokal ansehen“: Begründung „wegen der Modul-Ladung von three.js“ ersetzen durch „(die Videos brauchen Range-Anfragen, und `file://` kennt keine)“.
- „Aufbau“: Zeilen für `js/werk-sequenz.js`, `js/motion.js` und `vendor/ three.js` ersetzen durch

```
js/bewegung.js        Grundlage aller Bewegung: Motion, Stärke, Tempo je Richtung, Enthüllen, Parallaxe, Zeiger
js/auftakt.js         Der Auftakt: vier Ebenen in der Tiefe, Zeichenvideo, Schnitt, Blatt
js/blattfolge.js      Die Blattfolge: ein Blatt nach dem anderen, scrollgeführt
js/abschnitte.js      Kleine Bewegungen je Abschnitt: Aktuell, Handschrift, Studio
js/tropfspur.js       Die rote Spur, die aus dem Auftakt austritt, den Rand findet und mit dem Lesen mitläuft
vendor/motion/        Motion 13.2.0, lokal gehostet (siehe HERKUNFT.md)
scripts/pruefen.mjs   Prüft die Seite mit Playwright: Zusicherungen, leere Konsole, Bilder je Abschnitt
```

- Neuer Abschnitt „Bewegung“ (vor „Bewegtbild“):

```markdown
## Bewegung

Alles, was sich auf der Seite bewegt, ist mit [Motion](https://motion.dev) gebaut, das lokal unter
`vendor/motion/` liegt. `js/bewegung.js` ist die eine Stelle für Stärke, Tempo und Kurven je
Richtung; die Abschnitte fragen dort. Eintritte kommen beim Sichtbarwerden (`.rv`), scrollgebundene
Bewegung läuft über `ScrollTimeline`, wo der Browser sie kann. Bei „reduzierte Bewegung“ und mit
`?bewegung=aus` steht alles im Endzustand. Der Entwurf dazu:
`docs/superpowers/specs/2026-09-09-seite-mit-motion-design.md`.

Prüfen, mit Playwright:

    NODE_PATH=/opt/node22/lib/node_modules node scripts/pruefen.mjs --bilder

Das lädt die Seite in Chromium, scrollt sie durch, prüft Zusicherungen, verlangt eine leere
Konsole und legt Bilder je Abschnitt (1440 und 390 Pixel breit) unter `pruefung/` ab.
```

- „Bilder und Videos austauschen“, Absatz zum Auftakt: den Satz zum Remotion-Player streichen; neu: „Der Auftakt zeigt die Zeichnung in vier Ebenen mit Tiefe (`js/auftakt.js`); das Bündel des Remotion-Players wird von der Seite nicht mehr geladen, der Quelltext bleibt unter `video/` als Teil des Films.“
- „Richtungen und Bedienfeld“: „`sequenz=voll|still|aus`“ steht dort nicht — belassen; Satz zu „reduzierte Bewegung“ bleibt.
- „Bereits umgesetzt“ in `NOTES.md`: `three.js lokal aus vendor/…` ersetzen durch „Motion 13 lokal aus `vendor/motion/`, keine Bibliothek vom CDN“; den offenen Punkt zur leeren Blättersequenz („Zwischen Kapitel 1 und 2 …“) streichen (erledigt: die Blattfolge zeigt ein Blatt nach dem anderen); den Punkt „Sechs Papierblätter … lang“ als erledigt abhaken (drei Spalten ab 1100 px).

- [ ] **Step 3: Commit**

```bash
git add scripts/pruefen.mjs README.md NOTES.md
git commit -m "Prüfung für B, C und das Bedienfeld; README und NOTES zum neuen Aufbau"
```
