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
vm.runInContext(readFileSync(quelle, 'utf8'), sandbox);
const L = sandbox.window.LUKE;
if (!L || !Array.isArray(L.WERKE)) throw new Error('LUKE.WERKE nicht gefunden in ' + quelle);

const werke = L.WERKE.map((w) => ({
  nr: w.nr, titel: w.t, traeger: w.tr, jahr: w.jahr,
  technik: w.technik ?? null, ort: w.ort ?? null, serie: w.serie ?? null
}));

writeFileSync(ziel, `/* Erzeugt von scripts/werke-uebernehmen.mjs aus js/works.js. Nicht von Hand ändern:
   Änderungen gehören in js/works.js, danach das Skript erneut laufen lassen. */
export type Werk = {
  nr: string; titel: string; traeger: 'haut' | 'papier'; jahr: number;
  technik: string | null; ort: string | null; serie: string | null;
};

export const WERKE: Werk[] = ${JSON.stringify(werke, null, 2)};

export const AUSSTELLUNG = ${JSON.stringify(L.CONFIG?.ausstellung ?? {}, null, 2)};
`);
console.log('geschrieben:', ziel, '-', werke.length, 'Werke');
