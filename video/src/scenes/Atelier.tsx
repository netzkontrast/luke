/* Luke im Atelier. Das einzige Foto im Film, deshalb ohne multiply und mit etwas mehr
   Kontrast, damit es neben der Tusche besteht. Der Text sitzt im dunklen Teil des Bildes. */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { theme } from '../theme';
import { useForm } from '../layout';
import { Foto } from '../components/Blatt';
import { Zeile } from '../components/Typo';

export const Atelier: React.FC<{ ende: number }> = ({ ende }) => {
  const f = useForm();
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: f.hoch ? 'column' : 'row',
          alignItems: 'stretch',
          padding: `${f.sicherOben}px ${f.rand}px ${f.sicherUnten}px`,
          gap: f.rand,
        }}
      >
        <Foto
          datei="img/luke-atelier-1536.jpg"
          ab={0}
          raus={ende - 0.5}
          weite={0.11}
          richtung={1}
          style={{
            flex: f.hoch ? '1 1 auto' : '0 0 52%',
            height: f.hoch ? '58%' : '100%',
          }}
        />

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: f.klein * 0.6,
            paddingLeft: f.hoch ? 0 : f.rand * 0.4,
          }}
        >
          <Zeile ab={0.7} raus={ende - 0.55}>
            <div
              style={{
                fontFamily: theme.schrift.anzeige,
                fontWeight: 300,
                fontSize: f.mittel * 1.15,
                lineHeight: 1.05,
                color: theme.farben.tusche,
              }}
            >
              Bluthandwerk
            </div>
          </Zeile>
          <Zeile ab={1.0} raus={ende - 0.55}>
            <div
              style={{
                fontFamily: theme.schrift.lauf,
                fontWeight: 400,
                fontSize: f.klein,
                lineHeight: 1.5,
                color: theme.farben.gedaempft,
                maxWidth: '26ch',
              }}
            >
              Privates Atelier in Köln-Ehrenfeld.
              <br />
              Seit 2012. Termine nur nach Vereinbarung.
            </div>
          </Zeile>
          <Zeile ab={1.35} raus={ende - 0.55} style={{ marginTop: f.klein * 0.5 }}>
            <div
              style={{
                height: 1,
                width: f.klein * 3,
                backgroundColor: theme.farben.linie,
              }}
            />
          </Zeile>
          <Zeile ab={1.5} raus={ende - 0.55}>
            <div
              style={{
                fontFamily: theme.schrift.lauf,
                fontWeight: 400,
                fontSize: f.winzig,
                lineHeight: 1.5,
                color: theme.farben.gedaempft,
              }}
            >
              Vogelsangerstraße 84, 50823 Köln
            </div>
          </Zeile>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
