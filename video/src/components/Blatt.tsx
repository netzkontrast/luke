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

/* Die Schräge, mit der sich ein Blatt ablegt, bevor es sich gerade richtet. Dieselben Werte
   wie auf der Seite (css/site.css, --dreh an .g-blatt). */
const DREH = [-1.1, 0.8, 1.4];

/* Ein Werk aus mehreren Blättern, so wie es hängt: nebeneinander, gleich hoch, mit einer
   schmalen Fuge. Die Blätter legen sich nacheinander ab und richten sich gerade, wie beim
   Eintritt „blatt“ auf der Seite (js/bewegung.js). Danach steht die Reihe, und nur der
   Ken Burns läuft, auf der ganzen Reihe, damit die Fugen gleich bleiben.

   multiply liegt deshalb auf der Reihe und nicht auf dem Blatt: Die Reihe braucht für den
   Ken Burns ein transform und ist damit eine abgeschlossene Ebene. Ein Blatt darin sähe
   mit multiply nur die leere Ebene, nicht das Papier, und stünde als weißer Kasten da.
   Die Blätter multiplizieren trotzdem auch untereinander, damit eine schräge Ecke im
   Eintritt nicht die Tusche des Nachbarn verdeckt. */
export const Haengung: React.FC<
  Gemeinsam & {
    blaetter: { datei: string; seite: number }[];
    hoehe: number;
    fuge: number;
    /* Sekunden zwischen zwei Blättern. */
    versatz?: number;
    weite?: number;
    richtung?: number;
  }
> = ({ blaetter, hoehe, fuge, ab = 0, raus, versatz = 0.17, weite = 0.04, richtung = -1, style }) => {
  const bild = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const lauf = interpolate(bild, [0, durationInFrames], [0, 1], {
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
    <div
      style={{
        display: 'flex',
        gap: fuge,
        height: hoehe,
        mixBlendMode: 'multiply',
        opacity: 1 - weg,
        transform: `${kenBurns(lauf, weite, richtung).transform} translateY(${weg * -14}px)`,
        ...style,
      }}
    >
      {blaetter.map((b, i) => {
        const p = interpolate(bild, [(ab + i * versatz) * fps, (ab + i * versatz + 1) * fps], [0, 1], {
          easing: theme.kurve.seite,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <Img
            key={b.datei}
            src={staticFile(b.datei)}
            style={{
              display: 'block',
              width: Math.round(hoehe * b.seite),
              height: hoehe,
              mixBlendMode: 'multiply',
              opacity: p,
              transform: `translateY(${(1 - p) * hoehe * 0.032}px) rotate(${(1 - p) * DREH[i % DREH.length]}deg)`,
            }}
          />
        );
      })}
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
