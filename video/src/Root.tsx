import React from 'react';
import { Composition } from 'remotion';
import { Werkschau, gesamtDauer } from './Werkschau';

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Für die Schleife im Studio und für die Website. */}
      <Composition
        id="Werkschau"
        component={Werkschau}
        durationInFrames={gesamtDauer(FPS)}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Für Story und Reel. Gleiche Szenen, anderes Format: die Szenen fragen über
          useForm nach der Bildform. */}
      <Composition
        id="WerkschauHoch"
        component={Werkschau}
        durationInFrames={gesamtDauer(FPS)}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
