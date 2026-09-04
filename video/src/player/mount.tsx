/* Hängt den Auftakt als Remotion-Player in die Website.

   Gebaut wird daraus ein einzelnes Bündel unter assets/js/auftakt-player.js
   (siehe scripts/build-player.mjs). Die Seite lädt es nachträglich und nur dann, wenn
   Bewegung erwünscht ist; ohne das Bündel bleibt der Auftakt so, wie er ohne React ist.

   Der Player läuft einmal durch und hält an. Weil er React ist und keine abgespielte Datei,
   zeichnet er danach weiter neu, sobald sich die Zeigerposition ändert: Die Parallaxe lebt
   also auch dann noch, wenn der Auftakt längst gelaufen ist. */
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Player, type PlayerRef } from '@remotion/player';
import { SeitenAuftakt, auftaktDauer, type AuftaktProps } from '../SeitenAuftakt';

const FPS = 30;
/* Seitenverhältnis der Zeichnung, damit der Player genauso steht wie das Standbild davor. */
const BREITE = 1200;
const HOEHE = 1948;

const Buehne: React.FC = () => {
  const [zeiger, setZeiger] = useState({ x: 0, y: 0 });
  const spieler = useRef<PlayerRef>(null);
  const roh = useRef({ x: 0, y: 0 });
  const rahmen = useRef(0);

  useEffect(() => {
    const bewegt = (e: PointerEvent) => {
      roh.current = {
        x: e.clientX / window.innerWidth - 0.5,
        y: e.clientY / window.innerHeight - 0.5,
      };
      if (rahmen.current) return;
      /* Ein Neuzeichnen pro Bild reicht. Ohne die Bremse rechnet React bei jeder
         Mausbewegung neu, und auf schwachen Geräten bricht die Bildrate ein. */
      rahmen.current = requestAnimationFrame(() => {
        rahmen.current = 0;
        setZeiger((alt) => {
          const x = alt.x + (roh.current.x - alt.x) * 0.12;
          const y = alt.y + (roh.current.y - alt.y) * 0.12;
          return Math.abs(x - alt.x) < 0.0004 && Math.abs(y - alt.y) < 0.0004 ? alt : { x, y };
        });
      });
    };
    window.addEventListener('pointermove', bewegt, { passive: true });
    return () => {
      window.removeEventListener('pointermove', bewegt);
      if (rahmen.current) cancelAnimationFrame(rahmen.current);
    };
  }, []);

  /* Der Player spult am Ende von allein auf Bild null zurück und hält dort an. Auf der
     Seite wäre das eine leere Fläche: Bei Bild null ist noch nichts eingeblendet. Also
     fangen wir das Ende ab und bleiben auf dem letzten Bild stehen, auf dem die Zeichnung
     fertig ist und der rote Faden ganz durchläuft.

     Stehen heißt hier nicht eingefroren: Der Player ist React, kein abgespieltes Video.
     Ändert sich die Zeigerposition, zeichnet er dasselbe Bild mit neuer Parallaxe neu. */
  useEffect(() => {
    const p = spieler.current;
    if (!p) return;
    const letztes = auftaktDauer(FPS) - 1;
    let gehalten = false;
    const halten = () => {
      /* Das Zurückspringen löst selbst wieder "ended" aus. Ohne diese Sperre ruft sich
         der Zuhörer endlos auf und der Aufrufstapel läuft über. */
      if (gehalten) return;
      gehalten = true;
      p.pause();
      p.seekTo(letztes);
    };
    p.addEventListener('ended', halten);
    return () => p.removeEventListener('ended', halten);
  }, []);

  return (
    <Player
      ref={spieler}
      component={SeitenAuftakt}
      inputProps={{ zeiger, eigenerGrund: false, korn: false } satisfies AuftaktProps}
      durationInFrames={auftaktDauer(FPS)}
      fps={FPS}
      compositionWidth={BREITE}
      compositionHeight={HOEHE}
      style={{ width: '100%', height: '100%' }}
      autoPlay
      loop={false}
      controls={false}
      clickToPlay={false}
      doubleClickToFullscreen={false}
      spaceKeyToPlayOrPause={false}
      initiallyMuted
      acknowledgeRemotionLicense
    />
  );
};

const start = (): void => {
  const ziel = document.getElementById('auftakt-buehne');
  const figur = document.querySelector('.hero-fig');
  if (!ziel || !figur) return;
  ziel.hidden = false;
  figur.classList.add('hat-buehne');
  createRoot(ziel).render(<Buehne />);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
