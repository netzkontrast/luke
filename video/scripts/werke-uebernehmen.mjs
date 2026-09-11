/* Überträgt das Werkverzeichnis aus js/works.js (Quelle der Wahrheit für die Website)
   nach video/src/werke.ts, damit Film und Seite dieselben Titel und Jahre zeigen.
   Aufruf: node scripts/werke-uebernehmen.mjs */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const hier = dirname(fileURLToPath(import.meta.url));
const quelle = resolve(hier, '../../js/works.js');
const ziel = resolve(hier, '../src/werke.ts');

/* works.js schreibt an window und liest danach die globale Variable LUKE. Damit beides
   dasselbe Objekt trifft, zeigt window im Sandkasten auf den globalen Kontext selbst. */
const sandbox = {};
sandbox.window = sandbox;
vm.createContext(sandbox);
/* bilder.js zuerst: Es trägt Namen und Maße der Bilder, works.js fragt dort nach. */
vm.runInContext(readFileSync(resolve(hier, '../../js/bilder.js'), 'utf8'), sandbox);
vm.runInContext(readFileSync(quelle, 'utf8'), sandbox);
const L = sandbox.window.LUKE;
if (!L || !Array.isArray(L.WERKE)) throw new Error('LUKE.WERKE nicht gefunden in ' + quelle);

/* Je Werk seine Bilder, in der Reihenfolge der Hängung, so wie Haengung (components/Blatt.tsx)
   sie nimmt: die größte WebP-Fassung (nur dort ist das Papier auf Weiß gezogen, siehe
   .claude/skills/werkschau-video) und ihr Seitenverhältnis. scripts/assets-uebernehmen.sh
   legt die Dateien nach public/img/. */
const bilderVon = (w) => L.blaetter(w).map((b) => ({
  datei: `img/${b.name}-${L.BILDER[b.name].breiten.at(-1)}.webp`,
  seite: +(b.w / b.h).toFixed(4)
}));

const werke = L.WERKE.map((w) => ({
  nr: w.nr, titel: w.t, jahr: w.jahr,
  technik: w.technik ?? null, serie: w.serie ?? null,
  blaetter: (w.bilder || []).length || 1,
  bilder: bilderVon(w)
}));

writeFileSync(ziel, `/* Erzeugt von scripts/werke-uebernehmen.mjs aus js/works.js. Nicht von Hand ändern:
   Änderungen gehören in js/works.js, danach das Skript erneut laufen lassen. */
export type Werk = {
  nr: string; titel: string; jahr: number;
  technik: string | null; serie: string | null; blaetter: number;
  bilder: { datei: string; seite: number }[];
};

export const WERKE: Werk[] = ${JSON.stringify(werke, null, 2)};

export const AUSSTELLUNG = ${JSON.stringify(L.CONFIG?.ausstellung ?? {}, null, 2)};
`);
console.log('geschrieben:', ziel, '-', werke.length, 'Werke');
