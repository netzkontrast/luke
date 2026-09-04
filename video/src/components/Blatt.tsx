/* Zeichnungen und Zeichenvideos auf dem Papiergrund.

   Die eine Regel, die alles trägt: Lukes Arbeiten sind Tusche und Rot auf weißem Papier.
   mixBlendMode multiply lässt das Weiß im Papiergrund verschwinden, nur Tusche und Rot
   bleiben stehen. Ohne multiply klebt ein weißer Kasten auf hellgrauem Grund. */
import React from 'react';
import { Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

type Gemeinsam = {
  ab?: number;
  raus?: number;
  style?: React.CSSProperties;
};

/* Ken Burns: langsamer Zoom mit Wanderung. Jedes Standbild bekommt ihn, sonst steht das
   Bild tot im Film. */
const kenBurns = (p: number, weite: number, richtung: number) => ({
  transform: `scale(${interpolate(p, [0, 1], [1, 1 + weite])}) translate(${interpolate(
    p,
    [0, 1],
    [0, richtung * 1.6]
  )}%, ${interpolate(p, [0, 1], [0, -1.1])}%)`,
});

export const BlattBild: React.FC<
  Gemeinsam & { datei: string; alt?: string; weite?: number; richtung?: number; tusche?: boolean }
> = ({ datei, ab = 0, raus, weite = 0.05, richtung = 1, tusche = true, style }) => {
  const bild = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const lauf = interpolate(bild, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const auf = interpolate(bild, [ab * fps, (ab + 1.1) * fps], [0, 1], {
    easing: theme.kurve.aus,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const weg =
    raus === undefined
      ? 0
      : interpolate(bild, [raus * fps, (raus + 0.45) * fps], [0, 1], {
          easing: theme.kurve.rein,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
  return (
    /* Kein overflow hidden: Der Ken Burns würde sonst die Ränder der Zeichnung abschneiden.
       Über den Rand hinaus ist nur weißes Papier, und das ist unter multiply unsichtbar. */
    <div style={{ ...style }}>
      <Img
        src={staticFile(datei)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          mixBlendMode: tusche ? 'multiply' : 'normal',
          opacity: auf * (1 - weg),
          ...kenBurns(lauf, weite, richtung),
        }}
      />
    </div>
  );
};

/* Fotografie, nicht Tusche: kein multiply, dafür etwas mehr Kontrast, damit das Korn des
   Fotos zur Zeichnung passt. */
export const Foto: React.FC<Gemeinsam & { datei: string; weite?: number; richtung?: number }> = ({
  datei,
  ab = 0,
  raus,
  weite = 0.1,
  richtung = -1,
  style,
}) => {
  const bild = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const lauf = interpolate(bild, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const auf = interpolate(bild, [ab * fps, (ab + 1.3) * fps], [0, 1], {
    easing: theme.kurve.aus,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const weg =
    raus === undefined
      ? 0
      : interpolate(bild, [raus * fps, (raus + 0.45) * fps], [0, 1], {
          easing: theme.kurve.rein,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
  return (
    <div style={{ overflow: 'hidden', ...style }}>
      <Img
        src={staticFile(datei)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'contrast(1.08) saturate(0.9)',
          opacity: auf * (1 - weg),
          ...kenBurns(lauf, weite, richtung),
        }}
      />
    </div>
  );
};

/* Das Entstehen der Zeichnung. OffthreadVideo statt Video, wie vom Skill verlangt. */
export const BlattVideo: React.FC<
  Gemeinsam & { datei: string; start?: number; passform?: 'contain' | 'cover' }
> = ({ datei, ab = 0, raus, start = 0, passform = 'contain', style }) => {
  const bild = useCurrentFrame();
  const { fps } = useVideoConfig();
  const auf = interpolate(bild, [ab * fps, (ab + 0.8) * fps], [0, 1], {
    easing: theme.kurve.aus,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const weg =
    raus === undefined
      ? 0
      : interpolate(bild, [raus * fps, (raus + 0.45) * fps], [0, 1], {
          easing: theme.kurve.rein,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
  return (
    <div style={{ ...style }}>
      <OffthreadVideo
        src={staticFile(datei)}
        startFrom={start}
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: passform,
          mixBlendMode: 'multiply',
          opacity: auf * (1 - weg),
        }}
      />
    </div>
  );
};
