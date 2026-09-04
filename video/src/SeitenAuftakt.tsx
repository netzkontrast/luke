/* Der Auftakt der Website, live im Browser.

   Diese Komposition läuft nicht als fertiges Video auf der Seite, sondern als React über
   den Remotion-Player. Das ist der Unterschied, den ein gerendertes Video nicht kann: Sie
   bekommt die Zeigerposition als Eigenschaft herein und reagiert darauf, auch nachdem der
   Auftakt durchgelaufen ist.

   Aufbau in Ebenen, von hinten nach vorn, jede mit eigener Tiefe. Die Tiefe entscheidet,
   wie stark eine Ebene dem Zeiger folgt: hinten fast gar nicht, vorn deutlich. Das ist die
   ganze Parallaxe, mehr braucht es nicht.

   Design Read: Auftakt der Website für Erstbesucher, in der Tuschesprache der Werkschau,
   Varianz 8, Bewegung 5, Dichte 1. */
import React, { useMemo, useState } from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { theme } from './theme';
import { Korn } from './components/Papier';

export type AuftaktProps = {
  /* Zeigerposition, jeweils von -0,5 bis 0,5, Mitte ist null. Kommt live von der Seite. */
  zeiger: { x: number; y: number };
  /* Papiergrund mitzeichnen. Auf der Website liegt der Grund schon in der Seite, im
     Studio und beim Rendern braucht die Komposition ihren eigenen. */
  eigenerGrund?: boolean;
  /* Körnung mitzeichnen. Auf der weißen Seite bleibt sie aus. */
  korn?: boolean;
};

export const auftaktStandard: AuftaktProps = { zeiger: { x: 0, y: 0 }, eigenerGrund: true, korn: true };

/* Sekunden, an denen sich der Auftakt orientiert.

   Das Video zeigt, wie das Profil entsteht; stehen bleibt am Ende die kniende Figur. Das
   sind zwei Blätter, und genau so soll es auch gelesen werden. Zwischen beiden liegt
   deshalb eine knappe Leerstelle: Ohne sie sähe der Übergang aus, als verwandelte sich
   eine Zeichnung in eine andere. Mit ihr ist es ein Schnitt.

   Beide sind Gestaltung, keine Werke: Sie tragen die Seite, stehen aber nicht im
   Werkverzeichnis. Siehe LUKE.GESTALTUNG in js/works.js. */
const T = {
  fern: 0.15,
  zeichnen: 0.35,
  zeichnenEnde: 6.05,
  blattFrei: 6.75,
  gesamt: 9.4,
};

