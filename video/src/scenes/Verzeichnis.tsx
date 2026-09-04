/* Das Werkverzeichnis als Schriftbild. Kein Raster aus gleich großen Kacheln und keine
   erfundenen Abbildungen: Es stehen nur Arbeiten drin, die es gibt, mit den Titeln aus
   js/works.js. Die Zeilen kommen gestaffelt, getrennt durch Haarlinien.

   Die Spalte ist bewusst schmal. Über die ganze Bildbreite gezogen läsen die Haarlinien
   als Tabelle; in einer Spalte lesen sie als Verzeichnis. */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { theme } from '../theme';
import { useForm } from '../layout';
import { Zeile, Eintritt } from '../components/Typo';
import { Faden } from '../components/Faden';
import { WERKE } from '../werke';

const ZAHLWORT = [
  'null', 'ein', 'zwei', 'drei', 'vier', 'fünf',
  'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf',
];

export const Verzeichnis: React.FC<{ ende: number }> = ({ ende }) => {
  const f = useForm();
  const papier = WERKE.filter((w) => w.traeger === 'papier');
  const haut = WERKE.filter((w) => w.traeger === 'haut');
  const hautZahl = ZAHLWORT[haut.length] ?? String(haut.length);
  const spalte = f.hoch ? f.breite - f.rand * 3 : Math.round(f.breite * 0.52);

  return (
    <AbsoluteFill>
      <Faden
        links={f.hoch ? 8 : 6}
        ab={0.2}
        dauer={2.8}
        von={f.hoch ? 26 : 24}
        bis={f.hoch ? 74 : 76}
        breite={f.hoch ? 4 : 3}
      />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: `${f.sicherOben}px ${f.rand}px ${f.sicherUnten}px`,
          paddingLeft: f.hoch ? f.rand * 1.9 : f.rand * 2.4,
        }}
      >
        <div style={{ width: spalte }}>
          <Zeile ab={0.2} raus={ende - 0.5}>
            <div
              style={{
                fontFamily: theme.schrift.anzeige,
                fontWeight: 300,
                fontSize: f.mittel,
                color: theme.farben.tusche,
                marginBottom: Math.round(f.klein * 0.8),
              }}
            >
              Arbeiten auf Papier
            </div>
          </Zeile>

          {papier.map((w, i) => (
            <Eintritt key={w.nr} ab={0.55 + i * 0.17} raus={ende - 0.5 - i * 0.03} hub={18}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: Math.round(f.klein * 0.7),
                  borderTop: `1px solid ${theme.farben.linie}`,
                  padding: `${Math.round(f.klein * 0.44)}px 0`,
                }}
              >
                <span
                  style={{
                    fontFamily: theme.schrift.anzeige,
                    fontWeight: 400,
                    fontSize: f.winzig,
                    color: theme.farben.gedaempft,
                    minWidth: Math.round(f.klein * 1.9),
                    letterSpacing: '0.12em',
                  }}
                >
                  {w.nr}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontFamily: theme.schrift.lauf,
                    fontWeight: 500,
                    fontSize: f.klein,
                    color: theme.farben.tusche,
                    lineHeight: 1.25,
                  }}
                >
                  {w.titel}
                </span>
                <span
                  style={{
                    fontFamily: theme.schrift.lauf,
                    fontWeight: 400,
                    fontSize: f.winzig,
                    color: theme.farben.gedaempft,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {w.jahr}
                </span>
              </div>
            </Eintritt>
          ))}

          <Eintritt ab={0.55 + papier.length * 0.17 + 0.35} raus={ende - 0.5} hub={18}>
            <div
              style={{
                marginTop: Math.round(f.klein * 1.2),
                fontFamily: theme.schrift.serife,
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: Math.round(f.klein * 1.04),
                color: theme.farben.gedaempft,
                lineHeight: 1.45,
              }}
            >
              {haut.length > 0 ? (
                <>
                  Dazu {hautZahl} Arbeiten auf Haut.
                  <br />
                  Beides Originale, beides aus der Hand gegeben.
                </>
              ) : (
                <>Originale, aus der Hand gegeben.</>
              )}
            </div>
          </Eintritt>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
