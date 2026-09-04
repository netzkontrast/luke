/* Der Film. Der Papiergrund liegt einmal ganz unten und wechselt nie, deshalb können die
   Szenen ineinander übergehen, ohne dass der Hintergrund blitzt. Körnung und Randabdunklung
   liegen ganz oben, über allem.

   Schichten von unten nach oben: Papier, Szene, Körnung. Mehr braucht Tusche nicht. */
import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { Papier, Korn } from './components/Papier';
import { Auftakt } from './scenes/Auftakt';
import { WerkEins } from './scenes/WerkEins';
import { Handschrift } from './scenes/Handschrift';
import { Verzeichnis } from './scenes/Verzeichnis';
import { Atelier } from './scenes/Atelier';
import { Abspann } from './scenes/Abspann';
import { takt } from './theme';
import { schriftenLaden } from './fonts';

schriftenLaden();

/* Die Szenen überlappen sich um eine knappe halbe Sekunde. Jede Szene blendet ihren
   eigenen Inhalt aus, sodass in der Überblendung kurz beides zu sehen ist statt leerem
   Papier. */
const UEBERLAPP = 0.45;

type Szene = { name: string; dauer: number; inhalt: (ende: number) => React.ReactNode };

const SZENEN: Szene[] = [
  { name: 'Auftakt', dauer: takt.auftakt, inhalt: (e) => <Auftakt ende={e} /> },
  { name: 'WerkEins', dauer: takt.werkEins, inhalt: (e) => <WerkEins ende={e} /> },
  { name: 'Handschrift', dauer: takt.handschrift, inhalt: (e) => <Handschrift ende={e} /> },
  { name: 'Verzeichnis', dauer: takt.verzeichnis, inhalt: (e) => <Verzeichnis ende={e} /> },
  { name: 'Atelier', dauer: takt.atelier, inhalt: (e) => <Atelier ende={e} /> },
  { name: 'Abspann', dauer: takt.abspann, inhalt: (e) => <Abspann ende={e} /> },
];

export const gesamtDauer = (fps: number): number =>
  Math.round(SZENEN.reduce((s, z) => s + z.dauer, 0) * fps - (SZENEN.length - 1) * UEBERLAPP * fps);

export const Werkschau: React.FC = () => {
  const { fps } = useVideoConfig();
  let start = 0;
  return (
    <AbsoluteFill>
      <Papier />
      {SZENEN.map((z) => {
        const von = Math.round(start * fps);
        const laenge = Math.round(z.dauer * fps);
        start += z.dauer - UEBERLAPP;
        return (
          <Sequence key={z.name} from={von} durationInFrames={laenge} name={z.name}>
            {z.inhalt(z.dauer)}
          </Sequence>
        );
      })}
      <Korn staerke={0.26} />
    </AbsoluteFill>
  );
};