/* Eine Ebene mit Tiefe. tiefe 0 steht still, tiefe 1 folgt dem Zeiger ganz. */
const Ebene: React.FC<{
  tiefe: number;
  zeiger: { x: number; y: number };
  drift?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ tiefe, zeiger, drift = 1, children, style }) => {
  const bild = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = bild / fps;
  /* Zum Zeiger kommt eine sehr langsame Eigenbewegung. Ohne sie steht das Bild still,
     sobald niemand die Maus bewegt, und auf dem Telefon gäbe es gar keine Parallaxe. */
  const eigenX = Math.sin(t / 5.5) * 6 * drift;
  const eigenY = Math.cos(t / 7.5) * 5 * drift;
  const x = zeiger.x * 96 * tiefe + eigenX * tiefe;
  const y = zeiger.y * 62 * tiefe + eigenY * tiefe;
  return (
    <AbsoluteFill
      style={{
        transform: `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`,
        willChange: 'transform',
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const SeitenAuftakt: React.FC<AuftaktProps> = ({ zeiger, eigenerGrund = false, korn = true }) => {
  const bild = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const s = (sek: number) => sek * fps;

  /* Die Zeichenanimation liegt als WebM und als MP4 vor. Welche der Browser nehmen kann,
     entscheidet er selbst; ohne diese Wahl bleibt die Fläche in Browsern ohne H.264 leer. */
  const quelle = useMemo(() => {
    if (typeof document === 'undefined') return 'video/gestaltung-profil-zeichnung.mp4';
    const probe = document.createElement('video');
    return probe.canPlayType('video/webm; codecs="vp9"')
      ? 'video/gestaltung-profil-zeichnung.webm'
      : 'video/gestaltung-profil-zeichnung.mp4';
  }, []);
  /* Klappt die Wiedergabe trotzdem nicht, tritt sofort das fertige Blatt an ihre Stelle. */
  const [videoKaputt, setVideoKaputt] = useState(false);

  const auf = (ab: number, dauer: number) =>
    interpolate(bild, [s(ab), s(ab + dauer)], [0, 1], {
      easing: theme.kurve.aus,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

  /* Die fernen Blätter kommen zuerst und bleiben schwach: Sie sind Tiefe, kein Motiv.
     Dafür bleibt Werk I das Material — dünne Linien, viel Weiß, das liest sich als Dunst.
     Das Blatt, das vorn steht, ist eine dichte schwarze Masse; vergrößert und multipliziert
     ergäbe es keine Tiefe, sondern eine graue Wolke. */
  const fern = auf(T.fern, 1.6);
  /* Das Zeichenvideo läuft einmal durch, danach übernimmt das fertige Blatt. */
  const videoWeg = auf(T.zeichnenEnde, 0.5);
  const blatt = videoKaputt ? 1 : auf(T.blattFrei, 0.9);
  /* Ganz langsames Heranfahren über die volle Länge, wie Ken Burns, nur zurückhaltender. */
  const zoom = interpolate(bild, [0, s(T.gesamt)], [1.045, 1], {
    easing: theme.kurve.beides,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: eigenerGrund ? theme.farben.papier : 'transparent',
        overflow: 'hidden',
      }}
    >
      {/* Ebene 1, ganz hinten: ein großes, sehr blasses Blatt. */}
      <Ebene tiefe={0.14} zeiger={zeiger} drift={0.6}>
        <Img
          src={staticFile('img/gestaltung-profil-1200.jpg')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '38% 30%',
            mixBlendMode: 'multiply',
            /* Grau, nicht rot: Werk I trägt seinen roten Strang, und der würde als blasser
               Fleck neben der schwarzen Zeichnung stehen. Rot gehört hier der Tropfspur. */
            filter: 'grayscale(1)',
            opacity: fern * 0.1,
            transform: `scale(${1.55 * zoom})`,
          }}
        />
      </Ebene>

      {/* Ebene 2: dasselbe Blatt näher, seitlich versetzt, immer noch blass. */}
      <Ebene tiefe={0.3} zeiger={zeiger} drift={0.8}>
        <Img
          src={staticFile('img/gestaltung-profil-1200.jpg')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '68% 62%',
            mixBlendMode: 'multiply',
            /* Grau, nicht rot: Werk I trägt seinen roten Strang, und der würde als blasser
               Fleck neben der schwarzen Zeichnung stehen. Rot gehört hier der Tropfspur. */
            filter: 'grayscale(1)',
            opacity: fern * 0.16,
            transform: `scale(${1.22 * zoom}) translateX(-4%)`,
          }}
        />
      </Ebene>

      {/* Ebene 3, das Motiv: die Zeichnung entsteht. */}
      <Ebene tiefe={0.48} zeiger={zeiger}>
        <OffthreadVideo
          src={staticFile(quelle)}
          muted
          onError={() => setVideoKaputt(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            mixBlendMode: 'multiply',
            opacity: videoKaputt ? 0 : (1 - videoWeg) * auf(T.zeichnen, 0.5),
            transform: `scale(${zoom})`,
          }}
        />
      </Ebene>

      {/* Ebene 4: das Blatt, das am Ende steht. Ausschnitt wie das Standbild in der Seite
          (cover, rechtsbündig), damit Live-Auftakt und Rückfallebene deckungsgleich sind:
          Das Blatt hat links ein breites leeres Drittel, das hier wegfällt. */}
      <Ebene tiefe={0.48} zeiger={zeiger}>
        <Img
          src={staticFile('img/gestaltung-kniend-1200.jpg')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '100% 50%',
            mixBlendMode: 'multiply',
            opacity: blatt,
            transform: `scale(${zoom})`,
          }}
        />
      </Ebene>

      {/* Ebene 5, ganz vorn: ein Ausschnitt der Zeichnung, groß und blass, der dem Zeiger
          am deutlichsten folgt. Er gibt der Parallaxe ihre vorderste Kante.

          Hier stand vorher ein roter Faden. Er ist raus: Rot gehört auf dieser Seite der
          Tropfspur, die unter dem Blatt weiterläuft. Ein zweites Rot im selben Blickfeld
          nähme ihr die Wirkung. */}
      <Ebene tiefe={0.95} zeiger={zeiger} drift={0.4}>
        <Img
          src={staticFile('img/gestaltung-profil-1200.jpg')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '82% 88%',
            mixBlendMode: 'multiply',
            /* Grau, nicht rot: Werk I trägt seinen roten Strang, und der würde als blasser
               Fleck neben der schwarzen Zeichnung stehen. Rot gehört hier der Tropfspur. */
            filter: 'grayscale(1)',
            opacity: fern * 0.09,
            transform: `scale(${2.1 * zoom})`,
          }}
        />
      </Ebene>

      {/* Körnung liegt über allem und bewegt sich nicht mit. Auf der weißen Seite aus. */}
      {korn ? <Korn staerke={0.22} /> : null}

      {/* Ein Hauch Papierton über der ganzen Fläche, damit Video und Foto denselben
          Grundton bekommen. Keine Farbgradierung, nur Papier. */}
      {korn ? (
        <AbsoluteFill
          style={{
            backgroundColor: theme.farben.papierHell,
            mixBlendMode: 'soft-light',
            opacity: 0.1,
            pointerEvents: 'none',
          }}
        />
      ) : null}
      <span style={{ display: 'none' }}>{height}</span>
    </AbsoluteFill>
  );
};

export const auftaktDauer = (fps: number): number => Math.round(T.gesamt * fps);
