# Herkunft

htmx 4.0.0, erschienen am 28. August 2026.

- Projekt: https://github.com/bigskysoftware/htmx
- Bezogen über: https://cdn.jsdelivr.net/npm/htmx.org@4.0.0/
- Lizenz: Zero-Clause BSD, siehe `LICENSE`

| Datei | Quelle im Paket | Größe |
| --- | --- | --- |
| `htmx-4.0.0.min.js` | `dist/htmx.min.js` | 36,7 kB |
| `hx-live-4.0.0.min.js` | `dist/ext/hx-live.min.js` | 14,8 kB |

Unverändert übernommen. Sie liegen hier und nicht auf einem CDN, weil die
Datenschutzerklärung der Seite zusagt, dass zur Laufzeit nichts von Dritten nachgeladen
wird.

## Wofür

Nur `skizze.html` bindet sie ein, und dort nur für die Anzeige am unteren Rand. Der Kern
von htmx spricht mit einem Server; diese Seite hat keinen. Brauchbar ist allein die
Erweiterung `hx-live`: reaktive Ausdrücke im Markup, die auf DOM-Mutationen neu rechnen.
Der Weltzustand schreibt dafür zehnmal die Sekunde gerundete Werte als `data-welt-*` auf
`<html>`.

Für die Bewegung taugt das nicht — `hx-live` rechnet auf Mutationen, nicht im Bildtakt,
und warnt selbst, sobald seine Ausdrücke über 16 ms brauchen. Zahlen zum Lesen also
deklarativ, sechzig Bilder je Sekunde in einer Schleife.
