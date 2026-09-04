/* Der Bildgrund: Papier, Körnung, eine sehr dünne Waschung.

   Der allgemeine Remotion-Skill verbietet flache Hintergründe und schlägt Farbverläufe vor.
   Hier wäre das falsch: Der Grund ist Papier, seine Textur ist die Körnung, nicht buntes
   Licht. Die Waschung bewegt sich langsam, damit die Fläche lebt, ohne zu leuchten. */
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { theme } from '../theme';

export const Papier: React.FC = () => {
  const bild = useCurrentFrame();
  const x = Math.sin(bild / 190) * 60;
  const y = Math.cos(bild / 240) * 45;
  return (
    <AbsoluteFill style={{ backgroundColor: theme.farben.papier }}>
      {/* Sehr flache Waschung. Sie darf die Fläche beleben, aber nie als Verlauf lesbar
          werden: Sobald man sie als Lichtkegel erkennt, sieht es nach Studio aus statt
          nach Papier. Deshalb große Radien und Deckkraft im niedrigen Prozentbereich. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(78% 70% at ${50 + x / 26}% ${46 + y / 30}%, ${theme.farben.papierHell} 0%, rgba(241,241,239,0) 78%)`,
          opacity: 0.5,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(52% 56% at ${16 - x / 34}% ${82 + y / 34}%, ${theme.farben.fastWeg}33 0%, rgba(201,201,199,0) 76%)`,
          opacity: 0.55,
        }}
      />
    </AbsoluteFill>
  );
};

/* Körnung und Randabdunklung liegen über allem, wie auf der Website (dort .app[data-korn]).
   Multiply, damit die Körnung ins Papier geht statt darauf zu liegen. */
export const Korn: React.FC<{ staerke?: number }> = ({ staerke = 0.3 }) => {
  const bild = useCurrentFrame();
  /* Die Körnung springt nur jedes dritte Bild weiter. Wanderte sie in jedem Bild, müsste
     der Encoder jedes Pixel neu kodieren und die Datei würde um ein Vielfaches größer,
     ohne dass man den Unterschied sieht. */
  const stufe = Math.floor(bild / 3);
  const rauschen = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill
        style={{
          backgroundImage: rauschen,
          backgroundSize: '240px',
          backgroundPosition: `${(stufe * 19) % 240}px ${(stufe * 37) % 240}px`,
          opacity: staerke,
          mixBlendMode: 'multiply',
        }}
      />
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at 50% 48%, rgba(13,13,13,0) 58%, rgba(13,13,13,0.07) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
