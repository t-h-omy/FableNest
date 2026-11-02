# Fabelnest

Fabelnest is a mobile-first, client-only fantasy creature-care game for children aged 8–12. It has two independent local profiles, a PixiJS game room, and no accounts, backend, or external game-art dependencies.

## Requirements

- Node.js 22.12 or newer
- npm

## Get started

```sh
npm install
npm run dev
```

The app is served locally by Vite. Select either profile to enter its game.

Each profile first chooses `creature_01` (Mika) or `creature_02` (Lumi) for free.
The other friend costs 30 Sternentaler in the shop. Acquired friends can be
renamed (1–24 characters) and switched in the room or collection without losing
their individual progress.

## Build and test

```sh
npm run build
npm test
```

`npm run preview` serves the production build locally. Vite builds the app with its configured GitHub Pages base path; set `VITE_BASE_PATH` when deploying from a differently named project path.

## Architecture

- `src/models.ts` defines the shared profile, creature, house, item, task, and save-state types.
- `src/data/` contains the data-driven creatures, tasks, and shop catalog.
- `src/game/` holds game rules independently from React and PixiJS.
- `src/storage/` stores profiles and schema-versioned saves in IndexedDB using `idb`.
- `src/assets/` is the central registry for procedural placeholder assets. The game-room creature is drawn at runtime with PixiJS; no external game art is loaded.
- `src/components/` and `src/App.tsx` provide the UI and game-room rendering.
- `src/rendering/CreatureRenderer.ts` handles named animations and asset loading
  independently from game rules. The room uses a fixed 640 × 400 coordinate space,
  scaled uniformly with its original aspect ratio on phones and tablets.

## Care and progress

Tap the creature for a reaction or swipe at least 24 room units over it to pet it.
Each gesture triggers at most one pet interaction. Feeding, sleeping, petting and
playing also have keyboard-accessible UI buttons. Care remains available at zero
energy; only playing costs energy. Needs stay between 0 and 100.

`src/data/gameContent.ts` configures care effects and separate XP cooldowns:
tap 2 XP / 10 s, pet 5 XP / 15 s, feed 8 XP / 30 s, sleep 6 XP / 60 s,
play 10 XP / 20 s. Repeated care still changes needs during the XP cooldown,
but does not grant XP or extend the cooldown. Every friend has its own cooldowns.
Each 100 total XP raises its level by one, up to level 20 (1900 XP).
Levels never change its size or species; there is no evolution.

Schema version 2 saves owned creatures, the active creature ID, names, XP,
levels, needs and XP timestamps in IndexedDB. Versions 0/1 are migrated in one
transaction, preserving coins, tasks, decor, the existing name and care values.
Legacy Mika maps to `creature_01`; Lumi and the former Pippin map to
`creature_02` (preserving Pippin's individual name). The migrated creature is
already owned and the other stays locked. Newer save versions are rejected
on both load and write without being overwritten.

## Importing a local creature spritesheet

No real creature art is shipped yet. To replace Mika's placeholder, put your own
texture at `public/assets/creature_01/texture.png` (or `.webp`) and the following
PixiJS atlas at `public/assets/creature_01/creature.json`. This example describes
six 64 × 64 frames in a single 384 × 64 texture; export matching frame names and
dimensions from your sprite tool.

```json
{
  "frames": {
    "idle_0": { "frame": { "x": 0, "y": 0, "w": 64, "h": 64 } },
    "idle_1": { "frame": { "x": 64, "y": 0, "w": 64, "h": 64 } },
    "happy_0": { "frame": { "x": 128, "y": 0, "w": 64, "h": 64 } },
    "eat_0": { "frame": { "x": 192, "y": 0, "w": 64, "h": 64 } },
    "sleep_0": { "frame": { "x": 256, "y": 0, "w": 64, "h": 64 } },
    "play_0": { "frame": { "x": 320, "y": 0, "w": 64, "h": 64 } }
  },
  "animations": {
    "idle": ["idle_0", "idle_1"],
    "happy": ["happy_0"],
    "eat": ["eat_0"],
    "sleep": ["sleep_0"],
    "play": ["play_0"]
  },
  "meta": { "image": "texture.png", "size": { "w": 384, "h": 64 }, "scale": "1" }
}
```

Extend each animation's frame list for real motion. Replace only the
`'creature-mika'` entry's `source` in `src/assets/registry.ts`:

```ts
source: {
  type: 'spritesheet',
  src: `${import.meta.env.BASE_URL}assets/creature_01/creature.json`,
  animations: {
    idle:  { animation: 'idle',  speed: 0.12, loop: true,  scale: 2.2, anchor: { x: 0.5, y: 0.5 } },
    happy: { animation: 'happy', speed: 0.18, loop: false, scale: 2.2, anchor: { x: 0.5, y: 0.5 } },
    eat:   { animation: 'eat',   speed: 0.14, loop: true,  scale: 2.2, anchor: { x: 0.5, y: 0.5 } },
    sleep: { animation: 'sleep', speed: 0.06, loop: true,  scale: 2.2, anchor: { x: 0.5, y: 0.5 } },
    play:  { animation: 'play',  speed: 0.18, loop: true,  scale: 2.2, anchor: { x: 0.5, y: 0.5 } }
  }
}
```

The texture path in `meta.image` is relative to the JSON file. Keep all files
local; no game-logic or save-state changes are needed. `setAnimation(state)`
selects the named animation; speed is PixiJS frames per ticker frame, scale is
uniform, and anchor coordinates are normalized. Missing JSON, textures or state
definitions produce a console warning and automatically retain the animated pink
placeholder for that state. Temporary reactions return to `idle` after 1.8 s
(sleep after 5 s); sleeping restores energy immediately, not on a background timer.

The PWA uses a local, hand-authored SVG icon and caches the application shell for offline use. Progress stays on the current device in the browser's IndexedDB.
