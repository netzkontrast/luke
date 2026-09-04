/* Die Aussage des Projekts. Darunter läuft die Auge-Zeichnung über die ganze Bildbreite:
   Ihre lange Linie kommt von links ins Bild, das Auge sitzt rechts. Der rote Faden liegt
   als kurze Marke neben dem Text, nicht als zweite lange Linie, damit er der Zeichnung
   nicht ins Gehege kommt. */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { theme } from '../theme';
import { useForm } from '../layout';
import { BlattVideo } from '../components/Blatt';
import { WortWeise } from '../components/Typo';
import { Faden } from '../components/Faden';

/* Seitenverhältnis von gestaltung-signatur.mp4: 1072 zu 272. */
const SEITE = 1072 / 272;

export const Handschrift: React.FC<{ ende: number }> = ({ ende }) => {
  const f = useForm();
  const grad = f.hoch ? f.mittel * 1.45 : f.mittel * 1.72;
  return (
    <AbsoluteFill>
      {/* Kurze Marke am Textanfang statt einer zweiten durchgehenden Linie. */}
      <Faden
        links={f.hoch ? 7 : 5.5}
        ab={0.25}
        dauer={1.1}
        breite={f.hoch ? 4 : 3}
        von={f.hoch ? 27 : 30}
        bis={f.hoch ? 45 : 50}
      />

      <div
        style={{
          position: 'absolute',
          left: f.hoch ? f.rand * 1.8 : f.rand * 2.2,
          right: f.rand,
          top: f.hoch ? '26%' : '28%',
        }}
      >
        <WortWeise
          text="Dieselbe Hand, dieselbe Linie."
          ab={0.3}
          je={3}
          abstand={Math.round(grad * 0.24)}
          style={{
            fontFamily: theme.schrift.anzeige,
            fontWeight: 300,
            fontSize: grad,
            lineHeight: 1.02,
            color: theme.farben.tusche,
            maxWidth: f.hoch ? '100%' : '15ch',
          }}
        />
        <WortWeise
          text="Nur der Grund wechselt."
          ab={0.95}
          je={3}
          abstand={Math.round(grad * 0.24)}
          style={{
            fontFamily: theme.schrift.anzeige,
            fontWeight: 300,
            fontSize: grad,
            lineHeight: 1.02,
            color: theme.farben.gedaempft,
            maxWidth: f.hoch ? '100%' : '15ch',
            marginTop: Math.round(grad * 0.14),
          }}
        />
      </div>

      {/* Randabfallend: Die Linie der Zeichnung soll das Bild durchqueren, nicht in einem
          Kasten mit Rand sitzen. */}
      <BlattVideo
        datei="video/gestaltung-signatur.mp4"
        ab={1.5}
        raus={ende - 0.5}
        passform="contain"
        style={{
          position: 'absolute',
          left: 0,
          width: '100%',
          /* Höhe aus dem Seitenverhältnis der Datei, sonst schneidet cover die Signatur ab. */
          height: Math.round(f.breite / SEITE),
          top: f.hoch ? '54%' : '52%',
        }}
      />
    </AbsoluteFill>
  );
};
