/* Lädt die lokal liegenden Schriften, bevor Remotion das erste Bild rendert.
   Ohne delayRender fällt der erste Frame auf eine Systemschrift zurück und der Film
   beginnt mit einem falschen Schriftbild. */
import { continueRender, delayRender, staticFile } from 'remotion';

type Schnitt = { familie: string; datei: string; gewicht: string; stil?: string };

const SCHNITTE: Schnitt[] = [
  { familie: 'Alegreya Sans', datei: 'alegreya-sans-300-latin.woff2', gewicht: '300' },
  { familie: 'Alegreya Sans', datei: 'alegreya-sans-400-latin.woff2', gewicht: '400' },
  { familie: 'Alegreya Sans', datei: 'alegreya-sans-500-latin.woff2', gewicht: '500' },
  { familie: 'Alegreya', datei: 'alegreya-400-500-latin.woff2', gewicht: '400 500' },
  { familie: 'Alegreya', datei: 'alegreya-italic-400-latin.woff2', gewicht: '400', stil: 'italic' },
];

let geladen = false;

export const schriftenLaden = (): void => {
  if (geladen || typeof document === 'undefined' || typeof FontFace === 'undefined') return;
  geladen = true;
  const marke = delayRender('Schriften laden');
  Promise.all(
    SCHNITTE.map((s) => {
      const face = new FontFace(s.familie, `url(${staticFile('fonts/' + s.datei)}) format('woff2')`, {
        weight: s.gewicht,
        style: s.stil ?? 'normal',
        display: 'block',
      });
      return face.load().then((f) => {
        document.fonts.add(f);
      });
    })
  )
    .then(() => continueRender(marke))
    .catch(() => continueRender(marke));
};
