# NotesAI SE

[![CI](https://github.com/dwelsh1/notesai-se/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/dwelsh1/notesai-se/actions/workflows/ci.yml)
[![Unit Tests](https://github.com/dwelsh1/notesai-se/actions/workflows/ci.yml/badge.svg?branch=main&label=unit)](https://github.com/dwelsh1/notesai-se/actions/workflows/ci.yml)
[![E2E Browser](https://github.com/dwelsh1/notesai-se/actions/workflows/ci.yml/badge.svg?branch=main&label=e2e-browser)](https://github.com/dwelsh1/notesai-se/actions/workflows/ci.yml)
[![E2E Electron](https://github.com/dwelsh1/notesai-se/actions/workflows/ci.yml/badge.svg?branch=main&label=e2e-electron)](https://github.com/dwelsh1/notesai-se/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

NotesAI SE is a simplified, local-only NotesAI variant focused on privacy.
It uses a markdown editor (tiptap) with a top toolbar, slash commands, and AI
integration via LM Studio over local HTTP. Electron-only runtime.

## Docs

- Plan: `docs/notesAI_se-plan.md`
- Overview: `docs/readme.md`
- Architecture: `docs/architecture.md`
- API: `docs/api.md`
- Developer guide: `docs/developer.md`
- Testing: `docs/testing.md`
- Changelog: `docs/changelog.md`

## Quick Start

1. Install dependencies: `npm install`
2. Run the app: `npm run dev:electron`

## Project Structure

```
docs/                  # Planning + guides
electron/              # Electron main/preload + SQLite
src/                   # React renderer
tests/                 # Shared selectors + Playwright specs
playwright.config.ts   # Playwright config
vite.config.ts         # Vite + Vitest config
```

## Command Cheatsheet (Windows 11)

### App

| Command | What it does |
| --- | --- |
| `npm run dev:electron` | Runs Vite dev server + Electron app |
| `npm run dev` | Runs Vite dev server only |
| `npm run build` | Builds the renderer (Vite) |
| `npm run build:electron:main` | Builds Electron main/preload |
| `npm run build:electron` | Builds Electron main + renderer |
| `Ctrl + C` | Stops the running dev process in the current terminal |
| `taskkill /F /IM electron.exe` | Force-close Electron if it hangs |

### Unit Tests

| Command | What it does |
| --- | --- |
| `npm run test:unit` | Runs unit tests (Vitest) |
| `npm run test:unit:coverage` | Runs unit tests with coverage |

### Playwright E2E

| Command | What it does |
| --- | --- |
| `npx playwright install` | Installs Playwright browsers (one-time) |
| `npm run test:e2e` | Runs Playwright E2E tests |
| `npm run test:e2e:ui` | Runs Playwright in UI mode |
| `npm run test:e2e:electron` | Runs Playwright E2E against Electron |
| `npx playwright test -g @smoke` | Runs Playwright tests tagged `@smoke` |

### Quality

| Command | What it does |
| --- | --- |
| `npm run lint` | Runs ESLint |
| `npm run lint:fix` | Fixes lint issues where possible |
| `npm run format` | Checks formatting (Prettier) |
| `npm run format:write` | Formats files with Prettier |


## Status

Phase 0 complete.
