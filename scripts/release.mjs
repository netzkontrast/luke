#!/usr/bin/env node
/* Baut das Release-Bündel nach dist/ — den Ordner, der auf den Webspace hochgeladen wird.

   Die Quelle bleibt, wie sie ist: index.html lässt sich weiter direkt öffnen, kein Schritt
   dazwischen. Dieses Skript ist ein Ausgabeschritt, kein Entwicklungsschritt. Was hier
   entsteht, wird nie von Hand bearbeitet.

   Aufruf:
     npm install        einmalig, holt esbuild
     npm run release    baut dist/ neu
     npm run pruefen:dist   lässt dieselben Prüfungen gegen dist/ laufen

   Was passiert:
     JS       Zehn Dateien werden zu zwei Bündeln verkettet und minifiziert. Zwei, nicht eins,
              weil zwischen ihnen ein Inline-Block steht, der LUKE.ABSCHNITTE setzt; der muss
              an seiner Stelle bleiben. Verkettet wird in genau der Reihenfolge der
              <script>-Tags — die Dateien sind keine Module, sie reden über window.LUKE
              miteinander, und die Reihenfolge ist die ganze Abhängigkeitsverwaltung, die es
              hier gibt. Motion liegt mit im ersten Bündel: Es ist ein UMD-Bündel, das sich
              an globalThis hängt, Verketten ist also unbedenklich, und es spart eine Anfrage.
     CSS      site.css und fonts.css minifiziert. Die Pfade in fonts.css sind relativ zu ihrem
              eigenen Ort, darum bleibt die Datei liegen, wo sie liegt.
     HTML     Kommentare raus, Inline-Skripte minifiziert, Script-Tags auf die Bündel
              umgeschrieben. Die Erklärtexte im Quelltext sind für die Arbeit da, nicht für
              die Leitung.
     Assets   fonts, img und video vollständig. img wird aus js/bilder.js dynamisch nach Name
              und Breite adressiert — eine Referenzsuche im HTML würde Dateien übersehen.
     Raus     assets/original (23 MB Aufnahmen, wie sie kamen), assets/gif (7 MB für
              Instagram, von keiner Seite verlinkt), vendor/htmx und skizze.* (Werkstatt),
              video/, docs/, scripts/.
     .htaccess  Die Regeln aus vercel.json, übersetzt für Apache. Ohne sie liefert der Server
              15 MB ohne Cache-Vorgabe aus, und jeder Besuch lädt alles neu. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const PROJEKT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL = path.join(PROJEKT, 'dist');

/* Die Reihenfolge ist die aus index.html und darf nicht anders sein. Wer hier etwas
   verschiebt, verschiebt es dort mit. */
const BUENDEL = [
  { name: 'js/luke.min.js', teile: [
    'js/bilder.js', 'js/works.js', 'vendor/motion/motion-13.2.0.min.js',
    'js/bewegung.js', 'js/auftakt.js', 'js/blattfolge.js', 'js/site.js',
    'js/auge.js', 'js/abschnitte.js'
  ] },
  { name: 'js/welt.min.js', teile: ['js/weltzustand.js', 'js/tropfspur.js'] }
];

const SEITEN = ['index.html', 'impressum.html', 'datenschutz.html'];
const STILE = ['css/site.css', 'assets/fonts/fonts.css'];
const ORDNER = ['assets/fonts', 'assets/img', 'assets/video'];

const lies = p => fs.readFileSync(path.join(PROJEKT, p), 'utf8');
const schreib = (p, inhalt) => {
  const ziel = path.join(ZIEL, p);
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  fs.writeFileSync(ziel, inhalt);
  return Buffer.byteLength(inhalt);
};
const kb = n => (n / 1024).toFixed(1).replace('.', ',') + ' kB';

/* ---------- JavaScript ---------- */

async function js() {
  const zeilen = [];
  for (const { name, teile } of BUENDEL) {
    /* Ein Semikolon und ein Zeilenumbruch zwischen den Teilen: Die Dateien enden mal mit,
       mal ohne, und zwei aufeinanderfolgende IIFEs ohne Trenner werden als Aufruf gelesen. */
    const roh = teile.map(t => lies(t)).join('\n;\n');
    const { code } = await esbuild.transform(roh, { minify: true, legalComments: 'none' });
    const gross = teile.reduce((n, t) => n + fs.statSync(path.join(PROJEKT, t)).size, 0);
    zeilen.push({ name, vorher: gross, nachher: schreib(name, code), teile: teile.length });
  }
  return zeilen;
}

/* ---------- CSS ---------- */

async function css() {
  const zeilen = [];
  for (const datei of STILE) {
    const roh = lies(datei);
    const { code } = await esbuild.transform(roh, { loader: 'css', minify: true, legalComments: 'none' });
    zeilen.push({ name: datei, vorher: Buffer.byteLength(roh), nachher: schreib(datei, code) });
  }
  return zeilen;
}

/* ---------- HTML ---------- */

/* Die Script-Tags des ersten Bündels stehen am Stück; sie werden durch ein Tag ersetzt. Die
   des zweiten ebenso. Gesucht wird nach genau den Dateien aus BUENDEL, damit ein Tag, das
   hier niemand erwartet, auffällt statt stillzuliegen. */
function tagsErsetzen(html, buendel) {
  const quelle = t => `<script src="${t.replace(/^vendor\//, 'vendor/')}"></script>`;
  for (const { name, teile } of buendel) {
    const block = teile.map(quelle).join('\n');
    if (!html.includes(block)) {
      throw new Error(
        `Die Script-Tags für ${name} stehen in index.html nicht so beieinander, wie release.mjs es erwartet.\n` +
        `Gesucht:\n${block}\n\nWenn die Seite umgebaut wurde, gehört BUENDEL in scripts/release.mjs nachgezogen.`
      );
    }
    html = html.replace(block, `<script src="${name}"></script>`);
  }
  return html;
}

