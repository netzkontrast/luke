/* Werk I, so wie es hängt: drei Blätter nebeneinander, gleich hoch, mit schmaler Fuge, wie
   in der Galerie und in der Hängung der Seite. Die Blätter legen sich nacheinander ab, die
   Beschriftung kommt zuletzt und steht wie ein Wandschild neben der Reihe. Im Auftakt steht
   die Zeichnung rechts, hier steht das Werk links: Die Achse springt. */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { theme } from '../theme';
import { useForm } from '../layout';
import { Haengung } from '../components/Blatt';
import { Beschriftung, Zeile } from '../components/Typo';
import { WERKE } from '../werke';

/* Die Blätter in der Reihenfolge der Hängung (js/works.js, w1), jeweils die größte Fassung
   aus assets/img/: Nur dort ist das Papier auf Weiß gezogen. Maße aus js/bilder.js. */
const BLAETTER = [
  { datei: 'img/werk-befreiung-1-bild-1-713.webp', seite: 713 / 1350 },
  { datei: 'img/werk-befreiung-1-bild-2-703.webp', seite: 703 / 1350 },
  { datei: 'img/werk-befreiung-1-bild-3-622.webp', seite: 622 / 1350 },
];
const SUMME = BLAETTER.reduce((s, b) => s + b.seite, 0);
/* Fuge als Anteil der Höhe, wie --fuge auf der Seite (14 px bei 560 px). */
const FUGE = 0.025;
/* Wie in js/site.js: Die Zahl der Blätter steht in der Zeile. */
const ZAHLWORT = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];

export const WerkEins: React.FC<{ ende: number }> = ({ ende }) => {
  const f = useForm();
  const w = WERKE.find((x) => x.nr === 'I');
  const fugen = BLAETTER.length - 1;

  /* Quer bestimmt die Bildhöhe die Reihe, hoch die Bildbreite. */
  const hoehe = f.hoch
    ? Math.floor((f.breite - f.rand * 1.4) / (SUMME + FUGE * fugen))
    : Math.round(f.hoehe * 0.74);
  const fuge = Math.round(hoehe * FUGE);
  const breite = Math.round(hoehe * SUMME) + fuge * fugen;
  const links = f.hoch ? Math.round((f.breite - breite) / 2) : Math.round(f.rand * 2.4);
  const oben = f.hoch ? Math.round(f.hoehe * 0.26) : Math.round((f.hoehe - hoehe) / 2);
  const schildLinks = f.hoch ? links : links + breite + Math.round(f.rand * 1.6);
  /* Früher raus als die anderen Szenen: Die Handschrift setzt links oben an, genau über dem
     ersten Blatt. Erst geht die Schrift, dann die Reihe, und die ist weg, bevor dort der
     Faden und das erste Wort erscheinen. */
  const rausSchrift = ende - 0.8;
  const rausReihe = ende - 0.7;

  return (
    <AbsoluteFill>
      {/* Kein Faden in dieser Szene: Alle drei Blätter tragen Rot, das Werk ist hier das Rot.
          Ein roter Faden daneben nähme ihm die Wirkung. */}

      <Haengung
        blaetter={BLAETTER}
        hoehe={hoehe}
        fuge={fuge}
        ab={0.25}
        raus={rausReihe}
        weite={0.04}
        richtung={f.hoch ? 0 : -1}
        style={{ position: 'absolute', left: links, top: oben }}
      />

      <Beschriftung
        ab={2.1}
        raus={rausSchrift}
        breite={f.hoch ? f.breite - links * 2 : f.breite - schildLinks - Math.round(f.rand * 1.6)}
        groesse={f.klein}
        zeilen={[
          w ? w.titel : 'Befreiung der Körperlichkeit, Werk I',
          w && w.technik
            ? `${w.technik}, ${ZAHLWORT[w.blaetter] || w.blaetter} Blätter, ${w.jahr}`
            : 'Tusche auf Papier, drei Blätter, 2026',
          'Gezeigt in der Gruppenausstellung Red.',
        ]}
        style={
          f.hoch
            ? { position: 'absolute', left: schildLinks, top: oben + hoehe + Math.round(f.rand * 0.8) }
            : {
                position: 'absolute',
                left: schildLinks,
                /* An der Unterkante der Tusche, nicht des Blatts: Unten ist jedes Blatt weiß. */
                bottom: f.hoehe - oben - hoehe + Math.round(hoehe * 0.08),
              }
        }
      />

      {/* Die Werknummer als stiller Vermerk, wie im Werkverzeichnis der Seite. */}
      <Zeile
        ab={2.5}
        raus={rausSchrift}
        style={{ position: 'absolute', left: f.rand, bottom: f.sicherUnten * 0.55 }}
      >
        <div
          style={{
            fontFamily: theme.schrift.anzeige,
            fontWeight: 300,
            fontSize: f.mittel,
            color: theme.farben.fastWeg,
            letterSpacing: '0.14em',
          }}
        >
          {w ? w.nr : 'I'}
        </div>
      </Zeile>
    </AbsoluteFill>
  );
};
