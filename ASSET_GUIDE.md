# Sprite-Asset-Leitfaden

Alle Grafiken bleiben lokale PNG- oder WebP-Dateien. Der aktuelle Prototyp
verwendet pinkfarbene Platzhalter; echte Assets sind optional.

## Verzeichnis und Formate

```text
public/
└── assets/
    └── creature_01/
        ├── texture.png       # alternativ texture.webp
        └── creature.json    # PixiJS-Spritesheet-/Atlas-JSON
```

Empfohlen sind PNG mit Transparenz oder verlustarmes WebP. Das Atlas-JSON muss
die benutzte Textur relativ zu seiner eigenen Datei referenzieren. Ein
Spritesheet-Frame ist quadratisch und standardmäßig 64 × 64 Pixel; 96 × 96 oder
128 × 128 Pixel sind für detailreichere Wesen ebenfalls geeignet. Alle Frames
einer Animation sollten dieselbe Größe und konsistente Ausrichtung haben.

## Animationsnamen

Die Registry verwendet diese Zustände: `idle` (ruhig, Schleife), `happy`
(Reaktion), `eat` (Fressen), `sleep` (Schlafen) und `play` (Spielen). Pro
Animation enthält das Atlas eine Frame-Liste, zum Beispiel `idle_0`, `idle_1`
und `happy_0`. `idle`, `eat`, `sleep` und `play` laufen üblicherweise in einer
Schleife; `happy` ist üblicherweise eine kurze einmalige Reaktion. Fehlende
Dateien oder Zustände behalten den pinken Platzhalter bei.

## Einbinden

Ergänze in `src/assets/registry.ts` die Asset-Quelle des Wesens:

```ts
source: {
  type: 'spritesheet',
  src: `${import.meta.env.BASE_URL}assets/creature_01/creature.json`,
  animations: {
    idle:  { animation: 'idle',  speed: 0.12, loop: true,  scale: 2.2 },
    happy: { animation: 'happy', speed: 0.18, loop: false, scale: 2.2 },
    eat:   { animation: 'eat',   speed: 0.14, loop: true,  scale: 2.2 },
    sleep: { animation: 'sleep', speed: 0.06, loop: true,  scale: 2.2 },
    play:  { animation: 'play',  speed: 0.18, loop: true,  scale: 2.2 },
  },
}
```

Die Namen in `animation` müssen den benannten Animationslisten im Atlas-JSON
entsprechen. Passe `scale` an die Zeichenfläche des Wesens an; `anchor` ist
optional und verwendet normalisierte Koordinaten von 0 bis 1. `BASE_URL` hält
den Asset-Pfad für GitHub-Pages-Unterverzeichnisse korrekt. Die Spiel- und
Fortschrittslogik muss dafür nicht geändert werden.

