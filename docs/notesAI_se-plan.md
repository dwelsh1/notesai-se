# NotesAI SE Plan

## Summary

NotesAI SE is a simplified, local-only NotesAI variant focused on privacy. It keeps the core UX (page tree, dashboard, tabs, AI, backups, import/export) but replaces BlockNote with a standard markdown editor and a top toolbar. It integrates with LM Studio over local HTTP and stores all data locally in SQLite.

## Goals

- Local-only data with no cloud sync or external persistence.
- Markdown editor with toolbar + slash commands + AI command.
- Multi-tab editing with session restore + pin support.
- Slim dashboard (recent, favorites, stats).
- Backups (manual + scheduled).
- Import/export (Markdown + JSON + HTML).
- Full test discipline: unit tests first in each phase, then Playwright e2e.
- Complete docs in `docs/` (readme, changelog, developer, architecture, testing).

## Light/Dark Theme

- **Overview**: Light/dark themes with instant toggle and persisted preference.
- **Toggle**: Header sun/moon button and Settings -> General -> Theme.
- **Behavior**: Apply immediately, persist to local storage, optional OS sync (future).
- **Implementation**: Tailwind dark: classes and dark class on <html>; CSS variables for bg/text.
- **Scope**: Global theme only; no per-page theme.

## Non-Goals

- Block-based editing, BlockNote plugins, or rich block schemas.
- PocketBase sync/auth.
- Real-time collaboration.

## Decisions (from Q&A)

- Editor: **tiptap** (markdown-centric, toolbar, slash commands).
- Slash UX: **single `/` menu** for blocks + AI.
- Tabs: **hybrid** (restore last session + pin).
- Storage: **SQLite** (Electron local file).
- Runtime: **Electron only**.
- LM Studio: **local HTTP** integration.
- Dashboard: **slim** (recent, favorites, stats).
- Backups: **scheduled + manual**.
- Import/export: **Markdown + JSON + HTML**.
- Testing: **Vitest + Playwright**.
- Docs: `readme.md`, `changelog.md`, `developer.md`, `architecture.md`, `testing.md`, `api.md`.

## Tech Stack Recommendations (changes from NotesAI)

- Keep: React 18, TypeScript, Vite, Zustand, Playwright, Vitest.
- Replace BlockNote with **tiptap**.
- Remove PocketBase; use **SQLite** for local persistence.
- Add Electron file and DB services (for storage, backups, imports/exports).
- Planned formula engine: **jexl** (when formulas are implemented).

## Architecture Overview

- **Renderer**: React app with tiptap editor, toolbar, slash menu, AI panel.
- **Main (Electron)**: file system access, SQLite DB, backup scheduler, import/export.
- **Storage**: SQLite (pages, settings, tabs, history, tags).
- **AI**: LM Studio HTTP client with configurable endpoint/model.
- **Backups**: scheduled job + manual export (ZIP containing JSON + Markdown + assets).

## Data Model (initial)

- `pages`: id, title, parentId, order, contentMarkdown, updatedAt, createdAt, trashed, favorited, tags
- `tabs`: id, pageId, pinned, lastActiveAt, order
- `settings`: key/value (JSON)
- `backups`: id, createdAt, type, location
- `assets`: id, pageId, path, mime, size, createdAt

## Phases

### Phase 0 — Project Scaffolding + Docs

**Unit tests first**

- Write unit tests for config loading, storage adapters, and basic app shell render.

**Implementation**

- Create `docs/readme.md`, `docs/changelog.md`, `docs/developer.md`, `docs/architecture.md`, `docs/testing.md`.
- Create initial Electron + Vite scaffolding for NotesAI SE.
- Add SQLite layer and migration setup (schema + migrations).

**E2E (after unit tests pass)**

- Playwright: app boots, empty state shows, settings page reachable.

### Phase 1 — Core Navigation + Page Tree

**Unit tests first**

- Page creation, rename, delete/restore, favorites, search filter.
- Sidebar expand/collapse and keyboard shortcuts (new page, focus filter).

**Implementation**

- Page tree UI (similar to NotesAI), trash section, favorites section.
- Search/filter input.
- Basic routing and layout shell.

**E2E (after unit tests pass)**

- Playwright: create page, rename, favorite, trash/restore.

### Phase 2 — Markdown Editor + Toolbar + Slash Menu

**Unit tests first**

- Editor mounts with markdown content.
- Toolbar actions (bold/italic/heading/list/code).
- Slash menu opens, inserts templates, AI command is listed.

**Implementation**

- tiptap editor with markdown-friendly extensions.
- Top toolbar and slash menu.
- Block insertion from slash command list.

**E2E (after unit tests pass)**

- Playwright: type content, apply formatting, use slash commands.

### Phase 3 — Tabs + Dashboard

**Unit tests first**

- Tabs open/close/pin/reorder/restore session.
- Dashboard data sources (recent, favorites, stats).

**Implementation**

- Multi-tab UI with session persistence (restore + pin).
- Slim dashboard page.

**E2E (after unit tests pass)**

- Playwright: open multiple tabs, pin, restore, dashboard widgets.

### Phase 4 — Import/Export + Backups

**Unit tests first**

- Import Markdown/JSON/HTML -> pages.
- Export selected pages and full backup.
- Backup scheduler logic and retention.

**Implementation**

- Import/export UI.
- Scheduled + manual backups (ZIP).

**E2E (after unit tests pass)**

- Playwright: import file, export pages, verify backup creation.

### Phase 5 — AI (LM Studio) + Slash AI Command

**Unit tests first**

- LM Studio HTTP client (mocked).
- AI command prompt assembly and response handling.

**Implementation**

- AI sidebar/modal and slash command integration.
- Model config settings (endpoint, model, temperature).

**E2E (after unit tests pass)**

- Playwright: open AI panel, run AI slash command (mocked).

### Phase 6 — Polish + Performance + QA

**Unit tests first**

- Regressions for storage, editor, and tabs.

**Implementation**

- Performance tuning, error boundaries, telemetry-free logging.
- Accessibility checks and UX refinements.

**E2E (after unit tests pass)**

- Playwright: full smoke suite, regression pack.

## Testing Principles

- Unit tests first in each phase, then Playwright e2e.
- Tests must be isolated, deterministic, and cleanup after themselves.

## Risks & Mitigations

- **SQLite migration complexity**: keep schema minimal, add migrations early.
- **Markdown editor parity**: define required features and limit scope.
- **AI reliability**: use mock adapters and configurable timeouts.

## Open Questions (resolved)

- Editor: tiptap
- Slash UX: unified `/`
- Tabs: hybrid (restore + pin)
- Storage: SQLite (Electron)
- Runtime: Electron only
- LM Studio: HTTP
- Dashboard: slim
- Backups: scheduled + manual
- Import/export: MD + JSON + HTML
- Tests: Vitest + Playwright
- Docs: readme, changelog, developer, architecture, testing