async function inlineMinifizieren(html) {
  /* Nur Blöcke ohne src; die mit src sind bereits ersetzt. */
  const treffer = [...html.matchAll(/<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/g)];
  for (const m of treffer) {
    const { code } = await esbuild.transform(m[2], { minify: true, legalComments: 'none' });
    html = html.replace(m[0], `<script${m[1]}>${code.trim()}</script>`);
  }
  return html;
}

async function seiten() {
  const zeilen = [];
  for (const datei of SEITEN) {
    const roh = lies(datei);
    let html = roh;
    if (datei === 'index.html') html = tagsErsetzen(html, BUENDEL);
    /* Kommentare raus. In den Skripten stehen nur /* *​/-Kommentare, kein <!-- -->, darum
       trifft das hier ausschließlich HTML. */
    html = html.replace(/<!--[\s\S]*?-->/g, '');
    html = await inlineMinifizieren(html);
    /* Leerzeilen, die von den Kommentaren übrig sind. Eingerückt bleibt es: Wer sich den
       Quelltext der fertigen Seite ansieht, soll ihn lesen können. */
    html = html.replace(/^[ \t]*\n/gm, '');
    zeilen.push({ name: datei, vorher: Buffer.byteLength(roh), nachher: schreib(datei, html) });
  }
  return zeilen;
}

/* ---------- Assets ---------- */

function kopieren() {
  let zahl = 0, gross = 0;
  for (const ordner of ORDNER) {
    const von = path.join(PROJEKT, ordner);
    for (const eintrag of fs.readdirSync(von, { withFileTypes: true, recursive: true })) {
      if (!eintrag.isFile()) continue;
      const rel = path.relative(PROJEKT, path.join(eintrag.parentPath || eintrag.path, eintrag.name));
      /* fonts.css ist schon minifiziert geschrieben worden. */
      if (STILE.includes(rel.split(path.sep).join('/'))) continue;
      const ziel = path.join(ZIEL, rel);
      fs.mkdirSync(path.dirname(ziel), { recursive: true });
      fs.copyFileSync(path.join(PROJEKT, rel), ziel);
      zahl++; gross += fs.statSync(ziel).size;
    }
  }
  return { zahl, gross };
}

/* ---------- .htaccess ---------- */

/* Dieselben Regeln wie vercel.json, für Apache. mod_headers und mod_expires sind auf
   Standard-Webspace üblicherweise an; fehlen sie, bleiben die Blöcke wirkungslos statt die
   Seite mit einem 500er lahmzulegen — dafür sind die <IfModule> da. */
const HTACCESS = `# Erzeugt von scripts/release.mjs — nicht von Hand ändern.
# Entspricht den Regeln in vercel.json, übersetzt für Apache.

<IfModule mod_headers.c>
  # Schriften und Bündel tragen ihren Inhalt im Namen nicht, werden aber selten geändert.
  # Wer eine Schrift austauscht, benennt sie um oder wartet ein Jahr.
  <FilesMatch "\\.(woff2|woff|ttf|otf|eot)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  # Bilder und Videos: eine Woche.
  <FilesMatch "\\.(webp|jpg|jpeg|png|svg|gif|mp4|webm)$">
    Header set Cache-Control "public, max-age=604800"
  </FilesMatch>
  # HTML nie aus dem Cache: Sonst sieht jemand tagelang die alte Werkliste.
  <FilesMatch "\\.html$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
  # CSS und JS werden bei jeder Änderung neu gebaut, behalten aber ihren Namen. Eine Stunde
  # ist der Kompromiss: schnell genug für Besucher, kurz genug für eine Korrektur.
  <FilesMatch "\\.(css|js)$">
    Header set Cache-Control "public, max-age=3600"
  </FilesMatch>
  Header set X-Content-Type-Options "nosniff"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

<IfModule mod_mime.c>
  AddType font/woff2 .woff2
  AddType image/webp .webp
  AddType image/svg+xml .svg
  AddType video/mp4 .mp4
  AddType video/webm .webm
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml
</IfModule>

# Kein ErrorDocument auf die Startseite. Das ist ein Muster für Single-Page-Anwendungen und
# hier schädlich: Ein fehlendes Bild bekäme die komplette Startseite als Antwort, und ein
# falscher Pfad in assets/ fiele niemandem mehr auf.
`;

/* ---------- Lauf ---------- */

fs.rmSync(ZIEL, { recursive: true, force: true });
fs.mkdirSync(ZIEL, { recursive: true });

const jsZeilen = await js();
const cssZeilen = await css();
const htmlZeilen = await seiten();
const assets = kopieren();
schreib('.htaccess', HTACCESS);

const tabelle = [...jsZeilen, ...cssZeilen, ...htmlZeilen];
const vorher = tabelle.reduce((n, z) => n + z.vorher, 0);
const nachher = tabelle.reduce((n, z) => n + z.nachher, 0);

console.log('dist/ gebaut\n');
for (const z of tabelle) {
  const teile = z.teile ? ` (${z.teile} Dateien)` : '';
  console.log(`  ${z.name.padEnd(24)} ${kb(z.vorher).padStart(10)} → ${kb(z.nachher).padStart(10)}${teile}`);
}
console.log(`  ${'Summe Code'.padEnd(24)} ${kb(vorher).padStart(10)} → ${kb(nachher).padStart(10)}`);
console.log(`\n  ${assets.zahl} Dateien in assets, ${kb(assets.gross)}`);
console.log(`  ${'gesamt'.padEnd(24)} ${kb(nachher + assets.gross).padStart(10)}`);
console.log('\nPrüfen mit: npm run pruefen:dist');
