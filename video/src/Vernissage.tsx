/* Die Ankündigung zur Vernissage, 15 Sekunden, für Story und Reel (9:16).

   Design Read: Terminankündigung für die Story, eine Aussage — zwei Werke hängen in „Red“ —
   und ein Datum, in der Tuschesprache der Website. Varianz 6, Bewegung 5, Dichte 1.

   Zwei Einstellungen, ein Gedanke je Einstellung. Erst die beiden Werke, untereinander, jedes
   mit seinen drei Blättern in einer Reihe — genau das hängt in der Ausstellung, und im
   Hochformat füllen erst zwei Reihen das Bild; ein Werk allein ließ zwei Drittel leer. Dann
   die Tafel. Bei den Werken trägt das Rot der Blätter die Farbe, deshalb läuft dort kein
   Faden; auf der Tafel steht er als einziges Rot. Die Tafel ist mittig, weil die Nachricht
   selbst die Gestaltung ist (remotion-taste), und sie bleibt bis zum Schluss stehen. Die
   Schrift ist größer als im Film: Eine Story liest man auf dem Telefon, im Vorbeiwischen.

   Alles, was im Bild steht, kommt aus js/works.js: Titel, Blätter, Ausstellung, Termine. */
import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { theme } from './theme';
import { useForm } from './layout';
import { Papier, Korn } from './components/Papier';
import { Haengung } from './components/Blatt';
import { Zeile, Eintritt } from './components/Typo';
import { Faden } from './components/Faden';
import { WERKE } from './werke';
import { ausstellung, tagText, vernissageText } from './datum';
import { schriftenLaden } from './fonts';

schriftenLaden();

const UEBERLAPP = 0.45;
const DAUER = { werke: 7, tafel: 8.45 };
const FUGE = 16;

export const vernissageDauer = (fps: number): number =>
  Math.round((DAUER.werke + DAUER.tafel - UEBERLAPP) * fps);

/* Die beiden Werke der Serie untereinander: oben einmal die Serie, dann je Werk seine Nummer
   und seine Blätter, die sich nacheinander ablegen. Werk II kommt, wenn Werk I liegt. */
