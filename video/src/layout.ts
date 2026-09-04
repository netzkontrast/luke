/* Ein Film, zwei Formate: 16:9 für die Schleife im Studio und die Website,
   9:16 für Story und Reel. Die Szenen fragen hier nach der Form, statt zwei Fassungen
   zu pflegen. */
import { useVideoConfig } from 'remotion';

export type Form = {
  hoch: boolean;
  breite: number;
  hoehe: number;
  /* Seitlicher Rand. Bei 9:16 bleibt der wichtige Inhalt in den mittleren 75 Prozent der
     Höhe, weil die Bedienflächen der Plattformen oben und unten liegen. */
  rand: number;
  sicherOben: number;
  sicherUnten: number;
  /* Schriftgrößen, an der Bildbreite ausgerichtet. */
  gross: number;
  mittel: number;
  klein: number;
  winzig: number;
};

export const useForm = (): Form => {
  const { width, height } = useVideoConfig();
  const hoch = height > width;
  const einheit = Math.min(width, height * 0.62);
  return {
    hoch,
    breite: width,
    hoehe: height,
    rand: Math.round(einheit * 0.075),
    sicherOben: hoch ? Math.round(height * 0.12) : Math.round(height * 0.07),
    sicherUnten: hoch ? Math.round(height * 0.14) : Math.round(height * 0.07),
    gross: Math.round(einheit * 0.115),
    mittel: Math.round(einheit * 0.05),
    klein: Math.round(einheit * 0.028),
    winzig: Math.round(einheit * 0.021),
  };
};
