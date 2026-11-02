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

The PWA uses a local, hand-authored SVG icon and caches the application shell for offline use. Progress stays on the current device in the browser's IndexedDB.
