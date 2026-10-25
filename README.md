# Git Visualizer

A desktop git client that sits somewhere between GitHub Desktop and the branch graph in VS Code's
sidebar. Open a local repository to see its full commit graph, click a branch tip to check it out,
and use the little character standing on `HEAD` to commit, push, pull, stash and unstash. Built at
nwHacks 2026 with Electron, React, TypeScript, Vite and Tailwind CSS.

## Prerequisites

- Node.js and npm
- `git` on your `PATH` (the app shells out to it)

## Getting started

```bash
npm install
npm run dev
```

`npm run dev` starts the Vite dev server, builds the Electron main and preload scripts into
`dist-electron/`, and opens the app window with hot reload.

## Scripts

| Command             | What it does                                                                |
| ------------------- | --------------------------------------------------------------------------- |
| `npm run dev`       | Run the app in development (Vite + Electron)                                |
| `npm run build`     | Type-check, build the renderer and Electron bundles, and package installers |
| `npm run typecheck` | Type-check the renderer and Electron code                                   |
| `npm run lint`      | Lint with ESLint (fails on any warning)                                     |
| `npm run format`    | Format everything with Prettier                                             |
| `npm run preview`   | Preview the built renderer in a browser (no Electron APIs)                  |

Packaged installers are written to `release/<version>/` (configured in `electron-builder.json5`).
