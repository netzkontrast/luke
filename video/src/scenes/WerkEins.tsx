/* Werk I ganz. Die fertige Zeichnung steht, langsamer Ken Burns, die Beschriftung kommt
   nach, wenn das Auge das Blatt schon gelesen hat. Der Faden liegt hier rechts, damit die
   Achse gegenüber dem Auftakt springt. */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { theme } from '../theme';
import { useForm } from '../layout';
import { BlattBild } from '../components/Blatt';
import { Beschriftung } from '../components/Typo';
import { WERKE } from '../werke';

export const WerkEins: React.FC<{ ende: number }> = ({ ende }) => {
  const f = useForm();
  const w = WERKE.find((x) => x.nr === 'I');
  return (
    <AbsoluteFill>
      {/* Kein Faden in dieser Szene: Der rote Strang der Zeichnung ist hier das Rot.
          Zwei rote Elemente im selben Bild nehmen einander die Wirkung. */}

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: f.hoch ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${f.sicherOben}px ${f.rand}px ${f.sicherUnten}px`,
          gap: f.rand,
        }}
      >
        <BlattBild
          datei="img/gestaltung-profil-1900.jpg"
          ab={0}
          raus={ende - 0.5}
          weite={0.09}
          richtung={-1}
          style={{
            flex: f.hoch ? '1 1 auto' : '0 0 54%',
            height: f.hoch ? '64%' : '100%',
            width: f.hoch ? '92%' : undefined,
            order: f.hoch ? 1 : 2,
          }}
        />

        <Beschriftung
          ab={1.6}
          raus={ende - 0.55}
          breite={f.hoch ? f.breite - f.rand * 2 : f.breite * 0.34}
          groesse={f.klein}
          zeilen={[
            w ? w.titel : 'Befreiung der Körperlichkeit, Werk I',
            w && w.technik ? `${w.technik}, ${w.jahr}` : 'Tusche auf Papier, 2026',
            'Gezeigt in der Gruppenausstellung Red.',
          ]}
          style={{
            order: f.hoch ? 2 : 1,
            alignSelf: f.hoch ? 'flex-start' : 'flex-end',
            marginLeft: f.hoch ? 0 : f.rand * 1.2,
            marginBottom: f.hoch ? 0 : f.hoehe * 0.16,
          }}
        />
      </AbsoluteFill>

      {/* Die Werknummer als stiller Vermerk, wie im Werkverzeichnis der Seite. */}
      <div
        style={{
          position: 'absolute',
          left: f.rand,
          bottom: f.sicherUnten * 0.55,
          fontFamily: theme.schrift.anzeige,
          fontWeight: 300,
          fontSize: f.mittel,
          color: theme.farben.fastWeg,
          letterSpacing: '0.14em',
        }}
      >
        {w ? w.nr : 'I'}
      </div>
    </AbsoluteFill>
  );
};
