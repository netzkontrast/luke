/* Schriftbausteine. Alle Eintritte bewegen zwei bis drei Eigenschaften zugleich und sind
   gestaffelt; ein reines Aufblenden gibt es nicht. Austritte laufen schneller als Eintritte.

   Auf der Website blenden Elemente in Richtung A über clip-path von links auf. Genau das
   macht Zeile: Der Text wird freigelegt, als würde ein Blatt weggezogen. */
import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

type Basis = {
  ab?: number;
  raus?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export const Zeile: React.FC<Basis> = ({ ab = 0, raus, children, style }) => {
  const bild = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(bild, [ab * fps, (ab + 0.95) * fps], [0, 1], {
    easing: theme.kurve.aus,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const weg =
    raus === undefined
      ? 0
      : interpolate(bild, [raus * fps, (raus + 0.42) * fps], [0, 1], {
          easing: theme.kurve.rein,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
  return (
    <div
      style={{
        clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
        opacity: 1 - weg,
        transform: `translateY(${interpolate(weg, [0, 1], [0, -14])}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* Eintritt für Blöcke, die kein Text sind: Deckkraft, Verschiebung und Maßstab zusammen. */
export const Eintritt: React.FC<Basis & { hub?: number }> = ({
  ab = 0,
  raus,
  hub = 34,
  children,
  style,
}) => {
  const bild = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: bild - ab * fps, fps, config: theme.feder.ruhig });
  const weg =
    raus === undefined
      ? 0
      : interpolate(bild, [raus * fps, (raus + 0.4) * fps], [0, 1], {
          easing: theme.kurve.rein,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
  return (
    <div
      style={{
        opacity: p * (1 - weg),
        transform: `translateY(${interpolate(p, [0, 1], [hub, 0]) + weg * -18}px) scale(${interpolate(
          p,
          [0, 1],
          [0.965, 1]
        )})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* Wort für Wort, für die eine große Aussage im Film. Versatz drei Bilder, wie im Muster. */
export const WortWeise: React.FC<{
  text: string;
  ab?: number;
  je?: number;
  /* Wortabstand in Pixeln. Er muss zur Schriftgröße passen: em bezöge sich auf das
     Elternelement und ergäbe neben großer Schrift fast keinen Abstand. */
  abstand?: number;
  style?: React.CSSProperties;
}> = ({ text, ab = 0, je = 3, abstand = 14, style }) => {
  const bild = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    /* Der Abstand steht in Pixeln, nicht in em: em bezieht sich auf die Schriftgröße des
       Elternelements und ergibt neben großer Schrift fast keinen Abstand. */
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: abstand, ...style }}>
      {text.split(' ').map((wort, i) => {
        const p = spring({
          frame: bild - ab * fps - i * je,
          fps,
          config: theme.feder.gesetzt,
        });
        return (
          <span
            key={`${wort}-${i}`}
            style={{
              display: 'inline-block',
              opacity: p,
              transform: `translateY(${interpolate(p, [0, 1], [26, 0])}px)`,
            }}
          >
            {wort}
          </span>
        );
      })}
    </div>
  );
};

/* Beschriftung im Ton der Website: gedämpft, klein, mit Haarlinie darüber statt Gedankenstrich. */
export const Beschriftung: React.FC<{
  zeilen: string[];
  ab?: number;
  raus?: number;
  breite?: number;
  /* Grundgröße der ersten Zeile. Die Folgezeilen sitzen etwas kleiner darunter. */
  groesse?: number;
  style?: React.CSSProperties;
}> = ({ zeilen, ab = 0, raus, breite = 420, groesse = 30, style }) => {
  const bild = useCurrentFrame();
  const { fps } = useVideoConfig();
  const strich = interpolate(bild, [ab * fps, (ab + 0.8) * fps], [0, 1], {
    easing: theme.kurve.aus,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{ width: breite, ...style }}>
      <div
        style={{
          height: 1,
          backgroundColor: theme.farben.linie,
          transform: `scaleX(${strich})`,
          transformOrigin: '0% 50%',
          marginBottom: Math.round(groesse * 0.6),
        }}
      />
      {zeilen.map((z, i) => (
        <Zeile key={z} ab={ab + 0.16 + i * 0.12} raus={raus}>
          <div
            style={{
              fontFamily: theme.schrift.lauf,
              fontWeight: i === 0 ? 500 : 400,
              fontSize: i === 0 ? groesse : Math.round(groesse * 0.86),
              lineHeight: 1.45,
              color: i === 0 ? theme.farben.tusche : theme.farben.gedaempft,
            }}
          >
            {z}
          </div>
        </Zeile>
      ))}
    </div>
  );
};
