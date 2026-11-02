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
The other friend is the shop product "Zweites Wesen" (20 stars). Acquired friends
can be renamed (1–24 characters) and activated in the room or collection without
losing their individual progress; exactly one friend is always active.

## Shop, collection and housing

- `src/data/shop.ts` holds the typed shop products (decoration 5, play ball 10,
  second creature 20 stars) and the three room placement slots. Products are
  one-time purchases tracked in the profile's `ownedItemIds` (inventory belongs
  to the profile, not to a creature).
- `src/game/shop.ts` contains the pure purchase/placement rules; purchases and
  placements are validated and saved atomically through `mutateGameState`.
- Each profile has one shared room (`house.placements`: slot → product). Tap an
  item in the inventory, then a slot, to place or move it; tap an occupied slot
  to pick it up. Switching creatures never changes the room. Tapping the play
  ball triggers the active creature's play action.
- Object graphics are pink generated placeholders with distinct shapes and
  labels, resolved through `src/assets/registry.ts` (`image` sources replace the
  placeholder without logic changes).
- Save schema version 5: v4 saves retain furniture, inventory, creatures and
  task history. v3 and older saves also refund obsolete shop items as stars.

## Interdimensionale Pizzalieferung

Start the unlocked minigame in the game room with the active creature as the
visible pilot. Each attempt costs 20 energy immediately, followed by a three-second
countdown, a 60-second fixed-distance flight and a two-second pizza handover.
Use the large up/down buttons or desktop arrow keys to change one of three lanes
at a time. Avoid space cows and flying toilets; collect toppings for 10 score
points each. Three collisions end the flight; a hit grants one second of immunity.
The single configured course leaves two open lanes in every separated obstacle
wave. The game pauses when the browser tab is hidden.

A successful delivery gives the pilot 20 XP plus 2 per topping, capped at 40 XP.
Only the first three successful deliveries per creature and local calendar day
(using the arrival date) grant XP. Defeats give none. Further flights still count
toward that profile's personal highscore, including collected points on defeats.
Level 20 caps total XP; the result displays the amount actually added.
Leaving a flight or reloading abandons it without XP or an energy refund.
An interrupted flight is not resumed. Retrying an unsuccessful result save does
not double-book XP. A newer flight or creature switch in another tab prevents an
old flight from being booked against the wrong pilot.

Every creature regenerates one energy per full minute, up to 100, including time
with the app closed. Its timestamp is persisted; fractional minutes are retained
during regeneration, and time above full energy cannot be banked. Regeneration
uses the local device clock, as do daily household tasks.

- `src/data/minigames.ts`: registry (ID, name, description, default unlock,
  optional shop price), course distance/speed/spacing, timing, energy and XP rules.
  Future purchases can be recorded in `unlockedMinigameIds`; there are no other
  games or minigame shop products yet.
- `src/data/gameContent.ts`: configurable cumulative `LEVEL_THRESHOLDS` for
  levels 1–20 and the energy regeneration interval.
- `src/game/pizzaFlight.ts`: renderer-independent countdown, delta-time movement,
  rectangular collision detection with substeps, course, start and result rules.
- `src/game/progression.ts`: shared XP/level and offline energy calculations.
- `src/components/PizzaDelivery.tsx` and `src/rendering/PizzaFlightRenderer.ts`:
  mobile UI and PixiJS scene. Unmounting removes keyboard/visibility listeners
  and destroys the application, ticker and scene children; there are no game timers.
- `src/assets/registry.ts`: all pink placeholders, including plane, existing
  creature pilot, cows, toilets, topping, space, pizza and alien. `ObjectRenderer`
  supports local PNG/WebP sources and spritesheets with an `idle` animation using
  the same animation definition format as creatures. Replacing a registry source
  does not alter game logic or hitboxes; object images fit their logical art bounds.

Schema 5 adds per-creature energy timestamps and dated XP counters, per-profile
unlocks/highscores, and a pending run plus the last booked result for atomic,
idempotent completion. Migration initializes new fields without inventing offline
energy or previous deliveries. Unknown newer saves remain untouched.

## Build and test

```sh
npm run build
npm test
```

`npm run preview` serves the production build locally. Vite builds the app with its configured GitHub Pages base path; set `VITE_BASE_PATH` when deploying from a differently named project path.

## Architecture

- `src/models.ts` defines the shared profile, creature, house, shop product, task, and save-state types.
- `src/data/` contains the data-driven creatures, tasks, shop products, and placement slots.
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
By default, each 100 total XP raises its level by one, up to level 20 (1900 XP);
the cumulative thresholds are configurable in `src/data/gameContent.ts`.
Levels never change its size or species; there is no evolution.

Schema version 3 saves owned creatures, the active creature ID, names, XP,
levels, needs and XP timestamps in IndexedDB. Versions 0/1 are migrated in one
transaction, preserving coins, tasks, decor, the existing name and care values.
Legacy Mika maps to `creature_01`; Lumi and the former Pippin map to
`creature_02` (preserving Pippin's individual name). The migrated creature is
already owned and the other stays locked. Newer save versions are rejected
on both load and write without being overwritten.

## Household tasks and parent approval

`TASKS` in `src/data/gameContent.ts` configures the four daily household tasks
and their star rewards (1, 3, 5 and 5). New profiles start with zero stars.
Reporting a task only creates a pending request; a parent must enter the local
4–6 digit PIN for each approval. The first approval opens PIN setup, followed
by a separate PIN entry to approve the task. “Eltern-PIN verwalten” sets or
changes the device-wide PIN; changing it requires the previous PIN.

The PIN is stored as a salted PBKDF2-SHA-256 hash in IndexedDB, never as plain
text. There is no server, recovery service or remote validation. This is a
local family approval aid, not protection against someone modifying browser
storage or the device clock.

Every confirmed task records its ID, title, local calendar date and amount
in that profile's star ledger. Each task can earn stars once per profile and
local calendar day, regardless of spending. Pending requests expire at local
midnight and can be reported again. Stars pay for shop items and creatures;
care XP is independent. Approval checks the PIN and updates the latest saved
state in an atomic transaction, preventing double rewards across browser tabs.
UI changes are shown as saved only after their IndexedDB transaction succeeds.

IndexedDB database version 2 adds shared parent settings. Save schema version 3
adds pending requests and star bookings. Versions 0–2 are migrated while
preserving existing balances, creatures and legacy completed-task IDs. Old
undated completions remain archival and do not block new daily requests or
create fictional ledger entries. Unknown newer saves remain untouched.

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
