/* Daten im Ton der Website: „23. September“, ohne führende Null, Monat ausgeschrieben.
   Die Termine selbst stehen in js/works.js (LUKE.CONFIG.ausstellung) und kommen über
   src/werke.ts in den Film. */
import { AUSSTELLUNG } from './werke';

const MONATE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

/* '2026-09-27' → „27. September“, mit Jahr „27. September 2026“. Leer, wenn es nichts taugt. */
export const tagText = (iso: string | undefined, mitJahr = false): string => {
  if (!iso) return '';
  const [j, m, t] = iso.split('-').map(Number);
  if (!j || !m || !t) return '';
  return `${t}. ${MONATE[m - 1]}${mitJahr ? ' ' + j : ''}`;
};

export type Ausstellung = {
  titel?: string;
  art?: string;
  ort?: string;
  vernissage?: { datum: string; von: number; bis: number };
  bis?: string;
};

export const ausstellung = AUSSTELLUNG as Ausstellung;

/* „23. September, 19 bis 21 Uhr“ — kein Gedankenstrich im Bild (remotion-taste). */
export const vernissageText = (): string => {
  const v = ausstellung.vernissage;
  return v ? `${tagText(v.datum)}, ${v.von} bis ${v.bis} Uhr` : '';
};