const WerkeEinstellung: React.FC<{ ende: number }> = ({ ende }) => {
  const f = useForm();
  const werke = ['I', 'II'].map((nr) => WERKE.find((x) => x.nr === nr)).filter((w): w is NonNullable<typeof w> => !!w);
  if (!werke.length) return null;
  const innen = f.hoehe - f.sicherOben - f.sicherUnten;
  /* So hoch, wie Breite und Höhe es zulassen: Die Reihe stößt entweder seitlich an oder oben. */
  const reiheHoehe = (bilder: typeof werke[number]['bilder'], hoechstens: number) =>
    Math.floor(Math.min(hoechstens, (f.breite - f.rand * 2 - FUGE * (bilder.length - 1)) / bilder.reduce((s, b) => s + b.seite, 0)));
  const zeile = (text: string, ab: number, raus: number, style: React.CSSProperties) => (
    <Zeile ab={ab} raus={raus}>
      <div style={style}>{text}</div>
    </Zeile>
  );
  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: `${f.sicherOben}px ${f.rand}px ${f.sicherUnten}px`,
      }}
    >
      {zeile(werke[0].serie || '', 0.2, ende - 0.5, {
        fontFamily: theme.schrift.lauf,
        fontWeight: 400,
        fontSize: f.klein,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: theme.farben.gedaempft,
        marginBottom: Math.round(f.mittel * 0.9),
      })}
      {werke.map((w, k) => {
        const ab = 0.45 + k * 1.55;
        return (
          <div key={w.nr} style={{ marginTop: k ? Math.round(f.mittel * 1.1) : 0 }}>
            {zeile(`Werk ${w.nr}`, ab, ende - 0.55 + k * 0.05, {
              fontFamily: theme.schrift.anzeige,
              fontWeight: 300,
              fontSize: f.mittel,
              lineHeight: 1,
              color: theme.farben.tusche,
              marginBottom: Math.round(f.klein * 0.7),
            })}
            <Haengung
              blaetter={w.bilder}
              hoehe={reiheHoehe(w.bilder, innen * 0.34)}
              fuge={FUGE}
              ab={ab + 0.1}
              versatz={0.28}
              raus={ende - 0.5}
              weite={0.04}
              richtung={k ? 1 : -1}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* Die Tafel: Anlass, Ort, Termine. Der Faden kommt von oben und bleibt über dem Titel stehen. */
const Tafel: React.FC = () => {
  const f = useForm();
  const bis = tagText(ausstellung.bis);
  return (
    <AbsoluteFill>
      {/* Erst wenn die Blätter weg sind: Ihr Rot und der Faden sollen nie im selben Bild stehen. */}
      <Faden links={50} ab={0.6} dauer={1.8} von={0} bis={f.hoch ? 22 : 20} breite={f.hoch ? 4 : 3} />
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${f.sicherOben}px ${f.rand}px ${f.sicherUnten}px`,
          textAlign: 'center',
          gap: Math.round(f.klein * 0.5),
        }}
      >
        <Zeile ab={0.8}>
          <div
            style={{
              fontFamily: theme.schrift.lauf,
              fontWeight: 400,
              fontSize: f.klein,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: theme.farben.gedaempft,
            }}
          >
            {ausstellung.art}
          </div>
        </Zeile>
        <Zeile ab={1.0}>
          <div
            style={{
              fontFamily: theme.schrift.anzeige,
              fontWeight: 300,
              fontSize: Math.round(f.gross * 1.6),
              lineHeight: 0.95,
              color: theme.farben.tusche,
            }}
          >
            {ausstellung.titel}
          </div>
        </Zeile>
        <Zeile ab={1.3}>
          <div style={{ fontFamily: theme.schrift.lauf, fontWeight: 400, fontSize: Math.round(f.klein * 1.25), color: theme.farben.gedaempft }}>
            {ausstellung.ort}
          </div>
        </Zeile>

        <Eintritt ab={2.1} hub={20} style={{ marginTop: Math.round(f.mittel * 1.1) }}>
          <div
            style={{
              fontFamily: theme.schrift.lauf,
              fontWeight: 500,
              fontSize: Math.round(f.klein * 1.2),
              letterSpacing: '0.04em',
              color: theme.farben.tusche,
            }}
          >
            Vernissage
          </div>
          <div
            style={{
              fontFamily: theme.schrift.anzeige,
              fontWeight: 300,
              fontSize: Math.round(f.mittel * 1.2),
              lineHeight: 1.2,
              color: theme.farben.tusche,
              marginTop: Math.round(f.winzig * 0.4),
            }}
          >
            {vernissageText()}
          </div>
        </Eintritt>

        {bis ? (
          <Eintritt ab={2.45} hub={16}>
            <div style={{ fontFamily: theme.schrift.lauf, fontWeight: 400, fontSize: Math.round(f.klein * 1.15), color: theme.farben.gedaempft }}>
              Zu sehen bis {bis}
            </div>
          </Eintritt>
        ) : null}

        <Zeile ab={3.1} style={{ marginTop: Math.round(f.mittel * 1.2) }}>
          <div
            style={{
              fontFamily: theme.schrift.lauf,
              fontWeight: 500,
              fontSize: Math.round(f.klein * 1.1),
              letterSpacing: '0.04em',
              color: theme.farben.tusche,
            }}
          >
            @lukewtf
          </div>
        </Zeile>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Vernissage: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Papier />
      <Sequence from={0} durationInFrames={Math.round(DAUER.werke * fps)} name="Werke">
        <WerkeEinstellung ende={DAUER.werke} />
      </Sequence>
      <Sequence from={Math.round((DAUER.werke - UEBERLAPP) * fps)} name="Tafel">
        <Tafel />
      </Sequence>
      <Korn staerke={0.26} />
    </AbsoluteFill>
  );
};
