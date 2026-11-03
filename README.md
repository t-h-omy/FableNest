# Fabelnest

Fabelnest ist ein mobile-first Fantasy-Creature-Care-Spiel für Kinder von 8 bis
12 Jahren. Das Spiel läuft vollständig im Browser: Es gibt genau zwei getrennte
lokale Profile, keine Konten und keinen Server. Spielgrafiken sind pinkfarbene,
lokal erzeugte Platzhalter.

## Lokal starten und prüfen

Voraussetzung ist Node.js 22.22.2 oder neuer.

```sh
npm ci
npm run dev
```

`npm run typecheck`, `npm test` und `npm run build` prüfen Typen, Tests und den
Production-Build. `npm run preview` startet den fertigen Build lokal.

## Spielablauf

Wähle eines der beiden Profile, nimm Mika oder Lumi als kostenloses Startwesen
und gib ihm einen Namen. Im Spielzimmer kannst du es pflegen, XP verdienen und
die freigeschaltete interdimensionale Pizzalieferung spielen. Melde Aufgaben;
eine erwachsene Person bestätigt sie mit dem lokalen Eltern-PIN und vergibt
Sterne. Sterne kaufst du für Dekoration, Spielzeug und das zweite Wesen. Jedes
Wesen hat eigene Bedürfnisse, Energie und XP. Aufgaben, Sterne, Einrichtung,
Inventar und Wesen gehören zum jeweiligen Profil.

## GitHub-Pages-Deployment

Der Workflow `.github/workflows/deploy-pages.yml` prüft Typen und Tests und
erstellt bei Pushes einen Build für den `gh-pages`-Branch. Für `main` nutzt
Vite `/FableNest/`; Branch-Vorschauen erhalten einen passenden Unterpfad.
Aktiviere in den Repository-Einstellungen GitHub Pages mit der Quelle
**Deploy from a branch**, Branch `gh-pages` und Verzeichnis `/` (für Vorschauen
liegt die Hauptseite im Unterverzeichnis `previews/<branch>`).

Für lokale Builds oder Deployments mit einem anderen Projektpfad kann
`VITE_BASE_PATH` gesetzt werden, zum Beispiel:

```sh
VITE_BASE_PATH=/mein-projekt/ npm run build
```

Manifest, Assets und der automatisch registrierte Service Worker werden mit
dem Vite-Basispfad gebaut. Der Service Worker cached den App-Shell-Build und
statische Bild-, Skript-, CSS-, Manifest- und Schriftdateien für Offline-Starts.
Nach dem ersten erfolgreichen Online-Aufruf ist die App installierbar; Icon und
Startbildschirm verwenden das lokale pinkfarbene SVG-Icon und die pinke
Manifest-Hintergrundfarbe.

## Spielstandspeicherung

Profile und Spielstände liegen ausschließlich lokal in IndexedDB. Beide Profile
haben getrennte Spielstände; der Eltern-PIN gilt gemeinsam auf diesem Gerät und
wird als gesalzener Hash gespeichert. Versionierte Spielstände werden beim Laden
sicher migriert. Unbekannte neuere Versionen werden nicht überschrieben.
Browserdaten löschen oder ein Gerätewechsel entfernt den lokalen Spielstand;
es gibt keinen Export-, Cloud- oder Wiederherstellungsdienst.

## Sprite-Assets importieren

Echte lokale PNG- oder WebP-Spritesheets können pro Wesen in
`public/assets/<wesen-id>/` abgelegt und über `src/assets/registry.ts`
eingetragen werden. Die Registry-Definition verweist auf ein PixiJS-Atlas-JSON
und ordnet die Animationen `idle`, `happy`, `eat`, `sleep` und `play` zu.
Fehlende Dateien oder Animationen zeigen weiterhin die pinken Platzhalter.
Dateiformate, Verzeichnisbeispiel, Framegrößen und ein Registry-Beispiel stehen
in [`ASSET_GUIDE.md`](ASSET_GUIDE.md).

## Bekannte Einschränkungen

- Es gibt zwei Wesen, vier tägliche Aufgaben und ein Minispiel.
- Das Minispiel verbraucht 20 Energie beim Start; nach Neuladen wird ein
  begonnener Flug nicht fortgesetzt und die Energie nicht erstattet.
- Tageswechsel und Energiewiederherstellung verwenden die lokale Geräteuhr.
- Der Eltern-PIN ist eine lokale Familienfreigabe, kein Schutz vor Änderungen
  an Browserdaten oder Systemuhr.
- Offline-Betrieb ist nach einem erfolgreichen Laden der App möglich; erstmalige
  Installation und Laden benötigen eine Verbindung.
- Animationen und Spielobjekte bleiben Platzhalter, bis lokale Spritesheets
  importiert werden.
