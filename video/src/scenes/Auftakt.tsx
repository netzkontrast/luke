/* Auftakt. Wie der Kopf der Website: Name links, Zeichnung rechts, dazwischen Luft.
   Kein zentrierter Titel über einer Fläche, die Achse liegt bewusst außermittig.
   In den ersten 15 Bildern bewegt sich etwas: der rote Faden setzt an. */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { theme } from '../theme';
import { useForm } from '../layout';
import { Faden } from '../components/Faden';
import { BlattVideo } from '../components/Blatt';
import { Zeile } from '../components/Typo';

export const Auftakt: React.FC<{ ende: number }> = ({ ende }) => {
  const f = useForm();
  return (
    <AbsoluteFill>
      {/* Im Hochformat sitzt der Faden weiter links: Auf 9 Prozent liefe er sonst mitten
          durch den Namen. */}
      <Faden links={f.hoch ? 4.5 : 7} ab={0.1} dauer={2.2} breite={f.hoch ? 4 : 3} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: f.hoch ? 'column' : 'row',
          alignItems: f.hoch ? 'stretch' : 'flex-end',
          justifyContent: f.hoch ? 'center' : 'space-between',
          padding: `${f.sicherOben}px ${f.rand}px ${f.sicherUnten}px`,
          gap: f.hoch ? f.rand : f.rand * 1.4,
        }}
      >
        <div
          style={{
            order: f.hoch ? 2 : 1,
            paddingLeft: f.hoch ? f.rand * 0.35 : f.rand * 0.6,
            paddingBottom: f.hoch ? 0 : f.hoehe * 0.08,
            flex: f.hoch ? '0 0 auto' : '1 1 42%',
          }}
        >
          <Zeile ab={0.55} raus={ende - 0.5}>
            <div
              style={{
                fontFamily: theme.schrift.anzeige,
                fontWeight: 300,
                fontSize: f.gross,
                lineHeight: 0.95,
                letterSpacing: '-0.01em',
                color: theme.farben.tusche,
              }}
            >
              Luke WTF
            </div>
          </Zeile>
          <Zeile ab={0.95} raus={ende - 0.55} style={{ marginTop: f.klein }}>
            <div
              style={{
                fontFamily: theme.schrift.lauf,
                fontWeight: 400,
                fontSize: f.klein,
                lineHeight: 1.5,
                color: theme.farben.gedaempft,
                maxWidth: f.hoch ? '28ch' : '24ch',
              }}
            >
              Tätowierer und Zeichner.
              <br />
              Bluthandwerk, Köln-Ehrenfeld.
            </div>
          </Zeile>
        </div>

        <BlattVideo
          datei="video/gestaltung-profil-zeichnung.mp4"
          ab={0.2}
          raus={ende - 0.5}
          style={{
            order: f.hoch ? 1 : 2,
            flex: f.hoch ? '1 1 auto' : '0 0 44%',
            height: f.hoch ? '52%' : '92%',
            alignSelf: f.hoch ? 'center' : 'flex-end',
            width: f.hoch ? '88%' : undefined,
            marginInline: f.hoch ? 'auto' : undefined,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
