/* Baut den Auftakt zu einem einzelnen Bündel unter ../assets/js/auftakt-player.js.
   Die Website hat keinen Bauschritt; deshalb liegt das fertige Bündel im Repository und
   wird hier nur bei Bedarf neu erzeugt.

   Aufruf: npm run build:player */
import { build } from 'esbuild';
import { mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

const hier = dirname(fileURLToPath(import.meta.url));
const ziel = resolve(hier, '../../assets/js/auftakt-player.js');
mkdirSync(dirname(ziel), { recursive: true });

await build({
  entryPoints: [resolve(hier, '../src/player/mount.tsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  platform: 'browser',
  jsx: 'automatic',
  outfile: ziel,
  define: { 'process.env.NODE_ENV': '"production"' },
  legalComments: 'none',
  logLevel: 'warning',
});

const roh = statSync(ziel).size;
const gz = gzipSync(readFileSync(ziel)).length;
console.log(
  `${ziel.split('/').slice(-3).join('/')}  ${(roh / 1024).toFixed(0)} kB, gzip ${(gz / 1024).toFixed(0)} kB`
);
