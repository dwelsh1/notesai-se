# NotesAI SE

[![CI](https://github.com/dwelsh1/notesai-se/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/dwelsh1/notesai-se/actions/workflows/ci.yml)
[![Version](https://img.shields.io/github/package-json/v/dwelsh1/notesai-se?label=version)](https://github.com/dwelsh1/notesai-se/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Electron](https://img.shields.io/badge/Electron-39-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.58-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![tiptap](https://img.shields.io/badge/tiptap-2-000000?logo=prosemirror&logoColor=white)](https://tiptap.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Node.js](https://img.shields.io/badge/Node.js-LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

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

**Semantic search**: Sparkles button in the sidebar or **Ctrl+Shift+K** (Windows/Linux) / **Cmd+Shift+K** (Mac).

**AI Chat**: MessageCircle button in the sidebar or **Ctrl+Shift+C** (Windows/Linux) / **Cmd+Shift+C** (Mac). Chat with AI using your notes as context (LM Studio).

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

| Command                         | What it does                                         |
| ------------------------------- | ---------------------------------------------------- |
| `npm run build:electron`        | Builds Electron main/preload + the Vite renderer     |
| `npm run start:desktop`         | Starts the desktop app (PowerShell)                  |
| `npm run stop:desktop`          | Stops Electron and Node processes (PowerShell)       |
| `npm run dev:electron`          | Runs Vite dev server + Electron app                  |
| `npm run dev:start`             | Alias for `dev:electron`                             |
| `npm run dev:stop`              | Alias for `stop:desktop`                             |
| `npm run dev`                   | Runs Vite dev server only                            |
| `npm run build`                 | Builds the renderer (Vite)                           |
| `npm run build:electron:main`   | Builds Electron main/preload                         |
| `npm run start:desktop:rebuild` | Rebuilds native modules, then starts the desktop app |
| `taskkill /F /IM electron.exe`  | Force-close Electron if it hangs                     |

### Unit Tests

| Command                      | What it does                  |
| ---------------------------- | ----------------------------- |
| `npm run test:unit`          | Runs unit tests (Vitest)      |
| `npm run test:unit:coverage` | Runs unit tests with coverage |

### Playwright E2E

| Command                         | What it does                            |
| ------------------------------- | --------------------------------------- |
| `npx playwright install`        | Installs Playwright browsers (one-time) |
| `npm run test:e2e`              | Runs Playwright E2E tests               |
| `npm run test:e2e:ui`           | Runs Playwright in UI mode              |
| `npm run test:e2e:electron`     | Runs Playwright E2E against Electron    |
| `npm run test:e2e:report`       | Serves the Smart Reporter HTML (browser) for the last run |
| `npx playwright test -g @smoke` | Runs Playwright tests tagged `@smoke`   |
| `npx playwright test -g @ai`    | Runs AI-related E2E tests               |
| `npx playwright test -g @data` | Data/import-export tests (see `docs/testing.md` for all tags) |

### Quality

| Command                | What it does                     |
| ---------------------- | -------------------------------- |
| `npm run lint`         | Runs ESLint                      |
| `npm run lint:fix`     | Fixes lint issues where possible |
| `npm run format`       | Checks formatting (Prettier)     |
| `npm run format:write` | Formats files with Prettier      |

## Status

**Phase 6 (Polish + QA) — Nearly Complete**

All core phases (1–6) are implemented:

- ✅ Phase 1: Core navigation + page tree
- ✅ Phase 2: Markdown editor + toolbar + slash menu
- ✅ Phase 3: Tabs + dashboard
- ✅ Phase 4: Import/export + backups (Markdown, JSON, HTML, PDF; toasts; backup as ZIP)
- ✅ Phase 5: AI integration (LM Studio)
- 🔄 Phase 6: Final polish, bug fixes, and refinements

Remaining work: minor polish items and optimizations.
