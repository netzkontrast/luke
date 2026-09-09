# Herkunft

Motion 13.2.0, die Animationsbibliothek von Matt Perry.

- Projekt: https://github.com/motiondivision/motion — Dokumentation: https://motion.dev/docs
- Bezogen über npm: `npm pack motion@13.2.0`
- Lizenz: MIT, siehe `LICENSE`

| Datei | Quelle im Paket | Größe |
| --- | --- | --- |
| `motion-13.2.0.min.js` | `dist/motion.js` (UMD-Bündel, stellt `window.Motion` bereit) | 140,5 kB, 46,7 kB gezippt |

Unverändert übernommen. SHA-256: `b24a0c29134800dad72021e22d5ead99fa941722526807f29c131f6fbffa5fe2`

Sie liegt hier und nicht auf einem CDN, weil die Datenschutzerklärung der Seite zusagt, dass
zur Laufzeit nichts von Dritten nachgeladen wird.

## Wofür

Die gesamte Bewegung der Seite: Eintritte beim Sichtbarwerden, scrollgebundene Bewegung
(über `ScrollTimeline`, wo der Browser sie kann), Federn, Zeigerfolge, Gesten. Der Zugang
läuft über `js/bewegung.js`; die Abschnitte nehmen Motion nicht direkt, sondern fragen dort.
