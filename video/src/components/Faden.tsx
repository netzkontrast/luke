/* Der rote Faden. Auf der Website zeigt er links den Scrollfortschritt, im Film ist er das
   Rückgrat: Er wächst durchs Bild, sitzt in jeder Szene woanders und trägt als einziges
   Element die Farbe. Der Schnitt fällt dorthin, wo er ankommt. */
import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

type Props = {
  /* Abstand von links in Prozent der Bildbreite. */
  links: number;
  /* Sekunden bis der Faden zu wachsen beginnt und wie lange er dafür braucht. */
  ab?: number;
  dauer?: number;
  breite?: number;
  /* Von wo nach wo, in Prozent der Bildhöhe. */
  von?: number;
  bis?: number;
  tief?: boolean;
};

export const Faden: React.FC<Props> = ({
  links,
  ab = 0,
  dauer = 1.6,
  breite = 3,
  von = 0,
  bis = 100,
  tief = false,
}) => {
  const bild = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(bild, [ab * fps, (ab + dauer) * fps], [0, 1], {
    easing: theme.kurve.aus,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  /* Leichtes Atmen, damit die Linie nicht wie ein Balken steht. */
  const zittern = Math.sin(bild / 34) * 0.35;
  return (
    <div
      style={{
        position: 'absolute',
        left: `calc(${links}% + ${zittern}px)`,
        top: `${von}%`,
        height: `${bis - von}%`,
        width: breite,
        backgroundColor: tief ? theme.farben.rotTief : theme.farben.rot,
        transform: `scaleY(${p})`,
        transformOrigin: '50% 0%',
      }}
    />
  );
};

/* Waagerechte Fassung für die Auge-Szene, in der die Linie quer durchs Bild fährt. */
export const FadenQuer: React.FC<{
  oben: number;
  ab?: number;
  dauer?: number;
  hoehe?: number;
  von?: number;
  bis?: number;
}> = ({ oben, ab = 0, dauer = 1.6, hoehe = 3, von = 0, bis = 100 }) => {
  const bild = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(bild, [ab * fps, (ab + dauer) * fps], [0, 1], {
    easing: theme.kurve.aus,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: `${oben}%`,
        left: `${von}%`,
        width: `${bis - von}%`,
        height: hoehe,
        backgroundColor: theme.farben.rot,
        transform: `scaleX(${p})`,
        transformOrigin: '0% 50%',
      }}
    />
  );
};
