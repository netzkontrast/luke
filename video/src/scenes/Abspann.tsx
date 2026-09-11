/* Abspann: der Anlass und die Signatur. Das Auge-Video endet mit Lukes Handschrift,
   deshalb steht hier sein Ende. Der Faden läuft ein letztes Mal durch und bleibt stehen. */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { theme } from '../theme';
import { useForm } from '../layout';
import { BlattBild } from '../components/Blatt';
import { Zeile, Eintritt } from '../components/Typo';
import { Faden } from '../components/Faden';
import { ausstellung, tagText, vernissageText } from '../datum';

export const Abspann: React.FC<{ ende: number }> = ({ ende }) => {
  const f = useForm();
  const bis = tagText(ausstellung.bis, true);
  return (
    <AbsoluteFill>
      {/* Der Faden endet über der Zeile. Liefe er weiter, striche er den Titel durch. */}
      <Faden links={50} ab={0.3} dauer={2.4} von={0} bis={f.hoch ? 22 : 26} breite={f.hoch ? 4 : 3} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${f.sicherOben}px ${f.rand}px ${f.sicherUnten}px`,
          gap: f.klein * 0.8,
          textAlign: 'center',
        }}
      >
        <Zeile ab={0.9}>
          <div
            style={{
              fontFamily: theme.schrift.lauf,
              fontWeight: 400,
              fontSize: f.winzig,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: theme.farben.gedaempft,
            }}
          >
            {ausstellung.art}
          </div>
        </Zeile>

        <Zeile ab={1.15}>
          <div
            style={{
              fontFamily: theme.schrift.anzeige,
              fontWeight: 300,
              fontSize: f.gross * 0.9,
              lineHeight: 0.95,
              color: theme.farben.tusche,
            }}
          >
            {ausstellung.titel}
          </div>
        </Zeile>

        <Eintritt ab={1.5} hub={18}>
          <div
            style={{
              fontFamily: theme.schrift.lauf,
              fontWeight: 400,
              fontSize: f.klein,
              lineHeight: 1.6,
              color: theme.farben.gedaempft,
              marginTop: f.klein * 0.4,
            }}
          >
            {ausstellung.ort}
            <br />
            Vernissage {vernissageText()}
            {bis ? (
              <>
                <br />
                Zu sehen bis {bis}
              </>
            ) : null}
          </div>
        </Eintritt>

        <BlattBild
          datei="img/gestaltung-signatur.jpg"
          ab={2.1}
          weite={0.04}
          richtung={-1}
          style={{
            width: f.hoch ? '92%' : '58%',
            height: f.hoch ? f.hoehe * 0.12 : f.hoehe * 0.19,
            marginTop: Math.round(f.klein * 0.6),
          }}
        />

        <Zeile ab={2.9} style={{ marginTop: f.klein * 0.2 }}>
          <div
            style={{
              fontFamily: theme.schrift.lauf,
              fontWeight: 500,
              fontSize: f.winzig * 1.1,
              letterSpacing: '0.04em',
              color: theme.farben.tusche,
            }}
          >
            @lukewtf
          </div>
        </Zeile>
      </AbsoluteFill>
      {/* ende wird hier nicht zum Ausblenden gebraucht: Der Abspann steht bis zum Schluss. */}
      <span style={{ display: 'none' }}>{ende}</span>
    </AbsoluteFill>
  );
};
