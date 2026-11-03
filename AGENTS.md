# Fabelnest: verbindliche Projektregeln

## Produktanforderungen

- Fabelnest ist ein mobile-first Fantasy-Creature-Care-Spiel für Kinder von 8 bis 12 Jahren. UI-Texte sind auf Deutsch, zugänglich und wertschätzend, nicht babyhaft.
- Das Projekt ist vollständig clientseitig. Keine Konten, Server, APIs, Cloud-Datenbanken, Telemetrie oder externen Spielgrafiken ergänzen.
- Es gibt genau zwei voneinander unabhängige lokale Kinderprofile. Profile und versionierte Spielstände müssen nach einem Browser-Neustart aus IndexedDB wiederhergestellt werden.
- Unterstütze Smartphones und Tablets im Hoch- und Querformat. Alle Hauptbereiche Spielzimmer, Aufgaben, Shop und Sammlung bleiben erreichbar.

## Architektur und Änderungen

- React und TypeScript laufen im Strict-Modus. UI, PixiJS-Rendering, Spiellogik, persistente Speicherung und Datenkonfiguration bleiben getrennt.
- Gemeinsame Modelle liegen in `src/models.ts`; veränderliche Inhalte für Wesen, Aufgaben und Shop gehören nach `src/data/`.
- Spiellogik gehört nach `src/game/` und darf keine UI- oder Renderer-Abhängigkeit erhalten.
- IndexedDB-Zugriffe gehören nach `src/storage/`. Jede Änderung am gespeicherten Format muss versioniert und mit einer sicheren Migration versehen werden. Unbekannte neuere Speicherstände dürfen nicht überschrieben werden.
- Spielgrafiken sind zunächst lokal programmatisch erzeugte pinkfarbene Platzhalter. Verwalte Assets über `src/assets/registry.ts`; spätere PNG/WebP- oder PixiJS-Spritesheet-Quellen sollen ohne Änderungen an der Spiellogik austauschbar sein.
- Verwende CSS für die Oberfläche und füge keine UI-Komponentenbibliothek hinzu. Füge Abhängigkeiten nur hinzu, wenn die Produktanforderungen sie rechtfertigen.
- Jede Änderung an Oberfläche, Interaktion oder Feedback folgt der UI/UX-Bible `docs/UI_UX_BIBLE.md`. Farben, Typo, Abstände, Radien und Bewegungen kommen ausschließlich aus `src/styles/tokens.css`. Neue Komponenten oder Regeln werden in der Bible ergänzt.
- Keine Zugangsdaten, personenbezogene Daten, Werbe- oder Tracking-Funktionen hinzufügen. Speichere Spielstände ausschließlich lokal.

## Qualitätssicherung

- Halte TypeScript strict und ändere oder entferne keine unabhängigen Tests, um Builds grün zu bekommen.
- Ergänze gezielte Vitest-Tests für neue Spiellogik und Persistenzverhalten.
- Prüfe Änderungen mindestens mit `npm test` und `npm run build`.
- Dokumentiere notwendige Setup-, Build-, Test- oder Architekturänderungen in `README.md`.
